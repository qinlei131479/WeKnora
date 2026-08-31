import hashlib
from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import APIKey, User
from yuxi.utils.datetime_utils import utc_now_naive

from yuxi.p0.flags import is_run_token_store_enabled
from yuxi.p0.request_token import bind_request_access_token
from yuxi.p1.auth_token_status import is_weknora_access_token_active
from yuxi.p1.flags import is_legacy_jwt_enabled, is_weknora_identity_enabled
from yuxi.p2.context import TenantPrincipal, bind_tenant_principal
from yuxi.p2.flags import is_department_enforced
from yuxi.p2.resolve import TenantHeaderError, resolve_request_tenant_id, resolve_uid_tenant_id
from yuxi.services.weknora_identity_service import WeKnoraIdentityError, ensure_projected_user
from yuxi.utils.auth_utils import AuthUtils
from yuxi.utils.weknora_auth import WeKnoraTokenError, verify_weknora_access_token

# 定义OAuth2密码承载器，指定token URL
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


# 获取数据库会话（异步版本）
async def get_db():
    async with pg_manager.get_async_session_context() as db:
        yield db


async def _verify_api_key(key: str, db: AsyncSession) -> tuple[User | None, APIKey | None]:
    """验证 API Key 并返回关联用户和 APIKey 对象"""
    key_hash = hashlib.sha256(key.encode()).hexdigest()

    result = await db.execute(select(APIKey).filter(APIKey.key_hash == key_hash))
    api_key = result.scalar_one_or_none()

    if api_key is None:
        return None, None

    if not api_key.is_enabled:
        return None, None

    if api_key.expires_at and utc_now_naive() > api_key.expires_at:
        return None, None

    if not api_key.user_id:
        return None, None

    result = await db.execute(select(User).filter(User.id == api_key.user_id))
    user = result.scalar_one_or_none()
    if user and not user.is_deleted:
        return user, api_key

    return None, None


# 获取当前用户（异步版本）
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

    if is_run_token_store_enabled():
        bind_request_access_token(None)

    if authorization is None:
        return _bind_principal(None, None)

    if not authorization.startswith("Bearer "):
        return _bind_principal(None, None)

    token = authorization.split("Bearer ")[1]
    if not token:
        return _bind_principal(None, None)

    # 根据 token 前缀判断认证方式
    if token.startswith("yxkey_"):
        # API Key 认证
        user, api_key_obj = await _verify_api_key(token, db)
        if user is not None and api_key_obj is not None:
            api_key_obj.last_used_at = utc_now_naive()
            await db.commit()
            tenant_id = await resolve_uid_tenant_id(db, getattr(user, "uid", None))
            try:
                tenant_id = await resolve_request_tenant_id(
                    db,
                    uid=getattr(user, "uid", None),
                    token_tenant_id=tenant_id,
                    header_raw=x_tenant_id,
                )
            except TenantHeaderError as exc:
                raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
            return _bind_principal(user, tenant_id)
        return _bind_principal(None, None)

    if is_weknora_identity_enabled():
        try:
            claims = verify_weknora_access_token(token)
        except WeKnoraTokenError:
            claims = None
        if claims is not None:
            if is_run_token_store_enabled():
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
                user = await ensure_projected_user(db, claims)
            except TenantHeaderError as exc:
                raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
            except WeKnoraIdentityError as exc:
                raise HTTPException(
                    status_code=exc.status_code,
                    detail=str(exc),
                    headers={"WWW-Authenticate": "Bearer"},
                ) from exc
            if user.is_login_locked():
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="登录被锁定，请稍后重试",
                    headers={"X-Lock-Remaining": str(user.get_remaining_lock_time())},
                )
            return _bind_principal(user, int(claims["tenant_id"]))
        if not is_legacy_jwt_enabled():
            raise credentials_exception

    # JWT Token 认证（yuxi legacy）
    if is_run_token_store_enabled() and not token.startswith("yxkey_"):
        bind_request_access_token(token)
    try:
        payload = AuthUtils.verify_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).filter(User.id == int(user_id), User.is_deleted == 0))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    if user.is_login_locked():
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail="登录被锁定，请稍后重试",
            headers={"X-Lock-Remaining": str(user.get_remaining_lock_time())},
        )

    tenant_id = await resolve_uid_tenant_id(db, getattr(user, "uid", None))
    try:
        tenant_id = await resolve_request_tenant_id(
            db,
            uid=getattr(user, "uid", None),
            token_tenant_id=tenant_id,
            header_raw=x_tenant_id,
        )
    except TenantHeaderError as exc:
        raise HTTPException(status_code=exc.status_code, detail=str(exc)) from exc
    return _bind_principal(user, tenant_id)


# 获取已登录用户（抛出401如果未登录）
async def get_required_user(user: User | None = Depends(get_current_user)):
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请登录后再访问",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if is_department_enforced() and not user.department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="当前用户未绑定部门",
        )
    return user


# 获取管理员用户
async def get_admin_user(current_user: User = Depends(get_required_user)):
    if current_user.role not in ["admin", "superadmin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限",
        )
    return current_user


# 获取超级管理员用户
async def get_superadmin_user(current_user: User = Depends(get_required_user)):
    if current_user.role != "superadmin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要超级管理员权限",
        )
    return current_user
