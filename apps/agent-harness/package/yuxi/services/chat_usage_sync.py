"""把已完成的对话消息补进用量事实表。

用量事实是不可变历史数据：消息、会话或工具后续删除时不回删、不重算已落账
统计；删除标记只用于决定源消息是否还需要被增量扫描。
"""

from __future__ import annotations

import asyncio
import hashlib
import json
from datetime import UTC, date, datetime, timedelta
from time import monotonic

from sqlalchemy import text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from yuxi.services.usage_telemetry import (
    DEFAULT_CHAT_AGENT_ID,
    USAGE_SIDE_CHAT,
    capability_type_for_tool,
    default_knowledge_model_id,
    fold_usage_agent_id,
    is_unresolved_usage_label,
    stat_date,
    usage_score,
)
from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import AgentUsageDaily, AgentUsageEvent, TokenUsageEvent, ToolUsageEvent
from yuxi.utils.datetime_utils import utc_now
from yuxi.utils.logging_config import logger

SYNC_KEY = "go_messages"
SYNC_INTERVAL_SECONDS = 60
SYNC_BATCH_SIZE = 200
SYNC_BUDGET_SECONDS = 20
_PIPELINE_TOOL_PREFIX = "ragpipe-"
_SYNC_LOCK_KEY = int(hashlib.sha256(SYNC_KEY.encode()).hexdigest()[:15], 16)

_MESSAGE_SQL = """
SELECT m.id AS message_id,
       m.session_id AS session_id,
       COALESCE(m.agent_id, '') AS agent_id,
       COALESCE(m.model_id, '') AS model_id,
       m.usage AS usage,
       m.agent_steps AS agent_steps,
       COALESCE(m.channel, '') AS channel,
       m.created_at AS created_at,
       m.updated_at AS updated_at,
       COALESCE(m.agent_duration_ms, 0) AS duration_ms,
       s.tenant_id AS tenant_id,
       COALESCE(NULLIF(s.user_id, ''), 'unknown') AS uid
FROM messages m
INNER JOIN sessions s ON s.id = m.session_id
WHERE m.deleted_at IS NULL
  AND s.deleted_at IS NULL
  AND m.role = 'assistant'
  AND m.is_completed IS TRUE
  AND s.tenant_id IS NOT NULL
  AND (
        CAST(:has_cursor AS BOOLEAN) IS FALSE
        OR m.updated_at > :cursor_at
        OR (m.updated_at = :cursor_at AND m.id > :cursor_id)
      )
ORDER BY m.updated_at ASC, m.id ASC
LIMIT :limit
"""


def tool_event_id(message_id: str, identity: str) -> str:
    """工具事件 ID 固定长度，同一消息的同一次调用只对应一行。"""
    digest = hashlib.sha1(f"{message_id}:{identity}".encode()).hexdigest()[:40]
    return f"go-tool-{digest}"


def iter_chat_tool_calls(agent_steps) -> list[tuple[str, str, str, int]]:
    """展开对话步骤里的工具调用，优先取实际执行目标名。检索流水线不计入。"""
    steps = agent_steps
    if isinstance(steps, str):
        try:
            steps = json.loads(steps)
        except json.JSONDecodeError:
            return []
    if not isinstance(steps, list):
        return []
    calls: list[tuple[str, str, str, int]] = []
    for step_index, step in enumerate(steps):
        if not isinstance(step, dict):
            continue
        for index, call in enumerate(step.get("tool_calls") or []):
            if not isinstance(call, dict):
                continue
            call_id = str(call.get("id") or "")
            if call_id.startswith(_PIPELINE_TOOL_PREFIX):
                continue
            target = call.get("target")
            target_name = str(target.get("name") or "").strip() if isinstance(target, dict) else ""
            name = target_name or str(call.get("name") or "").strip()
            if not name:
                continue
            result = call.get("result") if isinstance(call.get("result"), dict) else {}
            status = "success" if result.get("success") else "error"
            duration = call.get("duration") or 0
            try:
                duration_ms = max(int(duration), 0)
            except (TypeError, ValueError):
                duration_ms = 0
            identity = call_id or f"{step_index}:{index}:{name}"
            calls.append((identity, name[:255], status, duration_ms))
    return calls


