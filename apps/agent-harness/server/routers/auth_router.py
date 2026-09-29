from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from server.utils.auth_middleware import get_db
from yuxi.services.operation_log_service import log_operation
from yuxi.services.weknora_identity_service import (
    fetch_membership,
    map_projected_role,
    resolve_login_tenant_id,
)
from yuxi.storage.minio.client import normalize_public_minio_url
from yuxi.storage.postgres.models_business import User
from yuxi.utils.auth_utils import AuthUtils
from yuxi.utils.datetime_utils import utc_now_naive
from yuxi.utils.weknora_auth import create_weknora_access_token, create_weknora_refresh_token

auth = APIRouter(prefix="/auth", tags=["authentication"])


class Token(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str
    user_id: str
    username: str
    uid: str
    email: str | None = None
    phone_number: str | None = None
    avatar: str | None = None
    role: str
    department_id: int | None = None
    department_name: str | None = None


class LoginBody(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)


def _user_token_payload(user: User, access_token: str, refresh_token: str | None = None) -> dict:
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user_id": str(user.id),
        "username": user.username,
        "uid": str(user.uid),
        "email": user.email,
        "phone_number": None,
        "avatar": normalize_public_minio_url(user.avatar),
        "role": user.role,
        "department_id": None,
        "department_name": None,
    }


async def _persist_auth_tokens(db: AsyncSession, *, user_id: str, access: str, refresh: str) -> None:
    now = utc_now_naive()
    access_exp = now + timedelta(hours=24)
    refresh_exp = now + timedelta(days=7)
    for token, token_type, expires_at in (
        (access, "access_token", access_exp),
        (refresh, "refresh_token", refresh_exp),
    ):
        await db.execute(
            text(
                "INSERT INTO auth_tokens "
                "(id, user_id, token, token_type, expires_at, is_revoked, created_at, updated_at) "
                "VALUES (gen_random_uuid()::text, :user_id, :token, :token_type, "
                ":expires_at, false, :now, :now)"
            ),
            {
                "user_id": user_id,
                "token": token,
                "token_type": token_type,
                "expires_at": expires_at,
                "now": now,
            },
        )


async def _login_with_email(db: AsyncSession, email: str, password: str) -> dict:
    result = await db.execute(select(User).where(User.email == email.strip()))
    user = result.scalar_one_or_none()
    if user is None or user.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    if not AuthUtils.verify_password(user.password_hash, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    tenant_id = await resolve_login_tenant_id(db, user)
    if tenant_id <= 0:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="当前账号没有可用租户")

    membership = await fetch_membership(db, str(user.id), tenant_id)
    user.role = map_projected_role(
        is_system_admin=bool(user.is_system_admin),
        can_access_all_tenants=bool(user.can_access_all_tenants),
        membership_role=None if membership is None else str(membership.get("role") or ""),
    )
    access = create_weknora_access_token(user_id=str(user.id), email=user.email, tenant_id=tenant_id)
    refresh = create_weknora_refresh_token(user_id=str(user.id))
    await _persist_auth_tokens(db, user_id=str(user.id), access=access, refresh=refresh)
    await log_operation(db, str(user.id), "登录")
    return _user_token_payload(user, access, refresh)


@auth.post("/login", response_model=Token)
async def login_with_json(body: LoginBody, db: AsyncSession = Depends(get_db)):
    return await _login_with_email(db, str(body.email), body.password)
