"""旧 yuxi kb_id → WeKnora UUID。未映射项告警，不静默丢弃。"""

from __future__ import annotations

import json
import os

from yuxi.p3.ids import is_weknora_kb_id
from yuxi.utils import logger


def load_kb_id_map() -> dict[str, str]:
    raw = os.environ.get("HARNESS_WEKNORA_KB_MAP", "").strip()
    if not raw:
        return {}
    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.warning("HARNESS_WEKNORA_KB_MAP 不是合法 JSON，已忽略")
        return {}
    if not isinstance(data, dict):
        return {}
    mapped: dict[str, str] = {}
    for key, value in data.items():
        src = str(key or "").strip()
        dst = str(value or "").strip()
        if src and dst:
            mapped[src] = dst
    return mapped


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
            "P3 旧智能体知识库未映射到 WeKnora UUID，仍按 yuxi 原生 ID 保留: %s "
            "（配置 HARNESS_WEKNORA_KB_MAP）",
            unmapped,
        )
    return remapped, unmapped
