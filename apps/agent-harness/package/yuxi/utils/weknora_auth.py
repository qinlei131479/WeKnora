"""解析 WeKnora access JWT。密钥缺失时失败，不生成临时密钥。"""

from __future__ import annotations

import os
import uuid
from typing import Any

import jwt

from yuxi.utils.datetime_utils import utc_now

JWT_ALGORITHM = "HS256"


class WeKnoraTokenError(ValueError):
    """WeKnora access token 无效、过期或类型错误。"""


def get_weknora_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "").strip()
    if not secret:
        raise WeKnoraTokenError("JWT_SECRET 未配置")
    return secret


def remaining_ttl_seconds(payload: dict[str, Any], *, now: int | None = None) -> int:
    exp = payload.get("exp")
    if exp is None:
        return 3600
    try:
        exp_ts = int(exp)
    except (TypeError, ValueError) as exc:
        raise WeKnoraTokenError("令牌 exp 无效") from exc
    now_ts = now if now is not None else int(utc_now().timestamp())
    return max(1, exp_ts - now_ts)


def verify_weknora_access_token(token: str) -> dict[str, Any]:
    """校验 WeKnora access JWT，返回规范化 claims。"""
    raw = str(token or "").strip()
    if not raw:
        raise WeKnoraTokenError("令牌为空")
    if raw.startswith("yxkey_"):
        raise WeKnoraTokenError("不是 WeKnora access 令牌")

    try:
        payload = jwt.decode(
            raw,
            get_weknora_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp"], "verify_aud": False},
        )
    except jwt.ExpiredSignatureError as exc:
        raise WeKnoraTokenError("令牌已过期") from exc
    except jwt.InvalidTokenError as exc:
        raise WeKnoraTokenError("无效的令牌") from exc

    if payload.get("type") != "access":
        raise WeKnoraTokenError("只接受 type=access 的令牌")

    user_id = str(payload.get("user_id") or "").strip()
    if not user_id:
        raise WeKnoraTokenError("令牌缺少 user_id")
    try:
        user_id = str(uuid.UUID(user_id))
    except ValueError as exc:
        raise WeKnoraTokenError("令牌 user_id 不是合法 UUID") from exc

    tenant_raw = payload.get("tenant_id")
    try:
        tenant_id = int(tenant_raw)
    except (TypeError, ValueError) as exc:
        raise WeKnoraTokenError("令牌 tenant_id 无效") from exc
    if tenant_id <= 0:
        raise WeKnoraTokenError("令牌 tenant_id 无效")

    return {
        "user_id": user_id,
        "email": payload.get("email"),
        "tenant_id": tenant_id,
        "exp": payload.get("exp"),
        "iat": payload.get("iat"),
        "type": "access",
    }
