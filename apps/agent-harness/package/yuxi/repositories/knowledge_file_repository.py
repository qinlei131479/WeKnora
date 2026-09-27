from __future__ import annotations

from typing import Any


class KnowledgeFileRepository:
    """原生 h_knowledge_files 已删除。"""

    async def get_kb_file_stats(self, kb_id: str) -> dict[str, Any]:
        return {}

    async def get_by_file_id(self, file_id: str) -> None:
        return None

    async def list_children(self, kb_id: str, parent_id: str | None = None) -> list[Any]:
        return []

    async def list_by_file_ids(self, file_ids: list[str]) -> list[Any]:
        return []

    async def search_files(self, *args, **kwargs) -> tuple[list[Any], int]:
        return [], 0

    async def exists_by_filename(self, kb_id: str, filename: str) -> bool:
        return False

    async def count_all(self) -> int:
        return 0

    async def update_fields(self, *args, **kwargs) -> None:
        return None

    async def update_fields_if_status(self, *args, **kwargs) -> None:
        return None

    async def upsert(self, *args, **kwargs) -> None:
        raise RuntimeError("原生知识库已删除")

    async def delete(self, file_id: str) -> None:
        return None

