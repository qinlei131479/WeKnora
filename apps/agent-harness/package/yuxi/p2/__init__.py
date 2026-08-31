"""P2 租户贯通。默认关闭；关闭后查询与改造前一致，影子列保留。"""

from yuxi.p2.context import TenantPrincipal, TenantScopeError, bind_tenant_principal, stamp_tenant_id
from yuxi.p2.flags import is_department_enforced, is_tenant_scope_enabled

__all__ = [
    "TenantPrincipal",
    "TenantScopeError",
    "bind_tenant_principal",
    "is_department_enforced",
    "is_tenant_scope_enabled",
    "stamp_tenant_id",
]
