from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.p2.context import stamp_tenant_id
from yuxi.p2.tenant_query import apply_tenant_filters, row_in_tenant, slug_taken_clauses
from yuxi.storage.postgres.models_business import Skill
from yuxi.utils.datetime_utils import utc_now_naive


class SkillRepository:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def list_all(self) -> list[Skill]:
        stmt = apply_tenant_filters(select(Skill), Skill.tenant_id, catalog_null=True)
        result = await self.db.execute(stmt.order_by(Skill.updated_at.desc(), Skill.id.desc()))
        return list(result.scalars().all())

    async def list_enabled(self) -> list[Skill]:
        stmt = apply_tenant_filters(
            select(Skill).where(Skill.enabled.is_(True)),
            Skill.tenant_id,
            catalog_null=True,
        )
        result = await self.db.execute(stmt.order_by(Skill.updated_at.desc(), Skill.id.desc()))
        return list(result.scalars().all())

    async def list_by_slugs(self, slugs: list[str]) -> list[Skill]:
        normalized = [slug for slug in dict.fromkeys(slugs) if isinstance(slug, str) and slug]
        if not normalized:
            return []
        result = await self.db.execute(select(Skill).where(Skill.slug.in_(normalized)))
        items = [item for item in result.scalars().all() if row_in_tenant(item, catalog_null=True)]
        item_map = {item.slug: item for item in items}
        return [item_map[slug] for slug in normalized if slug in item_map]

    async def get_by_slug_unscoped(self, slug: str, *, for_update: bool = False) -> Skill | None:
        """不过滤租户。仅用于 slug 全局唯一性与内置安装对账。"""
        stmt = select(Skill).where(Skill.slug == slug)
        if for_update:
            stmt = stmt.with_for_update()
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str, *, for_update: bool = False) -> Skill | None:
        stmt = apply_tenant_filters(
            select(Skill).where(Skill.slug == slug),
            Skill.tenant_id,
            catalog_null=True,
        )
        if for_update:
            stmt = stmt.with_for_update()
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def exists_slug(self, slug: str) -> bool:
        result = await self.db.execute(
            select(Skill.id).where(*slug_taken_clauses(Skill.tenant_id, Skill.slug, slug))
        )
        return result.scalar_one_or_none() is not None

    async def create(
        self,
        *,
        slug: str,
        name: str,
        description: str,
        source_type: str,
        tool_dependencies: list[str] | None,
        mcp_dependencies: list[str] | None,
        skill_dependencies: list[str] | None,
        dir_path: str,
        share_config: dict,
        enabled: bool = True,
        version: str | None = None,
        content_hash: str | None = None,
        created_by: str | None,
    ) -> Skill:
        now = utc_now_naive()
        item = Skill(
            slug=slug,
            name=name,
            description=description,
            source_type=source_type,
            tool_dependencies=tool_dependencies or [],
            mcp_dependencies=mcp_dependencies or [],
            skill_dependencies=skill_dependencies or [],
            dir_path=dir_path,
            version=version,
            content_hash=content_hash,
            share_config=share_config,
            enabled=enabled,
            created_by=created_by,
            updated_by=created_by,
            tenant_id=stamp_tenant_id(),
            created_at=now,
            updated_at=now,
        )
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_builtin_install(
        self,
        item: Skill,
        *,
        version: str,
        content_hash: str,
        updated_by: str | None,
    ) -> Skill:
        item.version = version
        item.content_hash = content_hash
        item.source_type = "builtin"
        item.share_config = {
            "version": 2,
            "read_scope": {"access_level": "global", "department_ids": [], "user_uids": []},
            "manage_scope": None,
        }
        item.updated_by = updated_by
        item.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_dependencies(
        self,
        item: Skill,
        *,
        tool_dependencies: list[str],
        mcp_dependencies: list[str],
        skill_dependencies: list[str],
        updated_by: str | None,
    ) -> Skill:
        item.tool_dependencies = tool_dependencies
        item.mcp_dependencies = mcp_dependencies
        item.skill_dependencies = skill_dependencies
        item.updated_by = updated_by
        item.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_metadata(
        self,
        item: Skill,
        *,
        name: str,
        description: str,
        updated_by: str | None,
    ) -> Skill:
        item.name = name
        item.description = description
        item.updated_by = updated_by
        item.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_share_config(self, item: Skill, *, share_config: dict, updated_by: str | None) -> Skill:
        item.share_config = share_config
        item.updated_by = updated_by
        item.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def update_enabled(self, item: Skill, *, enabled: bool, updated_by: str | None) -> Skill:
        item.enabled = enabled
        item.updated_by = updated_by
        item.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(item)
        return item

    async def delete(self, item: Skill) -> None:
        await self.db.delete(item)
        await self.db.commit()
