"""请求/运行上下文中的租户 principal。"""

from __future__ import annotations

from contextvars import ContextVar
from dataclasses import dataclass

_PRINCIPAL: ContextVar["TenantPrincipal | None"] = ContextVar("tenant_principal", default=None)


@dataclass(frozen=True)
class TenantPrincipal:
    uid: str
    tenant_id: int | None
    role: str


def bind_tenant_principal(principal: TenantPrincipal | None) -> None:
    _PRINCIPAL.set(principal)


def get_tenant_principal() -> TenantPrincipal | None:
    return _PRINCIPAL.get()


class TenantScopeError(ValueError):
    """当前上下文没有可写入的 tenant_id。"""


def current_tenant_id() -> int | None:
    """当前租户。无上下文时返回 None（查询应 fail-closed）。"""
    principal = get_tenant_principal()
    if principal is None:
        return None
    return principal.tenant_id


def stamp_tenant_id() -> int | None:
    """写入新行用的 tenant_id。超管也盖当前 token 空间，不写空。"""
    principal = get_tenant_principal()
    if principal is None or principal.tenant_id is None:
        raise TenantScopeError("写入需要当前租户 tenant_id")
    return int(principal.tenant_id)
