"""运行遥测。写入失败只记日志，不阻断对话。"""

from __future__ import annotations

import math
from datetime import UTC, date, datetime
from typing import Any

from sqlalchemy import case, func, select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import (
    AgentUsageDaily,
    AgentUsageEvent,
    Conversation,
    Message,
    TokenUsageEvent,
    ToolUsageEvent,
)
from yuxi.utils.datetime_utils import utc_now
from yuxi.utils.logging_config import logger

USAGE_SIDE_WORK = "work"
USAGE_SIDE_CHAT = "chat"
DEFAULT_CHAT_AGENT_ID = "builtin-quick-answer"
DEFAULT_WORK_AGENT_ID = "default-chatbot"
_UNRESOLVED_USAGE_LABELS = frozenset({"", "unknown", "none", "null", "unknown_model"})

_TERMINAL_EVENT_TYPES = {
    "completed": "succeed",
    "failed": "fail",
    "cancelled": "cancel",
    "interrupted": "fail",
}


def is_unresolved_usage_label(value: str | None) -> bool:
    """空值或占位名无法对应到真实模型、智能体。"""
    return str(value or "").strip().lower() in _UNRESOLVED_USAGE_LABELS


def fold_usage_agent_id(agent_id: str | None, usage_side: str) -> str:
    """对不上的智能体并入该侧默认智能体，不再单独显示 unknown。"""
    raw = str(agent_id or "").strip()
    if not is_unresolved_usage_label(raw):
        return raw[:64]
    if usage_side == USAGE_SIDE_CHAT:
        return DEFAULT_CHAT_AGENT_ID
    return DEFAULT_WORK_AGENT_ID


async def default_knowledge_model_id(db: AsyncSession, tenant_id: int | None) -> str | None:
    """当前空间的默认对话模型：优先 is_default，否则取最早的可用 KnowledgeQA。"""
    if tenant_id is None:
        return None
    try:
        async with db.begin_nested():
            row = (
                await db.execute(
                    text(
                        """
                        SELECT id
                        FROM models
                        WHERE deleted_at IS NULL
                          AND type = 'KnowledgeQA'
                          AND (status IS NULL OR status = '' OR status = 'active')
                          AND tenant_id = :tid
                        ORDER BY is_default DESC, created_at ASC
                        LIMIT 1
                        """
                    ),
                    {"tid": int(tenant_id)},
                )
            ).first()
    except Exception:
        logger.warning("默认对话模型读取失败")
        return None
    if row is None or not row.id:
        return None
    return str(row.id)[:128]


def capability_type_for_tool(tool_name: str | None) -> str:
    """按工具名前缀区分内置、MCP 和技能工具。"""
    name = str(tool_name or "")
    if name.startswith("mcp__"):
        return "mcp"
    if name.startswith("skill__") or name.startswith("skill:"):
        return "skill"
    return "builtin"


def usage_score(
    *,
    run_count: int,
    success_count: int,
    session_count: int,
    tool_call_count: int,
    tool_success_count: int,
    total_tokens: int,
    total_duration_ms: int,
    max_duration_ms: int,
) -> float:
    """综合分：成功率、运行量、工具成功率、token 效率、时长稳定性。"""
    success_rate = (success_count / run_count) if run_count else 0.0
    volume = min(1.0, math.log1p(max(run_count, session_count)) / math.log1p(50))
    tool_rate = (tool_success_count / tool_call_count) if tool_call_count else 1.0
    if success_count:
        tokens_per_success = total_tokens / success_count
        efficiency = 1.0 / (1.0 + tokens_per_success / 1000.0)
    elif total_tokens:
        efficiency = 1.0 / (1.0 + total_tokens / 1000.0)
    else:
        efficiency = 0.5
    if max_duration_ms and run_count:
        average = total_duration_ms / run_count
        stability = 1.0 - min(1.0, abs(max_duration_ms - average) / max_duration_ms)
    else:
        stability = 1.0
    raw = (
        0.35 * success_rate
        + 0.20 * volume
        + 0.20 * tool_rate
        + 0.15 * efficiency
        + 0.10 * stability
    )
    return round(raw * 100, 4)


def _as_utc(value: datetime | None) -> datetime:
    current = value or utc_now()
    if current.tzinfo is None:
        return current.replace(tzinfo=UTC)
    return current.astimezone(UTC)


