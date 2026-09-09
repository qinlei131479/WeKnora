"""旧 yuxi kb_id → WeKnora UUID。未映射项告警，不静默丢弃。"""

from __future__ import annotations

from yuxi.weknora.ids import is_weknora_kb_id
from yuxi.utils import logger


def load_kb_id_map() -> dict[str, str]:
    return {}


def remap_knowledge_ids(ids: list[str] | None) -> tuple[list[str], list[str]]:
    """返回 (重映射后的 id 列表, 仍是 yuxi kb_* 且无映射的 id)。"""
    if not ids:
        return [], []
    table = load_kb_id_map()
    remapped: list[str] = []
    unmapped: list[str] = []
    seen: set[str] = set()
    for raw in ids:
        value = str(raw or "").strip()
        if not value:
            continue
        if value in table:
            value = table[value]
        elif value.startswith("kb_") and not is_weknora_kb_id(value):
            unmapped.append(value)
        if value in seen:
            continue
        seen.add(value)
        remapped.append(value)
    if unmapped:
        logger.warning(
            "旧智能体知识库未映射到 WeKnora UUID，仍按 yuxi 原生 ID 保留: %s",
            unmapped,
        )
    return remapped, unmapped
