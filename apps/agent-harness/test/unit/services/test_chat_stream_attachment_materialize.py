from __future__ import annotations

from pathlib import Path

from yuxi.services import conversation_service as cs


def test_build_attachment_storage_path_uses_thread_local_uploads_dir(tmp_path: Path, monkeypatch) -> None:
    monkeypatch.setattr(cs.app_config, "save_dir", str(tmp_path))

    virtual_path, host_path = cs._build_attachment_storage_path(
        uid="u-1",
        thread_id="t-1",
        file_name="demo.txt",
    )

    assert virtual_path == "/home/gem/user-data/uploads/attachments/demo.md"
    assert host_path == tmp_path / "threads" / "t-1" / "user-data" / "uploads" / "attachments" / "demo.md"


def test_serialize_attachment_includes_original_file_fields() -> None:
    serialized = cs.serialize_attachment(
        {
            "file_id": "f-1",
            "file_name": "demo.txt",
            "file_type": "text/plain",
            "file_size": 5,
            "status": "parsed",
            "uploaded_at": "2026-03-25T00:00:00+00:00",
            "path": "/home/gem/user-data/uploads/attachments/demo.md",
            "artifact_url": "/api/chat/thread/t-1/artifacts/home/gem/user-data/uploads/attachments/demo.md",
            "original_path": "/home/gem/user-data/uploads/demo.txt",
            "original_artifact_url": "/api/chat/thread/t-1/artifacts/home/gem/user-data/uploads/demo.txt",
            "minio_url": None,
        }
    )

    assert serialized["path"] == "/home/gem/user-data/uploads/attachments/demo.md"
    assert serialized["original_path"] == "/home/gem/user-data/uploads/demo.txt"
    assert serialized["original_artifact_url"] == "/api/chat/thread/t-1/artifacts/home/gem/user-data/uploads/demo.txt"