def stat_date(value: datetime) -> date:
    """把遥测时间归一到 UTC 日期，供日聚合和同步器共用。"""
    return _as_utc(value).date()


def _duration_ms(started_at: datetime | None, finished_at: datetime | None) -> int | None:
    if started_at is None or finished_at is None:
        return None
    delta = _as_utc(finished_at) - _as_utc(started_at)
    return max(int(delta.total_seconds() * 1000), 0)


async def _safe(action) -> None:
    try:
        async with pg_manager.get_async_session_context() as db:
            await action(db)
    except Exception:
        logger.exception("遥测写入失败")


async def _insert_ignore(db: AsyncSession, model, values: dict[str, Any]) -> None:
    dialect = db.bind.dialect.name if db.bind is not None else ""
    if dialect == "postgresql":
        stmt = pg_insert(model).values(**values).on_conflict_do_nothing(index_elements=["event_id"])
        await db.execute(stmt)
        return
    existed = await db.execute(select(model.id).where(model.event_id == values["event_id"]))
    if existed.scalar_one_or_none() is None:
        db.add(model(**values))


async def _refresh_daily(
    db: AsyncSession,
    *,
    tenant_id: int,
    agent_id: str,
    stat_date: date,
    usage_side: str = USAGE_SIDE_WORK,
) -> None:
    agent_rows = await db.execute(
        select(
            AgentUsageEvent.event_type,
            func.count(AgentUsageEvent.id),
            func.coalesce(func.sum(AgentUsageEvent.duration_ms), 0),
            func.coalesce(func.max(AgentUsageEvent.duration_ms), 0),
        )
        .where(
            AgentUsageEvent.tenant_id == tenant_id,
            AgentUsageEvent.agent_id == agent_id,
            AgentUsageEvent.usage_side == usage_side,
            func.date(AgentUsageEvent.occurred_at) == stat_date,
            AgentUsageEvent.event_type.in_(["succeed", "fail", "cancel"]),
        )
        .group_by(AgentUsageEvent.event_type)
    )
    success_count = failure_count = cancelled_count = 0
    total_duration = max_duration = 0
    for event_type, count, duration_sum, duration_max in agent_rows.all():
        count = int(count or 0)
        if event_type == "succeed":
            success_count += count
        elif event_type == "cancel":
            cancelled_count += count
        else:
            failure_count += count
        total_duration += int(duration_sum or 0)
        max_duration = max(max_duration, int(duration_max or 0))
    run_count = success_count + failure_count + cancelled_count

    tool_row = await db.execute(
        select(
            func.count(ToolUsageEvent.id),
            func.coalesce(func.sum(case((ToolUsageEvent.status == "success", 1), else_=0)), 0),
        ).where(
            ToolUsageEvent.tenant_id == tenant_id,
            ToolUsageEvent.agent_id == agent_id,
            ToolUsageEvent.usage_side == usage_side,
            func.date(ToolUsageEvent.occurred_at) == stat_date,
        )
    )
    tool_call_count, tool_success_count = tool_row.one()

    token_row = await db.execute(
        select(
            func.coalesce(func.sum(TokenUsageEvent.prompt_tokens), 0),
            func.coalesce(func.sum(TokenUsageEvent.completion_tokens), 0),
            func.coalesce(func.sum(TokenUsageEvent.total_tokens), 0),
        ).where(
            TokenUsageEvent.tenant_id == tenant_id,
            TokenUsageEvent.agent_id == agent_id,
            TokenUsageEvent.usage_side == usage_side,
            func.date(TokenUsageEvent.occurred_at) == stat_date,
        )
    )
    prompt_tokens, completion_tokens, total_tokens = token_row.one()

    existing = await db.execute(
        select(AgentUsageDaily).where(
            AgentUsageDaily.stat_date == stat_date,
            AgentUsageDaily.tenant_id == tenant_id,
            AgentUsageDaily.agent_id == agent_id,
            AgentUsageDaily.usage_side == usage_side,
        )
    )
    row = existing.scalar_one_or_none()
    if row is None:
        row = AgentUsageDaily(
            stat_date=stat_date,
            tenant_id=tenant_id,
            agent_id=agent_id,
            usage_side=usage_side,
            session_count=0,
            message_count=0,
        )
        db.add(row)
    row.run_count = run_count
    row.success_count = success_count
    row.failure_count = failure_count
    row.cancelled_count = cancelled_count
    row.tool_call_count = int(tool_call_count or 0)
    row.tool_success_count = int(tool_success_count or 0)
    row.total_duration_ms = total_duration
    row.max_duration_ms = max_duration
    row.prompt_tokens = int(prompt_tokens or 0)
    row.completion_tokens = int(completion_tokens or 0)
    row.total_tokens = int(total_tokens or 0)
    row.score = usage_score(
        run_count=run_count,
        success_count=success_count,
        session_count=int(row.session_count or 0),
        tool_call_count=int(row.tool_call_count or 0),
        tool_success_count=int(row.tool_success_count or 0),
        total_tokens=int(row.total_tokens or 0),
        total_duration_ms=total_duration,
        max_duration_ms=max_duration,
    )
    row.computed_at = utc_now()


