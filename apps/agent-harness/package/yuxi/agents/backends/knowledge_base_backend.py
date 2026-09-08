from __future__ import annotations

from typing import Any

from yuxi.weknora.mapping import remap_knowledge_ids


async def resolve_visible_knowledge_bases_for_context(context) -> list[dict[str, Any]]:
    from yuxi.knowledge.runtime import knowledge_base
    from yuxi.utils import logger

    uid = getattr(context, "uid", None)
    if not uid:
        setattr(context, "_visible_knowledge_bases", [])
        return []

    summaries = await knowledge_base.get_databases_by_uid(str(uid))
    databases = [
        {
            "kb_id": summary.kb_id,
            "name": summary.name,
            "description": summary.description,
            "kb_type": summary.kb_type,
        }
        for summary in summaries
    ]
    enabled_knowledges = getattr(context, "knowledges", None)
    if enabled_knowledges is not None:
        remapped, unmapped = remap_knowledge_ids([str(value) for value in enabled_knowledges])
        enabled_ids = {item for item in remapped if item}
        databases = [db for db in databases if str(db.get("kb_id") or "").strip() in enabled_ids]
        if unmapped:
            still_missing = [item for item in unmapped if item not in {db.get("kb_id") for db in databases}]
            if still_missing:
                logger.warning("旧知识库绑定未映射且当前不可见: %s", still_missing)

    setattr(context, "_visible_knowledge_bases", databases)
    return databases
