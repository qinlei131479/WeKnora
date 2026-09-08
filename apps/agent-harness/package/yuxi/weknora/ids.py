"""WeKnora 知识库 ID（UUID）与 yuxi `kb_*` 本地 ID。"""

from __future__ import annotations

import uuid


def is_weknora_kb_id(value: str | None) -> bool:
    raw = str(value or "").strip()
    if not raw or raw.startswith("kb_"):
        return False
    try:
        uuid.UUID(raw)
    except ValueError:
        return False
    return True
