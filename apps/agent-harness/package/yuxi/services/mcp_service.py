"""MCP 服务业务：创建、更新、启停、凭证、工具开关与 OAuth 状态。表读写走 repositories.mcp_service_repository。"""

from __future__ import annotations

import base64
import hashlib
import json
import os
from datetime import datetime, timezone
from ipaddress import ip_address
from typing import Any
from urllib.parse import urlparse

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.repositories.mcp_service_repository import (
    mcp_metadata_repository,
    mcp_oauth_repository,
    mcp_service_repository,
    mcp_tool_approval_repository,
)
from yuxi.tenancy.context import TenantScopeError, current_tenant_id, stamp_tenant_id

_ENC_PREFIX = "enc:v1:"
_METADATA_LIMIT = 8 * 1024 * 1024
_RESTRICTED_HOSTS = {
    "localhost",
    "127.0.0.1",
    "::1",
    "0.0.0.0",
    "metadata.google.internal",
    "metadata.tencentyun.com",
    "metadata.aws.internal",
    "host.docker.internal",
    "gateway.docker.internal",
    "kubernetes.docker.internal",
    "kubernetes",
    "kubernetes.default",
    "kubernetes.default.svc",
    "kubernetes.default.svc.cluster.local",
}
_RESTRICTED_SUFFIXES = (
    ".local",
    ".localhost",
    ".internal",
    ".corp",
    ".lan",
    ".home",
    ".localdomain",
    ".svc.cluster.local",
    ".pod.cluster.local",
)


class MCPConflictError(ValueError):
    """同一空间内名称冲突。"""


def _aes_key() -> bytes | None:
    key = os.environ.get("SYSTEM_AES_KEY", "").encode()
    return key if len(key) == 32 else None


