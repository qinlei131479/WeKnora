"""MCP 服务的 OAuth 授权：发现端点、动态注册、授权码换票。状态放在进程内。"""

from __future__ import annotations

import hashlib
import secrets
import time
from base64 import urlsafe_b64encode
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode, urljoin, urlparse

import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.services import mcp_service
from yuxi.tenancy.context import current_tenant_id

_STATE_TTL_SECONDS = 600
_CLIENT_NAME = "WeKnora"


@dataclass
class AuthorizationAttempt:
    tenant_id: int
    user_id: str
    service_id: str
    verifier: str
    client_id: str
    client_secret: str
    redirect_uri: str
    frontend_redirect: str
    token_endpoint: str
    completed: bool = False
    created_at: float = 0.0


_ATTEMPTS: dict[str, AuthorizationAttempt] = {}


def _purge() -> None:
    now = time.time()
    expired = [key for key, item in _ATTEMPTS.items() if now - item.created_at > _STATE_TTL_SECONDS]
    for key in expired:
        _ATTEMPTS.pop(key, None)


def _pkce() -> tuple[str, str]:
    verifier = secrets.token_urlsafe(48)
    digest = hashlib.sha256(verifier.encode()).digest()
    challenge = urlsafe_b64encode(digest).decode().rstrip("=")
    return verifier, challenge


def _origin(url: str) -> str:
    parsed = urlparse(url)
    return f"{parsed.scheme}://{parsed.netloc}"


async def _get_json(client: httpx.AsyncClient, url: str) -> dict[str, Any]:
    response = await client.get(url)
    response.raise_for_status()
    data = response.json()
    if not isinstance(data, dict):
        raise ValueError("OAuth 元数据不是对象")
    return data


async def discover(service_url: str, metadata_url: str | None) -> dict[str, Any]:
    """按显式元数据地址，或 RFC 9728 保护资源元数据，找到授权端点。"""
    async with httpx.AsyncClient(timeout=20.0, follow_redirects=True) as client:
        if metadata_url:
            document = await _get_json(client, metadata_url)
            if document.get("authorization_endpoint"):
                return document
            servers = document.get("authorization_servers") or []
            if servers:
                return await _authorization_server(client, str(servers[0]))
        resource = await _protected_resource(client, service_url)
        servers = resource.get("authorization_servers") or []
        if not servers:
            raise ValueError("MCP 服务没有公布 OAuth 授权服务器")
        return await _authorization_server(client, str(servers[0]))


async def _protected_resource(client: httpx.AsyncClient, service_url: str) -> dict[str, Any]:
    probe = await client.get(service_url, headers={"Accept": "application/json, text/event-stream"})
    resource_url = _resource_metadata_url(probe.headers.get("www-authenticate") or "", service_url)
    if resource_url:
        return await _get_json(client, resource_url)
    parsed = urlparse(service_url)
    path = parsed.path.rstrip("/")
    candidates = [
        urljoin(_origin(service_url), f"/.well-known/oauth-protected-resource{path}"),
        urljoin(_origin(service_url), "/.well-known/oauth-protected-resource"),
    ]
    last_error: Exception | None = None
    for candidate in candidates:
        try:
            return await _get_json(client, candidate)
        except Exception as exc:
            last_error = exc
    raise ValueError(f"无法发现 OAuth 保护资源元数据: {last_error}")


def _resource_metadata_url(header: str, service_url: str) -> str:
    marker = "resource_metadata="
    lower = header.lower()
    index = lower.find(marker)
    if index < 0:
        return ""
    raw = header[index + len(marker) :].split(",", 1)[0].strip().strip('"')
    if raw.startswith("http://") or raw.startswith("https://"):
        return raw
    return urljoin(service_url, raw)


async def _authorization_server(client: httpx.AsyncClient, issuer: str) -> dict[str, Any]:
    parsed = urlparse(issuer if "://" in issuer else f"https://{issuer}")
    origin = f"{parsed.scheme}://{parsed.netloc}"
    path = parsed.path.rstrip("/")
    candidates = [
        urljoin(origin, f"/.well-known/oauth-authorization-server{path}"),
        urljoin(origin, "/.well-known/oauth-authorization-server"),
        issuer,
    ]
    last_error: Exception | None = None
    for candidate in candidates:
        try:
            document = await _get_json(client, candidate)
        except Exception as exc:
            last_error = exc
            continue
        if document.get("authorization_endpoint") and document.get("token_endpoint"):
            return document
    raise ValueError(f"无法读取 OAuth 授权服务器元数据: {last_error}")


