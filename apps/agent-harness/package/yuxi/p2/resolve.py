"""从 WeKnora 表解析 uid → tenant_id。不走 prefix_sql。"""

from __future__ import annotations

import uuid

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text


def looks_like_uuid(value: str | None) -> bool:
    raw = str(value or "").strip()
    if not raw:
        return False
    try:
        uuid.UUID(raw)
    except ValueError:
        return False
    return True


async def resolve_uid_tenant_id(db: AsyncSession, uid: str | None) -> int | None:
    """legacy JWT / API Key：uid 为 WeKnora UUID 时取 users.tenant_id。"""
    raw = str(uid or "").strip()
    if not looks_like_uuid(raw):
        return None
    result = await db.execute(
        text(
            "SELECT tenant_id FROM users "
            "WHERE id = :uid AND deleted_at IS NULL AND tenant_id IS NOT NULL"
        ),
        {"uid": raw},
    )
    value = result.scalar_one_or_none()
    if value is None:
        return None
    return int(value)


class TenantHeaderError(Exception):
    """X-Tenant-ID 非法或无权访问目标空间。"""

    def __init__(self, message: str, status_code: int = 400):
        super().__init__(message)
        self.status_code = status_code


def parse_tenant_header(raw: str | None) -> int | None:
    if raw is None:
        return None
    text_value = str(raw).strip()
    if not text_value:
        return None
    try:
        tenant_id = int(text_value)
    except (TypeError, ValueError) as exc:
        raise TenantHeaderError("Invalid X-Tenant-ID header") from exc
    if tenant_id <= 0:
        raise TenantHeaderError("Invalid X-Tenant-ID header")
    return tenant_id


async def tenant_row_exists(db: AsyncSession, tenant_id: int) -> bool:
    result = await db.execute(
        text("SELECT 1 FROM tenants WHERE id = :tid AND deleted_at IS NULL"),
        {"tid": int(tenant_id)},
    )
    return result.scalar_one_or_none() is not None


async def assert_tenant_accessible(db: AsyncSession, uid: str | None, tenant_id: int) -> None:
    from yuxi.services.weknora_identity_service import fetch_membership, fetch_weknora_user

    if not looks_like_uuid(uid):
        raise TenantHeaderError("Forbidden: insufficient permissions to access target workspace", 403)
    source = await fetch_weknora_user(db, str(uid))
    if source is None:
        raise TenantHeaderError("Forbidden: insufficient permissions to access target workspace", 403)
    home = source.get("tenant_id")
    if home is not None and int(home) == int(tenant_id):
        return
    if bool(source.get("is_system_admin")) or bool(source.get("can_access_all_tenants")):
        return
    membership = await fetch_membership(db, str(uid), int(tenant_id))
    if membership is None or str(membership.get("status") or "") != "active":
        raise TenantHeaderError("Forbidden: insufficient permissions to access target workspace", 403)


async def resolve_request_tenant_id(
    db: AsyncSession,
    *,
    uid: str | None,
    token_tenant_id: int | None,
    header_raw: str | None,
) -> int | None:
    """JWT/家空间为默认；合法且有权的 X-Tenant-ID 覆盖之。"""
    header = parse_tenant_header(header_raw)
    if header is None:
        return int(token_tenant_id) if token_tenant_id is not None else None
    if token_tenant_id is not None and int(header) == int(token_tenant_id):
        return int(header)
    if not await tenant_row_exists(db, header):
        raise TenantHeaderError("Invalid target workspace ID")
    await assert_tenant_accessible(db, uid, header)
    return int(header)
