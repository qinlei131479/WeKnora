from __future__ import annotations

from pathlib import Path
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from yuxi.agents.backends.sandbox import paths as sandbox_paths
from yuxi.repositories import conversation_repository
from yuxi.services import viewer_filesystem_service as svc


class FakeAttachmentRepository:
    def __init__(self, conversation, attachments):
        self.conversation = conversation
        self.attachments = attachments

    async def get_conversation_by_thread_id(self, thread_id: str):
        return self.conversation

    async def get_attachments(self, conversation_id: int):
        return list(self.attachments)


@pytest.mark.asyncio
async def test_thread_attachment_paths_authorizes_thread_attachments(monkeypatch) -> None:
    """viewer 走线程维度授权；留空会让 uploads 下所有文件被沙箱白名单拒绝。"""
    attachments = [
        {
            "path": "/home/gem/user-data/uploads/attachments/a.md",
            "original_path": "/home/gem/user-data/uploads/attachments/a.docx",
            "table_index_path": "/home/gem/user-data/uploads/attachments/a.index.json",
        }
    ]
    monkeypatch.setattr(
        conversation_repository,
        "ConversationRepository",
        lambda db: FakeAttachmentRepository(SimpleNamespace(id=9, uid="user-1"), attachments),
    )

    paths = await svc._thread_attachment_paths(thread_id="thread-1", uid="user-1", db=None)

    assert paths == [
        "/home/gem/user-data/uploads/attachments/a.md",
        "/home/gem/user-data/uploads/attachments/a.docx",
        "/home/gem/user-data/uploads/attachments/a.index.json",
    ]


@pytest.mark.asyncio
async def test_thread_attachment_paths_rejects_foreign_thread(monkeypatch) -> None:
    monkeypatch.setattr(
        conversation_repository,
        "ConversationRepository",
        lambda db: FakeAttachmentRepository(SimpleNamespace(id=9, uid="other-user"), [{"path": "/uploads/a.md"}]),
    )

    assert await svc._thread_attachment_paths(thread_id="thread-1", uid="user-1", db=None) == []


