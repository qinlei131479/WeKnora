from __future__ import annotations

import os
import tempfile
from dataclasses import dataclass
from pathlib import Path
from types import SimpleNamespace

import pytest

os.environ.setdefault("OPENAI_API_KEY", "test-key")
os.environ.setdefault(
    "SAVE_DIR", os.path.join(os.environ.get("CLAUDE_JOB_DIR", tempfile.gettempdir()), "yuxi-test-saves")
)

from yuxi.services import conversation_service as service

pytestmark = pytest.mark.unit


class FakeUpload:
    def __init__(self, filename: str, content: bytes, content_type: str | None = None):
        self.filename = filename
        self.content_type = content_type
        self._content = content
        self._offset = 0

    async def seek(self, offset: int) -> None:
        self._offset = offset

    async def read(self, size: int = -1) -> bytes:
        if self._offset >= len(self._content):
            return b""
        end = len(self._content) if size < 0 else min(len(self._content), self._offset + size)
        chunk = self._content[self._offset : end]
        self._offset = end
        return chunk


class FakeMinioClient:
    KB_BUCKETS = {"documents": "knowledgebases"}

    def __init__(self):
        self.objects: dict[tuple[str, str], bytes] = {}
        self.uploads: list[dict] = []
        self.deleted_prefixes: list[tuple[str, str]] = []

    async def aupload_file(self, bucket_name: str, object_name: str, data: bytes, content_type: str | None = None):
        self.objects[(bucket_name, object_name)] = data
        self.uploads.append(
            {
                "bucket_name": bucket_name,
                "object_name": object_name,
                "data": data,
                "content_type": content_type,
            }
        )
        return SimpleNamespace(
            bucket_name=bucket_name,
            object_name=object_name,
            url=f"http://minio:9000/{bucket_name}/{object_name}",
        )

    async def adownload_file(self, bucket_name: str, object_name: str) -> bytes:
        try:
            return self.objects[(bucket_name, object_name)]
        except KeyError as exc:
            raise service.StorageError("missing object") from exc

    async def adelete_objects_by_prefix(self, bucket_name: str, prefix: str) -> int:
        self.deleted_prefixes.append((bucket_name, prefix))
        removed = [key for key in self.objects if key[0] == bucket_name and key[1].startswith(prefix)]
        for key in removed:
            self.objects.pop(key, None)
        return len(removed)


@dataclass
class FakeConversation:
    id: int = 1
    uid: str = "user-1"
    agent_id: str = "agent-1"
    status: str = "active"
    extra_metadata: dict | None = None


class FakeConversationRepository:
    def __init__(self, db):
        self.conversation = FakeConversation()
        self.attachments: list[dict] = []

    async def get_conversation_by_thread_id(self, thread_id: str):
        return self.conversation

    async def add_attachments(self, conversation_id: int, attachment_infos: list[dict]):
        self.attachments.extend(attachment_infos)
        return attachment_infos

    async def get_attachments(self, conversation_id: int):
        return list(self.attachments)

    async def remove_attachment(self, conversation_id: int, file_id: str) -> bool:
        remaining = [item for item in self.attachments if item.get("file_id") != file_id]
        removed = len(remaining) != len(self.attachments)
        self.attachments = remaining
        return removed


@pytest.mark.asyncio
async def test_upload_tmp_attachment_writes_user_scoped_minio_object(monkeypatch):
    fake_minio = FakeMinioClient()
    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)

    response = await service.upload_tmp_attachment_view(
        file=FakeUpload("demo.pdf", b"pdf-bytes", "application/pdf"),
        current_uid="user-1",
    )

    assert response["bucket_name"] == "knowledgebases"
    assert response["object_name"].startswith("tmp/chat_attachments/user-1/")
    assert response["parse_methods"][0] == "weknora"
    assert fake_minio.objects[("knowledgebases", response["object_name"])] == b"pdf-bytes"


@pytest.mark.asyncio
async def test_parse_tmp_attachment_uses_selected_method_and_uploads_markdown(monkeypatch):
    fake_minio = FakeMinioClient()
    object_name = "tmp/chat_attachments/user-1/tmp-1/original/demo.pdf"
    fake_minio.objects[("knowledgebases", object_name)] = b"pdf-bytes"
    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)

    parse_calls = []

    async def fake_parse(source: str, params: dict | None = None) -> str:
        parse_calls.append({"source": source, "params": params})
        return "# parsed"

    monkeypatch.setattr(service, "parse_document", fake_parse)

    response = await service.parse_tmp_attachment_view(
        object_name=object_name,
        file_name="demo.pdf",
        parse_method="weknora",
        bucket_name="knowledgebases",
        current_uid="user-1",
    )

    assert parse_calls == [
        {
            "source": f"minio://knowledgebases/{object_name}",
            "params": None,
        }
    ]
    assert response["parsed_object_name"] == "tmp/chat_attachments/user-1/tmp-1/parsed/demo.md"
    assert fake_minio.objects[("knowledgebases", response["parsed_object_name"])] == b"# parsed"


