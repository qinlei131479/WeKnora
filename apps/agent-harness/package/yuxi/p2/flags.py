"""P2 功能开关。租户过滤默认关闭；部门强制默认开启。"""

from __future__ import annotations

import os


def _flag(name: str, default: str = "") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "on"}


def is_tenant_scope_enabled() -> bool:
    """按 JWT/上下文 tenant_id 过滤业务数据。默认关闭。"""
    return _flag("HARNESS_TENANT_SCOPE")


def is_department_enforced() -> bool:
    """是否强制部门绑定并允许 department 共享匹配。

    租户开关打开时默认关闭部门强制（可用 HARNESS_DEPARTMENT_ENFORCED 覆盖）。
    """
    if os.environ.get("HARNESS_DEPARTMENT_ENFORCED", "").strip():
        return _flag("HARNESS_DEPARTMENT_ENFORCED")
    return not is_tenant_scope_enabled()