def chat_usage_numbers(usage) -> tuple[int, int, int]:
    """对话消息上的整轮 Token。没有用量时记 0。"""
    payload = usage
    if isinstance(payload, str):
        try:
            payload = json.loads(payload)
        except json.JSONDecodeError:
            payload = None
    if not isinstance(payload, dict):
        return 0, 0, 0
    prompt = _as_int(payload.get("prompt_tokens"))
    completion = _as_int(payload.get("completion_tokens"))
    total = _as_int(payload.get("total_tokens"))
    if total <= 0:
        total = prompt + completion
    return prompt, completion, total


def _as_int(value) -> int:
    try:
        return max(int(value or 0), 0)
    except (TypeError, ValueError):
        return 0


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


async def sync_chat_usage_once() -> int:
    """同步一批已完成的对话消息。返回本轮写入检查过的消息数。"""
    started = monotonic()
    scanned = 0
    logger.debug("对话侧用量同步开始")
    try:
        async with pg_manager.get_async_session_context() as db:
            if not await _has_chat_messages_table(db):
                return 0
            if not await _try_acquire_sync_lock(db):
                return 0
            await _fold_unresolved_facts(db)
            await db.commit()
            while monotonic() - started < SYNC_BUDGET_SECONDS:
                if not await _try_acquire_sync_lock(db):
                    break
                cursor = (
                    await db.execute(
                        text(
                            """
                            SELECT cursor_updated_at, cursor_id
                            FROM amp_usage_sync_state
                            WHERE sync_key = :sync_key
                            """
                        ),
                        {"sync_key": SYNC_KEY},
                    )
                ).first()
                has_cursor = cursor is not None and cursor.cursor_updated_at is not None and cursor.cursor_id
                rows = (
                    await db.execute(
                        text(_MESSAGE_SQL),
                        {
                            "has_cursor": bool(has_cursor),
                            "cursor_at": cursor.cursor_updated_at if has_cursor else datetime(1970, 1, 1, tzinfo=UTC),
                            "cursor_id": cursor.cursor_id if has_cursor else "",
                            "limit": SYNC_BATCH_SIZE,
                        },
                    )
                ).all()
                if not rows:
                    break
                affected: set[tuple[int, str, object]] = set()
                model_cache: dict[int, str] = {}
                for row in rows:
                    affected.update(await _write_message(db, row, model_cache))
                last = rows[-1]
                await db.execute(
                    text(
                        """
                        INSERT INTO amp_usage_sync_state (sync_key, cursor_updated_at, cursor_id, updated_at)
                        VALUES (:sync_key, :cursor_at, :cursor_id, NOW())
                        ON CONFLICT (sync_key) DO UPDATE
                        SET cursor_updated_at = EXCLUDED.cursor_updated_at,
                            cursor_id = EXCLUDED.cursor_id,
                            updated_at = NOW()
                        """
                    ),
                    {
                        "sync_key": SYNC_KEY,
                        "cursor_at": last.updated_at,
                        "cursor_id": last.message_id,
                    },
                )
                for tenant_id, agent_id, stat_date in affected:
                    await _refresh_chat_daily(db, tenant_id=tenant_id, agent_id=agent_id, stat_date=stat_date)
                await db.commit()
                scanned += len(rows)
                if len(rows) < SYNC_BATCH_SIZE:
                    break
        return scanned
    finally:
        elapsed = monotonic() - started
        logger.debug(f"对话侧用量同步结束，本轮 {scanned} 条，耗时 {elapsed:.1f} 秒")


async def _try_acquire_sync_lock(db) -> bool:
    """多实例只允许一个同步器处理同一批次，锁随当前事务提交或回滚释放。"""
    if db.bind is None or db.bind.dialect.name != "postgresql":
        return True
    locked = await db.execute(text("SELECT pg_try_advisory_xact_lock(:lock_key)"), {"lock_key": _SYNC_LOCK_KEY})
    return bool(locked.scalar())


