"""以 run_id 为键的 Redis 临时 JWT 凭证。不写业务表，不记明文日志。"""

from __future__ import annotations

from typing import Any

from yuxi.p0.flags import is_auth_token_db_check_enabled
from yuxi.storage.redis import get_async_redis_client
from yuxi.utils.weknora_auth import WeKnoraTokenError, remaining_ttl_seconds, verify_weknora_access_token

RUN_TOKEN_KEY_PREFIX = "p0:run-token:"
MAX_TTL_SECONDS = 24 * 60 * 60


def run_token_key(run_id: str) -> str:
    value = str(run_id or "").strip()
    if not value:
        raise ValueError("run_id is required")
    return f"{RUN_TOKEN_KEY_PREFIX}{value}"


def ttl_for_access_token(token: str) -> int:
    payload = verify_weknora_access_token(token)
    return min(MAX_TTL_SECONDS, remaining_ttl_seconds(payload))


async def save_run_access_token(run_id: str, token: str) -> int:
    """保存 access token，返回 TTL 秒数。"""
    ttl = ttl_for_access_token(token)
    redis = await get_async_redis_client()
    await redis.set(run_token_key(run_id), token, ex=ttl)
    return ttl


async def load_run_access_token(run_id: str) -> str | None:
    redis = await get_async_redis_client()
    value = await redis.get(run_token_key(run_id))
    if value is None:
        return None
    return str(value)


async def delete_run_access_token(run_id: str) -> None:
    redis = await get_async_redis_client()
    await redis.delete(run_token_key(run_id))


async def is_weknora_access_token_active(token: str, db: Any | None = None) -> bool:
    """JWT 验签通过后，可选地只读检查 auth_tokens。"""
    verify_weknora_access_token(token)
    if not is_auth_token_db_check_enabled() or db is None:
        return True

    from sqlalchemy import text

    result = await db.execute(
        text(
            "SELECT token_type, is_revoked FROM auth_tokens "
            "WHERE token = :token LIMIT 1"
        ),
        {"token": token},
    )
    row = result.mappings().first()
    if row is None:
        return False
    token_type = str(row.get("token_type") or "")
    return token_type == "access_token" and not bool(row.get("is_revoked"))


async def validate_stored_run_token(run_id: str, db: Any | None = None) -> str | None:
    """读取并校验已存 token。缺失返回 None；无效抛 WeKnoraTokenError。"""
    token = await load_run_access_token(run_id)
    if not token:
        return None
    if not await is_weknora_access_token_active(token, db):
        raise WeKnoraTokenError("令牌已吊销或不是 access_token")
    return token
