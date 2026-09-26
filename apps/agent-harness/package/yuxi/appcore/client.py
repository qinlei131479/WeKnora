"""Harness 调用 app-core 统一能力 API 的受控客户端。"""

from __future__ import annotations

import os
from typing import Any

import httpx

from yuxi.auth.request_token import get_request_access_token
from yuxi.tenancy.context import current_tenant_id

_TIMEOUT = httpx.Timeout(30.0)


class AppCoreClientError(RuntimeError):
    """app-core 能力接口访问失败。"""


class AppCoreAuthError(AppCoreClientError):
    """当前请求缺少或携带无效的 app-core 凭证。"""


def app_core_base_url() -> str:
    value = os.environ.get("WEKNORA_BASE_URL", "").strip().rstrip("/")
    if not value:
        raise AppCoreClientError("WEKNORA_BASE_URL 为空，无法调用 app-core 能力接口")
    # 运行环境可能直接配置 API 根路径；这里统一消除 /api/v1 重复拼接。
    if value.endswith(("/api/v1", "/api/v1/")):
        value = value[: -len("/api/v1")]
    return value


def _headers() -> dict[str, str]:
    token = get_request_access_token()
    api_key = os.environ.get("WEKNORA_APPCORE_API_KEY", "").strip()
    if token:
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
    elif api_key:
        # 启动同步没有用户请求上下文，只能使用预配置的能力 API Key。
        headers = {"X-API-Key": api_key, "Accept": "application/json"}
    else:
        raise AppCoreAuthError("缺少用户 JWT 或 app-core API Key，无法调用能力接口")
    tenant_id = current_tenant_id()
    if tenant_id is None:
        tenant_id = os.environ.get("WEKNORA_APPCORE_TENANT_ID", "").strip()
    if tenant_id:
        headers["X-Tenant-ID"] = str(tenant_id)
    return headers


def _unwrap(payload: Any) -> Any:
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def _raise_for_status(response: httpx.Response) -> None:
    if response.status_code < 400:
        return
    if response.status_code == 401:
        raise AppCoreAuthError("app-core 令牌无效或已过期")
    if response.status_code == 403:
        raise AppCoreClientError("无权访问 app-core 能力接口")
    if response.status_code == 404:
        raise AppCoreClientError("app-core 能力对象不存在")
    preview = (response.text or "")[:500]
    raise AppCoreClientError(f"app-core 请求失败: HTTP {response.status_code} {preview}")


class AppCoreClient:
    """按当前请求租户调用 app-core；不做本地越权缓存。"""

    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or app_core_base_url()).rstrip("/")

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path if path.startswith('/') else '/' + path}"

    async def request(
        self,
        method: str,
        path: str,
        *,
        json: dict[str, Any] | None = None,
        files: dict[str, Any] | None = None,
        data: dict[str, Any] | None = None,
        params: dict[str, Any] | None = None,
    ) -> Any:
        headers = _headers()
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.request(
                    method,
                    self._url(path),
                    json=json,
                    files=files,
                    data=data,
                    params=params,
                    headers=headers,
                )
        except httpx.RequestError as exc:
            raise AppCoreClientError(f"无法连接 app-core: {exc}") from exc
        _raise_for_status(response)
        if not response.content:
            return None
        try:
            return _unwrap(response.json())
        except ValueError as exc:
            raise AppCoreClientError("app-core 返回了无法解析的 JSON") from exc

    async def read_skill_file(self, skill_id: str, path: str) -> dict[str, Any]:
        data = await self.request(
            "GET",
            f"/api/v1/skills/catalog/{skill_id}/files/content",
            params={"path": path},
        )
        return data if isinstance(data, dict) else {}