async def _bump_counter(
    db: AsyncSession,
    *,
    tenant_id: int,
    agent_id: str,
    occurred_at: datetime,
    session_delta: int = 0,
    message_delta: int = 0,
    usage_side: str = USAGE_SIDE_WORK,
) -> None:
    if not agent_id or (session_delta == 0 and message_delta == 0):
        return
    async with db.begin_nested():
        stat_day = stat_date(occurred_at)
        existing = await db.execute(
            select(AgentUsageDaily).where(
                AgentUsageDaily.stat_date == stat_day,
                AgentUsageDaily.tenant_id == tenant_id,
                AgentUsageDaily.agent_id == agent_id,
                AgentUsageDaily.usage_side == usage_side,
            )
        )
        row = existing.scalar_one_or_none()
        if row is None:
            row = AgentUsageDaily(
                stat_date=stat_day,
                tenant_id=tenant_id,
                agent_id=agent_id,
                usage_side=usage_side,
            )
            db.add(row)
            await db.flush()
        row.session_count = int(row.session_count or 0) + session_delta
        row.message_count = int(row.message_count or 0) + message_delta
        row.computed_at = utc_now()


async def record_run_started(run) -> None:
    """记录 run 开始。"""
    if run is None or not run.agent_slug or not run.uid:
        return
    occurred_at = _as_utc(run.started_at)

    async def action(db: AsyncSession) -> None:
        await _insert_ignore(
            db,
            AgentUsageEvent,
            {
                "event_id": f"agent:{run.id}:start",
                "tenant_id": int(run.tenant_id or 0),
                "uid": str(run.uid),
                "agent_id": str(run.agent_slug),
                "run_id": run.id,
                "session_id": run.conversation_id,
                "event_type": "start",
                "run_type": run.run_type or "chat",
                "is_subagent": run.run_type == "subagent",
                "status": "running",
                "duration_ms": None,
                "retry_count": 0,
                "error_type": None,
                "error_message": None,
                "event_metadata": {},
                "usage_side": USAGE_SIDE_WORK,
                "channel": "",
                "occurred_at": occurred_at,
            },
        )

    await _safe(action)


async def record_run_finished(run, *, retry_count: int = 0) -> None:
    """记录 run 成功、失败或取消，并刷新当日聚合。"""
    if run is None:
        return
    event_type = _TERMINAL_EVENT_TYPES.get(str(run.status or ""))
    if event_type is None or not run.agent_slug or not run.uid:
        return
    occurred_at = _as_utc(run.finished_at)
    tenant_id = int(run.tenant_id or 0)
    agent_id = str(run.agent_slug)

    async def action(db: AsyncSession) -> None:
        await _insert_ignore(
            db,
            AgentUsageEvent,
            {
                "event_id": f"agent:{run.id}:{event_type}",
                "tenant_id": tenant_id,
                "uid": str(run.uid),
                "agent_id": agent_id,
                "run_id": run.id,
                "session_id": run.conversation_id,
                "event_type": event_type,
                "run_type": run.run_type or "chat",
                "is_subagent": run.run_type == "subagent",
                "status": str(run.status),
                "duration_ms": _duration_ms(run.started_at, run.finished_at),
                "retry_count": max(int(retry_count or 0), 0),
                "error_type": run.error_type,
                "error_message": run.error_message,
                "event_metadata": {},
                "usage_side": USAGE_SIDE_WORK,
                "channel": "",
                "occurred_at": occurred_at,
            },
        )
        await _refresh_daily(
            db,
            tenant_id=tenant_id,
            agent_id=agent_id,
            stat_date=stat_date(occurred_at),
            usage_side=USAGE_SIDE_WORK,
        )

    await _safe(action)


