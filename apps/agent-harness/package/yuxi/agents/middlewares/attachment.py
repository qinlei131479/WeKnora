"""Attachment prompt injection middleware.

Read uploaded file metadata from LangGraph state and inject readable paths
into the system prompt so the model can use `read_file` on demand.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from pathlib import PurePosixPath
from typing import NotRequired

from langchain.agents import AgentState
from langchain.agents.middleware import AgentMiddleware, ModelRequest, ModelResponse
from langchain_core.messages import SystemMessage

from yuxi.utils.paths import VIRTUAL_PATH_UPLOADS
from yuxi.utils import logger

ATTACHMENT_PROMPT_MARKER = "<!-- attachment_context -->"


class AttachmentState(AgentState):
    """Extended state schema with uploaded files."""

    uploads: NotRequired[list[dict]]
    active_request_id: NotRequired[str]


def _build_attachment_prompt(uploads: Sequence[dict]) -> str | None:
    """Render uploads into a concise prompt block."""
    if not uploads:
        return None

    valid_uploads: list[dict] = []
    for upload in uploads:
        path = upload.get("path")
        if not isinstance(path, str) or not path.strip():
            continue
        valid_uploads.append(upload)

    if not valid_uploads:
        return None

    upload_infos = []
    for upload in valid_uploads:
        original_path = upload.get("original_path")
        row = f"- {upload.get('file_name', '未知文件')}: {upload.get('path')}"
        if isinstance(original_path, str) and original_path.strip() and original_path != upload.get("path"):
            row = f"{row}（原始文件：{original_path}）"
        table_index_path = upload.get("table_index_path")
        if isinstance(table_index_path, str) and table_index_path.strip():
            row = f"{row}（表格索引：{table_index_path}）"
        upload_infos.append(row)

    lines = [
        "本次请求的用户上传文件如下；这些路径是唯一授权的输入清单：",
        "",
        *upload_infos,
        "",
        "请只根据这些文件回答；若 Markdown 已截断，必须结合原始文件或专用表格索引，"
        "不得把历史 uploads/outputs 当作本次输入。",
    ]
    return "\n".join(lines)


def _runtime_context(request: ModelRequest) -> tuple[str | None, str | None, object, frozenset[str]]:
    context = getattr(request.runtime, "context", None)
    thread_id = getattr(context, "thread_id", None)
    request_id = getattr(context, "request_id", None)
    active_request_id = getattr(context, "active_request_id", None)
    state = getattr(request.runtime, "state", None)
    if active_request_id is None and isinstance(state, dict):
        active_request_id = state.get("active_request_id")

    raw_paths = getattr(context, "runtime_attachment_paths", [])
    if not isinstance(raw_paths, list):
        raw_paths = []
    authorized_paths = frozenset(
        "/" + str(path).strip().lstrip("/")
        for path in raw_paths
        if isinstance(path, str) and path.strip()
    )
    return (
        str(thread_id) if thread_id else None,
        str(request_id) if request_id else None,
        active_request_id,
        authorized_paths,
    )


def _is_valid_upload_path(path: str) -> bool:
    clean_path = "/" + path.lstrip("/")
    if not clean_path.startswith(f"{VIRTUAL_PATH_UPLOADS}/"):
        return False
    return ".." not in PurePosixPath(clean_path).parts


def _select_active_uploads(
    *,
    uploads: Sequence[object],
    thread_id: str | None,
    request_id: str | None,
    active_request_id: object,
    authorized_paths: frozenset[str],
) -> tuple[list[dict], list[tuple[str, str]]]:
    active_uploads: list[dict] = []
    rejected: list[tuple[str, str]] = []

    if not thread_id:
        return [], [("runtime", "缺少 thread_id")]
    if not request_id:
        return [], [("runtime", "缺少 request_id")]
    if not active_request_id or not str(active_request_id).strip():
        return [], [("runtime", "缺少附件授权请求 ID")]
    if not authorized_paths:
        return [], [("runtime", "缺少附件授权路径")]

    for upload in uploads:
        if not isinstance(upload, dict):
            rejected.append(("format", "上传记录不是对象"))
            continue

        file_id = str(upload.get("file_id") or "unknown")
        upload_thread_id = upload.get("thread_id")
        upload_request_id = upload.get("request_id")
        path = upload.get("path")
        clean_path = "/" + str(path).strip().lstrip("/") if isinstance(path, str) and path.strip() else ""
        extra_paths = [
            "/" + str(upload.get(key)).strip().lstrip("/")
            for key in ("original_path", "table_index_path")
            if isinstance(upload.get(key), str) and upload.get(key).strip()
        ]

        if upload_thread_id != thread_id:
            rejected.append((file_id, "thread 不匹配"))
        elif upload_request_id != active_request_id:
            rejected.append((file_id, "request 不匹配"))
        elif not clean_path or clean_path not in authorized_paths or not _is_valid_upload_path(clean_path):
            rejected.append((file_id, "path 不在当前请求快照内"))
        elif any(
            extra_path not in authorized_paths or not _is_valid_upload_path(extra_path)
            for extra_path in extra_paths
        ):
            rejected.append((file_id, "path 不在当前请求快照内"))
        else:
            active_uploads.append(upload)

    return active_uploads, rejected


class AttachmentMiddleware(AgentMiddleware[AttachmentState]):
    """Inject upload context from state.uploads into system prompt."""

    state_schema = AttachmentState

    async def awrap_model_call(
        self, request: ModelRequest, handler: Callable[[ModelRequest], ModelResponse]
    ) -> ModelResponse:
        uploads = request.state.get("uploads", [])
        thread_id, request_id, active_request_id, authorized_paths = _runtime_context(request)
        active_uploads, rejected_uploads = _select_active_uploads(
            uploads=uploads,
            thread_id=thread_id,
            request_id=request_id,
            active_request_id=active_request_id,
            authorized_paths=authorized_paths,
        )
        logger.info(
            "AttachmentMiddleware: uploads=%s active=%s rejected=%s "
            "thread_id=%s request_id=%s active_request_id=%s reasons=%s",
            len(uploads),
            len(active_uploads),
            len(rejected_uploads),
            thread_id,
            request_id,
            active_request_id,
            rejected_uploads,
        )

        if active_uploads:
            attachment_prompt = _build_attachment_prompt(active_uploads)
            if attachment_prompt:
                logger.info("AttachmentMiddleware: injecting attachment prompt")
                existing_blocks = list(request.system_message.content_blocks) if request.system_message else []
                existing_text = "\n".join(
                    block.get("text", "")
                    for block in existing_blocks
                    if isinstance(block, dict) and block.get("type") == "text"
                )

                if ATTACHMENT_PROMPT_MARKER in existing_text:
                    logger.info("AttachmentMiddleware: attachment prompt already injected, skip")
                    return await handler(request)

                merged_blocks = existing_blocks + [
                    {"type": "text", "text": f"{ATTACHMENT_PROMPT_MARKER}\n{attachment_prompt}"}
                ]
                request = request.override(system_message=SystemMessage(content=merged_blocks))

        return await handler(request)


save_attachments_to_fs = AttachmentMiddleware()
