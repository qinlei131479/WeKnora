from __future__ import annotations

from types import SimpleNamespace

import pytest

from fastapi import HTTPException

from yuxi.agents.middlewares.attachment import _select_active_uploads
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


def test_build_state_uploads_prefers_request_snapshot():
    attachments = [
        {
            "file_id": "current",
            "request_id": "request-current",
            "path": "/uploads/attachments/changed.md",
            "request_snapshot": {
                "file_id": "current",
                "request_id": "request-current",
                "thread_id": "thread-1",
                "path": "/uploads/attachments/snapshot.md",
                "original_path": "/uploads/attachments/original.md",
                "table_index_path": "/uploads/attachments/table.json",
                "parse_status": "parsed",
            },
        }
    ]

    uploads = svc._build_state_uploads(attachments)

    assert uploads[0]["path"] == "/uploads/attachments/snapshot.md"
    assert uploads[0]["request_id"] == "request-current"
    assert uploads[0]["original_path"] == "/uploads/attachments/original.md"
    assert uploads[0]["table_index_path"] == "/uploads/attachments/table.json"


def test_attachment_snapshot_preserves_request_identity():
    snapshot = svc.ConversationRepository._build_attachment_snapshot(
        {
            "file_id": "file-1",
            "request_id": "request-1",
            "path": "/uploads/file.md",
        }
    )

    assert snapshot["request_id"] == "request-1"


def test_runtime_attachment_paths_collect_one_authorization_group():
    paths = chat_svc._runtime_attachment_paths(
        [
            {
                "path": "/uploads/a.md",
                "original_path": "/uploads/a.docx",
                "table_index_path": "/uploads/a.index.json",
            },
            {
                "path": "/uploads/b.md",
                "original_path": "/uploads/a.md",
            },
        ]
    )

    assert paths == [
        "/uploads/a.md",
        "/uploads/a.docx",
        "/uploads/a.index.json",
        "/uploads/b.md",
    ]


def test_select_active_uploads_accepts_only_snapshot_request_and_paths():
    upload = {
        "file_id": "file-1",
        "thread_id": "thread-1",
        "request_id": "parent-request",
        "path": "/home/gem/user-data/uploads/file.md",
    }
    stale = {**upload, "file_id": "file-2", "request_id": "old-request", "path": "/uploads/stale.md"}
    unauthorized = {**upload, "file_id": "file-3", "path": "/uploads/other.md"}

    active, rejected = _select_active_uploads(
        uploads=[upload, stale, unauthorized],
        thread_id="thread-1",
        request_id="resume-request",
        active_request_id="parent-request",
        authorized_paths=frozenset({"/home/gem/user-data/uploads/file.md"}),
    )

    assert [item["file_id"] for item in active] == ["file-1"]
    assert {item[0] for item in rejected} == {"file-2", "file-3"}


@pytest.mark.asyncio
async def test_resume_attachment_authorization_inherits_parent_request():
    class FakeConversationRepository:
        async def get_conversation_by_thread_id(self, thread_id):
            assert thread_id == "thread-1"
            return SimpleNamespace(id=9)

        async def get_attachments_by_request_id(self, conversation_id, request_id):
            assert conversation_id == 9
            assert request_id == "parent-request"
            return [
                {
                    "request_id": "parent-request",
                    "request_snapshot": {
                        "file_id": "file-1",
                        "thread_id": "thread-1",
                        "path": "/uploads/file.md",
                        "original_path": "/uploads/file.docx",
                    },
                }
            ]

    class FakeRunRepository:
        async def get_run_for_user(self, run_id, uid):
            assert run_id == "parent-run"
            assert uid == "user-1"
            return SimpleNamespace(conversation_id=9, request_id="parent-request")

    active_request_id, attachments = await chat_svc._resume_attachment_authorization(
        conv_repo=FakeConversationRepository(),
        run_repo=FakeRunRepository(),
        thread_id="thread-1",
        created_by_run_id="parent-run",
        uid="user-1",
    )

    assert active_request_id == "parent-request"
    assert attachments[0]["file_id"] == "file-1"


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


def test_get_attachment_max_size_reads_environment(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AGENT_ATTACHMENT_MAX_SIZE_MB", "10")
    assert svc._get_attachment_max_size_bytes() == 10 * 1024 * 1024


def test_get_attachment_max_size_falls_back_for_invalid_environment(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("AGENT_ATTACHMENT_MAX_SIZE_MB", "0")
    assert svc._get_attachment_max_size_bytes() == 10 * 1024 * 1024


def test_extract_csv_index_keeps_headers_and_row_numbers():
    index = svc._extract_csv_index("需求.csv", "功能,角色\n登录,用户\n".encode("utf-8"))

    sheet = index["sheets"][0]
    assert sheet["headers"] == ["功能", "角色"]
    assert sheet["sample_rows"] == [{"row": 2, "cells": ["登录", "用户"]}]


def test_extract_csv_index_uses_first_row_as_header_for_single_column():
    """单列 CSV 没有多列表头行，必须固定取首行，否则表头会错位到数据行。"""
    index = svc._extract_csv_index("清单.csv", "功能清单\n登录\n".encode("utf-8"))

    sheet = index["sheets"][0]
    assert sheet["header_row"] == 1
    assert sheet["headers"] == ["功能清单"]
    assert sheet["row_count"] == 1


def test_extract_csv_index_allows_empty_file():
    index = svc._extract_csv_index("空.csv", b"")

    sheet = index["sheets"][0]
    assert sheet["headers"] == []
    assert sheet["row_count"] == 0
    assert svc._build_table_markdown(index)


def test_extract_csv_index_rejects_oversized_table():
    rows = ["功能,角色"] + ["登录,用户"] * (svc.TMP_ATTACHMENT_TABLE_MAX_ROWS + 1)

    with pytest.raises(ValueError, match="行数"):
        svc._extract_csv_index("大表.csv", "\n".join(rows).encode("utf-8"))
