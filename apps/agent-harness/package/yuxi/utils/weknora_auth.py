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
    """校验 WeKnora access JWT，返回 claims（user_id 保留原始字符串，不做 UUID 规范化）。"""
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
        # 仅用于校验 user_id 是否是合法 UUID（含无横线的 32 位 hex）；
        # 不能用 uuid.UUID(...) 的规范化结果覆盖原始值——Go 端签发 token 时
        # 直接写入 users.id 的原始字符串（可能是无横线的历史/测试数据），
        # 且验签时也是原样字符串比较，不做规范化。若这里改写成带横线的
        # 标准形式，会导致后续按 users.id 查库时与数据库里的原始值不相等，
        # 表现为 Go 端鉴权通过而 Python 端误报「用户不存在」。
        uuid.UUID(user_id)
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


def create_weknora_access_token(*, user_id: str, email: str | None, tenant_id: int) -> str:
    now = int(utc_now().timestamp())
    payload = {
        "user_id": str(user_id),
        "email": email,
        "tenant_id": int(tenant_id),
        "exp": now + 24 * 3600,
        "iat": now,
        "type": "access",
    }
    return jwt.encode(payload, get_weknora_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_weknora_refresh_token(*, user_id: str) -> str:
    now = int(utc_now().timestamp())
    payload = {
        "user_id": str(user_id),
        "exp": now + 7 * 24 * 3600,
        "iat": now,
        "type": "refresh",
    }
    return jwt.encode(payload, get_weknora_jwt_secret(), algorithm=JWT_ALGORITHM)
