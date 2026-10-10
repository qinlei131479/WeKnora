from __future__ import annotations

import asyncio
import contextlib
import os
import shutil
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from yuxi.agents.backends.sandbox import (
    ensure_global_saved_artifacts_dir,
    ensure_thread_dirs,
    existing_global_saved_artifacts_dir,
    resolve_virtual_path,
    sandbox_outputs_dir,
    sandbox_uploads_dir,
    sandbox_user_data_dir,
    sandbox_workspace_dir,
    resolve_legacy_saved_artifact_fallback,
    validate_thread_id,
    virtual_path_for_thread_file,
)
from yuxi.repositories.conversation_repository import ConversationRepository
from yuxi.services.conversation_service import require_user_conversation
from yuxi.services.mention_search_service import invalidate_mention_cache, invalidate_workspace_mention_cache
from yuxi.utils.datetime_utils import utc_isoformat_from_timestamp
from yuxi.utils.paths import SAVED_ARTIFACTS_DIR_NAME, VIRTUAL_PATH_PREFIX


def _get_virtual_root() -> str:
    """Return the virtual root exposed by the thread-files API."""
    return "/" + VIRTUAL_PATH_PREFIX.strip("/")


def _thread_file_entry(
    thread_id: str,
    uid: str,
    child: Path,
    *,
    directory_paths_end_with_slash: bool = False,
) -> dict[str, Any]:
    stat = child.stat()
    child_virtual_path = virtual_path_for_thread_file(thread_id, child, uid=uid)
    if directory_paths_end_with_slash and child.is_dir() and not child_virtual_path.endswith("/"):
        child_virtual_path = f"{child_virtual_path}/"
    return {
        "path": child_virtual_path,
        "name": child.name,
        "is_dir": child.is_dir(),
        "size": stat.st_size if child.is_file() else 0,
        "modified_at": utc_isoformat_from_timestamp(stat.st_mtime),
        "artifact_url": None
        if child.is_dir()
        else f"/api/chat/thread/{thread_id}/artifacts/{child_virtual_path.lstrip('/')}",
    }


async def list_thread_files_view(
    *,
    thread_id: str,
    current_uid: str,
    db,
    path: str | None = None,
    recursive: bool = False,
) -> dict:
    conv_repo = ConversationRepository(db)
    conversation = await require_user_conversation(conv_repo, thread_id, str(current_uid))
    uid = str(conversation.uid)

    ensure_thread_dirs(thread_id, uid)
    virtual_path = path or _get_virtual_root()
    try:
        actual_path = resolve_virtual_path(thread_id, virtual_path, uid=uid)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not actual_path.exists():
        return {"path": virtual_path, "files": []}
    if not actual_path.is_dir():
        raise HTTPException(status_code=400, detail="path must be a directory")

    if recursive:
        if virtual_path.rstrip("/") == _get_virtual_root():
            return await asyncio.to_thread(
                _list_user_data_root_entries,
                thread_id,
                uid,
                virtual_path,
                recursive=True,
            )
        return await asyncio.to_thread(_list_files_recursive, thread_id, uid, actual_path, virtual_path)

    if virtual_path.rstrip("/") == _get_virtual_root():
        return await asyncio.to_thread(_list_user_data_root_entries, thread_id, uid, virtual_path)

    entries = await asyncio.to_thread(_list_directory_entries, thread_id, uid, actual_path)

    return {"path": virtual_path, "files": entries}


def _list_directory_entries(thread_id: str, uid: str, actual_path: Path) -> list[dict[str, Any]]:
    return [
        _thread_file_entry(thread_id, uid, child)
        for child in sorted(actual_path.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower()))
    ]