async def record_tool_finished(db: AsyncSession, tool_call) -> None:
    """工具结果落库后写工具事件。调用方已提交工具行。"""
    if tool_call is None or tool_call.status not in {"success", "error", "cancelled"}:
        return
    message = await db.get(Message, tool_call.message_id)
    if message is None:
        return
    conversation = await db.get(Conversation, message.conversation_id)
    if conversation is None or not conversation.agent_id or not conversation.uid:
        return
    occurred_at = _as_utc(getattr(tool_call, "created_at", None))
    tenant_id = int(conversation.tenant_id or 0)
    agent_id = str(conversation.agent_id)
    status = str(tool_call.status)
    uid = str(conversation.uid)
    run_id = message.run_id
    session_id = conversation.id
    message_id = message.id
    tool_call_id = tool_call.id
    tool_name = str(tool_call.tool_name or "unknown")[:255]

    async def action(write_db: AsyncSession) -> None:
        await _insert_ignore(
            write_db,
            ToolUsageEvent,
            {
                "event_id": f"tool:{tool_call_id}:{status}",
                "tenant_id": tenant_id,
                "uid": uid,
                "agent_id": agent_id,
                "run_id": run_id,
                "session_id": session_id,
                "message_id": message_id,
                "tool_call_id": tool_call_id,
                "capability_type": capability_type_for_tool(tool_name),
                "tool_name": tool_name,
                "status": status,
                "duration_ms": None,
                "error_type": "tool_error" if status == "error" else None,
                "error_code": None,
                "event_metadata": {},
                "usage_side": USAGE_SIDE_WORK,
                "channel": "",
                "occurred_at": occurred_at,
            },
        )
        await _refresh_daily(
            write_db,
            tenant_id=tenant_id,
            agent_id=agent_id,
            stat_date=stat_date(occurred_at),
            usage_side=USAGE_SIDE_WORK,
        )

    await _safe(action)


def _as_int(value: Any) -> int:
    if value is None or value is False:
        return 0
    try:
        return int(value)
    except (TypeError, ValueError):
        try:
            return int(float(value))
        except (TypeError, ValueError):
            return 0


def _model_name(metadata: dict, usage: dict, response_metadata: dict) -> str:
    for source in (response_metadata, usage, metadata):
        for key in ("model_name", "model", "model_id"):
            value = str(source.get(key) or "").strip()
            if value and value.lower() not in {"unknown", "none", "null"}:
                return value[:128]
    return ""


def _usage_numbers(metadata: dict | None, *, token_count: int | None = None) -> tuple[str, int, int, int] | None:
    """从消息元数据取模型和 token。用量字段有多套命名，缺 usage 时回退到 token_count。"""
    if not isinstance(metadata, dict):
        metadata = {}
    response_metadata = metadata.get("response_metadata") if isinstance(metadata.get("response_metadata"), dict) else {}
    usage = metadata.get("usage_metadata") if isinstance(metadata.get("usage_metadata"), dict) else {}
    token_usage = response_metadata.get("token_usage") if isinstance(response_metadata.get("token_usage"), dict) else {}
    response_usage = response_metadata.get("usage") if isinstance(response_metadata.get("usage"), dict) else {}
    top_usage = metadata.get("usage") if isinstance(metadata.get("usage"), dict) else {}
    state_usage = metadata.get("token_usage") if isinstance(metadata.get("token_usage"), dict) else {}
    model_usage = state_usage.get("model_usage") if isinstance(state_usage.get("model_usage"), dict) else {}
    prompt = _as_int(
        usage.get("input_tokens")
        or usage.get("prompt_tokens")
        or token_usage.get("prompt_tokens")
        or token_usage.get("input_tokens")
        or response_usage.get("prompt_tokens")
        or response_usage.get("input_tokens")
        or top_usage.get("prompt_tokens")
        or top_usage.get("input_tokens")
        or model_usage.get("input_tokens")
        or model_usage.get("prompt_tokens")
        or state_usage.get("llm_input_tokens")
    )
    completion = _as_int(
        usage.get("output_tokens")
        or usage.get("completion_tokens")
        or token_usage.get("completion_tokens")
        or token_usage.get("output_tokens")
        or response_usage.get("completion_tokens")
        or response_usage.get("output_tokens")
        or top_usage.get("completion_tokens")
        or top_usage.get("output_tokens")
        or model_usage.get("output_tokens")
        or model_usage.get("completion_tokens")
        or state_usage.get("llm_output_tokens")
    )
    total = _as_int(
        usage.get("total_tokens")
        or token_usage.get("total_tokens")
        or response_usage.get("total_tokens")
        or top_usage.get("total_tokens")
        or model_usage.get("total_tokens")
    )
    if total <= 0:
        total = prompt + completion
    if total <= 0:
        total = _as_int(token_count)
    model = _model_name(metadata, usage or token_usage, response_metadata)
    if total <= 0 and not model:
        return None
    return model, prompt, completion, total


