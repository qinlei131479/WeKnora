"""WeKnora → harness 短时内部身份断言。仅协议验证，不接入现网 IM。"""

from __future__ import annotations

from typing import Any

import jwt

from yuxi.utils.datetime_utils import utc_now
from yuxi.utils.weknora_auth import JWT_ALGORITHM, WeKnoraTokenError, get_weknora_jwt_secret

ASSERTION_AUDIENCE = "weknora-harness-internal"
ASSERTION_ISSUER = "weknora"
ALLOWED_PRINCIPAL_TYPES = frozenset(
    {
        "web_user",
        "im_user",
        "embed_session",
        "embed_visitor",
        "api_external_user",
    }
)
DEFAULT_TTL_SECONDS = 5 * 60
MAX_TTL_SECONDS = 15 * 60


def create_channel_assertion(
    *,
    principal_type: str,
    principal_id: str,
    tenant_id: int,
    backend_agent_id: str,
    ttl_seconds: int = DEFAULT_TTL_SECONDS,
) -> str:
    if principal_type not in ALLOWED_PRINCIPAL_TYPES:
        raise WeKnoraTokenError("不支持的 principal_type")
    principal = str(principal_id or "").strip()
    agent = str(backend_agent_id or "").strip()
    if not principal or not agent:
        raise WeKnoraTokenError("principal_id 与 backend_agent_id 不能为空")
    if int(tenant_id) <= 0:
        raise WeKnoraTokenError("tenant_id 无效")
    ttl = min(MAX_TTL_SECONDS, max(30, int(ttl_seconds)))
    now = int(utc_now().timestamp())
    payload = {
        "iss": ASSERTION_ISSUER,
        "aud": ASSERTION_AUDIENCE,
        "exp": now + ttl,
        "iat": now,
        "principal_type": principal_type,
        "principal_id": principal,
        "tenant_id": int(tenant_id),
        "backend_agent_id": agent,
    }
    return jwt.encode(payload, get_weknora_jwt_secret(), algorithm=JWT_ALGORITHM)


def verify_channel_assertion(token: str) -> dict[str, Any]:
    raw = str(token or "").strip()
    if not raw:
        raise WeKnoraTokenError("断言为空")
    try:
        payload = jwt.decode(
            raw,
            get_weknora_jwt_secret(),
            algorithms=[JWT_ALGORITHM],
            audience=ASSERTION_AUDIENCE,
            issuer=ASSERTION_ISSUER,
            options={"require": ["exp", "iss", "aud"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise WeKnoraTokenError("断言已过期") from exc
    except jwt.InvalidTokenError as exc:
        raise WeKnoraTokenError("无效的内部断言") from exc

    principal_type = str(payload.get("principal_type") or "")
    if principal_type not in ALLOWED_PRINCIPAL_TYPES:
        raise WeKnoraTokenError("不支持的 principal_type")
    return {
        "principal_type": principal_type,
        "principal_id": str(payload.get("principal_id") or ""),
        "tenant_id": int(payload["tenant_id"]),
        "backend_agent_id": str(payload.get("backend_agent_id") or ""),
        "exp": payload.get("exp"),
        "aud": ASSERTION_AUDIENCE,
    }