def _list_user_data_root_entries(thread_id: str, uid: str, virtual_path: str, recursive: bool = False) -> dict:
    """List the thread root and inject the user workspace entry if needed."""
    entries: list[dict[str, Any]] = []
    thread_root = sandbox_user_data_dir(thread_id)
    for child in sorted(thread_root.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower())):
        entry = _thread_file_entry(thread_id, uid, child, directory_paths_end_with_slash=True)
        entries.append(entry)
        if recursive and child.is_dir():
            nested = _list_files_recursive(thread_id, uid, child, entry["path"])
            entries.extend(nested["files"])

    workspace_dir = sandbox_workspace_dir(thread_id, uid)
    workspace_virtual_path = virtual_path_for_thread_file(thread_id, workspace_dir, uid=uid)
    if workspace_virtual_path.rstrip("/") not in {str(entry["path"]).rstrip("/") for entry in entries}:
        # workspace lives outside the per-thread root, so expose it as a top-level entry.
        entry = _thread_file_entry(thread_id, uid, workspace_dir, directory_paths_end_with_slash=True)
        entries.append(entry)
        if recursive:
            nested = _list_files_recursive(thread_id, uid, workspace_dir, entry["path"])
            entries.extend(nested["files"])
    saved_artifacts_dir = existing_global_saved_artifacts_dir(uid)
    if saved_artifacts_dir is not None:
        entry = _thread_file_entry(thread_id, uid, saved_artifacts_dir, directory_paths_end_with_slash=True)
        entries.append(entry)
        if recursive:
            nested = _list_files_recursive(thread_id, uid, saved_artifacts_dir, entry["path"])
            entries.extend(nested["files"])
    return {"path": virtual_path, "files": entries}


def _list_files_recursive(thread_id: str, uid: str, actual_path: Path, virtual_path: str) -> dict:
    """Recursively scan a directory while preserving viewer virtual paths."""
    entries: list[dict[str, Any]] = []

    def _scan_dir(base_actual_path: Path):
        try:
            for child in sorted(base_actual_path.iterdir(), key=lambda item: (not item.is_dir(), item.name.lower())):
                entry = _thread_file_entry(thread_id, uid, child)
                entries.append(entry)
                if child.is_dir():
                    _scan_dir(child)
        except PermissionError:
            pass

    _scan_dir(actual_path)
    return {"path": virtual_path, "files": entries}


async def resolve_thread_artifact_view(
    *,
    thread_id: str,
    current_uid: str,
    db,
    path: str,
) -> Path:
    conv_repo = ConversationRepository(db)
    conversation = await require_user_conversation(conv_repo, thread_id, str(current_uid))
    uid = str(conversation.uid)

    ensure_thread_dirs(thread_id, uid)

    normalized = "/" + path.lstrip("/")
    try:
        actual_path = resolve_virtual_path(thread_id, normalized, uid=uid)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not actual_path.exists():
        # 迁移完成前的历史直链仍应可用，但只允许普通文件且必须留在授权目录内。
        legacy_path = resolve_legacy_saved_artifact_fallback(thread_id, uid, actual_path)
        if legacy_path is None:
            raise HTTPException(status_code=404, detail="artifact not found")
        return legacy_path
    if not actual_path.is_file():
        raise HTTPException(status_code=400, detail="artifact path is not a file")

    resolved_path = actual_path.resolve()
    saved_artifacts_root = existing_global_saved_artifacts_dir(uid)
    workspace_root = sandbox_workspace_dir(thread_id, uid).resolve()
    uploads_root = sandbox_uploads_dir(thread_id).resolve()
    outputs_root = sandbox_outputs_dir(thread_id).resolve()
    if not (
        resolved_path.is_relative_to(workspace_root)
        or (saved_artifacts_root is not None and resolved_path.is_relative_to(saved_artifacts_root))
        or resolved_path.is_relative_to(uploads_root)
        or resolved_path.is_relative_to(outputs_root)
    ):
        raise HTTPException(status_code=403, detail="access denied")

    return resolved_path


async def save_thread_artifact_to_workspace_view(
    *,
    thread_id: str,
    current_uid: str,
    db,
    path: str,
) -> dict[str, str]:
    source_path = await resolve_thread_artifact_view(
        thread_id=thread_id,
        current_uid=current_uid,
        db=db,
        path=path,
    )

    conv_repo = ConversationRepository(db)
    conversation = await require_user_conversation(conv_repo, thread_id, str(current_uid))
    uid = str(conversation.uid)
    target_dir = ensure_global_saved_artifacts_dir(uid)

    migrated_paths = await asyncio.to_thread(
        _migrate_legacy_saved_artifacts,
        thread_id,
        uid,
        target_dir,
    )
    if source_path in migrated_paths:
        target_path = migrated_paths[source_path]
    else:
        target_path = _copy_regular_file(target_dir, source_path)

    await invalidate_mention_cache(thread_id)
    await invalidate_workspace_mention_cache(uid)

    saved_virtual_path = virtual_path_for_thread_file(thread_id, target_path, uid=uid)
    return {
        "name": target_path.name,
        "source_path": "/" + path.lstrip("/"),
        "saved_path": saved_virtual_path,
        "saved_artifact_url": f"/api/chat/thread/{thread_id}/artifacts/{saved_virtual_path.lstrip('/')}",
    }


