"""yuxi 通过 WeKnora 内部代理调用模型 / 解析 / 思维导图。不读、不缓存密钥。"""

from __future__ import annotations

import re
import uuid
from pathlib import Path
from typing import Any
import httpx

from yuxi.weknora.client import auth_headers
from yuxi.weknora.errors import WeKnoraKBAuthError, WeKnoraKBError, WeKnoraKBPermissionError
from yuxi.weknora.flags import require_weknora_base_url
from yuxi.utils.logging_config import logger

_YUXI_TYPE = {
    "KnowledgeQA": "chat",
    "Embedding": "embedding",
    "Rerank": "rerank",
}

_LIST_TIMEOUT = httpx.Timeout(30.0)
_PARSE_TIMEOUT = httpx.Timeout(120.0)
_MINDMAP_TIMEOUT = httpx.Timeout(180.0)


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value.strip())
    except ValueError:
        return False
    return True


def _norm(value: str) -> str:
    return " ".join(str(value or "").strip().lower().split())


def _slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", _norm(value))


def _raise_for_status(response: httpx.Response) -> None:
    if response.status_code < 400:
        return
    if response.status_code == 401:
        raise WeKnoraKBAuthError("WeKnora 令牌无效或已过期，请重新登录后再调用模型")
    if response.status_code == 403:
        raise WeKnoraKBPermissionError("无权调用 WeKnora 模型或解析接口")
    if response.status_code == 404:
        raise WeKnoraKBError("模型、知识库或解析接口不存在")
    preview = (response.text or "")[:500]
    raise WeKnoraKBError(f"WeKnora 请求失败: HTTP {response.status_code} {preview}")


def _unwrap_models(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, dict) and "data" in payload:
        payload = payload["data"]
    if isinstance(payload, list):
        return [item for item in payload if isinstance(item, dict)]
    return []


def _url(path: str) -> str:
    base = require_weknora_base_url()
    return f"{base}{path if path.startswith('/') else '/' + path}"


def list_weknora_models() -> list[dict[str, Any]]:
    try:
        with httpx.Client(timeout=_LIST_TIMEOUT) as client:
            response = client.get(_url("/models"), headers=auth_headers())
    except httpx.RequestError as exc:
        raise WeKnoraKBError(f"无法连接 WeKnora: {exc}") from exc
    _raise_for_status(response)
    try:
        payload = response.json()
    except ValueError as exc:
        raise WeKnoraKBError("WeKnora 返回了无法解析的 JSON") from exc
    return _unwrap_models(payload)


async def list_weknora_models_async() -> list[dict[str, Any]]:
    try:
        async with httpx.AsyncClient(timeout=_LIST_TIMEOUT) as client:
            response = await client.get(_url("/models"), headers=auth_headers())
    except httpx.RequestError as exc:
        raise WeKnoraKBError(f"无法连接 WeKnora: {exc}") from exc
    _raise_for_status(response)
    try:
        payload = response.json()
    except ValueError as exc:
        raise WeKnoraKBError("WeKnora 返回了无法解析的 JSON") from exc
    return _unwrap_models(payload)


def yuxi_type_of(model: dict[str, Any]) -> str | None:
    return _YUXI_TYPE.get(str(model.get("type") or "").strip())


def model_display_name(model: dict[str, Any]) -> str:
    return str(model.get("display_name") or model.get("name") or model.get("id") or "").strip()


def model_dimension(model: dict[str, Any]) -> int | None:
    params = model.get("parameters") if isinstance(model.get("parameters"), dict) else {}
    embedding = params.get("embedding_parameters") if isinstance(params.get("embedding_parameters"), dict) else {}
    raw = embedding.get("dimension")
    try:
        value = int(raw)
    except (TypeError, ValueError):
        return None
    return value if value > 0 else None


def _available_label(model: dict[str, Any]) -> str:
    name = model_display_name(model)
    model_id = str(model.get("id") or "")
    if name and name != model_id:
        return f"{name} ({model_id})"
    return model_id or name


def _spec_candidates(spec: str) -> list[str]:
    raw = spec.strip()
    names = [raw]
    if ":" in raw:
        names.append(raw.rsplit(":", 1)[1].strip())
        names.append(raw.split(":", 1)[1].strip())
    extra: list[str] = []
    for name in names:
        if "/" in name:
            extra.append(name.rsplit("/", 1)[1].strip())
    names.extend(extra)
    seen: set[str] = set()
    out: list[str] = []
    for name in names:
        key = _norm(name)
        if name and key not in seen:
            seen.add(key)
            out.append(name)
    return out


def filter_models_by_type(models: list[dict[str, Any]], model_type: str) -> list[dict[str, Any]]:
    wanted = str(model_type or "").strip().lower()
    return [item for item in models if yuxi_type_of(item) == wanted]


