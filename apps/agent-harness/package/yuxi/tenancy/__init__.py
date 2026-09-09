"""租户贯通：请求 principal、查询过滤，以及 h_* 表 tenant_id 影子列回填。"""

from yuxi.tenancy.context import TenantPrincipal, TenantScopeError, bind_tenant_principal, stamp_tenant_id

__all__ = [
    "TenantPrincipal",
    "TenantScopeError",
    "bind_tenant_principal",
    "stamp_tenant_id",
]
