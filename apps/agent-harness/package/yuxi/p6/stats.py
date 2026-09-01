"""WeKnora 表统计（同库直查）。只按当前 token 空间，复刻软删除与租户口径。"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.p2.context import current_tenant_id
from yuxi.p2.flags import is_tenant_scope_enabled
from yuxi.utils.datetime_utils import utc_now

KB_TYPE_LABELS = {
    "document": "文档库",
    "faq": "FAQ",
    "wiki": "Wiki",
}

FILE_TYPE_LABELS = {
    "txt": "文本文件",
    "pdf": "PDF文档",
    "docx": "Word文档",
    "doc": "Word文档",
    "md": "Markdown",
    "html": "HTML网页",
    "htm": "HTML网页",
    "json": "JSON数据",
    "csv": "CSV表格",
    "xlsx": "Excel表格",
    "xls": "Excel表格",
    "pptx": "PowerPoint",
    "ppt": "PowerPoint",
    "png": "PNG图片",
    "jpg": "JPEG图片",
    "jpeg": "JPEG图片",
    "gif": "GIF图片",
    "svg": "SVG图片",
    "mp4": "MP4视频",
    "mp3": "MP3音频",
    "zip": "ZIP压缩包",
    "rar": "RAR压缩包",
    "7z": "7Z压缩包",
}


@dataclass(frozen=True)
class WeKnoraOverview:
    users: int = 0
    sessions: int = 0
    messages: int = 0
    agents: int = 0


@dataclass(frozen=True)
class WeKnoraKnowledgeStats:
    total_databases: int = 0
    total_files: int = 0
    total_nodes: int = 0
    total_storage_size: int = 0
    databases_by_type: dict[str, int] = field(default_factory=dict)
    file_type_distribution: dict[str, int] = field(default_factory=dict)


@dataclass(frozen=True)
class WeKnoraAgentStats:
    total_agents: int = 0
    agent_conversation_counts: list[dict] = field(default_factory=list)
    agent_names: dict[str, str] = field(default_factory=dict)


def simple_sum(*counts: int) -> int:
    """分系统合计：只做加法，不去重。"""
    return sum(int(c or 0) for c in counts)


def weknora_user_total(*, weknora_users: int, h_users: int = 0) -> int:
    """用户只计 WeKnora；h_users 是投影，显式丢弃以免误加。"""
    _ = h_users
    return int(weknora_users or 0)


def dashboard_tenant_id() -> int | None:
    """WeKnora 表必须带当前空间。无 tenant（含开关关着）则不算，避免全平台 COUNT。"""
    if not is_tenant_scope_enabled():
        return None
    return current_tenant_id()


def file_type_label(file_type: str | None) -> str:
    ext = (file_type or "").strip().lower().lstrip(".")
    if not ext:
        return "其他"
    return FILE_TYPE_LABELS.get(ext, f"{ext.upper()}文件")


def kb_type_label(kb_type: str | None) -> str:
    raw = (kb_type or "").strip().lower() or "document"
    return KB_TYPE_LABELS.get(raw, kb_type or "其他")


async def _scalar(db: AsyncSession, sql: str, params: dict[str, Any]) -> int:
    result = await db.execute(text(sql), params)
    return int(result.scalar() or 0)


async def fetch_weknora_overview(db: AsyncSession) -> WeKnoraOverview:
    tenant_id = dashboard_tenant_id()
    if tenant_id is None:
        return WeKnoraOverview()
    params = {"tid": tenant_id}
    users = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM tenant_members tm
        INNER JOIN users u ON u.id = tm.user_id AND u.deleted_at IS NULL
        WHERE tm.deleted_at IS NULL
          AND tm.status = 'active'
          AND tm.tenant_id = :tid
        """,
        params,
    )
    sessions = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM sessions
        WHERE deleted_at IS NULL AND tenant_id = :tid
        """,
        params,
    )
    messages = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM messages m
        INNER JOIN sessions s ON s.id = m.session_id
        WHERE m.deleted_at IS NULL
          AND s.deleted_at IS NULL
          AND s.tenant_id = :tid
        """,
        params,
    )
    agents = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM custom_agents
        WHERE deleted_at IS NULL AND tenant_id = :tid
        """,
        params,
    )
    return WeKnoraOverview(users=users, sessions=sessions, messages=messages, agents=agents)


async def count_weknora_active_users(
    db: AsyncSession,
    *,
    since: datetime,
    until: datetime | None = None,
) -> int:
    tenant_id = dashboard_tenant_id()
    if tenant_id is None:
        return 0
    params: dict[str, Any] = {"tid": tenant_id, "since": since}
    until_sql_sessions = ""
    until_sql_messages = ""
    if until is not None:
        params["until"] = until
        until_sql_sessions = " AND s.updated_at < :until"
        until_sql_messages = " AND m.created_at < :until"
    return await _scalar(
        db,
        f"""
        SELECT COUNT(*) FROM (
          SELECT s.user_id
          FROM sessions s
          INNER JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
          WHERE s.deleted_at IS NULL
            AND s.tenant_id = :tid
            AND s.user_id IS NOT NULL AND s.user_id <> ''
            AND s.updated_at >= :since
            {until_sql_sessions}
          UNION
          SELECT s.user_id
          FROM messages m
          INNER JOIN sessions s ON s.id = m.session_id
          INNER JOIN users u ON u.id = s.user_id AND u.deleted_at IS NULL
          WHERE m.deleted_at IS NULL
            AND s.deleted_at IS NULL
            AND s.tenant_id = :tid
            AND s.user_id IS NOT NULL AND s.user_id <> ''
            AND m.created_at >= :since
            {until_sql_messages}
        ) t
        """,
        params,
    )


async def fetch_weknora_daily_active_users(db: AsyncSession, *, days: int = 7) -> list[dict]:
    now = utc_now()
    rows: list[dict] = []
    for i in range(days):
        day_start = now - timedelta(days=i + 1)
        day_end = now - timedelta(days=i)
        count = await count_weknora_active_users(db, since=day_start, until=day_end)
        rows.append({"date": day_start.strftime("%Y-%m-%d"), "active_users": count})
    return list(reversed(rows))


async def fetch_weknora_knowledge_stats(db: AsyncSession) -> WeKnoraKnowledgeStats:
    tenant_id = dashboard_tenant_id()
    if tenant_id is None:
        return WeKnoraKnowledgeStats()
    params = {"tid": tenant_id}

    total_databases = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM knowledge_bases
        WHERE deleted_at IS NULL
          AND is_temporary = false
          AND tenant_id = :tid
        """,
        params,
    )

    type_result = await db.execute(
        text(
            """
            SELECT COALESCE(NULLIF(type, ''), 'document') AS kb_type, COUNT(*)
            FROM knowledge_bases
            WHERE deleted_at IS NULL
              AND is_temporary = false
              AND tenant_id = :tid
            GROUP BY 1
            """
        ),
        params,
    )
    databases_by_type: dict[str, int] = {}
    for kb_type, count in type_result.all():
        label = kb_type_label(kb_type)
        databases_by_type[label] = databases_by_type.get(label, 0) + int(count or 0)

    file_result = await db.execute(
        text(
            """
            SELECT k.file_type, COUNT(*), COALESCE(SUM(k.file_size), 0)
            FROM knowledges k
            INNER JOIN knowledge_bases kb ON kb.id = k.knowledge_base_id
            WHERE k.deleted_at IS NULL
              AND kb.deleted_at IS NULL
              AND kb.is_temporary = false
              AND kb.tenant_id = :tid
            GROUP BY k.file_type
            """
        ),
        params,
    )
    files_by_type: dict[str, int] = {}
    total_files = 0
    total_storage_size = 0
    for file_type, count, size in file_result.all():
        n = int(count or 0)
        total_files += n
        total_storage_size += int(size or 0)
        label = file_type_label(file_type)
        files_by_type[label] = files_by_type.get(label, 0) + n

    return WeKnoraKnowledgeStats(
        total_databases=total_databases,
        total_files=total_files,
        total_nodes=0,
        total_storage_size=total_storage_size,
        databases_by_type=databases_by_type,
        file_type_distribution=files_by_type,
    )