def test_resolve_local_user_data_path_blocks_upload_symlink_escape(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    sandbox_paths.ensure_thread_dirs(thread_id, uid)

    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("outside", encoding="utf-8")
    escape_link = sandbox_paths.sandbox_uploads_dir(thread_id) / "escape.txt"
    escape_link.symlink_to(outside_file)

    with pytest.raises(HTTPException) as exc_info:
        svc._resolve_local_user_data_path(thread_id, uid, "/home/gem/user-data/uploads/escape.txt")

    assert exc_info.value.status_code == 403


def test_resolve_local_user_data_path_allows_global_saved_artifacts(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    saved_dir = sandbox_paths.global_saved_artifacts_dir("user-1")
    saved_dir.mkdir(parents=True)
    target = saved_dir / "result.md"
    target.write_text("result", encoding="utf-8")

    resolved_path = svc._resolve_local_user_data_path(
        "thread-1",
        "user-1",
        "/home/gem/user-data/workspace/saved_artifacts/result.md",
    )

    assert resolved_path == target.resolve()


def test_resolve_local_user_data_path_falls_back_to_legacy_saved_file(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    sandbox_paths.ensure_thread_dirs("thread-1", "user-1")
    legacy_target = sandbox_paths.sandbox_workspace_dir("thread-1", "user-1") / "saved_artifacts" / "result.md"
    legacy_target.parent.mkdir(parents=True, exist_ok=True)
    legacy_target.write_text("legacy", encoding="utf-8")

    resolved_path = svc._resolve_local_user_data_path(
        "thread-1",
        "user-1",
        "/home/gem/user-data/workspace/saved_artifacts/result.md",
    )

    assert resolved_path == legacy_target.resolve()


def test_resolve_local_user_data_path_rejects_legacy_saved_symlink(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    sandbox_paths.ensure_thread_dirs("thread-1", "user-1")
    outside_file = tmp_path / "outside.md"
    outside_file.write_text("outside", encoding="utf-8")
    legacy_link = sandbox_paths.sandbox_workspace_dir("thread-1", "user-1") / "saved_artifacts" / "result.md"
    legacy_link.parent.mkdir(parents=True)
    legacy_link.symlink_to(outside_file)

    with pytest.raises(HTTPException) as exc_info:
        svc._resolve_local_user_data_path(
            "thread-1",
            "user-1",
            "/home/gem/user-data/workspace/saved_artifacts/result.md",
        )

    assert exc_info.value.status_code == 403


def test_list_viewer_user_data_root_entries_contains_global_saved_artifacts(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    sandbox_paths.ensure_thread_dirs("thread-1", "user-1")
    saved_dir = sandbox_paths.global_saved_artifacts_dir("user-1")
    saved_dir.mkdir(parents=True)
    (saved_dir / "result.md").write_text("result", encoding="utf-8")

    entries = svc._list_user_data_root_entries("thread-1", "user-1")

    assert "workspace" in {str(item["name"]) for item in entries}
    assert "saved_artifacts" in {str(item["name"]) for item in entries}


def test_list_local_entries_skips_symlink_escape(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    sandbox_paths.ensure_thread_dirs(thread_id, uid)

    uploads_dir = sandbox_paths.sandbox_uploads_dir(thread_id)
    (uploads_dir / "safe.txt").write_text("safe", encoding="utf-8")
    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("outside", encoding="utf-8")
    (uploads_dir / "escape.txt").symlink_to(outside_file)

    entries = svc._list_local_entries(thread_id, uid, uploads_dir)

    assert {entry["path"] for entry in entries} == {"/home/gem/user-data/uploads/safe.txt"}


@pytest.mark.asyncio
async def test_delete_saved_artifact_invalidates_thread_and_workspace_cache(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    saved_file = sandbox_paths.global_saved_artifacts_dir("user-1") / "result.md"
    saved_file.parent.mkdir(parents=True)
    saved_file.write_text("result", encoding="utf-8")
    invalidated = []

    async def _fake_resolve_viewer_state(**_kwargs):
        return None, None, []

    async def _fake_invalidate(value: str):
        invalidated.append(("thread" if value == "thread-1" else "workspace", value))

    monkeypatch.setattr(svc, "_resolve_viewer_state", _fake_resolve_viewer_state)
    monkeypatch.setattr(svc, "invalidate_mention_cache", _fake_invalidate)
    monkeypatch.setattr(svc, "invalidate_workspace_mention_cache", _fake_invalidate)

    response = await svc.delete_viewer_file(
        thread_id="thread-1",
        path="/home/gem/user-data/workspace/saved_artifacts/result.md",
        current_user=SimpleNamespace(uid="user-1"),
        db=None,
    )

    assert response["success"] is True
    assert invalidated == [("thread", "thread-1"), ("workspace", "user-1")]
    assert not saved_file.exists()


@pytest.mark.asyncio
async def test_read_viewer_workspace_office_file_returns_pdf_preview(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    user = SimpleNamespace(uid=uid)
    sandbox_paths.ensure_thread_dirs(thread_id, uid)
    target = sandbox_paths.sandbox_workspace_dir(thread_id, uid) / "slides.pptx"
    target.write_bytes(b"presentation")

    async def fake_resolve_viewer_state(**kwargs):
        return None, None, []

    async def fake_convert(filename: str, content: bytes) -> bytes:
        assert filename == "slides.pptx"
        assert content == b"presentation"
        return b"%PDF-1.4\npreview"

    monkeypatch.setattr(svc, "_resolve_viewer_state", fake_resolve_viewer_state)
    monkeypatch.setattr(svc, "convert_office_to_pdf", fake_convert)

    response = await svc.read_viewer_file_content(
        thread_id=thread_id,
        path="/home/gem/user-data/workspace/slides.pptx",
        current_user=user,
        db=None,
    )
    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    assert response.media_type == "application/pdf"
    assert response.headers["x-yuxi-preview-type"] == "pdf"
    assert body == b"%PDF-1.4\npreview"


@pytest.mark.asyncio
async def test_read_viewer_output_office_file_returns_pdf_preview(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    user = SimpleNamespace(uid=uid)
    sandbox_paths.ensure_thread_dirs(thread_id, uid)
    target = sandbox_paths.sandbox_outputs_dir(thread_id) / "slides.pptx"
    target.write_bytes(b"presentation")

    async def fake_resolve_viewer_state(**kwargs):
        return None, None, []

    async def fake_convert(filename: str, content: bytes) -> bytes:
        assert filename == "slides.pptx"
        assert content == b"presentation"
        return b"%PDF-1.4\npreview"

    monkeypatch.setattr(svc, "_resolve_viewer_state", fake_resolve_viewer_state)
    monkeypatch.setattr(svc, "convert_office_to_pdf", fake_convert)

    response = await svc.read_viewer_file_content(
        thread_id=thread_id,
        path="/home/gem/user-data/outputs/slides.pptx",
        current_user=user,
        db=None,
    )
    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    assert response.media_type == "application/pdf"
    assert response.headers["x-yuxi-preview-type"] == "pdf"
    assert body == b"%PDF-1.4\npreview"


@pytest.mark.asyncio
async def test_read_viewer_output_xlsx_returns_excel_binary_preview(
    tmp_path: Path,
    monkeypatch,
) -> None:
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    user = SimpleNamespace(uid=uid)
    sandbox_paths.ensure_thread_dirs(thread_id, uid)
    target = sandbox_paths.sandbox_outputs_dir(thread_id) / "sheet.xlsx"
    target.write_bytes(b"PK\x03\x04spreadsheet")

    async def fake_resolve_viewer_state(**kwargs):
        return None, None, []

    monkeypatch.setattr(svc, "_resolve_viewer_state", fake_resolve_viewer_state)

    response = await svc.read_viewer_file_content(
        thread_id=thread_id,
        path="/home/gem/user-data/outputs/sheet.xlsx",
        current_user=user,
        db=None,
    )
    body = b""
    async for chunk in response.body_iterator:
        body += chunk

    assert response.media_type == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert response.headers["x-yuxi-preview-type"] == "excel"
    assert body == b"PK\x03\x04spreadsheet"
