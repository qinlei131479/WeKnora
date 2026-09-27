from __future__ import annotations

from types import SimpleNamespace

import pytest

from fastapi import HTTPException

from yuxi.services import chat_service as chat_svc
from yuxi.services import conversation_service as svc


def test_tmp_attachment_ocr_methods_are_weknora_only():
    assert svc.TMP_ATTACHMENT_OCR_METHODS == ("weknora",)
    assert svc.TMP_ATTACHMENT_PARSE_METHODS == ("weknora",)


def test_build_state_files_only_parsed_and_with_content():
    attachments = [
        {
            "status": "parsed",
            "file_path": "/attachments/a.md",
            "markdown": "line1\nline2",
            "uploaded_at": "2026-02-20T00:00:00+00:00",
        },
        {
            "status": "pending",
            "file_path": "/attachments/b.md",
            "markdown": "ignored",
        },
        {
            "status": "parsed",
            "file_path": "/attachments/c.md",
            "markdown": "",
        },
    ]

    files = chat_svc._build_state_files(attachments)

    assert list(files.keys()) == ["/attachments/a.md"]
    assert files["/attachments/a.md"]["content"] == ["line1", "line2"]
    assert files["/attachments/a.md"]["created_at"] == "2026-02-20T00:00:00+00:00"


@pytest.mark.asyncio
async def test_sync_thread_attachment_state_updates_graph(monkeypatch: pytest.MonkeyPatch):
    captured: dict = {}

    class FakeGraph:
        async def aupdate_state(self, *, config, values):
            captured["write_config"] = config
            captured["write_values"] = values

    class FakeAgent:
        async def get_graph(self):
            return FakeGraph()

    monkeypatch.setattr(svc.agent_manager, "get_agent", lambda _agent_id: FakeAgent())

    attachments = [
        {
            "status": "parsed",
            "path": "/home/gem/user-data/uploads/attachments/resume.md",
            "file_name": "resume.md",
            "uploaded_at": "2026-02-20T00:00:00+00:00",
        }
    ]
    await svc._sync_thread_upload_state(
        thread_id="thread-1",
        uid="u1",
        agent_id="ChatbotAgent",
        backend_id=None,
        attachments=attachments,
    )

    assert captured["write_config"] == {"configurable": {"thread_id": "thread-1", "uid": "u1"}}
    assert captured["write_values"] == {"uploads": svc._build_state_uploads(attachments)}


@pytest.mark.asyncio
async def test_sync_thread_attachment_state_skips_when_agent_missing(monkeypatch: pytest.MonkeyPatch):
    warnings: list[str] = []
    fake_logger = SimpleNamespace(
        warning=lambda message: warnings.append(message),
    )

    monkeypatch.setattr(svc, "logger", fake_logger)
    monkeypatch.setattr(svc.agent_manager, "get_agent", lambda _agent_id: None)

    await svc._sync_thread_upload_state(
        thread_id="thread-1",
        uid="u1",
        agent_id="MissingAgent",
        backend_id=None,
        attachments=[],
    )

    assert any("agent not found" in msg for msg in warnings)


def test_normalize_parse_method_defaults_to_weknora():
    method = svc._normalize_parse_method("scan.png", parse_method=None)
    assert method == "weknora"


def test_normalize_parse_method_pdf_defaults_to_weknora():
    method = svc._normalize_parse_method("doc.pdf", parse_method=None)
    assert method == "weknora"


def test_normalize_parse_method_respects_explicit_weknora():
    method = svc._normalize_parse_method("scan.png", parse_method="weknora")
    assert method == "weknora"


def test_normalize_parse_method_rejects_native_engines():
    with pytest.raises(HTTPException, match="不支持的解析方法"):
        svc._normalize_parse_method("scan.png", parse_method="rapid_ocr")
