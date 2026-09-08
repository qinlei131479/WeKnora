from __future__ import annotations

from yuxi.weknora.kb_fulltext import (
    CHUNKS_PAGE_SIZE_MAX,
    capability_for_kb_type,
    flatten_pages,
    paginate_chunks,
    reconstruct_document_text,
)


def test_reconstruct_document_with_overlap_and_pages():
    text = "ABCDEFGHIJ" * 15
    chunks = []
    cursor = 0
    window = 20
    step = 15
    index = 0
    while cursor < len(text):
        end = min(len(text), cursor + window)
        chunks.append(
            {
                "id": f"c{index}",
                "chunk_index": index,
                "start_at": cursor,
                "end_at": end,
                "content": text[cursor:end],
            }
        )
        cursor += step
        index += 1

    pages = paginate_chunks(chunks, page_size=CHUNKS_PAGE_SIZE_MAX)
    assert all(len(page) <= CHUNKS_PAGE_SIZE_MAX for page in pages)
    result = reconstruct_document_text(flatten_pages(pages))
    assert result["reconstructable"] is True
    assert result["used_offsets"] is True
    assert result["overlap_count"] >= 1
    assert result["text"] == text
    assert len(chunks) > 1


def test_paginate_chunks_caps_page_size_and_covers_over_100():
    chunks = [{"id": str(i), "chunk_index": i, "content": f"c{i}"} for i in range(105)]
    pages = paginate_chunks(chunks, page_size=1000)
    assert len(pages) == 2
    assert len(pages[0]) == CHUNKS_PAGE_SIZE_MAX
    assert len(pages[1]) == 5
    assert reconstruct_document_text(flatten_pages(pages))["chunk_count"] == 105


def test_reconstruct_falls_back_when_offsets_are_zero():
    chunks = [
        {"id": "b", "chunk_index": 1, "start_at": 0, "end_at": 0, "content": "world"},
        {"id": "a", "chunk_index": 0, "start_at": 0, "end_at": 0, "content": "hello"},
    ]
    result = reconstruct_document_text(chunks)
    assert result["used_offsets"] is False
    assert result["text"] == "hello\nworld"


def test_kb_type_capabilities_differ():
    assert capability_for_kb_type("faq")["open_find"] == "entry"
    assert capability_for_kb_type("wiki")["open_find"] == "page"
    assert capability_for_kb_type("document")["open_find"] == "document"