@pytest.mark.asyncio
async def test_parse_tmp_attachment_accepts_legacy_bucket_after_bucket_split(monkeypatch):
    fake_minio = FakeMinioClient()
    fake_minio.KB_BUCKETS = {"documents": "agent-harness"}
    object_name = "tmp/chat_attachments/user-1/tmp-1/original/demo.pdf"
    fake_minio.objects[("knowledgebases", object_name)] = b"pdf-bytes"
    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)

    async def fake_parse(source: str, params: dict | None = None) -> str:
        assert source == f"minio://knowledgebases/{object_name}"
        return "# parsed"

    monkeypatch.setattr(service, "parse_document", fake_parse)

    response = await service.parse_tmp_attachment_view(
        object_name=object_name,
        file_name="demo.pdf",
        parse_method="weknora",
        bucket_name="knowledgebases",
        current_uid="user-1",
    )

    assert response["bucket_name"] == "knowledgebases"
    assert fake_minio.objects[("knowledgebases", response["parsed_object_name"])] == b"# parsed"


@pytest.mark.asyncio
async def test_confirm_tmp_thread_attachments_materializes_original_and_parsed_files(monkeypatch, tmp_path: Path):
    fake_minio = FakeMinioClient()
    original_object = "tmp/chat_attachments/user-1/tmp-1/original/demo.pdf"
    parsed_object = "tmp/chat_attachments/user-1/tmp-1/parsed/demo.md"
    fake_minio.objects[("knowledgebases", original_object)] = b"pdf-bytes"
    fake_minio.objects[("knowledgebases", parsed_object)] = b"# parsed"
    fake_repo = FakeConversationRepository(db=None)

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)
    monkeypatch.setattr(service.app_config, "save_dir", str(tmp_path))

    def fake_uploads_dir(thread_id: str) -> Path:
        path = tmp_path / "threads" / thread_id / "user-data" / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    monkeypatch.setattr(service, "ensure_thread_dirs", lambda thread_id, user_id: fake_uploads_dir(thread_id))
    monkeypatch.setattr(service, "sandbox_uploads_dir", fake_uploads_dir)

    async def noop_invalidate(thread_id: str):
        return None

    monkeypatch.setattr(service, "invalidate_mention_cache", noop_invalidate)

    response = await service.confirm_tmp_thread_attachments_view(
        thread_id="thread-1",
        attachments=[
            {
                "file_name": "demo.pdf",
                "file_type": "application/pdf",
                "bucket_name": "knowledgebases",
                "object_name": original_object,
                "parsed_object_name": parsed_object,
                "truncated": False,
            }
        ],
        db=None,
        current_uid="user-1",
    )

    [attachment] = response["attachments"]
    assert attachment["status"] == "parsed"
    original_name = Path(attachment["original_path"]).name
    markdown_name = Path(attachment["path"]).name
    assert original_name.endswith("_demo.pdf")
    assert markdown_name.endswith("_demo.md")
    assert (tmp_path / "threads" / "thread-1" / "user-data" / "uploads" / original_name).read_bytes() == b"pdf-bytes"
    assert (tmp_path / "threads" / "thread-1" / "user-data" / "uploads" / "attachments" / markdown_name).read_text(
        encoding="utf-8"
    ) == "# parsed"
    assert Path(fake_repo.attachments[0]["original_path"]).name == original_name
    # 确认成功后 tmp 侧对象必须清掉，否则会无限堆积。
    assert fake_minio.deleted_prefixes == [("knowledgebases", "tmp/chat_attachments/user-1/tmp-1")]
    assert fake_minio.objects == {}