def _b64_raw(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64_raw_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode(value + padding)


def encrypt_secret(plaintext: str) -> str:
    """与 app-core 的 enc:v1 AES-GCM 对齐。没有 32 字节密钥时保持原文。"""
    if not plaintext or plaintext.startswith(_ENC_PREFIX):
        return plaintext
    key = _aes_key()
    if key is None:
        return plaintext
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
    return _ENC_PREFIX + _b64_raw(nonce + ciphertext)


def decrypt_secret_lenient(value: str) -> str:
    """解密失败时按未配置处理，避免一条坏密文拖垮列表。"""
    if not value or not value.startswith(_ENC_PREFIX):
        return value or ""
    key = _aes_key()
    if key is None:
        return ""
    try:
        data = _b64_raw_decode(value[len(_ENC_PREFIX) :])
        if len(data) < 12:
            return ""
        return AESGCM(key).decrypt(data[:12], data[12:], None).decode()
    except Exception:
        return ""


def _json_obj(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except ValueError:
            return None
    return value


def _go_dumps(payload: Any) -> str:
    raw = json.dumps(payload, ensure_ascii=True, separators=(",", ":"))
    return raw.replace("&", r"\u0026").replace("<", r"\u003c").replace(">", r"\u003e")


def _auth_fingerprint(auth: dict[str, Any] | None) -> dict[str, Any] | None:
    if auth is None:
        return None
    out: dict[str, Any] = {}
    if auth.get("auth_type"):
        out["auth_type"] = auth["auth_type"]
    if auth.get("api_key"):
        out["api_key"] = auth["api_key"]
    if auth.get("api_key_header"):
        out["api_key_header"] = auth["api_key_header"]
    if auth.get("token"):
        out["token"] = auth["token"]
    if auth.get("custom_headers"):
        out["custom_headers"] = auth["custom_headers"]
    if auth.get("scopes"):
        out["scopes"] = auth["scopes"]
    if auth.get("auth_server_metadata_url"):
        out["auth_server_metadata_url"] = auth["auth_server_metadata_url"]
    return out


def config_fingerprint(raw: dict[str, Any]) -> str:
    """对齐 Go MCPConfigFingerprint：字段名和空值语义跟 encoding/json 一致。"""
    stdio = _json_obj(raw.get("stdio_config"))
    if isinstance(stdio, dict):
        stdio = {"command": stdio.get("command") or "", "args": stdio.get("args")}
    payload = {
        "Transport": raw.get("transport_type") or "",
        "URL": raw.get("url"),
        "Headers": _json_obj(raw.get("headers")),
        "Auth": _auth_fingerprint(_json_obj(raw.get("auth_config"))),
        "Stdio": stdio,
        "Env": _json_obj(raw.get("env_vars")),
    }
    return hashlib.sha256(_go_dumps(payload).encode()).hexdigest()


def _whitelist() -> set[str]:
    raw = os.environ.get("SSRF_WHITELIST", "")
    return {item.strip().lower() for item in raw.split(",") if item.strip()}


def validate_outbound_url(raw_url: str | None) -> None:
    """拦截明显的内网和元数据地址。白名单来自 SSRF_WHITELIST。"""
    target = (raw_url or "").strip()
    if not target:
        return
    parsed = urlparse(target if "://" in target else f"https://{target}")
    if parsed.scheme not in ("http", "https"):
        raise ValueError("MCP 地址只允许 http 或 https")
    host = (parsed.hostname or "").lower()
    if not host:
        raise ValueError("MCP 地址缺少主机名")
    if host in _whitelist():
        return
    if host in _RESTRICTED_HOSTS or any(host.endswith(suffix) for suffix in _RESTRICTED_SUFFIXES):
        raise ValueError("MCP 地址未通过出站校验")
    try:
        ip = ip_address(host)
    except ValueError:
        return
    if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast:
        raise ValueError("MCP 地址未通过出站校验")


def _decrypt_auth(auth: Any) -> dict[str, Any] | None:
    data = _json_obj(auth)
    if not isinstance(data, dict):
        return None
    copied = dict(data)
    if "api_key" in copied:
        copied["api_key"] = decrypt_secret_lenient(str(copied.get("api_key") or ""))
    if "token" in copied:
        copied["token"] = decrypt_secret_lenient(str(copied.get("token") or ""))
    return copied


def _row_to_dict(row: Any) -> dict[str, Any]:
    data = dict(row)
    for key in ("headers", "auth_config", "advanced_config", "stdio_config", "env_vars"):
        data[key] = _json_obj(data.get(key))
    data["auth_config"] = _decrypt_auth(data.get("auth_config"))
    auth = data.get("auth_config") or {}
    if not data.get("is_builtin"):
        data["credentials"] = {
            "api_key": {"configured": bool(auth.get("api_key"))},
            "token": {"configured": bool(auth.get("token"))},
        }
    return data


def _require_tenant() -> int:
    tenant = stamp_tenant_id()
    if tenant is None:
        raise TenantScopeError("写入需要当前租户 tenant_id")
    return int(tenant)


def _tenant_filter() -> int | None:
    tenant = current_tenant_id()
    return int(tenant) if tenant is not None else None


async def _load_service(db: AsyncSession | None, service_id: str, tenant: int | None = None) -> dict[str, Any] | None:
    scope = _tenant_filter() if tenant is None else tenant
    row = await mcp_service_repository.get_visible(db, scope, service_id)
    return _row_to_dict(row) if row else None


async def list_services(db: AsyncSession | None) -> list[dict[str, Any]]:
    """当前空间的服务，加上所有内置行。"""
    rows = await mcp_service_repository.list_visible(db, _tenant_filter())
    return [_row_to_dict(row) for row in rows]



def _encrypt_auth(auth: dict[str, Any] | None) -> dict[str, Any] | None:
    if auth is None:
        return None
    copied = dict(auth)
    if copied.get("api_key"):
        copied["api_key"] = encrypt_secret(str(copied["api_key"]))
    if copied.get("token"):
        copied["token"] = encrypt_secret(str(copied["token"]))
    return copied


def _merge_auth(existing: dict[str, Any] | None, incoming: dict[str, Any] | None) -> dict[str, Any] | None:
    if incoming is None:
        return existing
    merged = dict(existing or {})
    for key, value in incoming.items():
        if key in ("api_key", "token") and not value:
            continue
        merged[key] = value
    return merged


async def create_service(db: AsyncSession | None, body: dict[str, Any]) -> dict[str, Any]:
    tenant = _require_tenant()
    name = str(body.get("name") or "").strip()
    if not name:
        raise ValueError("名称不能为空")
    transport = body.get("transport_type")
    if transport not in ("sse", "http-streamable"):
        raise ValueError("用户创建的 MCP 仅支持 sse 或 http-streamable")
    url = body.get("url")
    validate_outbound_url(url if isinstance(url, str) else None)
    auth = body.get("auth_config") if isinstance(body.get("auth_config"), dict) else None
    if auth:
        validate_outbound_url(auth.get("auth_server_metadata_url"))
    advanced = body.get("advanced_config") if isinstance(body.get("advanced_config"), dict) else None
    if advanced is None:
        advanced = {"timeout": 30, "retry_count": 3, "retry_delay": 1}
    if await mcp_service_repository.name_exists(db, tenant, name):
        raise MCPConflictError("同一租户内已存在同名 MCP 服务")
    created = await mcp_service_repository.create(
        db,
        {
            "tenant_id": tenant,
            "name": name,
            "description": body.get("description") or "",
            "enabled": bool(body.get("enabled", True)),
            "transport_type": transport,
            "url": url,
            "headers": body.get("headers") or {},
            "auth_config": _encrypt_auth(auth),
            "advanced_config": advanced,
            "env_vars": {},
            "is_builtin": False,
        },
    )
    return _row_to_dict(created)


async def update_service(db: AsyncSession | None, service_id: str, body: dict[str, Any]) -> dict[str, Any]:
    existing = await _load_service(db, service_id)
    if existing is None:
        raise ValueError("MCP 服务不存在")
    if existing.get("is_builtin"):
        extra = set(body) - {"enabled"}
        if extra or "enabled" not in body:
            raise PermissionError("系统内置 MCP 只允许修改启用状态")
        updated = await mcp_service_repository.update(
            db, service_id, int(existing["tenant_id"]), {"enabled": bool(body["enabled"])}
        )
        if updated is None:
            raise RuntimeError("内置 MCP 更新后无法读取")
        return _row_to_dict(updated)

    transport = body.get("transport_type") or existing.get("transport_type")
    if transport == "stdio":
        raise ValueError("用户创建的 MCP 仅支持 sse 或 http-streamable")
    url = body["url"] if "url" in body else existing.get("url")
    validate_outbound_url(url if isinstance(url, str) else None)
    auth = existing.get("auth_config")
    if "auth_config" in body:
        incoming = body.get("auth_config") if isinstance(body.get("auth_config"), dict) else {}
        validate_outbound_url(incoming.get("auth_server_metadata_url"))
        auth = _merge_auth(auth if isinstance(auth, dict) else None, incoming)
    headers = body["headers"] if "headers" in body else existing.get("headers") or {}
    advanced = body["advanced_config"] if "advanced_config" in body else existing.get("advanced_config")
    updated = await mcp_service_repository.update(
        db,
        service_id,
        int(existing["tenant_id"]),
        {
            "name": body.get("name") or existing.get("name"),
            "description": body.get("description") if "description" in body else existing.get("description") or "",
            "usage_instructions": (
                body["usage_instructions"]
                if "usage_instructions" in body
                else existing.get("usage_instructions") or ""
            ),
            "enabled": body["enabled"] if "enabled" in body else existing.get("enabled"),
            "transport_type": transport,
            "url": url,
            "headers": headers or {},
            "auth_config": _encrypt_auth(auth if isinstance(auth, dict) else None),
            "advanced_config": advanced,
        },
    )
    if updated is None:
        raise RuntimeError("MCP 服务更新后无法读取")
    return _row_to_dict(updated)


async def delete_service(db: AsyncSession | None, service_id: str) -> None:
    existing = await _load_service(db, service_id, _require_tenant())
    if existing is None:
        raise ValueError("MCP 服务不存在")
    if existing.get("is_builtin"):
        raise PermissionError("系统内置 MCP 不能删除")
    await mcp_service_repository.soft_delete(db, service_id, int(existing["tenant_id"]))


async def list_tool_approvals(db: AsyncSession | None, service_id: str) -> list[dict[str, Any]]:
    tenant = current_tenant_id()
    if tenant is None:
        return []
    return await mcp_tool_approval_repository.list_by_service(db, int(tenant), service_id)


async def set_tool_policy(db: AsyncSession | None, service_id: str, tool_name: str, body: dict[str, Any]) -> None:
    """只更新请求里出现的列。缺省行按启用、不需要审批插入。"""
    if not service_id or not tool_name:
        raise ValueError("service_id 和 tool_name 不能为空")
    has_enabled = "enabled" in body
    has_approval = "require_approval" in body
    if not has_enabled and not has_approval:
        raise ValueError("需要 enabled 或 require_approval")
    tenant = _require_tenant()
    await mcp_tool_approval_repository.upsert(
        db,
        tenant,
        service_id,
        tool_name,
        enabled=bool(body["enabled"]) if has_enabled else None,
        require_approval=bool(body["require_approval"]) if has_approval else None,
    )


async def set_tool_enabled(db: AsyncSession | None, service_id: str, tool_name: str, enabled: bool) -> None:
    await set_tool_policy(db, service_id, tool_name, {"enabled": enabled})


def metadata_principal(raw: dict[str, Any], user_id: str) -> str:
    auth = raw.get("auth_config") or {}
    if isinstance(auth, dict) and auth.get("auth_type") == "oauth":
        if not user_id:
            raise ValueError("OAuth 工具目录需要登录用户")
        return f"web_user:{user_id}"
    return ""


async def get_metadata(db: AsyncSession | None, raw: dict[str, Any], user_id: str) -> dict[str, Any] | None:
    tenant = current_tenant_id()
    if tenant is None:
        return None
    principal = metadata_principal(raw, user_id)
    row = await mcp_metadata_repository.get(db, int(tenant), str(raw.get("id") or ""), principal)
    if row is None:
        return None
    data = dict(row)
    tools = _json_obj(data.get("tools")) or []
    synced = data.get("synced_at")
    return {
        "service_id": data.get("service_id"),
        "tools": tools,
        "instructions": data.get("instructions") or "",
        "server_name": data.get("server_name") or "",
        "server_version": data.get("server_version") or "",
        "server_description": data.get("server_description") or "",
        "synced_at": synced.isoformat() if isinstance(synced, datetime) else synced,
        "stale": data.get("config_fingerprint") != config_fingerprint(raw),
    }


async def save_metadata(db: AsyncSession | None, raw: dict[str, Any], snapshot: dict[str, Any], user_id: str) -> dict[str, Any]:
    tenant = _require_tenant()
    principal = metadata_principal(raw, user_id)
    tools = snapshot.get("tools") or []
    seen: set[str] = set()
    for tool in tools:
        name = tool.get("name") if isinstance(tool, dict) else ""
        if not name or name in seen:
            raise ValueError("工具目录包含空名称或重复名称")
        seen.add(name)
    fingerprint = config_fingerprint(raw)
    payload = {
        "service_id": raw.get("id"),
        "tools": tools,
        "instructions": snapshot.get("instructions") or "",
        "server_name": snapshot.get("server_name") or "",
        "server_version": snapshot.get("server_version") or "",
        "server_description": snapshot.get("server_description") or "",
    }
    if len(json.dumps(payload).encode()) > _METADATA_LIMIT:
        raise ValueError("工具目录超过 8 MiB")
    synced_at = datetime.now(timezone.utc)
    current = await _load_service(db, str(raw.get("id") or ""), tenant)
    if current is None or config_fingerprint(current) != fingerprint:
        raise ValueError("刷新过程中连接配置已变化")
    await mcp_metadata_repository.save(
        db,
        {
            "tenant_id": tenant,
            "service_id": raw.get("id"),
            "principal": principal,
            "config_fingerprint": fingerprint,
            "tools": tools,
            "instructions": payload["instructions"],
            "server_name": payload["server_name"],
            "server_version": payload["server_version"],
            "server_description": payload["server_description"],
            "synced_at": synced_at,
        },
    )
    saved = await get_metadata(db, raw, user_id)
    return saved or {**payload, "synced_at": synced_at.isoformat(), "stale": False}


def credential_fields(raw: dict[str, Any]) -> dict[str, Any]:
    auth = raw.get("auth_config") or {}
    return {
        "fields": {
            "api_key": {"configured": bool(auth.get("api_key"))},
            "token": {"configured": bool(auth.get("token"))},
        }
    }


async def put_credentials(
    db: AsyncSession | None,
    service_id: str,
    api_key: str | None,
    token: str | None,
) -> dict[str, Any]:
    """空字符串视为不修改。清空走 clear_credential。"""
    existing = await _load_service(db, service_id, _require_tenant())
    if existing is None:
        raise ValueError("MCP 服务不存在")
    if existing.get("is_builtin"):
        raise PermissionError("系统内置 MCP 不能修改凭证")
    auth = dict(existing.get("auth_config") or {})
    changed = False
    if api_key and api_key != auth.get("api_key"):
        auth["api_key"] = api_key
        changed = True
    if token and token != auth.get("token"):
        auth["token"] = token
        changed = True
    if changed:
        await mcp_service_repository.update(
            db,
            service_id,
            int(existing["tenant_id"]),
            {"auth_config": _encrypt_auth(auth)},
        )
        existing["auth_config"] = auth
    return credential_fields(existing)


async def clear_credential(db: AsyncSession | None, service_id: str, field: str) -> None:
    if field not in ("api_key", "token"):
        raise ValueError("未知的凭证字段")
    existing = await _load_service(db, service_id, _require_tenant())
    if existing is None:
        raise ValueError("MCP 服务不存在")
    if existing.get("is_builtin"):
        raise PermissionError("系统内置 MCP 不能修改凭证")
    auth = dict(existing.get("auth_config") or {})
    if not auth.get(field):
        return
    auth[field] = ""
    await mcp_service_repository.update(
        db,
        service_id,
        int(existing["tenant_id"]),
        {"auth_config": _encrypt_auth(auth)},
    )


async def get_oauth_client(db: AsyncSession, service_id: str) -> dict[str, Any] | None:
    tenant = current_tenant_id()
    if tenant is None:
        return None
    row = await mcp_oauth_repository.get_client(db, int(tenant), service_id)
    if row is None:
        return None
    data = dict(row)
    data["client_secret"] = decrypt_secret_lenient(str(data.get("client_secret") or ""))
    return data


async def save_oauth_client(
    db: AsyncSession,
    service_id: str,
    client_id: str,
    client_secret: str,
    redirect_uri: str,
) -> None:
    await mcp_oauth_repository.save_client(
        db,
        {
            "tenant_id": _require_tenant(),
            "service_id": service_id,
            "client_id": client_id,
            "client_secret": encrypt_secret(client_secret) if client_secret else "",
            "redirect_uri": redirect_uri,
        },
    )


async def get_oauth_token(db: AsyncSession | None, service_id: str, user_id: str) -> dict[str, Any] | None:
    tenant = current_tenant_id()
    if tenant is None or not user_id:
        return None
    row = await mcp_oauth_repository.get_token(db, int(tenant), service_id, user_id)
    if row is None:
        return None
    data = dict(row)
    data["access_token"] = decrypt_secret_lenient(str(data.get("access_token") or ""))
    data["refresh_token"] = decrypt_secret_lenient(str(data.get("refresh_token") or ""))
    return data


async def save_oauth_token(
    db: AsyncSession,
    service_id: str,
    user_id: str,
    access_token: str,
    refresh_token: str,
    token_type: str,
    expires_at: datetime | None,
) -> None:
    if expires_at is not None and expires_at.tzinfo is not None:
        expires_at = expires_at.astimezone(timezone.utc).replace(tzinfo=None)
    await mcp_oauth_repository.save_token(
        db,
        {
            "tenant_id": _require_tenant(),
            "user_id": f"web_user:{user_id}",
            "principal_type": "web_user",
            "principal_id": user_id,
            "service_id": service_id,
            "access_token": encrypt_secret(access_token) if access_token else "",
            "refresh_token": encrypt_secret(refresh_token) if refresh_token else "",
            "token_type": token_type or "Bearer",
            "expires_at": expires_at,
        },
    )


async def delete_oauth_token(db: AsyncSession | None, service_id: str, user_id: str) -> None:
    await mcp_oauth_repository.delete_token(db, _require_tenant(), service_id, user_id)


def oauth_status(token: dict[str, Any] | None) -> dict[str, Any]:
    status: dict[str, Any] = {"authorized": False, "state": "reauth_required", "refresh_available": False}
    if not token or not token.get("access_token"):
        return status
    status["refresh_available"] = bool(token.get("refresh_token"))
    expires_at = token.get("expires_at")
    now = datetime.now(timezone.utc)
    if isinstance(expires_at, datetime):
        aware = expires_at if expires_at.tzinfo else expires_at.replace(tzinfo=timezone.utc)
        status["expires_at"] = aware.isoformat()
        if aware > now:
            status["authorized"] = True
            status["state"] = "authorized"
            return status
        if status["refresh_available"]:
            status["state"] = "refreshable"
        return status
    status["authorized"] = True
    status["state"] = "authorized"
    return status