async def _has_chat_messages_table(db) -> bool:
    """独立部署的 Harness 库可能没有平台消息表，此时跳过而不是持续报错。"""
    if db.bind is None or db.bind.dialect.name != "postgresql":
        return True
    result = await db.execute(text("SELECT to_regclass('messages')"))
    return result.scalar() is not None


async def _fold_unresolved_facts(db) -> None:
    """把已经写成 unknown 的对话智能体和模型并入默认值，并重算受影响的日聚合。"""
    dates = (
        await db.execute(
            text(
                """
                SELECT DISTINCT tenant_id,
                       (occurred_at AT TIME ZONE 'UTC')::date AS stat_date
                FROM amp_agent_usage_events
                WHERE usage_side = 'chat'
                  AND lower(agent_id) IN ('unknown', 'none', 'null', '')
                """
            )
        )
    ).all()
    agent_sql = """
        UPDATE {table}
        SET agent_id = :agent_id
        WHERE usage_side = 'chat'
          AND lower(agent_id) IN ('unknown', 'none', 'null', '')
    """
    for table in ("amp_agent_usage_events", "amp_tool_usage_events", "amp_token_usage_events"):
        await db.execute(text(agent_sql.format(table=table)), {"agent_id": DEFAULT_CHAT_AGENT_ID})
    tenants = (
        await db.execute(
            text(
                """
                SELECT DISTINCT tenant_id
                FROM amp_token_usage_events
                WHERE usage_side = 'chat'
                  AND tenant_id IS NOT NULL
                  AND (
                    lower(model) IN ('unknown', 'none', 'null', 'unknown_model')
                    OR model = ''
                  )
                """
            )
        )
    ).all()
    for (tenant_id,) in tenants:
        model_id = await default_knowledge_model_id(db, int(tenant_id))
        if not model_id:
            continue
        await db.execute(
            text(
                """
                UPDATE amp_token_usage_events
                SET model = :model_id
                WHERE usage_side = 'chat'
                  AND tenant_id = :tenant_id
                  AND (
                    lower(model) IN ('unknown', 'none', 'null', 'unknown_model')
                    OR model = ''
                  )
                """
            ),
            {"model_id": model_id, "tenant_id": int(tenant_id)},
        )
    await db.execute(
        text(
            """
            DELETE FROM amp_agent_usage_daily
            WHERE usage_side = 'chat'
              AND lower(agent_id) IN ('unknown', 'none', 'null', '')
            """
        )
    )
    for tenant_id, stat_day in dates:
        if tenant_id is None or stat_day is None:
            continue
        await _refresh_chat_daily(
            db,
            tenant_id=int(tenant_id),
            agent_id=DEFAULT_CHAT_AGENT_ID,
            stat_date=stat_day,
        )


