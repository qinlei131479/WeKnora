from __future__ import annotations

from typing import Any


class KnowledgeBaseRepository:
    """原生 h_knowledge_* 已删除；智能体只走 WeKnora 虚拟配置。"""

    async def get_all(self) -> list[Any]:
        return []

    async def get_by_kb_id(self, kb_id: str) -> None:
        return None

    async def create(self, data: dict[str, Any]) -> None:
        raise RuntimeError("原生知识库已删除")

    async def update(self, kb_id: str, data: dict[str, Any]) -> None:
        return None

    async def merge_query_params_options(self, kb_id: str, params: dict[str, Any]) -> None:
        return None

    async def update_stats(self, kb_id: str, stats: dict[str, int]) -> None:
        return None

    async def delete(self, kb_id: str) -> None:
        return None
