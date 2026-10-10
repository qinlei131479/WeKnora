from __future__ import annotations

from pathlib import Path

import pytest
from fastapi import HTTPException

from yuxi.agents.backends.sandbox import paths as sandbox_paths
from yuxi.services import thread_files_service as svc


class _Conversation:
    uid = "user-1"


async def _fake_require_user_conversation(_repo, _thread_id: str, _current_uid: str):
    return _Conversation()


@pytest.mark.asyncio
async def test_list_thread_files_runs_directory_scan_in_worker_thread(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    directory = tmp_path / "outputs"
    directory.mkdir()
    (directory / "result.txt").write_text("result", encoding="utf-8")
    threaded_calls = []

    async def _fake_to_thread(func, *args, **kwargs):
        threaded_calls.append(func)
        return func(*args, **kwargs)

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(svc, "resolve_virtual_path", lambda _thread_id, _path, *, uid: directory)
    monkeypatch.setattr(
        svc,
        "virtual_path_for_thread_file",
        lambda _thread_id, path, *, uid: f"/home/gem/user-data/outputs/{path.name}",
    )
    monkeypatch.setattr(svc.asyncio, "to_thread", _fake_to_thread)

    result = await svc.list_thread_files_view(
        thread_id="thread-1",
        current_uid="user-1",
        db=None,
        path="/home/gem/user-data/outputs",
    )

    assert [item["name"] for item in result["files"]] == ["result.txt"]
    assert threaded_calls == [svc._list_directory_entries]


@pytest.mark.asyncio
async def test_resolve_thread_artifact_view_blocks_symlink_escape(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    thread_root = tmp_path / "threads" / "thread-1" / "user-data"
    uploads_dir = thread_root / "uploads"
    uploads_dir.mkdir(parents=True, exist_ok=True)
    outside_file = tmp_path / "outside.txt"
    outside_file.write_text("secret", encoding="utf-8")
    (uploads_dir / "escape.txt").symlink_to(outside_file)

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(
        svc,
        "sandbox_workspace_dir",
        lambda _thread_id, _uid: tmp_path / "shared" / _uid / "workspace",
    )
    monkeypatch.setattr(svc, "sandbox_uploads_dir", lambda _thread_id: uploads_dir)
    monkeypatch.setattr(svc, "sandbox_outputs_dir", lambda _thread_id: thread_root / "outputs")
    monkeypatch.setattr(svc, "resolve_virtual_path", lambda _thread_id, _path, *, uid: uploads_dir / "escape.txt")
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())

    with pytest.raises(HTTPException, match="access denied"):
        await svc.resolve_thread_artifact_view(
            thread_id="thread-1",
            current_uid="user-1",
            db=None,
            path="/home/gem/user-data/uploads/escape.txt",
        )


@pytest.mark.asyncio
async def test_resolve_thread_artifact_view_allows_global_saved_artifacts(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    saved_dir = sandbox_paths.global_saved_artifacts_dir("user-1")
    saved_dir.mkdir(parents=True)
    saved_file = saved_dir / "result.md"
    saved_file.write_text("result", encoding="utf-8")

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())

    resolved_path = await svc.resolve_thread_artifact_view(
        thread_id="thread-1",
        current_uid="user-1",
        db=None,
        path="/home/gem/user-data/workspace/saved_artifacts/result.md",
    )

    assert resolved_path == saved_file.resolve()


@pytest.mark.asyncio
async def test_resolve_thread_artifact_view_falls_back_to_legacy_saved_file(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    legacy_file = sandbox_paths.sandbox_workspace_dir("thread-1", "user-1") / "saved_artifacts" / "result.md"
    legacy_file.parent.mkdir(parents=True)
    legacy_file.write_text("legacy", encoding="utf-8")

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())

    resolved_path = await svc.resolve_thread_artifact_view(
        thread_id="thread-1",
        current_uid="user-1",
        db=None,
        path="/home/gem/user-data/workspace/saved_artifacts/result.md",
    )

    assert resolved_path == legacy_file.resolve()


@pytest.mark.asyncio
async def test_resolve_thread_artifact_view_rejects_legacy_saved_symlink(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    outside_file = tmp_path / "outside.md"
    outside_file.write_text("outside", encoding="utf-8")
    legacy_link = sandbox_paths.sandbox_workspace_dir("thread-1", "user-1") / "saved_artifacts" / "result.md"
    legacy_link.parent.mkdir(parents=True)
    legacy_link.symlink_to(outside_file)

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())

    with pytest.raises(HTTPException, match="artifact not found"):
        await svc.resolve_thread_artifact_view(
            thread_id="thread-1",
            current_uid="user-1",
            db=None,
            path="/home/gem/user-data/workspace/saved_artifacts/result.md",
        )


def test_resolve_virtual_path_blocks_saved_artifacts_symlink_escape(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    saved_dir = sandbox_paths.global_saved_artifacts_dir("user-1")
    saved_dir.parent.mkdir(parents=True)
    outside_dir = tmp_path / "outside"
    outside_dir.mkdir()
    saved_dir.symlink_to(outside_dir, target_is_directory=True)

    with pytest.raises(ValueError, match="outside threads root"):
        sandbox_paths.resolve_virtual_path(
            "thread-1",
            "/home/gem/user-data/workspace/saved_artifacts/secret.txt",
            uid="user-1",
        )


def test_list_thread_root_entries_contains_global_saved_artifacts(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    sandbox_paths.ensure_thread_dirs(thread_id, uid)
    saved_dir = sandbox_paths.global_saved_artifacts_dir(uid)
    saved_dir.mkdir(parents=True)
    (saved_dir / "result.md").write_text("result", encoding="utf-8")

    result = svc._list_user_data_root_entries(thread_id, uid, "/home/gem/user-data")

    assert "workspace" in {str(item["name"]) for item in result["files"]}
    assert "saved_artifacts" in {str(item["name"]) for item in result["files"]}


@pytest.mark.asyncio
async def test_save_artifact_uses_global_dir_and_migrates_legacy_files(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    scoped_saved_dir = tmp_path / "scoped" / "workspace" / "saved_artifacts"
    scoped_saved_dir.mkdir(parents=True)
    (scoped_saved_dir / "legacy.md").write_text("legacy", encoding="utf-8")

    global_saved_dir = tmp_path / "global" / "workspace" / "saved_artifacts"
    source_dir = tmp_path / "outputs"
    source_dir.mkdir(parents=True)
    source_path = source_dir / "result.md"
    source_path.write_text("result", encoding="utf-8")

    async def _fake_invalidate(_value):
        return None

    def _ensure_global_dir(_uid: str) -> Path:
        global_saved_dir.mkdir(parents=True, exist_ok=True)
        return global_saved_dir

    def _fake_virtual_path(_thread_id: str, path: Path, *, uid: str) -> str:
        relative_path = path.relative_to(global_saved_dir)
        return f"/home/gem/user-data/workspace/saved_artifacts/{relative_path.as_posix()}"

    monkeypatch.setattr(svc, "require_user_conversation", _fake_require_user_conversation)
    monkeypatch.setattr(svc, "ConversationRepository", lambda _db: object())
    monkeypatch.setattr(svc, "ensure_thread_dirs", lambda _thread_id, _uid: None)
    monkeypatch.setattr(svc, "resolve_virtual_path", lambda _thread_id, _path, *, uid: source_path)
    monkeypatch.setattr(svc, "sandbox_outputs_dir", lambda _thread_id: source_dir)
    monkeypatch.setattr(svc, "sandbox_workspace_dir", lambda _thread_id, _uid: tmp_path / "scoped" / "workspace")
    monkeypatch.setattr(svc, "ensure_global_saved_artifacts_dir", _ensure_global_dir)
    monkeypatch.setattr(svc, "invalidate_mention_cache", _fake_invalidate)
    monkeypatch.setattr(svc, "invalidate_workspace_mention_cache", _fake_invalidate)
    monkeypatch.setattr(svc, "virtual_path_for_thread_file", _fake_virtual_path)

    result = await svc.save_thread_artifact_to_workspace_view(
        thread_id="thread-1",
        current_uid="user-1",
        db=None,
        path="/home/gem/user-data/outputs/result.md",
    )

    assert result["saved_path"] == "/home/gem/user-data/workspace/saved_artifacts/result.md"
    assert (global_saved_dir / "legacy.md").read_text(encoding="utf-8") == "legacy"
    assert (global_saved_dir / "result.md").read_text(encoding="utf-8") == "result"
    assert not scoped_saved_dir.exists()


@pytest.mark.asyncio
async def test_migrate_legacy_saved_artifacts_invalidates_workspace_cache(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    legacy_file = sandbox_paths.sandbox_workspace_dir("thread-1", "user-1") / "saved_artifacts" / "legacy.md"
    legacy_file.parent.mkdir(parents=True)
    legacy_file.write_text("legacy", encoding="utf-8")
    invalidated = []

    async def _fake_invalidate(uid: str):
        invalidated.append(uid)

    monkeypatch.setattr(svc, "invalidate_workspace_mention_cache", _fake_invalidate)

    assert await svc.migrate_legacy_saved_artifacts_for_user(uid="user-1", thread_ids=["thread-1"]) is True
    assert invalidated == ["user-1"]
    assert not legacy_file.parent.exists()


def test_copy_regular_file_removes_partial_file_on_copy_failure(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    source = tmp_path / "source.md"
    source.write_text("source", encoding="utf-8")
    target_dir = tmp_path / "saved_artifacts"
    target_dir.mkdir()

    def _fail_copy(_src, dst):
        dst.write(b"partial")
        raise OSError("copy failed")

    monkeypatch.setattr(svc.shutil, "copyfileobj", _fail_copy)

    with pytest.raises(OSError, match="copy failed"):
        svc._copy_regular_file(target_dir, source)

    assert not (target_dir / "source.md").exists()


def test_migrate_legacy_saved_artifacts_skips_symlinked_source_dir(
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(sandbox_paths.conf, "save_dir", str(tmp_path))
    thread_id = "thread-1"
    uid = "user-1"
    scoped_workspace = sandbox_paths.sandbox_workspace_dir(thread_id, uid)
    scoped_workspace.mkdir(parents=True)
    outside_dir = tmp_path / "outside"
    outside_dir.mkdir()
    (outside_dir / "secret.txt").write_text("secret", encoding="utf-8")
    legacy_dir = scoped_workspace / "saved_artifacts"
    legacy_dir.symlink_to(outside_dir, target_is_directory=True)
    global_dir = tmp_path / "global-saved"
    global_dir.mkdir()

    assert svc._migrate_legacy_saved_artifacts(thread_id, uid, global_dir) == {}
    assert (outside_dir / "secret.txt").read_text(encoding="utf-8") == "secret"
    assert not any(global_dir.iterdir())