async def _write_message(db, row, model_cache: dict[int, str]) -> set[tuple[int, str, date]]:
    occurred_at = _as_utc(row.created_at)
    tenant_id = int(row.tenant_id)
    agent_id = fold_usage_agent_id(row.agent_id, USAGE_SIDE_CHAT)
    uid = str(row.uid)[:64]
    channel = str(row.channel or "")[:50]
    session_id = str(row.session_id or "")[:64]
    message_id = str(row.message_id)
    model_id = str(row.model_id or "").strip()
    if is_unresolved_usage_label(model_id):
        if tenant_id not in model_cache:
            model_cache[tenant_id] = await default_knowledge_model_id(db, tenant_id) or ""
        model_id = model_cache[tenant_id] or "unknown"
    metadata = {"session_id": session_id, "message_id": message_id, "channel": channel, "source": "go_messages"}
    affected = {(tenant_id, agent_id, stat_date(occurred_at))}

    agent_insert = pg_insert(AgentUsageEvent).values(
        event_id=f"go-msg-{message_id}"[:64],
        tenant_id=tenant_id,
        uid=uid,
        agent_id=agent_id,
        run_id=None,
        session_id=None,
        event_type="start",
        run_type="platform",
        is_subagent=False,
        status="succeed",
        duration_ms=_as_int(row.duration_ms),
        retry_count=0,
        error_type=None,
        error_message=None,
        event_metadata=metadata,
        usage_side=USAGE_SIDE_CHAT,
        channel=channel,
        external_session_id=session_id or None,
        occurred_at=occurred_at,
    )
    await db.execute(agent_insert.on_conflict_do_nothing(index_elements=["event_id"]))

    prompt, completion, total = chat_usage_numbers(row.usage)
    token_insert = pg_insert(TokenUsageEvent).values(
        event_id=f"go-token-{message_id}"[:64],
        tenant_id=tenant_id,
        uid=uid,
        agent_id=agent_id,
        run_id=None,
        session_id=None,
        message_id=None,
        model=model_id[:128],
        prompt_tokens=prompt,
        completion_tokens=completion,
        total_tokens=total,
        event_metadata=metadata,
        usage_side=USAGE_SIDE_CHAT,
        channel=channel,
        external_session_id=session_id or None,
        occurred_at=occurred_at,
    )
    await db.execute(
        token_insert.on_conflict_do_update(
            index_elements=["event_id"],
            set_={
                "model": token_insert.excluded.model,
                "agent_id": token_insert.excluded.agent_id,
                "prompt_tokens": token_insert.excluded.prompt_tokens,
                "completion_tokens": token_insert.excluded.completion_tokens,
                "total_tokens": token_insert.excluded.total_tokens,
                "channel": token_insert.excluded.channel,
            },
        )
    )

    for identity, name, status, duration_ms in iter_chat_tool_calls(row.agent_steps):
        tool_insert = pg_insert(ToolUsageEvent).values(
            event_id=tool_event_id(message_id, identity),
            tenant_id=tenant_id,
            uid=uid,
            agent_id=agent_id,
            run_id=None,
            session_id=None,
            message_id=None,
            tool_call_id=None,
            capability_type=capability_type_for_tool(name),
            tool_name=name,
            status=status,
            duration_ms=duration_ms,
            error_type="tool_error" if status == "error" else None,
            error_code=None,
            event_metadata={**metadata, "tool_call_id": identity},
            usage_side=USAGE_SIDE_CHAT,
            channel=channel,
            external_session_id=session_id or None,
            occurred_at=occurred_at,
        )
        await db.execute(tool_insert.on_conflict_do_nothing(index_elements=["event_id"]))
    return affected


