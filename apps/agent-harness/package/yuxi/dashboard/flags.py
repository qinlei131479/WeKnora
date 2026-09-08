"""数据总览开关。关闭后仪表盘仍只统计 yuxi h_* 表。"""

from __future__ import annotations

import os


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def is_weknora_dashboard_enabled() -> bool:
    """打开后，数据总览 SQL 统计同库 WeKnora 表并分栏。"""
    return _flag("HARNESS_WEKNORA_DASHBOARD")
