"""WeKnora 知识库适配器。索引与权限在 WeKnora；yuxi 只做读取。"""

from __future__ import annotations

from pathlib import PurePosixPath
from typing import Any

from yuxi.knowledge.base import KnowledgeBase
from yuxi.knowledge.read_models import KnowledgeBaseConfig
from yuxi.p0.kb_fulltext import CHUNKS_PAGE_SIZE_MAX, capability_for_kb_type, reconstruct_document_text
from yuxi.p3.client import WeKnoraKBClient
from yuxi.p3.errors import WeKnoraKBError, WeKnoraKBPermissionError
from yuxi.services.file_preview import (
    MAX_BINARY_PREVIEW_SIZE_BYTES,
    OfficePreviewConversionError,
    convert_office_to_pdf,
    detect_media_type,
    detect_preview_type,
    is_binary_preview_type,
    is_office_pdf_preview_file,
    render_preview_payload,
    render_preview_too_large_payload,
)

_MANAGED = "该知识库由 WeKnora 管理，请在 WeKnora 知识库页面操作"


class WeKnoraKB(KnowledgeBase):
    kb_type = "weknora"
    name = "WeKnora"
    description = "连接 WeKnora 知识库的只读适配器"
    requires_embedding_model = False
    supports_documents = True
    apply_chunk_defaults = False

    def __init__(self, work_dir: str, **kwargs):
        del kwargs
        super().__init__(work_dir)
        self._http: WeKnoraKBClient | None = None

    @property
    def _client(self) -> WeKnoraKBClient:
        if self._http is None:
            self._http = WeKnoraKBClient()
        return self._http

    @staticmethod
    def _managed_error() -> ValueError:
        return ValueError(_MANAGED)

    async def add_file_record(self, kb_id, item, params=None, operator_id=None, *, additional_params):
        del kb_id, item, params, operator_id, additional_params
        raise self._managed_error()

    async def parse_file(self, kb_id, file_id, operator_id=None, *, additional_params):
        del kb_id, file_id, operator_id, additional_params
        raise self._managed_error()

    async def create_folder(self, kb_id: str, folder_name: str, parent_id: str | None = None) -> dict:
        del kb_id, folder_name, parent_id
        raise self._managed_error()

    async def move_file(self, kb_id: str, file_id: str, new_parent_id: str | None) -> dict:
        del kb_id, file_id, new_parent_id
        raise self._managed_error()

    async def delete_folder(self, kb_id: str, folder_id: str) -> None:
        del kb_id, folder_id
        raise self._managed_error()

    async def cleanup_database_resources(self, kb_id: str) -> dict:
        del kb_id
        return {"skipped": True, "reason": _MANAGED}

    async def read_file_preview(self, kb_id: str, file_id: str) -> dict:
        if str(file_id).startswith("__virtual_folder__:"):
            raise ValueError("Cannot preview a folder")

        basic = await self.get_file_basic_info(kb_id, file_id)
        filename = str(basic.get("filename") or file_id)
        response = {
            "source": "knowledge",
            "kb_id": kb_id,
            "file_id": file_id,
            "filename": filename,
            "readonly": True,
        }

        kind, _supported, _message = detect_preview_type(filename, b"")
        wants_original = is_binary_preview_type(kind) or is_office_pdf_preview_file(filename)
        if wants_original:
            original = await self._preview_from_original(filename, file_id)
            if original is not None:
                return {**response, **original}

        content_type = await self._kb_content_type(kb_id)
        text, _chunks = await self._load_unit_text(kb_id, file_id, content_type)
        if text.strip():
            return {**response, **self._text_preview_payload(filename, text)}

        if not wants_original:
            original = await self._preview_from_original(filename, file_id)
            if original is not None:
                return {**response, **original}

        return {
            **response,
            "content": None,
            "preview_type": "unsupported",
            "supported": False,
            "message": self._empty_unit_hint(content_type),
        }

    async def _preview_from_original(self, filename: str, file_id: str) -> dict[str, Any] | None:
        try:
            downloaded = await self._client.download_knowledge(file_id)
        except (WeKnoraKBPermissionError, WeKnoraKBError):
            return None
        raw = downloaded.get("content") if isinstance(downloaded, dict) else None
        if not isinstance(raw, (bytes, bytearray)):
            return None
        raw = bytes(raw)
        if len(raw) > MAX_BINARY_PREVIEW_SIZE_BYTES:
            return render_preview_too_large_payload()

        if is_office_pdf_preview_file(filename):
            try:
                pdf = await convert_office_to_pdf(filename, raw)
            except OfficePreviewConversionError:
                return None
            stem = PurePosixPath(filename).stem or file_id
            return {
                "content": pdf,
                "filename": f"{stem}.pdf",
                "media_type": "application/pdf",
                "preview_type": "pdf",
                "supported": True,
                "message": None,
                "binary": True,
            }

        payload = render_preview_payload(filename, raw)
        if is_binary_preview_type(payload["preview_type"]) and payload["supported"]:
            return {
                "content": raw,
                "media_type": detect_media_type(filename, raw),
                "preview_type": payload["preview_type"],
                "supported": True,
                "message": None,
                "binary": True,
            }
        if payload.get("supported"):
            return payload
        return None

    @staticmethod
    def _text_preview_payload(filename: str, text: str) -> dict[str, Any]:
        kind, supported, _message = detect_preview_type(filename, text.encode("utf-8"))
        preview_name = filename
        if not supported or kind not in {"text", "markdown", "html"}:
            stem = PurePosixPath(filename).stem or filename
            preview_name = f"{stem}.md"
        return render_preview_payload(preview_name, text.encode("utf-8"))

    def _content_type(self, config: KnowledgeBaseConfig | None) -> str:
        extra = (config.additional_params if config else {}) or {}
        return str(extra.get("weknora_kb_type") or "document").strip().lower()

    async def _create_kb_instance(self, kb_id: str, embedding_model_spec: str | None) -> Any:
        del kb_id, embedding_model_spec
        return None

    async def _initialize_kb_instance(self, instance: Any) -> None:
        del instance

    async def index_file(self, kb_id, file_id, operator_id=None, *, embedding_model_spec, additional_params) -> dict:
        del kb_id, file_id, operator_id, embedding_model_spec, additional_params
        raise self._managed_error()

    async def update_content(
        self, kb_id, file_ids, params=None, *, embedding_model_spec, additional_params
    ) -> list[dict]:
        del kb_id, file_ids, params, embedding_model_spec, additional_params
        raise self._managed_error()

    async def delete_file(self, kb_id: str, file_id: str) -> None:
        del kb_id, file_id
        raise self._managed_error()

    def get_query_params_config(self, kb_id: str, **kwargs) -> dict:
        del kb_id, kwargs
        return {
            "type": "weknora",
            "options": [
                {
                    "key": "match_count",
                    "label": "返回条数",
                    "type": "number",
                    "default": 10,
                    "min": 1,
                    "max": 50,
                }
            ],
        }

    async def aquery(
        self,
        query_text: str,
        kb_id: str,
        *,
        config: KnowledgeBaseConfig,
        agent_call: bool = False,
        **kwargs,
    ) -> list[dict]:
        del agent_call
        body: dict[str, Any] = {"query_text": query_text}
        match_count = kwargs.get("match_count") or config.query_options.get("match_count") or 10
        try:
            body["match_count"] = max(1, int(match_count))
        except (TypeError, ValueError):
            body["match_count"] = 10

        file_name = str(kwargs.get("file_name") or "").strip()
        if file_name:
            knowledge_ids = await self._resolve_knowledge_ids(kb_id, file_name)
            if not knowledge_ids:
                return []
            body["knowledge_ids"] = knowledge_ids

        hits = await self._client.hybrid_search(kb_id, body)
        results: list[dict] = []
        for hit in hits:
            if not isinstance(hit, dict):
                continue
            knowledge_id = str(hit.get("knowledge_id") or "")
            results.append(
                {
                    "content": str(hit.get("content") or ""),
                    "score": float(hit.get("score") or 0.0),
                    "id": str(hit.get("id") or ""),
                    "file_id": knowledge_id,
                    "chunk_id": str(hit.get("id") or ""),
                    "chunk_index": hit.get("chunk_index"),
                    "metadata": {
                        "file_id": knowledge_id,
                        "chunk_id": str(hit.get("id") or ""),
                        "chunk_index": hit.get("chunk_index"),
                        "source": hit.get("knowledge_filename") or hit.get("knowledge_title") or "",
                        "knowledge_title": hit.get("knowledge_title"),
                        "knowledge_filename": hit.get("knowledge_filename"),
                        "knowledge_base_id": hit.get("knowledge_base_id") or kb_id,
                        "chunk_type": hit.get("chunk_type"),
                    },
                }
            )
        return results

    async def get_file_basic_info(self, kb_id: str, file_id: str) -> dict:
        del kb_id
        meta = await self._client.get_knowledge(file_id)
        return {
            "file_id": str(meta.get("id") or file_id),
            "filename": meta.get("file_name") or meta.get("title") or file_id,
            "file_type": meta.get("file_type") or meta.get("type") or "",
            "file_size": meta.get("file_size") or 0,
            "status": meta.get("parse_status") or "",
        }

    async def get_file_content(self, kb_id: str, file_id: str) -> dict:
        content_type = await self._kb_content_type(kb_id)
        text, chunks = await self._load_unit_text(kb_id, file_id, content_type)
        return {"content": text, "chunks": chunks, "kb_type": content_type}

    async def get_file_info(self, kb_id: str, file_id: str) -> dict:
        basic = await self.get_file_basic_info(kb_id, file_id)
        content = await self.get_file_content(kb_id, file_id)
        return {**basic, **content}

    async def open_file_content(self, kb_id: str, file_id: str, offset: int = 0, limit: int = 800) -> dict:
        content_type = await self._kb_content_type(kb_id)
        text, _chunks = await self._load_unit_text(kb_id, file_id, content_type)
        if not text.strip():
            raise WeKnoraKBError(self._empty_unit_hint(content_type))
        return self._build_open_file_window(text, offset=offset, limit=limit)

    async def find_file_content(
        self,
        kb_id: str,
        file_id: str,
        patterns: list[str],
        *,
        use_regex: bool = False,
        case_sensitive: bool = False,
        max_windows: int = 5,
        window_size: int = 80,
    ) -> dict:
        content_type = await self._kb_content_type(kb_id)
        text, _chunks = await self._load_unit_text(kb_id, file_id, content_type)
        if not text.strip():
            raise WeKnoraKBError(self._empty_unit_hint(content_type))
        return self._build_find_file_windows(
            text,
            patterns=patterns,
            use_regex=use_regex,
            case_sensitive=case_sensitive,
            max_windows=max_windows,
            window_size=window_size,
        )

    async def list_file_tree(
        self,
        kb_id: str,
        parent_id: str | None = None,
        recursive: bool = False,
        files_only: bool = False,
        path_prefix: str | None = None,
        page: int = 1,
        page_size: int = 100,
    ) -> dict:
        del parent_id
        folder_path = self._normalize_folder_path(path_prefix)
        if recursive:
            items, total = await self._list_all_knowledge(kb_id, folder_path=folder_path or None, folder_recursive=True)
            entries = [self._knowledge_as_file(item, kb_id) for item in items]
            return {"entries": entries, "total": total, "page": 1, "page_size": len(entries), "readonly": True}

        normalized_page = max(int(page or 1), 1)
        normalized_page_size = min(max(int(page_size or 100), 1), 500)
        folders: list[dict[str, Any]] = []
        if not files_only:
            tree = await self._client.list_knowledge_folders(kb_id)
            for node in self._folders_at_path(tree, folder_path):
                folders.append(self._folder_as_entry(node, kb_id))

        items, file_total = await self._client.list_knowledge(
            kb_id,
            page=normalized_page,
            page_size=normalized_page_size,
            folder_path=folder_path,
            folder_recursive=False,
        )
        files = [self._knowledge_as_file(item, kb_id) for item in items]
        if normalized_page <= 1:
            entries = folders + files
        else:
            entries = files
        total = len(folders) + int(file_total)
        return {
            "entries": entries,
            "total": total,
            "page": normalized_page,
            "page_size": normalized_page_size,
            "has_more": normalized_page * normalized_page_size < int(file_total),
            "readonly": True,
            "path_prefix": f"{folder_path}/" if folder_path else "",
        }

    async def get_file_download(self, kb_id: str, file_id: str, variant: str = "original") -> dict:
        del variant
        content_type = await self._kb_content_type(kb_id)
        if content_type in {"faq", "wiki"}:
            raise WeKnoraKBError(
                f"{content_type.upper()} 知识库不提供原件下载，请使用 open_kb_document 阅读条目或页面"
            )
        return await self._client.download_knowledge(file_id)

    async def search_files(self, kb_id: str, query: str | None, *, offset: int = 0, limit: int = 100) -> dict:
        keyword = (query or "").strip()
        items, total = await self._client.list_knowledge(kb_id, page=1, page_size=min(max(limit, 1), 100), keyword=keyword or None)
        files = [self._knowledge_as_file(item, kb_id) for item in items]
        sliced = files[offset : offset + limit] if offset else files[:limit]
        return {"files": sliced, "total": total}

    async def _kb_content_type(self, kb_id: str) -> str:
        meta = await self._client.get_knowledge_base(kb_id)
        return str(meta.get("type") or "document").strip().lower()

    async def _resolve_knowledge_ids(self, kb_id: str, file_name: str) -> list[str]:
        items, _total = await self._client.list_knowledge(kb_id, page=1, page_size=100, keyword=file_name)
        needle = file_name.strip().lower()
        matched = []
        for item in items:
            name = str(item.get("file_name") or item.get("title") or "").lower()
            if needle in name:
                matched.append(str(item.get("id")))
        return matched

    async def _list_all_knowledge(
        self,
        kb_id: str,
        *,
        folder_path: str | None = None,
        folder_recursive: bool | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        page = 1
        items: list[dict[str, Any]] = []
        total = 0
        while page <= 50:
            batch, total = await self._client.list_knowledge(
                kb_id,
                page=page,
                page_size=100,
                folder_path=folder_path,
                folder_recursive=folder_recursive,
            )
            items.extend(batch)
            if len(batch) < 100 or len(items) >= total:
                break
            page += 1
        return items, total

    async def _load_unit_text(self, kb_id: str, file_id: str, content_type: str) -> tuple[str, list[dict[str, Any]]]:
        cap = capability_for_kb_type(content_type)
        chunk_type = {"document": "text", "faq": "faq", "wiki": "wiki_page"}.get(content_type, "text")
        chunks = await self._paginate_chunks(file_id, chunk_type=chunk_type)
        if cap["open_find"] == "document":
            rebuilt = reconstruct_document_text(chunks)
            return str(rebuilt.get("text") or ""), chunks
        # FAQ entry / Wiki page：单条单元，不拼成一篇文章
        if not chunks:
            return "", []
        texts = [str(item.get("content") or "") for item in chunks if item.get("content")]
        return "\n\n".join(texts), chunks

    async def _paginate_chunks(self, knowledge_id: str, *, chunk_type: str) -> list[dict[str, Any]]:
        page = 1
        chunks: list[dict[str, Any]] = []
        while page <= 200:
            batch, total = await self._client.list_chunks(
                knowledge_id,
                page=page,
                page_size=CHUNKS_PAGE_SIZE_MAX,
                chunk_type=chunk_type,
            )
            chunks.extend(batch)
            if len(batch) < CHUNKS_PAGE_SIZE_MAX or (total and len(chunks) >= total):
                break
            page += 1
        return chunks

    @staticmethod
    def _empty_unit_hint(content_type: str) -> str:
        cap = capability_for_kb_type(content_type)
        if cap["open_find"] == "entry":
            return "该 FAQ 条目没有可打开的正文（FAQ 按条目读取，不会拼成一篇文章）"
        if cap["open_find"] == "page":
            return "该 Wiki 页面没有可打开的正文（Wiki 按页面读取，不会拼成一篇文章）"
        return "未能从 chunks 重建文档正文"

    @staticmethod
    def _normalize_folder_path(raw: str | None) -> str:
        if not raw:
            return ""
        path = str(raw).replace("\\", "/").strip()
        return path.strip("/")

    @classmethod
    def _folders_at_path(cls, tree: dict[str, Any] | None, folder_path: str) -> list[dict[str, Any]]:
        folders = (tree or {}).get("folders")
        if not isinstance(folders, list):
            return []
        if not folder_path:
            return [node for node in folders if isinstance(node, dict)]
        node = cls._find_folder_node(folders, folder_path)
        children = (node or {}).get("children") if isinstance(node, dict) else None
        if not isinstance(children, list):
            return []
        return [child for child in children if isinstance(child, dict)]

    @classmethod
    def _find_folder_node(cls, folders: list[Any], folder_path: str) -> dict[str, Any] | None:
        for node in folders:
            if not isinstance(node, dict):
                continue
            if str(node.get("path") or "") == folder_path:
                return node
            children = node.get("children")
            if isinstance(children, list):
                found = cls._find_folder_node(children, folder_path)
                if found is not None:
                    return found
        return None

    @classmethod
    def _folder_as_entry(cls, node: dict[str, Any], kb_id: str) -> dict[str, Any]:
        path = cls._normalize_folder_path(str(node.get("path") or ""))
        name = str(node.get("name") or path.rsplit("/", 1)[-1] or path)
        prefix = f"{path}/" if path else ""
        children = node.get("children") if isinstance(node.get("children"), list) else []
        child_count = int(node.get("total_count") or node.get("document_count") or 0) + len(children)
        return {
            "kb_id": kb_id,
            "file_id": f"__virtual_folder__:{kb_id}:{prefix}",
            "filename": name,
            "file_type": "folder",
            "status": "done",
            "file_size": 0,
            "created_at": None,
            "updated_at": None,
            "is_folder": True,
            "parent_id": None,
            "is_virtual_folder": True,
            "path_prefix": prefix,
            "has_children": child_count > 0,
            "children_count": child_count,
            "has_original_file": False,
            "has_parsed_markdown": False,
        }

    @staticmethod
    def _knowledge_as_file(item: dict[str, Any], kb_id: str) -> dict[str, Any]:
        return {
            "kb_id": kb_id,
            "file_id": str(item.get("id") or ""),
            "filename": item.get("file_name") or item.get("title") or "",
            "file_type": item.get("file_type") or item.get("type") or "",
            "status": item.get("parse_status") or "",
            "file_size": item.get("file_size") or 0,
            "created_at": str(item.get("created_at") or "") or None,
            "updated_at": str(item.get("updated_at") or "") or None,
            "is_folder": False,
            "parent_id": None,
            "is_virtual_folder": False,
            "path_prefix": None,
        }
