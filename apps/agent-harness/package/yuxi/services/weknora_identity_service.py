"""从 WeKnora `users` / `tenant_members` 加载当前用户，不再投影到 h_users。"""

from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from yuxi.storage.postgres.models_business import User

ADMIN_MEMBER_ROLES = frozenset({"owner", "admin"})


class WeKnoraIdentityError(Exception):
    """身份加载失败。status_code 供中间件映射 HTTP。"""

    def __init__(self, message: str, status_code: int = 401):
        super().__init__(message)
        self.status_code = status_code


def map_projected_role(
    *,
    is_system_admin: bool,
    can_access_all_tenants: bool,
    membership_role: str | None,
) -> str:
    if is_system_admin or can_access_all_tenants:
        return "superadmin"
    if str(membership_role or "").strip().lower() in ADMIN_MEMBER_ROLES:
        return "admin"
    return "user"


async def fetch_weknora_user(db: AsyncSession, user_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            "SELECT id, username, email, avatar, is_active, is_system_admin, "
            "can_access_all_tenants, tenant_id FROM users "
            "WHERE id = :uid AND deleted_at IS NULL"
        ),
        {"uid": user_id},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def fetch_membership(db: AsyncSession, user_id: str, tenant_id: int) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            "SELECT role, status FROM tenant_members "
            "WHERE user_id = :uid AND tenant_id = :tid AND deleted_at IS NULL"
        ),
        {"uid": user_id, "tid": int(tenant_id)},
    )
    row = result.mappings().first()
    return dict(row) if row else None


async def resolve_login_tenant_id(db: AsyncSession, user: User) -> int:
    if user.tenant_id and int(user.tenant_id) > 0:
        return int(user.tenant_id)
    result = await db.execute(
        text(
            "SELECT tenant_id FROM tenant_members "
            "WHERE user_id = :uid AND deleted_at IS NULL AND status = 'active' "
            "ORDER BY tenant_id ASC LIMIT 1"
        ),
        {"uid": str(user.id)},
    )
    row = result.first()
    if row is None:
        return 0
    return int(row[0])


async def list_access_options(db: AsyncSession, tenant_id: int) -> list[dict[str, Any]]:
    result = await db.execute(
        text(
            "SELECT u.id, u.username, tm.role "
            "FROM tenant_members tm "
            "JOIN users u ON u.id = tm.user_id "
            "WHERE tm.tenant_id = :tid AND tm.deleted_at IS NULL AND tm.status = 'active' "
            "AND u.deleted_at IS NULL "
            "ORDER BY u.username"
        ),
        {"tid": int(tenant_id)},
    )
    options = []
    for row in result.mappings():
        options.append(
            {
                "uid": str(row["id"]),
                "username": row["username"],
                "role": map_projected_role(
                    is_system_admin=False,
                    can_access_all_tenants=False,
                    membership_role=str(row["role"] or ""),
                ),
                "department_id": None,
                "department_name": None,
            }
        )
    return options


async def load_user_from_claims(db: AsyncSession, claims: dict[str, Any]) -> User:
    weknora_id = str(claims.get("user_id") or "").strip()
    tenant_id = int(claims["tenant_id"])
    result = await db.execute(select(User).where(User.id == weknora_id))
    user = result.scalar_one_or_none()
    if user is None or user.deleted_at is not None:
        raise WeKnoraIdentityError("用户不存在或已删除")
    if not bool(user.is_active):
        raise WeKnoraIdentityError("用户已禁用")

    membership = await fetch_membership(db, weknora_id, tenant_id)
    if not user.is_system_admin and not user.can_access_all_tenants:
        if membership is None or str(membership.get("status") or "") != "active":
            raise WeKnoraIdentityError("当前空间没有有效成员资格")

    user.role = map_projected_role(
        is_system_admin=bool(user.is_system_admin),
        can_access_all_tenants=bool(user.can_access_all_tenants),
        membership_role=None if membership is None else str(membership.get("role") or ""),
    )
    return user


ensure_projected_user = load_user_from_claims
