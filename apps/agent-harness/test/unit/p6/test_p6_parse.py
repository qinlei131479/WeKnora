from __future__ import annotations

import pytest

from yuxi.services.ocr_service import get_ocr_options, parse_document


def test_ocr_options_hide_engines_when_weknora(monkeypatch):
    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    options = get_ocr_options()
    assert options["weknora_managed"] is True
    assert options["engines"] == []
    assert options["default_engine"] == "weknora"


@pytest.mark.asyncio
async def test_parse_document_posts_to_weknora(tmp_path, monkeypatch):
    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    monkeypatch.setenv("WEKNORA_BASE_URL", "http://weknora.example/api/v1")
    file_path = tmp_path / "note.txt"
    file_path.write_text("hello", encoding="utf-8")
    captured = {}

    async def fake_parse(filename: str, content: bytes) -> str:
        captured["filename"] = filename
        captured["content"] = content
        return "# parsed"

    monkeypatch.setattr("yuxi.models.weknora_proxy.parse_file_via_weknora", fake_parse)

    markdown = await parse_document(str(file_path), params={"ocr_engine": "rapid_ocr"})
    assert markdown == "# parsed"
    assert captured["filename"] == "note.txt"
    assert captured["content"] == b"hello"
