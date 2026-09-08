"""WeKnora auth_tokens 吊销检查。缓存键是 token SHA-256，TTL ≤ 30 秒。"""

from __future__ import annotations

import hashlib
from typing import Any

from sqlalchemy import text

from yuxi.storage.redis import get_async_redis_client
from yuxi.utils.weknora_auth import verify_weknora_access_token

# Redis 缓存键沿用历史前缀，避免短 TTL 内重复打 auth_tokens。
AUTH_TOKEN_CACHE_PREFIX = "p1:auth-token:"
AUTH_TOKEN_CACHE_TTL_SECONDS = 30


def access_token_cache_key(token: str) -> str:
    digest = hashlib.sha256(str(token).encode("utf-8")).hexdigest()
    return f"{AUTH_TOKEN_CACHE_PREFIX}{digest}"


async def _lookup_auth_token_row(token: str, db: Any) -> bool:
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
    return str(row.get("token_type") or "") == "access_token" and not bool(row.get("is_revoked"))


async def is_weknora_access_token_active(token: str, db: Any) -> bool:
    """验签后再确认 auth_tokens 未吊销。缓存不写明文。"""
    verify_weknora_access_token(token)
    key = access_token_cache_key(token)
    try:
        redis = await get_async_redis_client()
        cached = await redis.get(key)
    except Exception:
        cached = None
        redis = None
    if cached is not None:
        return str(cached) == "1"

    active = await _lookup_auth_token_row(token, db)
    if redis is not None:
        try:
            await redis.set(key, "1" if active else "0", ex=AUTH_TOKEN_CACHE_TTL_SECONDS)
        except Exception:
            pass
    return active
