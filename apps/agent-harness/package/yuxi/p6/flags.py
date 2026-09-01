"""P6 功能开关。WeKnora 表分系统统计默认关闭。"""

from __future__ import annotations

import os


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def is_weknora_dashboard_enabled() -> bool:
    """接入模式：数据总览 SQL 统计 WeKnora 表并分栏；关闭后仍只计 yuxi h_*。"""
    return _flag("HARNESS_WEKNORA_DASHBOARD")
