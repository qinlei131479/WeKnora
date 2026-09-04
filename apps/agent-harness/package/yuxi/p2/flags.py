"""P2 功能开关。租户过滤默认关闭；部门强制默认开启。"""

from __future__ import annotations

import os


def _flag(name: str, default: str = "") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "on"}


def is_tenant_scope_enabled() -> bool:
    """按 JWT/上下文 tenant_id 过滤业务数据。默认关闭。"""
    return _flag("HARNESS_TENANT_SCOPE")


def is_department_enforced() -> bool:
    """部门能力已删除。"""
    return False
