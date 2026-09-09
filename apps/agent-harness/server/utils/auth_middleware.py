from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import User

from yuxi.auth.request_token import bind_request_access_token
from yuxi.auth.token_status import is_weknora_access_token_active
from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal
from yuxi.tenancy.resolve import TenantHeaderError, resolve_request_tenant_id
from yuxi.services.weknora_identity_service import WeKnoraIdentityError, load_user_from_claims
from yuxi.utils.weknora_auth import WeKnoraTokenError, verify_weknora_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/token", auto_error=False)


def _bind_principal(user: User | None, tenant_id: int | None) -> User | None:
    if user is None:
        bind_tenant_principal(None)
        return None
    uid = getattr(user, "uid", None)
    if uid is None:
        uid = getattr(user, "id", "")
    bind_tenant_principal(
        TenantPrincipal(
            uid=str(uid),
            tenant_id=int(tenant_id) if tenant_id is not None else None,
            role=str(getattr(user, "role", None) or "user"),
        )
    )
    return user


async def get_db():
    async with pg_manager.get_async_session_context() as db:
        yield db


async def get_current_user(
    authorization: str | None = Header(None),
    x_tenant_id: Annotated[str | None, Header(alias="X-Tenant-ID")] = None,
    db: AsyncSession = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无效的凭证",
        headers={"WWW-Authenticate": "Bearer"},
    )

    bind_request_access_token(None)

    if authorization is None or not authorization.startswith("Bearer "):
        return _bind_principal(None, None)

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        return _bind_principal(None, None)
    if token.startswith("yxkey_"):
        raise credentials_exception

    try:
        claims = verify_weknora_access_token(token)
    except WeKnoraTokenError:
        raise credentials_exception

    bind_request_access_token(token)
    try:
        tenant_id = await resolve_request_tenant_id(
            db,
            uid=str(claims.get("user_id") or ""),
            token_tenant_id=int(claims["tenant_id"]),
            header_raw=x_tenant_id,
        )
        claims = {**claims, "tenant_id": tenant_id}
        if not await is_weknora_access_token_active(token, db):
            raise credentials_exception
        user = await load_user_from_claims(db, claims)
    except TenantHeaderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    except WeKnoraIdentityError as exc:
        raise HTTPException(
            status_code=exc.status_code,
            detail=str(exc),
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    return _bind_principal(user, int(claims["tenant_id"]))


async def get_required_user(user: User | None = Depends(get_current_user)):
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请登录后再访问",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


async def get_admin_user(current_user: User = Depends(get_required_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


async def get_superadmin_user(current_user: User = Depends(get_required_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要超级管理员权限",
        )
    return current_user
