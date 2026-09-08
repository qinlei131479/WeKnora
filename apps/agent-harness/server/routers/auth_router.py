from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import text

from server.utils.auth_middleware import get_db, get_required_user
from yuxi.tenancy.context import get_tenant_principal
from yuxi.services.operation_log_service import log_operation
from yuxi.services.weknora_identity_service import (
    fetch_membership,
    list_access_options,
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


class UserResponse(BaseModel):
    id: str
    username: str
    uid: str
    email: str | None = None
    phone_number: str | None = None
    avatar: str | None = None
    role: str
    department_id: int | None = None
    department_name: str | None = None
    created_at: str | None = None
    last_login: str | None = None


class UserAccessOption(BaseModel):
    uid: str
    username: str
    role: str
    department_id: int | None = None
    department_name: str | None = None


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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="当前账号没有可用空间")

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


@auth.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db),
):
    return await _login_with_email(db, form_data.username, form_data.password)


@auth.post("/login", response_model=Token)
async def login_with_json(body: LoginBody, db: AsyncSession = Depends(get_db)):
    return await _login_with_email(db, str(body.email), body.password)


@auth.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_required_user)):
    data = current_user.to_dict()
    data["department_name"] = None
    return data


@auth.get("/users/access-options", response_model=list[UserAccessOption])
async def read_user_access_options(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    principal = get_tenant_principal()
    tenant_id = principal.tenant_id if principal is not None else current_user.tenant_id
    if not tenant_id:
        return []
    return await list_access_options(db, int(tenant_id))
