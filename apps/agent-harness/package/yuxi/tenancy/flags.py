"""租户过滤开关。关闭时查询与写入不带 tenant_id 条件。"""

from __future__ import annotations

import os


def _flag(name: str, default: str = "") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "on"}


def is_tenant_scope_enabled() -> bool:
    """按 JWT/上下文 tenant_id 过滤业务数据。默认关闭。"""
    return _flag("HARNESS_TENANT_SCOPE")
