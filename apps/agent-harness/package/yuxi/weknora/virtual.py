"""WeKnora UUID 知识库的虚拟配置，不写 h_knowledge_bases。"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from yuxi.knowledge.read_models import KnowledgeBaseConfig, KnowledgeBaseDetail, KnowledgeBaseSummary
from yuxi.weknora.kb_fulltext import capability_for_kb_type
from yuxi.weknora.client import WeKnoraKBClient
from yuxi.permissions import ResourcePermission

_GLOBAL_READ = {
    "version": 2,
    "read_scope": {"access_level": "global", "department_ids": [], "user_uids": []},
    "manage_scope": None,
}


def weknora_content_type(meta: dict[str, Any] | None) -> str:
    raw = str((meta or {}).get("type") or "document").strip().lower()
    if raw in {"faq", "wiki", "document"}:
        return raw
    return "document"


def summary_from_weknora(meta: dict[str, Any]) -> KnowledgeBaseSummary:
    kb_id = str(meta.get("id") or "").strip()
    content_type = weknora_content_type(meta)
    capability = capability_for_kb_type(content_type)
    created_at = _parse_dt(meta.get("created_at"))
    return KnowledgeBaseSummary(
        kb_id=kb_id,
        name=str(meta.get("name") or kb_id),
        description=str(meta.get("description") or "") or None,
        kb_type="weknora",
        embedding_model_spec=None,
        llm_model_spec=None,
        query_params={},
        additional_params={
            "weknora_kb_type": content_type,
            "weknora_capability": capability,
            "knowledge_count": int(meta.get("knowledge_count") or 0),
            "chunk_count": int(meta.get("chunk_count") or 0),
        },
        share_config=dict(_GLOBAL_READ),
        created_by=str(meta.get("creator_id") or "") or None,
        created_at=created_at,
        file_count=int(meta.get("knowledge_count") or 0),
        chunk_count=int(meta.get("chunk_count") or 0),
        effective_permission=ResourcePermission.READ,
    )


def detail_from_weknora(meta: dict[str, Any]) -> KnowledgeBaseDetail:
    summary = summary_from_weknora(meta)
    data = {key: getattr(summary, key) for key in summary.__dataclass_fields__}
    return KnowledgeBaseDetail(**data, mindmap=None)


def config_from_weknora(kb_id: str, meta: dict[str, Any] | None = None) -> KnowledgeBaseConfig:
    content_type = weknora_content_type(meta)
    return KnowledgeBaseConfig(
        kb_id=kb_id,
        kb_type="weknora",
        embedding_model_spec=None,
        query_params={},
        additional_params={"weknora_kb_type": content_type},
    )


async def fetch_weknora_summaries() -> list[KnowledgeBaseSummary]:
    client = WeKnoraKBClient()
    items = await client.list_knowledge_bases()
    summaries: list[KnowledgeBaseSummary] = []
    for item in items:
        if not isinstance(item, dict) or not item.get("id"):
            continue
        summaries.append(summary_from_weknora(item))
    return summaries


async def fetch_weknora_config(kb_id: str) -> KnowledgeBaseConfig:
    client = WeKnoraKBClient()
    meta = await client.get_knowledge_base(kb_id)
    return config_from_weknora(kb_id, meta)


async def fetch_weknora_detail(kb_id: str) -> KnowledgeBaseDetail:
    client = WeKnoraKBClient()
    meta = await client.get_knowledge_base(kb_id)
    return detail_from_weknora(meta)


def _parse_dt(value: Any) -> datetime | None:
    raw = str(value or "").strip()
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00")).astimezone(timezone.utc).replace(tzinfo=None)
    except ValueError:
        return None
