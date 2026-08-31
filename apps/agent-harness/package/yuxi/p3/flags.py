"""P3 功能开关。WeKnora 知识库实时透传默认关闭。"""

from __future__ import annotations

import os


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def is_weknora_kb_enabled() -> bool:
    """接入模式：智能体知识库选择与 list_kbs 只走 WeKnora；关闭后仍查 yuxi 原生库。"""
    return _flag("HARNESS_WEKNORA_KB")


def weknora_base_url() -> str:
    return os.environ.get("WEKNORA_BASE_URL", "").strip().rstrip("/")


def require_weknora_base_url() -> str:
    url = weknora_base_url()
    if not url:
        raise RuntimeError("HARNESS_WEKNORA_KB 已打开，但 WEKNORA_BASE_URL 为空")
    return url