@pytest.mark.asyncio
async def test_confirm_tmp_thread_attachments_materializes_excel_table_index(monkeypatch, tmp_path: Path):
    fake_minio = FakeMinioClient()
    original_object = "tmp/chat_attachments/user-1/tmp-1/original/hotel.xlsx"
    parsed_object = "tmp/chat_attachments/user-1/tmp-1/parsed/hotel.md"
    index_object = "tmp/chat_attachments/user-1/tmp-1/parsed/hotel.index.json"
    fake_minio.objects[("knowledgebases", original_object)] = b"xlsx-bytes"
    fake_minio.objects[("knowledgebases", parsed_object)] = b"| item | price |"
    fake_minio.objects[("knowledgebases", index_object)] = b'{"sheets": []}'
    fake_repo = FakeConversationRepository(db=None)

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)
    monkeypatch.setattr(service.app_config, "save_dir", str(tmp_path))

    def fake_uploads_dir(thread_id: str) -> Path:
        path = tmp_path / "threads" / thread_id / "user-data" / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    monkeypatch.setattr(service, "ensure_thread_dirs", lambda thread_id, uid: fake_uploads_dir(thread_id))
    monkeypatch.setattr(service, "sandbox_uploads_dir", fake_uploads_dir)

    async def noop_invalidate(thread_id: str):
        return None

    monkeypatch.setattr(service, "invalidate_mention_cache", noop_invalidate)

    response = await service.confirm_tmp_thread_attachments_view(
        thread_id="thread-1",
        attachments=[
            {
                "file_name": "hotel.xlsx",
                "file_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "bucket_name": "knowledgebases",
                "object_name": original_object,
                "parsed_object_name": parsed_object,
                "table_index_object_name": index_object,
            }
        ],
        db=None,
        current_uid="user-1",
    )

    [attachment] = response["attachments"]
    assert attachment["status"] == "parsed"
    assert attachment["table_index_path"].endswith("hotel.index.json")
    assert Path(fake_repo.attachments[0]["table_index_storage_path"]).read_text(encoding="utf-8") == '{"sheets": []}'
    assert fake_minio.deleted_prefixes == [("knowledgebases", "tmp/chat_attachments/user-1/tmp-1")]
    assert fake_minio.objects == {}


@pytest.mark.asyncio
async def test_delete_thread_attachment_cleans_tmp_objects(monkeypatch):
    fake_minio = FakeMinioClient()
    tmp_object = "tmp/chat_attachments/user-1/tmp-1/original/demo.pdf"
    fake_minio.objects[("knowledgebases", tmp_object)] = b"pdf-bytes"
    fake_repo = FakeConversationRepository(db=None)
    fake_repo.attachments = [
        {
            "file_id": "file-1",
            "file_name": "demo.pdf",
            "path": "/home/gem/user-data/uploads/attachments/demo.md",
            "source_bucket_name": "knowledgebases",
            "source_object_name": tmp_object,
        }
    ]

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)

    async def noop_invalidate(thread_id: str):
        return None

    monkeypatch.setattr(service, "invalidate_mention_cache", noop_invalidate)

    response = await service.delete_thread_attachment_view(
        thread_id="thread-1",
        file_id="file-1",
        db=None,
        current_uid="user-1",
    )

    assert response["message"] == "附件已删除"
    # 删除附件同样要回收 tmp 对象；这里曾因元组解包数量不匹配被异常吞掉。
    assert fake_minio.deleted_prefixes == [("knowledgebases", "tmp/chat_attachments/user-1/tmp-1")]
    assert fake_minio.objects == {}


@pytest.mark.asyncio
async def test_parse_tmp_attachment_uses_object_name_for_type_validation(monkeypatch):
    fake_minio = FakeMinioClient()
    object_name = "tmp/chat_attachments/user-1/tmp-1/original/demo.exe"
    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)

    with pytest.raises(service.HTTPException) as exc_info:
        await service.parse_tmp_attachment_view(
            object_name=object_name,
            file_name="demo.pdf",
            parse_method="weknora",
            bucket_name="knowledgebases",
            current_uid="user-1",
        )

    assert exc_info.value.status_code == 400
    assert "当前附件类型不支持解析" in exc_info.value.detail


@pytest.mark.asyncio
async def test_parse_tmp_attachment_handles_url_metacharacters(monkeypatch):
    fake_minio = FakeMinioClient()
    object_name = "tmp/chat_attachments/user-1/tmp-1/original/q1?.pdf"
    fake_minio.objects[("knowledgebases", object_name)] = b"pdf-bytes"
    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)

    parse_calls = []

    async def fake_parse(source: str, params: dict | None = None) -> str:
        parse_calls.append(source)
        return "# parsed"

    monkeypatch.setattr(service, "parse_document", fake_parse)

    response = await service.parse_tmp_attachment_view(
        object_name=object_name,
        file_name="ignored.pdf",
        parse_method="weknora",
        bucket_name="knowledgebases",
        current_uid="user-1",
    )

    assert parse_calls == ["minio://knowledgebases/tmp/chat_attachments/user-1/tmp-1/original/q1%3F.pdf"]
    assert response["parsed_object_name"] == "tmp/chat_attachments/user-1/tmp-1/parsed/q1?.md"