def resolve_weknora_model(spec: str | None, model_type: str, models: list[dict[str, Any]] | None = None) -> dict[str, Any]:
    raw = str(spec or "").strip()
    typed = filter_models_by_type(models if models is not None else list_weknora_models(), model_type)
    available = ", ".join(_available_label(item) for item in typed) or "（无）"
    type_label = {"chat": "聊天", "embedding": "Embedding", "rerank": "Rerank"}.get(model_type, model_type)

    if not raw:
        raise ValueError(f"未指定{type_label}模型。当前可用：{available}")

    if _is_uuid(raw):
        for item in typed:
            if str(item.get("id") or "").strip() == raw:
                return item
        raise ValueError(f"找不到{type_label}模型 '{raw}'。当前可用：{available}")

    candidates = _spec_candidates(raw)
    matches: list[dict[str, Any]] = []
    seen_ids: set[str] = set()
    for item in typed:
        item_id = str(item.get("id") or "")
        labels = [str(item.get("name") or ""), str(item.get("display_name") or "")]
        names = {_norm(label) for label in labels}
        names.discard("")
        slugs = {_slug(label) for label in labels}
        slugs.discard("")
        for candidate in candidates:
            candidate_norm = _norm(candidate)
            candidate_slug = _slug(candidate)
            if (candidate_norm in names or (candidate_slug and candidate_slug in slugs)) and item_id not in seen_ids:
                matches.append(item)
                seen_ids.add(item_id)
                break

    if len(matches) == 1:
        return matches[0]
    if len(matches) > 1:
        labels = ", ".join(_available_label(item) for item in matches)
        raise ValueError(f"模型 '{raw}' 匹配到多个{type_label}模型：{labels}。请改用 WeKnora 模型 ID")
    raise ValueError(f"找不到{type_label}模型 '{raw}'。当前可用：{available}")


def grouped_v2_models(models: list[dict[str, Any]], model_type: str) -> dict[str, Any]:
    typed = filter_models_by_type(models, model_type)
    grouped: dict[str, dict[str, Any]] = {}
    for item in typed:
        params = item.get("parameters") if isinstance(item.get("parameters"), dict) else {}
        source = str(item.get("source") or params.get("provider") or "remote").strip() or "remote"
        group = grouped.setdefault(
            source,
            {
                "provider_id": source,
                "provider_display_name": source,
                "models": [],
            },
        )
        model_id = str(item.get("id") or "")
        group["models"].append(
            {
                "spec": model_id,
                "model_id": model_id,
                "display_name": model_display_name(item),
                "dimension": model_dimension(item),
                "batch_size": None,
            }
        )
    return grouped


def chat_proxy_base_url(model_id: str) -> str:
    return _url(f"/internal/models/{model_id}")


def embeddings_proxy_url(model_id: str) -> str:
    return _url(f"/internal/models/{model_id}/embeddings")


def rerank_proxy_url(model_id: str) -> str:
    return _url(f"/internal/models/{model_id}/rerank")


def request_access_token() -> str:
    headers = auth_headers()
    auth = headers.get("Authorization") or ""
    token = auth.removeprefix("Bearer ").strip()
    if not token:
        raise WeKnoraKBAuthError("缺少用户 JWT，无法调用 WeKnora 模型")
    return token


def extra_request_headers() -> dict[str, str]:
    headers = auth_headers()
    headers.pop("Authorization", None)
    headers.pop("Accept", None)
    return {key: value for key, value in headers.items() if value}


async def parse_file_via_weknora(filename: str, content: bytes) -> str:
    name = Path(filename or "upload.bin").name
    try:
        async with httpx.AsyncClient(timeout=_PARSE_TIMEOUT) as client:
            response = await client.post(
                _url("/internal/parse"),
                headers=auth_headers(),
                files={"file": (name, content)},
            )
    except httpx.RequestError as exc:
        raise WeKnoraKBError(f"无法连接 WeKnora 解析接口: {exc}") from exc
    _raise_for_status(response)
    try:
        payload = response.json()
    except ValueError as exc:
        raise WeKnoraKBError("WeKnora 解析接口返回了无法解析的 JSON") from exc
    if not isinstance(payload, dict):
        raise WeKnoraKBError("WeKnora 解析结果格式无效")
    markdown = payload.get("markdown")
    if markdown is None and isinstance(payload.get("data"), dict):
        markdown = payload["data"].get("markdown")
    return str(markdown or "")


async def _read_source_bytes(source: str) -> tuple[bytes, str]:
    from yuxi.knowledge.utils.kb_utils import is_minio_url, parse_minio_url
    from yuxi.storage.minio.client import get_minio_client

    if is_minio_url(source):
        bucket_name, object_name = parse_minio_url(source)
        minio_client = get_minio_client()
        content = await minio_client.adownload_file(bucket_name, object_name)
        return content, Path(object_name).name or "upload.bin"

    path = Path(source.split("?", 1)[0])
    return path.read_bytes(), path.name


async def parse_source_via_weknora(source: str) -> str:
    content, filename = await _read_source_bytes(source)
    markdown = await parse_file_via_weknora(filename, content)
    logger.debug("WeKnora parsed %s (%s bytes)", filename, len(content))
    return markdown


def _mindmap_node(payload: Any) -> dict[str, Any] | None:
    if isinstance(payload, dict) and payload.get("mindmap") is not None:
        payload = payload.get("mindmap")
    if isinstance(payload, dict) and payload.get("content"):
        return payload
    return None


async def get_or_generate_mindmap(kb_id: str) -> dict[str, Any]:
    headers = auth_headers()
    path = f"/knowledge-bases/{kb_id}/mindmap"
    try:
        async with httpx.AsyncClient(timeout=_MINDMAP_TIMEOUT) as client:
            response = await client.get(_url(path), headers=headers)
            _raise_for_status(response)
            payload = response.json() if response.content else {}
            node = _mindmap_node(payload)
            if node:
                return node
            generated = await client.post(_url(path), headers=headers)
            _raise_for_status(generated)
            generated_payload = generated.json() if generated.content else {}
            node = _mindmap_node(generated_payload)
            if node:
                return node
    except httpx.RequestError as exc:
        raise WeKnoraKBError(f"无法连接 WeKnora 思维导图接口: {exc}") from exc
    except ValueError as exc:
        raise WeKnoraKBError("WeKnora 思维导图返回了无法解析的 JSON") from exc
    raise WeKnoraKBError("知识库还没有可展示的思维导图")
