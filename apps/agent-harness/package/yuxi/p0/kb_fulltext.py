"""用 WeKnora chunks 重建文档正文。只处理内存数据，不写库。"""

from __future__ import annotations

from typing import Any

CHUNKS_PAGE_SIZE_MAX = 100


def _int(value: Any, default: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


def sort_chunks(chunks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return sorted(
        chunks,
        key=lambda item: (
            _int(item.get("chunk_index"), 10**9),
            _int(item.get("start_at"), 10**9),
            str(item.get("id") or ""),
        ),
    )


def reconstruct_document_text(chunks: list[dict[str, Any]]) -> dict[str, Any]:
    """按 chunk_index / start_at 重建 document 正文。

    有 start_at/end_at 时按字符区间拼接并处理重叠；否则按顺序拼接。
    """
    ordered = [item for item in sort_chunks(chunks) if str(item.get("content") or "")]
    if not ordered:
        return {
            "text": "",
            "chunk_count": 0,
            "used_offsets": False,
            "overlap_count": 0,
            "gap_count": 0,
            "reconstructable": False,
        }

    has_offsets = _has_usable_offsets(ordered)
    if not has_offsets:
        text = "\n".join(str(item.get("content") or "") for item in ordered)
        return {
            "text": text,
            "chunk_count": len(ordered),
            "used_offsets": False,
            "overlap_count": 0,
            "gap_count": 0,
            "reconstructable": True,
        }

    pieces: list[str] = []
    cursor = 0
    overlap_count = 0
    gap_count = 0
    for item in ordered:
        start = max(0, _int(item.get("start_at")))
        end = max(start, _int(item.get("end_at")))
        content = str(item.get("content") or "")
        if start < cursor:
            overlap_count += 1
            content = content[cursor - start :]
            start = cursor
        elif start > cursor:
            gap_count += 1
            pieces.append("\n")
        pieces.append(content)
        cursor = max(cursor, end if end else start + len(content))

    return {
        "text": "".join(pieces),
        "chunk_count": len(ordered),
        "used_offsets": True,
        "overlap_count": overlap_count,
        "gap_count": gap_count,
        "reconstructable": True,
    }


def _has_usable_offsets(chunks: list[dict[str, Any]]) -> bool:
    if not all(
        item.get("start_at") is not None and item.get("end_at") is not None for item in chunks
    ):
        return False
    return any(_int(item.get("end_at")) > _int(item.get("start_at")) for item in chunks)


def paginate_chunks(
    chunks: list[dict[str, Any]], page_size: int = CHUNKS_PAGE_SIZE_MAX
) -> list[list[dict[str, Any]]]:
    size = max(1, min(int(page_size), CHUNKS_PAGE_SIZE_MAX))
    ordered = sort_chunks(chunks)
    return [ordered[index : index + size] for index in range(0, len(ordered), size)]


def flatten_pages(pages: list[list[dict[str, Any]]]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for page in pages:
        items.extend(page)
    return items


def capability_for_kb_type(kb_type: str | None) -> dict[str, Any]:
    normalized = str(kb_type or "").strip().lower()
    if normalized == "faq":
        return {
            "kb_type": "faq",
            "open_find": "entry",
            "note": "FAQ chunk 是条目，不是原文档；open/find 应按 entry 处理，不要拼成一篇文章",
        }
    if normalized == "wiki":
        return {
            "kb_type": "wiki",
            "open_find": "page",
            "note": "Wiki 应按页面读取，不能假设与 document 相同的线性正文",
        }
    return {
        "kb_type": normalized or "document",
        "open_find": "document",
        "note": "document 可用 chunks 重建正文，再做本地窗口切分",
    }