async def start_authorization(
    db: AsyncSession,
    raw: dict[str, Any],
    user_id: str,
    redirect_uri: str,
    frontend_redirect: str,
) -> dict[str, str]:
    auth = raw.get("auth_config") or {}
    if not isinstance(auth, dict) or auth.get("auth_type") != "oauth":
        raise ValueError("MCP 服务未配置 OAuth")
    if not user_id:
        raise ValueError("发起 OAuth 需要登录用户")
    tenant = current_tenant_id()
    if tenant is None:
        raise ValueError("发起 OAuth 需要当前空间")
    service_url = str(raw.get("url") or "").strip()
    if not service_url:
        raise ValueError("OAuth MCP 缺少服务地址")
    metadata_url = str(auth.get("auth_server_metadata_url") or "").strip() or None
    mcp_service.validate_outbound_url(service_url)
    mcp_service.validate_outbound_url(metadata_url)
    document = await discover(service_url, metadata_url)
    client_row = await mcp_service.get_oauth_client(db, str(raw.get("id") or ""))
    client_secret = ""
    if client_row and client_row.get("client_id"):
        client_id = str(client_row["client_id"])
        client_secret = str(client_row.get("client_secret") or "")
    else:
        client_id, client_secret = await _register_client(document, redirect_uri)
        await mcp_service.save_oauth_client(db, str(raw.get("id") or ""), client_id, client_secret, redirect_uri)
    verifier, challenge = _pkce()
    state = secrets.token_urlsafe(24)
    scopes = auth.get("scopes") or []
    query = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "state": state,
    }
    if isinstance(scopes, list) and scopes:
        query["scope"] = " ".join(str(item) for item in scopes)
    _purge()
    _ATTEMPTS[state] = AuthorizationAttempt(
        tenant_id=int(tenant),
        user_id=user_id,
        service_id=str(raw.get("id") or ""),
        verifier=verifier,
        client_id=client_id,
        client_secret=client_secret,
        redirect_uri=redirect_uri,
        frontend_redirect=frontend_redirect or "/",
        token_endpoint=str(document["token_endpoint"]),
        created_at=time.time(),
    )
    separator = "&" if "?" in str(document["authorization_endpoint"]) else "?"
    return {
        "authorization_url": f"{document['authorization_endpoint']}{separator}{urlencode(query)}",
        "authorization_attempt": state,
    }


async def _register_client(document: dict[str, Any], redirect_uri: str) -> tuple[str, str]:
    endpoint = document.get("registration_endpoint")
    if not endpoint:
        raise ValueError("授权服务器不支持动态客户端注册，且尚未保存 client_id")
    payload = {
        "client_name": _CLIENT_NAME,
        "redirect_uris": [redirect_uri],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
    }
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(str(endpoint), json=payload)
        response.raise_for_status()
        data = response.json()
    client_id = str(data.get("client_id") or "")
    if not client_id:
        raise ValueError("动态客户端注册没有返回 client_id")
    return client_id, str(data.get("client_secret") or "")


def attempt_completed(attempt_id: str, user_id: str, service_id: str) -> bool:
    _purge()
    attempt = _ATTEMPTS.get(attempt_id)
    if attempt is None:
        return False
    tenant = current_tenant_id()
    if tenant is None or attempt.tenant_id != int(tenant):
        raise ValueError("授权尝试与当前空间不匹配")
    if attempt.user_id != user_id or attempt.service_id != service_id:
        raise ValueError("授权尝试与当前用户或服务不匹配")
    return attempt.completed


async def complete_authorization(db: AsyncSession, state: str, code: str) -> tuple[str, str]:
    _purge()
    attempt = _ATTEMPTS.get(state)
    if attempt is None:
        raise ValueError("授权状态已失效")
    form = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": attempt.redirect_uri,
        "client_id": attempt.client_id,
        "code_verifier": attempt.verifier,
    }
    if attempt.client_secret:
        form["client_secret"] = attempt.client_secret
    async with httpx.AsyncClient(timeout=20.0) as client:
        response = await client.post(attempt.token_endpoint, data=form)
        response.raise_for_status()
        token = response.json()
    access_token = str(token.get("access_token") or "")
    if not access_token:
        raise ValueError("令牌响应缺少 access_token")
    expires_at = None
    if token.get("expires_in"):
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(token["expires_in"]))
    from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal

    previous = None
    try:
        from yuxi.tenancy.context import get_tenant_principal

        previous = get_tenant_principal()
        bind_tenant_principal(TenantPrincipal(uid=attempt.user_id, tenant_id=attempt.tenant_id, role=""))
        await mcp_service.save_oauth_token(
            db,
            attempt.service_id,
            attempt.user_id,
            access_token,
            str(token.get("refresh_token") or ""),
            str(token.get("token_type") or "Bearer"),
            expires_at,
        )
    finally:
        bind_tenant_principal(previous)
    attempt.completed = True
    return attempt.frontend_redirect or "/", attempt.service_id


async def authorization_status(
    db: AsyncSession,
    service_id: str,
    user_id: str,
    attempt_id: str | None = None,
) -> dict[str, Any]:
    if attempt_id:
        done = attempt_completed(attempt_id, user_id, service_id)
        return {"authorized": done, "state": "authorized" if done else "pending"}
    token = await mcp_service.get_oauth_token(db, service_id, user_id)
    return mcp_service.oauth_status(token)


async def revoke(db: AsyncSession, service_id: str, user_id: str) -> None:
    await mcp_service.delete_oauth_token(db, service_id, user_id)