async def _refresh_chat_daily(db, *, tenant_id: int, agent_id: str, stat_date) -> None:
    """按对话侧事实重算某一天，不在原数上累加。历史事实删除不代表聚合回退。"""
    day_start = datetime(stat_date.year, stat_date.month, stat_date.day, tzinfo=UTC)
    day_end = day_start + timedelta(days=1)
    bounds = {
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "day_start": day_start,
        "day_end": day_end,
    }
    agent_row = (
        await db.execute(
            text(
                """
                SELECT COUNT(*) AS message_count,
                       COUNT(DISTINCT external_session_id) AS session_count,
                       COALESCE(SUM(duration_ms), 0) AS total_duration_ms,
                       COALESCE(MAX(duration_ms), 0) AS max_duration_ms
                FROM amp_agent_usage_events
                WHERE usage_side = 'chat'
                  AND event_type = 'start'
                  AND tenant_id = :tenant_id
                  AND agent_id = :agent_id
                  AND occurred_at >= :day_start
                  AND occurred_at < :day_end
                """
            ),
            bounds,
        )
    ).one()
    tool_row = (
        await db.execute(
            text(
                """
                SELECT COUNT(*) AS tool_call_count,
                       COALESCE(SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END), 0) AS tool_success_count
                FROM amp_tool_usage_events
                WHERE usage_side = 'chat'
                  AND tenant_id = :tenant_id
                  AND agent_id = :agent_id
                  AND occurred_at >= :day_start
                  AND occurred_at < :day_end
                """
            ),
            bounds,
        )
    ).one()
    token_row = (
        await db.execute(
            text(
                """
                SELECT COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
                       COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
                       COALESCE(SUM(total_tokens), 0) AS total_tokens
                FROM amp_token_usage_events
                WHERE usage_side = 'chat'
                  AND tenant_id = :tenant_id
                  AND agent_id = :agent_id
                  AND occurred_at >= :day_start
                  AND occurred_at < :day_end
                """
            ),
            bounds,
        )
    ).one()
    message_count = int(agent_row.message_count or 0)
    session_count = int(agent_row.session_count or 0)
    tool_call_count = int(tool_row.tool_call_count or 0)
    tool_success_count = int(tool_row.tool_success_count or 0)
    total_duration = int(agent_row.total_duration_ms or 0)
    max_duration = int(agent_row.max_duration_ms or 0)
    prompt_tokens = int(token_row.prompt_tokens or 0)
    completion_tokens = int(token_row.completion_tokens or 0)
    total_tokens = int(token_row.total_tokens or 0)
    if message_count == 0 and tool_call_count == 0 and total_tokens == 0:
        await db.execute(
            text(
                """
                DELETE FROM amp_agent_usage_daily
                WHERE stat_date = :stat_date
                  AND tenant_id = :tenant_id
                  AND agent_id = :agent_id
                  AND usage_side = 'chat'
                """
            ),
            {"stat_date": stat_date, "tenant_id": tenant_id, "agent_id": agent_id},
        )
        return
    score = usage_score(
        run_count=message_count,
        success_count=message_count,
        session_count=session_count,
        tool_call_count=tool_call_count,
        tool_success_count=tool_success_count,
        total_tokens=total_tokens,
        total_duration_ms=total_duration,
        max_duration_ms=max_duration,
    )
    values = {
        "stat_date": stat_date,
        "tenant_id": tenant_id,
        "agent_id": agent_id,
        "usage_side": USAGE_SIDE_CHAT,
        "session_count": session_count,
        "message_count": message_count,
        "run_count": message_count,
        "success_count": message_count,
        "failure_count": 0,
        "cancelled_count": 0,
        "tool_call_count": tool_call_count,
        "tool_success_count": tool_success_count,
        "total_duration_ms": total_duration,
        "max_duration_ms": max_duration,
        "prompt_tokens": prompt_tokens,
        "completion_tokens": completion_tokens,
        "total_tokens": total_tokens,
        "score": score,
        "computed_at": utc_now(),
    }
    daily_insert = pg_insert(AgentUsageDaily).values(**values)
    await db.execute(
        daily_insert.on_conflict_do_update(
            index_elements=["stat_date", "tenant_id", "agent_id", "usage_side"],
            set_={
                "session_count": daily_insert.excluded.session_count,
                "message_count": daily_insert.excluded.message_count,
                "run_count": daily_insert.excluded.run_count,
                "success_count": daily_insert.excluded.success_count,
                "failure_count": daily_insert.excluded.failure_count,
                "cancelled_count": daily_insert.excluded.cancelled_count,
                "tool_call_count": daily_insert.excluded.tool_call_count,
                "tool_success_count": daily_insert.excluded.tool_success_count,
                "total_duration_ms": daily_insert.excluded.total_duration_ms,
                "max_duration_ms": daily_insert.excluded.max_duration_ms,
                "prompt_tokens": daily_insert.excluded.prompt_tokens,
                "completion_tokens": daily_insert.excluded.completion_tokens,
                "total_tokens": daily_insert.excluded.total_tokens,
                "score": daily_insert.excluded.score,
                "computed_at": daily_insert.excluded.computed_at,
            },
        )
    )


async def chat_usage_sync_loop() -> None:
    """每分钟同步一次。首次水位为空时从最早的已完成消息补起。"""
    logger.info(f"对话侧用量定时器启动，每 {SYNC_INTERVAL_SECONDS} 秒执行一次")
    try:
        while True:
            try:
                await sync_chat_usage_once()
            except asyncio.CancelledError:
                raise
            except Exception:
                logger.exception("对话侧用量同步失败")
            await asyncio.sleep(SYNC_INTERVAL_SECONDS)
    finally:
        logger.info("对话侧用量定时器结束")