@pytest.mark.asyncio
async def test_confirm_tmp_thread_attachments_rejects_non_parsed_object(monkeypatch):
    fake_minio = FakeMinioClient()
    original_object = "tmp/chat_attachments/user-1/tmp-1/original/demo.pdf"
    fake_minio.objects[("knowledgebases", original_object)] = b"pdf-bytes"
    fake_repo = FakeConversationRepository(db=None)

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)

    with pytest.raises(service.HTTPException) as exc_info:
        await service.confirm_tmp_thread_attachments_view(
            thread_id="thread-1",
            attachments=[
                {
                    "file_name": "demo.pdf",
                    "file_type": "application/pdf",
                    "bucket_name": "knowledgebases",
                    "object_name": original_object,
                    "parsed_object_name": original_object,
                }
            ],
            db=None,
            current_uid="user-1",
        )

    assert exc_info.value.status_code == 400
    assert fake_repo.attachments == []


@pytest.mark.asyncio
async def test_confirm_tmp_thread_attachments_validates_batch_before_commit(monkeypatch):
    fake_minio = FakeMinioClient()
    valid_object = "tmp/chat_attachments/user-1/tmp-1/original/valid.pdf"
    missing_object = "tmp/chat_attachments/user-1/tmp-2/original/missing.pdf"
    fake_minio.objects[("knowledgebases", valid_object)] = b"pdf-bytes"
    fake_repo = FakeConversationRepository(db=None)

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)

    with pytest.raises(service.HTTPException) as exc_info:
        await service.confirm_tmp_thread_attachments_view(
            thread_id="thread-1",
            attachments=[
                {"file_name": "valid.pdf", "bucket_name": "knowledgebases", "object_name": valid_object},
                {"file_name": "missing.pdf", "bucket_name": "knowledgebases", "object_name": missing_object},
            ],
            db=None,
            current_uid="user-1",
        )

    assert exc_info.value.status_code == 400
    assert fake_repo.attachments == []


@pytest.mark.asyncio
async def test_confirm_tmp_thread_attachments_keeps_duplicate_names_separate(monkeypatch, tmp_path: Path):
    fake_minio = FakeMinioClient()
    first_object = "tmp/chat_attachments/user-1/tmp-1/original/report.pdf"
    second_object = "tmp/chat_attachments/user-1/tmp-2/original/report.pdf"
    fake_minio.objects[("knowledgebases", first_object)] = b"first"
    fake_minio.objects[("knowledgebases", second_object)] = b"second"
    fake_repo = FakeConversationRepository(db=None)

    monkeypatch.setattr(service, "get_minio_client", lambda: fake_minio)
    monkeypatch.setattr(service, "ConversationRepository", lambda db: fake_repo)
    monkeypatch.setattr(service.app_config, "save_dir", str(tmp_path))

    def fake_uploads_dir(thread_id: str) -> Path:
        path = tmp_path / "threads" / thread_id / "user-data" / "uploads"
        path.mkdir(parents=True, exist_ok=True)
        return path

    monkeypatch.setattr(service, "ensure_thread_dirs", lambda thread_id, uid: fake_uploads_dir(thread_id))
    monkeypatch.setattr(service, "sandbox_uploads_dir", fake_uploads_dir)

    async def noop_invalidate(thread_id: str):
        return None

    monkeypatch.setattr(service, "invalidate_mention_cache", noop_invalidate)

    response = await service.confirm_tmp_thread_attachments_view(
        thread_id="thread-1",
        attachments=[
            {"file_name": "report.pdf", "bucket_name": "knowledgebases", "object_name": first_object},
            {"file_name": "report.pdf", "bucket_name": "knowledgebases", "object_name": second_object},
        ],
        db=None,
        current_uid="user-1",
    )

    first, second = response["attachments"]
    assert first["original_path"] != second["original_path"]
    assert (
        tmp_path / "threads" / "thread-1" / "user-data" / "uploads" / Path(first["original_path"]).name
    ).read_bytes() == b"first"
    assert (
        tmp_path / "threads" / "thread-1" / "user-data" / "uploads" / Path(second["original_path"]).name
    ).read_bytes() == b"second"