async def migrate_legacy_saved_artifacts_for_user(*, uid: str, thread_ids: list[str]) -> bool:
    """打开全局保存产物目录时，合并当前用户各会话中的历史产物。"""
    target_dir = ensure_global_saved_artifacts_dir(uid)
    has_migrated = False

    def _migrate_all() -> None:
        nonlocal has_migrated
        for thread_id in thread_ids:
            try:
                validate_thread_id(thread_id)
            except ValueError:
                continue
            if _migrate_legacy_saved_artifacts(thread_id, uid, target_dir):
                has_migrated = True

    await asyncio.to_thread(_migrate_all)
    if has_migrated:
        await invalidate_workspace_mention_cache(uid)
    return has_migrated


def _migrate_legacy_saved_artifacts(
    thread_id: str,
    uid: str,
    target_dir: Path,
) -> dict[Path, Path]:
    """把历史版本保存到会话目录的产物迁移到用户级共享目录。"""
    legacy_dir = sandbox_workspace_dir(thread_id, uid) / SAVED_ARTIFACTS_DIR_NAME
    if not legacy_dir.exists() or legacy_dir.is_symlink():
        return {}

    migrated_paths: dict[Path, Path] = {}
    for child in sorted(legacy_dir.iterdir(), key=lambda item: item.name.lower()):
        _migrate_saved_tree(child, target_dir, migrated_paths)
    with contextlib.suppress(FileNotFoundError):
        legacy_dir.rmdir()
    return migrated_paths


def _migrate_saved_tree(source_path: Path, target_dir: Path, migrated_paths: dict[Path, Path]) -> dict[Path, Path]:
    """递归迁移普通文件；任何符号链接都不进入用户级共享目录。"""
    if source_path.is_symlink():
        return migrated_paths
    if source_path.is_file():
        destination = _copy_regular_file(target_dir, source_path)
        source_path.unlink()
        migrated_paths[source_path.resolve()] = destination.resolve()
        return migrated_paths
    if not source_path.is_dir():
        return migrated_paths

    destination_dir = _next_available_artifact_path(target_dir, source_path.name)
    destination_dir.mkdir()
    for child in sorted(source_path.iterdir(), key=lambda item: item.name.lower()):
        _migrate_saved_tree(child, destination_dir, migrated_paths)
    if not any(source_path.iterdir()):
        source_path.rmdir()
    return migrated_paths


def _copy_regular_file(target_dir: Path, source_path: Path) -> Path:
    """以排他创建方式复制普通文件，避免并发保存覆盖同名产物。"""
    if not source_path.is_file():
        raise ValueError(f"cannot save non-regular artifact: {source_path}")

    base_name = source_path.stem
    suffix = source_path.suffix
    candidate = target_dir / source_path.name
    for index in range(1000):
        try:
            descriptor = os.open(candidate, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o666)
        except FileExistsError:
            candidate = target_dir / f"{base_name} ({index + 1}){suffix}"
            continue
        except FileNotFoundError as exc:
            raise FileNotFoundError(f"artifact target directory does not exist: {target_dir}") from exc

        with os.fdopen(descriptor, "wb") as dst, source_path.open("rb") as src:
            try:
                shutil.copyfileobj(src, dst)
            except BaseException:
                candidate.unlink(missing_ok=True)
                raise
        return candidate
    raise RuntimeError(f"Unable to find available filename for {source_path.name} after 1000 attempts.")


def _next_available_artifact_path(target_dir: Path, filename: str) -> Path:
    candidate = target_dir / filename
    if not candidate.exists():
        return candidate

    base_name = Path(filename).stem
    suffix = Path(filename).suffix
    index = 1
    while True:
        candidate = target_dir / f"{base_name} ({index}){suffix}"
        if not candidate.exists():
            return candidate

        index += 1
        if index >= 1000:
            # This is a safety check to prevent infinite loops in case of some unexpected issue with file naming.
            raise RuntimeError(f"Unable to find available filename for {filename} after 1000 attempts.")
