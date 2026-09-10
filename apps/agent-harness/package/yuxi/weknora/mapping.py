"""知识库 ID 规范化。旧 yuxi kb_* 不再映射，仅告警保留。"""

from __future__ import annotations

from yuxi.weknora.ids import is_weknora_kb_id
from yuxi.utils import logger


def remap_knowledge_ids(ids: list[str] | None) -> tuple[list[str], list[str]]:
    """返回 (去重后的 id 列表, 仍是 yuxi kb_* 的 id)。"""
    if not ids:
        return [], []
    remapped: list[str] = []
    unmapped: list[str] = []
    seen: set[str] = set()
    for raw in ids:
        value = str(raw or "").strip()
        if not value:
            continue
        if value.startswith("kb_") and not is_weknora_kb_id(value):
            unmapped.append(value)
        if value in seen:
            continue
        seen.add(value)
        remapped.append(value)
    if unmapped:
        logger.warning(
            "旧智能体知识库仍是 yuxi 原生 ID，未做映射: %s",
            unmapped,
        )
    return remapped, unmapped
