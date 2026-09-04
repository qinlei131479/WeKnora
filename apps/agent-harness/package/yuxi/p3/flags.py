"""P3 功能开关。P7 后知识库只走 WeKnora。"""

from __future__ import annotations

import os


def is_weknora_kb_enabled() -> bool:
    """P7 后只走 WeKnora。"""
    return True


def weknora_base_url() -> str:
    return os.environ.get("WEKNORA_BASE_URL", "").strip().rstrip("/")


def require_weknora_base_url() -> str:
    url = weknora_base_url()
    if not url:
        raise RuntimeError("HARNESS_WEKNORA_KB 已打开，但 WEKNORA_BASE_URL 为空")
    return url
