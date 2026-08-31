"""调 WeKnora /api/v1 知识库接口。凭证用当前请求/Worker 绑定的用户 JWT。"""

from __future__ import annotations

from typing import Any

import httpx

from yuxi.p0.request_token import get_request_access_token
from yuxi.p2.context import current_tenant_id
from yuxi.p3.errors import WeKnoraKBAuthError, WeKnoraKBError, WeKnoraKBPermissionError
from yuxi.p3.flags import require_weknora_base_url

DOWNLOAD_PERMISSION_HINT = (
    "当前账号没有下载原件权限（需要 Contributor 且具备写权限），"
    "无法把文件写入沙箱。请在 WeKnora 中提升权限，或改用 open_kb_document 阅读解析正文。"
)

_TIMEOUT = httpx.Timeout(30.0)


def _headers(*, accept: str = "application/json") -> dict[str, str]:
    token = get_request_access_token()
    if not token:
        raise WeKnoraKBAuthError("缺少用户 JWT，无法调用 WeKnora 知识库（请确认 HARNESS_P0_RUN_TOKEN_STORE 已打开）")
    headers = {"Authorization": f"Bearer {token}", "Accept": accept}
    tenant_id = current_tenant_id()
    if tenant_id is not None:
        headers["X-Tenant-ID"] = str(tenant_id)
    return headers


def _unwrap(payload: Any) -> Any:
    if isinstance(payload, dict) and "data" in payload:
        return payload["data"]
    return payload


def _raise_for_status(response: httpx.Response, *, download: bool = False) -> None:
    if response.status_code < 400:
        return
    if response.status_code in {401, 403} and download:
        raise WeKnoraKBPermissionError(DOWNLOAD_PERMISSION_HINT)
    if response.status_code == 401:
        raise WeKnoraKBAuthError("WeKnora 令牌无效或已过期，请重新登录后再检索知识库")
    if response.status_code == 403:
        raise WeKnoraKBPermissionError("无权访问该知识库（无权限或跨租户）")
    if response.status_code == 404:
        raise WeKnoraKBError("知识库或文件不存在")
    preview = (response.text or "")[:500]
    raise WeKnoraKBError(f"WeKnora 知识库请求失败: HTTP {response.status_code} {preview}")


class WeKnoraKBClient:
    def __init__(self, base_url: str | None = None):
        self.base_url = (base_url or require_weknora_base_url()).rstrip("/")

    def _url(self, path: str) -> str:
        return f"{self.base_url}{path if path.startswith('/') else '/' + path}"

    async def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json: dict[str, Any] | None = None,
        download: bool = False,
    ) -> Any:
        headers = _headers(accept="application/octet-stream" if download else "application/json")
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.request(
                    method,
                    self._url(path),
                    params=params,
                    json=json,
                    headers=headers,
                )
        except httpx.RequestError as exc:
            raise WeKnoraKBError(f"无法连接 WeKnora 知识库: {exc}") from exc
        _raise_for_status(response, download=download)
        if download:
            filename = "download.bin"
            disposition = response.headers.get("content-disposition") or ""
            if "filename=" in disposition:
                filename = disposition.split("filename=", 1)[1].strip().strip('"')
            return {
                "filename": filename,
                "content": response.content,
                "media_type": response.headers.get("content-type") or "application/octet-stream",
            }
        if not response.content:
            return None
        try:
            payload = response.json()
        except ValueError as exc:
            raise WeKnoraKBError("WeKnora 返回了无法解析的 JSON") from exc
        return _unwrap(payload)

    async def list_knowledge_bases(self) -> list[dict[str, Any]]:
        data = await self.request("GET", "/knowledge-bases")
        return data if isinstance(data, list) else []

    async def get_knowledge_base(self, kb_id: str) -> dict[str, Any]:
        data = await self.request("GET", f"/knowledge-bases/{kb_id}")
        if not isinstance(data, dict):
            raise WeKnoraKBError("知识库详情格式无效")
        return data

    async def hybrid_search(self, kb_id: str, body: dict[str, Any]) -> list[dict[str, Any]]:
        data = await self.request("POST", f"/knowledge-bases/{kb_id}/hybrid-search", json=body)
        return data if isinstance(data, list) else []

    async def list_knowledge(
        self,
        kb_id: str,
        *,
        page: int = 1,
        page_size: int = 100,
        keyword: str | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        params: dict[str, Any] = {"page": page, "page_size": page_size}
        if keyword:
            params["keyword"] = keyword
        payload = await self._raw_page("GET", f"/knowledge-bases/{kb_id}/knowledge", params=params)
        items = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            items = []
        total = int(payload.get("total") or len(items)) if isinstance(payload, dict) else len(items)
        return items, total

    async def search_knowledge(self, *, keyword: str, offset: int = 0, limit: int = 20) -> list[dict[str, Any]]:
        data = await self.request(
            "GET",
            "/knowledge/search",
            params={"keyword": keyword, "offset": offset, "limit": limit},
        )
        return data if isinstance(data, list) else []

    async def get_knowledge(self, knowledge_id: str) -> dict[str, Any]:
        data = await self.request("GET", f"/knowledge/{knowledge_id}")
        if not isinstance(data, dict):
            raise WeKnoraKBError("文件元数据格式无效")
        return data

    async def list_chunks(
        self,
        knowledge_id: str,
        *,
        page: int,
        page_size: int,
        chunk_type: str | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        params: dict[str, Any] = {"page": page, "page_size": page_size}
        if chunk_type:
            params["chunk_type"] = chunk_type
        payload = await self._raw_page("GET", f"/chunks/{knowledge_id}", params=params)
        items = payload.get("data") if isinstance(payload, dict) else payload
        if not isinstance(items, list):
            items = []
        total = int(payload.get("total") or len(items)) if isinstance(payload, dict) else len(items)
        return items, total

    async def download_knowledge(self, knowledge_id: str) -> dict[str, Any]:
        return await self.request("GET", f"/knowledge/{knowledge_id}/download", download=True)

    async def _raw_page(self, method: str, path: str, *, params: dict[str, Any] | None = None) -> dict[str, Any]:
        headers = _headers()
        try:
            async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
                response = await client.request(method, self._url(path), params=params, headers=headers)
        except httpx.RequestError as exc:
            raise WeKnoraKBError(f"无法连接 WeKnora 知识库: {exc}") from exc
        _raise_for_status(response)
        try:
            payload = response.json()
        except ValueError as exc:
            raise WeKnoraKBError("WeKnora 返回了无法解析的 JSON") from exc
        return payload if isinstance(payload, dict) else {"data": payload}