async def fetch_weknora_agent_stats(db: AsyncSession) -> WeKnoraAgentStats:
    tenant_id = dashboard_tenant_id()
    if tenant_id is None:
        return WeKnoraAgentStats()
    params = {"tid": tenant_id}

    total_agents = await _scalar(
        db,
        """
        SELECT COUNT(*)
        FROM custom_agents
        WHERE deleted_at IS NULL AND tenant_id = :tid
        """,
        params,
    )

    name_result = await db.execute(
        text(
            """
            SELECT id, name
            FROM custom_agents
            WHERE deleted_at IS NULL AND tenant_id = :tid
            """
        ),
        params,
    )
    agent_names = {str(agent_id): str(name or agent_id) for agent_id, name in name_result.all()}

    conv_result = await db.execute(
        text(
            """
            SELECT m.agent_id, COUNT(DISTINCT m.session_id)
            FROM messages m
            INNER JOIN sessions s ON s.id = m.session_id
            WHERE m.deleted_at IS NULL
              AND s.deleted_at IS NULL
              AND s.tenant_id = :tid
              AND m.agent_id IS NOT NULL AND m.agent_id <> ''
            GROUP BY m.agent_id
            ORDER BY COUNT(DISTINCT m.session_id) DESC
            """
        ),
        params,
    )
    agent_conversation_counts = [
        {"agent_id": agent_id, "conversation_count": int(count or 0), "system": "weknora"}
        for agent_id, count in conv_result.all()
    ]

    return WeKnoraAgentStats(
        total_agents=total_agents,
        agent_conversation_counts=agent_conversation_counts,
        agent_names=agent_names,
    )