async def record_message_activity(db: AsyncSession, message: Message) -> None:
    """消息计入日聚合。必须在消息提交前调用，失败不影响消息事务。"""
    if message is None:
        return
    conversation = await db.get(Conversation, message.conversation_id)
    if conversation is None or not conversation.agent_id:
        return
    try:
        await _bump_counter(
            db,
            tenant_id=int(conversation.tenant_id or 0),
            agent_id=str(conversation.agent_id),
            occurred_at=_as_utc(message.created_at),
            message_delta=1,
        )
    except Exception:
        logger.exception("遥测消息计数失败")


async def record_token_usage(message: Message, conversation: Conversation) -> None:
    """模型 usage 返回后写 token 事件。"""
    if message is None or conversation is None or not conversation.agent_id or not conversation.uid:
        return
    usage = _usage_numbers(message.extra_metadata, token_count=message.token_count)
    if usage is None:
        return
    model, prompt, completion, total = usage
    if is_unresolved_usage_label(model):
        model = ""
    state_usage = message.extra_metadata.get("token_usage") if isinstance(message.extra_metadata, dict) else {}
    state_usage = state_usage if isinstance(state_usage, dict) else {}
    response_metadata = message.extra_metadata.get("response_metadata")
    response_usage = response_metadata.get("token_usage") if isinstance(response_metadata, dict) else {}
    provider_usage = any(
        isinstance(source, dict) and any(source.get(key) for key in source)
        for source in (message.extra_metadata.get("usage_metadata"), response_usage)
    )
    token_source = "provider" if provider_usage else ("estimated" if state_usage else "stored")
    occurred_at = _as_utc(message.created_at)
    tenant_id = int(conversation.tenant_id or 0)
    agent_id = str(conversation.agent_id)
    uid = str(conversation.uid)
    run_id = message.run_id
    session_id = conversation.id
    message_id = message.id

    async def action(write_db: AsyncSession) -> None:
        resolved_model = model
        if is_unresolved_usage_label(resolved_model):
            resolved_model = await default_knowledge_model_id(write_db, tenant_id) or ""
        if is_unresolved_usage_label(resolved_model):
            resolved_model = "unknown"
        await _insert_ignore(
            write_db,
            TokenUsageEvent,
            {
                "event_id": f"token:{message_id}:{resolved_model}"[:64],
                "tenant_id": tenant_id,
                "uid": uid,
                "agent_id": agent_id,
                "run_id": run_id,
                "session_id": session_id,
                "message_id": message_id,
                "model": resolved_model,
                "prompt_tokens": prompt,
                "completion_tokens": completion,
                "total_tokens": total,
                "event_metadata": {"token_source": token_source},
                "usage_side": USAGE_SIDE_WORK,
                "channel": "",
                "occurred_at": occurred_at,
            },
        )
        await _refresh_daily(
            write_db,
            tenant_id=tenant_id,
            agent_id=agent_id,
            stat_date=stat_date(occurred_at),
            usage_side=USAGE_SIDE_WORK,
        )

    await _safe(action)


async def record_session_created(db: AsyncSession, conversation: Conversation) -> None:
    """新会话计入当日会话数。"""
    if conversation is None or not conversation.agent_id:
        return
    try:
        await _bump_counter(
            db,
            tenant_id=int(conversation.tenant_id or 0),
            agent_id=str(conversation.agent_id),
            occurred_at=_as_utc(conversation.created_at),
            session_delta=1,
        )
    except Exception:
        logger.exception("遥测会话计数失败")
