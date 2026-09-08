"""WeKnora 接入地址。知识库与模型已固定走 WeKnora，不再有回退开关。"""

from __future__ import annotations

import os


def weknora_base_url() -> str:
    return os.environ.get("WEKNORA_BASE_URL", "").strip().rstrip("/")


def require_weknora_base_url() -> str:
    url = weknora_base_url()
    if not url:
        raise RuntimeError("WEKNORA_BASE_URL 为空，无法调用 WeKnora")
    return url
