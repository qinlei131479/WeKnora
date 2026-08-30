"""把 WeKnora 用户投影到 h_users。不自动 remap 已有用户的 uid。"""

from __future__ import annotations

from typing import Any

from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from yuxi.storage.postgres.models_business import Department, User, UserIdentityMap
from yuxi.utils.datetime_utils import utc_now_naive

COMPAT_DEPARTMENT_NAME = "_weknora_compat"
PROJECTED_PASSWORD_PLACEHOLDER = "weknora-projected"
ADMIN_MEMBER_ROLES = frozenset({"owner", "admin"})
ROLE_RANK = {"user": 0, "admin": 1, "superadmin": 2}


class WeKnoraIdentityError(Exception):
    """投影失败。status_code 供中间件映射 HTTP。"""

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


def prefer_existing_role(existing: str | None, mapped: str) -> str:
    """已有 harness 角色不得因投影降权。"""
    if ROLE_RANK.get(existing or "", -1) > ROLE_RANK.get(mapped, 0):
        return str(existing)
    return mapped


def next_unique_username(preferred: str, taken: set[str]) -> str:
    base = (preferred or "weknora-user").strip() or "weknora-user"
    candidate = base[:80]
    suffix = 0
    while candidate in taken:
        suffix += 1
        candidate = f"{base[:60]}-wk{suffix}"
    return candidate


async def fetch_weknora_user(db: AsyncSession, user_id: str) -> dict[str, Any] | None:
    result = await db.execute(
        text(
            "SELECT id, username, email, avatar, is_active, is_system_admin, "
            "can_access_all_tenants FROM users "
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


async def fetch_confirmed_map(db: AsyncSession, weknora_user_id: str) -> UserIdentityMap | None:
    result = await db.execute(
        select(UserIdentityMap).where(
            UserIdentityMap.weknora_user_id == weknora_user_id,
            UserIdentityMap.confirmed_at.is_not(None),
        )
    )
    return result.scalar_one_or_none()


async def get_or_create_compat_department(db: AsyncSession) -> int:
    result = await db.execute(select(Department).where(Department.name == COMPAT_DEPARTMENT_NAME))
    department = result.scalar_one_or_none()
    if department:
        return int(department.id)
    department = Department(name=COMPAT_DEPARTMENT_NAME, description="P1 过渡兼容部门，P2 移除")
    db.add(department)
    try:
        await db.flush()
    except IntegrityError as exc:
        result = await db.execute(select(Department).where(Department.name == COMPAT_DEPARTMENT_NAME))
        department = result.scalar_one_or_none()
        if department is None:
            raise WeKnoraIdentityError("无法创建兼容部门", status_code=500) from exc
    return int(department.id)


async def _username_taken(db: AsyncSession, username: str, exclude_id: int | None) -> bool:
    query = select(User.id).where(User.username == username, User.is_deleted == 0)
    if exclude_id is not None:
        query = query.where(User.id != exclude_id)
    result = await db.execute(query)
    return result.scalar_one_or_none() is not None


async def allocate_username(db: AsyncSession, preferred: str, exclude_id: int | None = None) -> str:
    taken: set[str] = set()
    candidate = next_unique_username(preferred, taken)
    while await _username_taken(db, candidate, exclude_id):
        taken.add(candidate)
        candidate = next_unique_username(preferred, taken)
    return candidate


async def find_unmapped_candidates(db: AsyncSession, *, username: str, email: str) -> list[User]:
    values = {value for value in (username, email) if value}
    if not values:
        return []
    result = await db.execute(
        select(User).where(
            User.is_deleted == 0,
            or_(User.username.in_(values), User.uid.in_(values)),
        )
    )
    return list(result.scalars().all())


async def ensure_projected_user(db: AsyncSession, claims: dict[str, Any]) -> User:
    weknora_id = str(claims.get("user_id") or "").strip()
    tenant_id = int(claims["tenant_id"])
    source = await fetch_weknora_user(db, weknora_id)
    if source is None:
        raise WeKnoraIdentityError("用户不存在或已删除")
    if not bool(source.get("is_active")):
        raise WeKnoraIdentityError("用户已禁用")

    is_system_admin = bool(source.get("is_system_admin"))
    can_access_all = bool(source.get("can_access_all_tenants"))
    membership = await fetch_membership(db, weknora_id, tenant_id)
    if not is_system_admin and not can_access_all:
        if membership is None or str(membership.get("status") or "") != "active":
            raise WeKnoraIdentityError("当前空间没有有效成员资格")

    role = map_projected_role(
        is_system_admin=is_system_admin,
        can_access_all_tenants=can_access_all,
        membership_role=None if membership is None else str(membership.get("role") or ""),
    )
    preferred_name = str(source.get("username") or source.get("email") or "weknora-user")
    avatar = source.get("avatar")

    confirmed = await fetch_confirmed_map(db, weknora_id)
    user: User | None = None
    if confirmed is not None:
        result = await db.execute(
            select(User).where(User.id == confirmed.h_user_id, User.is_deleted == 0)
        )
        user = result.scalar_one_or_none()
        if user is None:
            raise WeKnoraIdentityError("已确认映射指向的用户不存在")
    else:
        result = await db.execute(select(User).where(User.uid == weknora_id, User.is_deleted == 0))
        user = result.scalar_one_or_none()
        if user is None:
            candidates = await find_unmapped_candidates(
                db,
                username=str(source.get("username") or ""),
                email=str(source.get("email") or ""),
            )
            if candidates:
                raise WeKnoraIdentityError(
                    "存在尚未确认的历史用户映射，禁止自动创建第二行投影",
                    status_code=403,
                )
            user = User(
                username=await allocate_username(db, preferred_name),
                uid=weknora_id,
                phone_number=None,
                avatar=avatar,
                password_hash=PROJECTED_PASSWORD_PLACEHOLDER,
                role=role,
                department_id=await get_or_create_compat_department(db),
                last_login=utc_now_naive(),
            )
            db.add(user)
            await db.flush()
            return user

    changed = False
    username = await allocate_username(db, preferred_name, exclude_id=int(user.id))
    if user.username != username:
        user.username = username
        changed = True
    if (user.avatar or None) != (avatar or None):
        user.avatar = avatar
        changed = True
    role = prefer_existing_role(user.role, role)
    if user.role != role:
        user.role = role
        changed = True
    if not user.department_id:
        user.department_id = await get_or_create_compat_department(db)
        changed = True
    if changed:
        user.last_login = utc_now_naive()
        await db.flush()
    return user
