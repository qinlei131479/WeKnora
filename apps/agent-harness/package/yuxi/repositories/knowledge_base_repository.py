from __future__ import annotations

from typing import Any

from sqlalchemy import select

from yuxi.knowledge.cache import cache_kb_config, delete_cached_kb_config, kb_config_cache_lock
from yuxi.p2.context import stamp_tenant_id
from yuxi.p2.tenant_query import apply_tenant_filters, visible_or_none
from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_knowledge import KnowledgeBase


class KnowledgeBaseRepository:
    async def get_all(self) -> list[KnowledgeBase]:
        async with pg_manager.get_async_session_context() as session:
            result = await session.execute(apply_tenant_filters(select(KnowledgeBase), KnowledgeBase.tenant_id))
            return list(result.scalars().all())

    async def get_by_kb_id(self, kb_id: str) -> KnowledgeBase | None:
        async with pg_manager.get_async_session_context() as session:
            result = await session.execute(select(KnowledgeBase).where(KnowledgeBase.kb_id == kb_id))
            return visible_or_none(result.scalar_one_or_none())

    async def create(self, data: dict[str, Any]) -> KnowledgeBase:
        payload = dict(data)
        payload.setdefault("tenant_id", stamp_tenant_id())
        kb = KnowledgeBase(**payload)
        async with pg_manager.get_async_session_context() as session:
            session.add(kb)
        await cache_kb_config(kb)
        return kb

    async def update(self, kb_id: str, data: dict[str, Any]) -> KnowledgeBase | None:
        async with kb_config_cache_lock(kb_id):
            async with pg_manager.get_async_session_context() as session:
                result = await session.execute(select(KnowledgeBase).where(KnowledgeBase.kb_id == kb_id))
                kb = visible_or_none(result.scalar_one_or_none())
                if kb is None:
                    return None
                # 先可靠清除旧值；失败时不写入，避免提交后仍命中过期缓存。
                await delete_cached_kb_config(kb_id, getattr(kb, "tenant_id", None))
                for key, value in data.items():
                    setattr(kb, key, value)
            return kb

    async def merge_query_params_options(self, kb_id: str, params: dict[str, Any]) -> KnowledgeBase | None:
        """在行锁内合并知识库查询参数，避免并发部分更新互相覆盖。"""
        async with kb_config_cache_lock(kb_id):
            async with pg_manager.get_async_session_context() as session:
                statement = select(KnowledgeBase).where(KnowledgeBase.kb_id == kb_id).with_for_update()
                result = await session.execute(statement)
                kb = visible_or_none(result.scalar_one_or_none())
                if kb is None:
                    return None
                await delete_cached_kb_config(kb_id, getattr(kb, "tenant_id", None))

                query_params = dict(kb.query_params or {})
                options = dict(query_params.get("options") or {})
                options.update(params)
                query_params["options"] = options
                kb.query_params = query_params
            return kb

    async def update_stats(self, kb_id: str, stats: dict[str, int]) -> KnowledgeBase | None:
        """在行锁内更新统计投影，保留并发写入的其他附加参数。"""
        async with kb_config_cache_lock(kb_id):
            async with pg_manager.get_async_session_context() as session:
                statement = select(KnowledgeBase).where(KnowledgeBase.kb_id == kb_id).with_for_update()
                result = await session.execute(statement)
                kb = visible_or_none(result.scalar_one_or_none())
                if kb is None:
                    return None

                additional_params = dict(kb.additional_params or {})
                additional_params["stats"] = stats
                kb.additional_params = additional_params
            return kb

    async def delete(self, kb_id: str) -> None:
        async with kb_config_cache_lock(kb_id):
            async with pg_manager.get_async_session_context() as session:
                result = await session.execute(select(KnowledgeBase).where(KnowledgeBase.kb_id == kb_id))
                kb = visible_or_none(result.scalar_one_or_none())
                if kb is None:
                    return
                await delete_cached_kb_config(kb_id, getattr(kb, "tenant_id", None))
                await session.delete(kb)
