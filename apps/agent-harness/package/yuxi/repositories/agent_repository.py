from __future__ import annotations

import copy
import re
import uuid
from collections.abc import Collection
from typing import Any, Literal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.config.builtin_agents import (
    BUILTIN_AGENT_SPECS,
    builtin_virtual_id,
    get_builtin_agent_spec,
    is_builtin_agent_slug,
)
from yuxi.permissions import ResourcePermission, normalize_permission_config, resolve_agent_permission
from yuxi.storage.postgres.models_business import Agent, AgentRun, AgentRunRequest, Conversation, User
from yuxi.tenancy.context import stamp_tenant_id
from yuxi.tenancy.tenant_query import apply_tenant_filters, row_in_tenant, slug_taken_clauses, visible_or_none
from yuxi.utils.datetime_utils import utc_now_naive

DEFAULT_AGENT_SLUG = "default-chatbot"
DEFAULT_AGENT_BACKEND_ID = "ChatbotAgent"
SUB_AGENT_BACKEND_ID = "SubAgentBackend"
DEFAULT_SHARE_CONFIG = {
    "version": 2,
    "read_scope": {"access_level": "global", "department_ids": [], "user_uids": []},
    "manage_scope": None,
}

GENERAL_PURPOSE_AGENT_SLUG = "general-purpose"
WEB_SEARCH_AGENT_SLUG = "web-search"
DEEP_RESEARCH_AGENT_SLUG = "deep-research"
RESEARCH_EXPLORER_AGENT_SLUG = "research-explorer"
FACT_VERIFIER_AGENT_SLUG = "fact-verifier"
QUOTE_AGENT_SLUG = "quote"
_QUOTE_DUP_SLUG = re.compile(r"^quote-dup-[0-9]+$")


def _spec_text(slug: str, field: str, fallback: str = "") -> str:
    """内置智能体的名称/描述以 YAML 为准，这里只做向后兼容的常量导出。"""
    spec = get_builtin_agent_spec(slug)
    return str(getattr(spec, field, "") or fallback) if spec else fallback


DEFAULT_AGENT_NAME = _spec_text(DEFAULT_AGENT_SLUG, "name", "智能助手")
DEFAULT_AGENT_DESCRIPTION = _spec_text(DEFAULT_AGENT_SLUG, "description")
GENERAL_PURPOSE_AGENT_NAME = _spec_text(GENERAL_PURPOSE_AGENT_SLUG, "name", "通用任务")
GENERAL_PURPOSE_AGENT_DESCRIPTION = _spec_text(GENERAL_PURPOSE_AGENT_SLUG, "description")
QUOTE_AGENT_NAME = _spec_text(QUOTE_AGENT_SLUG, "name", "报价评估")

# 内置智能体不落库：未保存过的租户读到的是这份「虚拟行」，管理员保存后才有真实租户行。
BUILTIN_VIRTUAL_ATTR = "_builtin_virtual"

ADMIN_ROLES = {"admin", "superadmin"}


def is_builtin_agent(agent: Agent) -> bool:
    """内置身份以落库字段为准，避免后续系统智能体依赖 slug 推导。"""
    return bool(getattr(agent, "is_builtin", False))


def is_builtin_virtual(agent: Agent) -> bool:
    """True 表示这是由 YAML 定义拼出来的内存对象，尚未被任何租户保存入库。"""
    return bool(getattr(agent, BUILTIN_VIRTUAL_ATTR, False))


def build_builtin_agent(spec, base_row: Agent | None = None) -> Agent:
    """按 YAML 定义拼一个只读的内置智能体对象（不落库）。

    `base_row` 是历史上落过库的内置目录行。它只贡献 YAML 没有声明的运行时配置键
    （model、knowledges、mcps、tools、max_execution_steps 等部署侧绑定值），
    YAML 声明过的键（system_prompt、skills、subagents、summary_prompt…）一律以 YAML 为准，
    这样改 YAML 能立即生效，又不会抹掉部署侧绑定。
    """
    context = dict(((base_row.config_json or {}).get("context") or {}) if base_row is not None else {})
    context.update(copy.deepcopy((spec.config_json or {}).get("context") or {}))
    agent = Agent(
        id=builtin_virtual_id(spec.slug),
        slug=spec.slug,
        backend_id=spec.backend_id,
        name=spec.name,
        description=spec.description,
        icon=base_row.icon if base_row is not None else None,
        pics=list(base_row.pics or []) if base_row is not None else [],
        config_json={"context": context},
        share_config=DEFAULT_SHARE_CONFIG.copy(),
        is_default=spec.is_default,
        is_subagent=spec.is_subagent,
        is_builtin=True,
        tenant_id=None,
        created_at=base_row.created_at if base_row is not None else utc_now_naive(),
        updated_at=utc_now_naive(),
    )
    setattr(agent, BUILTIN_VIRTUAL_ATTR, True)
    return agent


def _is_legacy_builtin_row(row: Agent) -> bool:
    """历史上落过库的内置目录行：定义部分已被 YAML 取代，只作为运行时配置的载体。"""
    return row.tenant_id is None and is_builtin_agent_slug(row.slug)


def _is_builtin_subagent_slug(slug: str | None) -> bool:
    spec = get_builtin_agent_spec(slug or "")
    return bool(spec is not None and spec.is_subagent)


def agent_model_value(config_json: dict | None) -> str:
    if not isinstance(config_json, dict):
        return ""
    context = config_json.get("context")
    source = context if isinstance(context, dict) else config_json
    return str(source.get("model") or "").strip()


def ensure_agent_model_configured(config_json: dict | None) -> None:
    if not agent_model_value(config_json):
        raise ValueError("请选择智能体模型")


def _sort_agents(items: list[Agent]) -> list[Agent]:
    return sorted(items, key=lambda item: (not item.is_default, item.id if item.id is not None else 0))


def resolve_agent_is_subagent(backend_id: str, is_subagent: bool | None = None) -> bool:
    expected = backend_id == SUB_AGENT_BACKEND_ID
    if is_subagent is not None and bool(is_subagent) != expected:
        raise ValueError("SubAgentBackend 与 is_subagent 必须保持一致")
    return expected


def get_allowed_agent_access_levels(user: User) -> list[str]:
    if user.role in ADMIN_ROLES:
        return ["global", "department", "user"]
    return ["user"]


def normalize_agent_share_config(
    share_config: dict | None,
    *,
    allowed_access_levels: Collection[str] | None = None,
) -> dict:
    return normalize_permission_config(
        share_config or DEFAULT_SHARE_CONFIG,
        allowed_access_levels=allowed_access_levels,
        unauthorized_access_level_message="当前用户无权使用该智能体共享范围",
        strict=True,
    )


def user_can_access_agent(user: User, agent: Agent) -> bool:
    return resolve_agent_permission(user, agent) != ResourcePermission.NONE


def user_can_manage_agent(user: User, agent: Agent) -> bool:
    return resolve_agent_permission(user, agent) == ResourcePermission.MANAGE


def _slugify(value: str | None) -> str:
    base = re.sub(r"[^a-zA-Z0-9_-]+", "-", (value or "").strip().lower()).strip("-")
    return base[:56] or f"agent-{uuid.uuid4().hex[:12]}"


class AgentRepository:
    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    # ---------------------------------------------------------------- 内置解析

    async def _resolve_builtin(self, slug: str) -> Agent | None:
        """按「租户覆写行 → YAML 定义」解析内置智能体。"""
        spec = get_builtin_agent_spec(slug)
        if spec is None:
            return await self.get_by_slug(slug)
        agent = await self.get_by_slug(slug)
        if agent is not None and not is_builtin_virtual(agent):
            return agent
        return build_builtin_agent(spec)

    async def ensure_default_agent(self, *, created_by: str | None = None) -> Agent:
        return await self._resolve_builtin(DEFAULT_AGENT_SLUG)

    async def ensure_web_search_subagent(self, *, created_by: str | None = None) -> Agent:
        return await self._resolve_builtin(WEB_SEARCH_AGENT_SLUG)

    async def ensure_general_purpose_subagent(self, *, created_by: str | None = None) -> Agent:
        return await self._resolve_builtin(GENERAL_PURPOSE_AGENT_SLUG)

    async def ensure_deep_research_agents(self, *, created_by: str | None = None) -> None:
        """解析内置「深度研究」编排器及其配套调研、核查子智能体（定义来自 YAML，不落库）。"""
        for slug in (RESEARCH_EXPLORER_AGENT_SLUG, FACT_VERIFIER_AGENT_SLUG, DEEP_RESEARCH_AGENT_SLUG):
            await self._resolve_builtin(slug)

    async def _collapse_quote_duplicates(self) -> None:
        """迁移曾把重复报价智能体改成 quote-dup-数字，名称未变，列表会多一张卡。"""
        result = await self.db.execute(select(Agent).where(Agent.name == QUOTE_AGENT_NAME))
        rows = list(result.scalars().all())
        duplicates = [row for row in rows if _QUOTE_DUP_SLUG.match(row.slug or "")]
        if not duplicates:
            return

        canonical = next((row for row in rows if row.slug == QUOTE_AGENT_SLUG), None)
        if canonical is None:
            canonical = min(duplicates, key=lambda row: row.id)
            canonical.slug = QUOTE_AGENT_SLUG
            canonical.is_builtin = True
            canonical.updated_at = utc_now_naive()
            await self.db.flush()
            duplicates = [row for row in duplicates if row.id != canonical.id]

        duplicate_slugs = [row.slug for row in duplicates]
        if duplicate_slugs:
            await self.db.execute(
                update(Conversation)
                .where(Conversation.agent_id.in_(duplicate_slugs))
                .values(agent_id=QUOTE_AGENT_SLUG)
            )
            await self.db.execute(
                update(AgentRun).where(AgentRun.agent_slug.in_(duplicate_slugs)).values(agent_slug=QUOTE_AGENT_SLUG)
            )
            await self.db.execute(
                update(AgentRunRequest)
                .where(AgentRunRequest.agent_slug.in_(duplicate_slugs))
                .values(agent_slug=QUOTE_AGENT_SLUG)
            )
            for row in duplicates:
                await self.db.delete(row)
        await self.db.commit()

    async def ensure_quote_agent(self, *, created_by: str | None = None) -> Agent:
        """解析内置「报价评估」智能体（定义来自 YAML，不落库）。"""
        await self._collapse_quote_duplicates()
        return await self._resolve_builtin(QUOTE_AGENT_SLUG)

    # ---------------------------------------------------------------- 读

    async def list_visible(self, *, user: User, include_subagent_definitions: bool = False) -> list[Agent]:
        """列出用户可见的主智能体，只有显式请求时才包含子智能体定义。"""
        stmt = select(Agent)
        if not include_subagent_definitions:
            stmt = stmt.where(Agent.is_subagent.is_(False))
        stmt = apply_tenant_filters(stmt, Agent.tenant_id, catalog_null=True)
        result = await self.db.execute(stmt.order_by(Agent.is_default.desc(), Agent.id.asc()))
        all_rows = list(result.scalars().all())
        legacy = {row.slug: row for row in all_rows if _is_legacy_builtin_row(row)}
        rows = [row for row in all_rows if not _is_legacy_builtin_row(row)]

        rows = [row for row in rows if row.slug != DEFAULT_AGENT_SLUG]
        present = {row.slug for row in rows}
        for spec in BUILTIN_AGENT_SPECS:
            # 默认助手暂不进入列表。内置子智能体仍在管理列表展示，绑定可选范围另查。
            if spec.slug == DEFAULT_AGENT_SLUG or spec.slug in present:
                continue
            if spec.is_subagent and not include_subagent_definitions:
                continue
            rows.append(build_builtin_agent(spec, legacy.get(spec.slug)))

        items = _sort_agents(rows)
        if user.role == "superadmin":
            return items
        return [agent for agent in items if user_can_access_agent(user, agent)]

    async def list_visible_subagents(self, *, user: User) -> list[Agent]:
        """绑定子智能体时的可选范围：只含当前租户自己的子智能体，不含内置定义。"""
        stmt = apply_tenant_filters(
            select(Agent).where(Agent.is_subagent.is_(True)),
            Agent.tenant_id,
            catalog_null=False,
        )
        result = await self.db.execute(stmt.order_by(Agent.name.asc(), Agent.id.asc()))
        rows = [
            row
            for row in result.scalars().all()
            if not (_is_builtin_subagent_slug(row.slug) and not agent_model_value(row.config_json))
        ]

        items = sorted(rows, key=lambda item: (item.name, item.id if item.id is not None else 0))
        if user.role == "superadmin":
            return items
        return [agent for agent in items if user_can_access_agent(user, agent)]

    async def get_by_slug_unscoped(self, slug: str) -> Agent | None:
        """不过滤租户。仅用于 slug 全局唯一性校验与历史重复数据清理。"""
        result = await self.db.execute(select(Agent).where(Agent.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Agent | None:
        stmt = apply_tenant_filters(select(Agent).where(Agent.slug == slug), Agent.tenant_id, catalog_null=True)
        result = await self.db.execute(stmt)
        rows = list(result.scalars().all())
        tenant_row = next((row for row in rows if row.tenant_id is not None), None)
        legacy_row = next((row for row in rows if row.tenant_id is None), None)
        spec = get_builtin_agent_spec(slug)
        if spec is not None:
            return tenant_row or build_builtin_agent(spec, legacy_row)
        return tenant_row or legacy_row

    async def list_by_slugs(self, slugs: list[str]) -> list[Agent]:
        result = await self.db.execute(select(Agent).where(Agent.slug.in_(slugs)))
        by_slug: dict[str, Agent] = {}
        legacy: dict[str, Agent] = {}
        for agent in result.scalars().all():
            if not row_in_tenant(agent, catalog_null=True):
                continue
            if _is_legacy_builtin_row(agent):
                legacy[agent.slug] = agent
            else:
                by_slug[agent.slug] = agent

        items: list[Agent] = []
        for slug in slugs:
            agent = by_slug.get(slug)
            if agent is not None:
                items.append(agent)
                continue
            spec = get_builtin_agent_spec(slug)
            if spec is not None:
                items.append(build_builtin_agent(spec, legacy.get(slug)))
        return items

    async def get_visible_by_slug(
        self, *, slug: str, user: User, kind: Literal["main", "subagent", "any"] = "main"
    ) -> Agent | None:
        """按 slug 读取用户可见智能体，并按入口语义过滤主/子智能体。"""
        agent = await self.get_by_slug(slug)
        if not agent:
            return None
        if agent.tenant_id is not None and not visible_or_none(agent, catalog_null=True):
            return None
        if not user_can_access_agent(user, agent):
            return None
        if kind == "any":
            return agent
        if kind == "main":
            return None if agent.is_subagent else agent
        if kind == "subagent":
            return agent if agent.is_subagent else None
        raise ValueError(f"未知智能体入口类型: {kind}")

    async def set_default(self, *, agent: Agent, updated_by: str | None = None) -> Agent:
        if agent.is_subagent:
            raise ValueError("子智能体不能设为默认智能体")
        if agent.slug != DEFAULT_AGENT_SLUG:
            raise ValueError("默认智能体已固定为内置智能助手")
        share_config = agent.share_config or DEFAULT_SHARE_CONFIG.copy()
        read_scope = share_config.get("read_scope") or {}
        if read_scope.get("access_level") != "global":
            raise ValueError("内置智能体必须全局共享")

        now = utc_now_naive()
        await self.db.execute(update(Agent).where(Agent.is_default.is_(True)).values(is_default=False, updated_at=now))
        agent.is_default = True
        agent.updated_by = updated_by
        agent.updated_at = now
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    # ---------------------------------------------------------------- 写

    async def _slug_exists(self, slug: str) -> bool:
        if is_builtin_agent_slug(slug):
            return True
        result = await self.db.execute(
            select(Agent.id).where(*slug_taken_clauses(Agent.tenant_id, Agent.slug, slug))
        )
        return result.scalar_one_or_none() is not None

    async def _unique_slug(self, desired: str | None, name: str) -> str:
        base = _slugify(desired or name)
        candidate = base
        idx = 2
        while await self._slug_exists(candidate):
            suffix = f"-{idx}"
            candidate = f"{base[: 80 - len(suffix)]}{suffix}"
            idx += 1
        return candidate

    async def create(
        self,
        *,
        name: str,
        backend_id: str,
        slug: str | None = None,
        description: str | None = None,
        icon: str | None = None,
        pics: list[str] | None = None,
        config_json: dict | None = None,
        share_config: dict | None = None,
        is_default: bool = False,
        is_subagent: bool | None = None,
        created_by: str | None = None,
        creator: User | None = None,
    ) -> Agent:
        resolved_is_subagent = resolve_agent_is_subagent(backend_id, is_subagent)
        if resolved_is_subagent and is_default:
            raise ValueError("子智能体不能设为默认智能体")
        owner_uid = str(created_by or "")
        default_share_config = {
            "version": 2,
            "read_scope": {
                "access_level": "user",
                "department_ids": [],
                "user_uids": [owner_uid],
            },
            "manage_scope": None,
        }
        allowed_access_levels = get_allowed_agent_access_levels(creator) if creator else None
        normalized_share_config = normalize_agent_share_config(
            share_config or default_share_config,
            allowed_access_levels=allowed_access_levels,
        )
        if is_default and (normalized_share_config.get("read_scope") or {}).get("access_level") != "global":
            raise ValueError("默认智能体必须全局共享")

        agent = Agent(
            slug=await self._unique_slug(slug, name),
            backend_id=backend_id,
            name=name.strip() or "未命名智能体",
            description=description,
            icon=icon,
            pics=pics or [],
            config_json=config_json or {"context": {}},
            share_config=normalized_share_config,
            is_default=False,
            is_subagent=resolved_is_subagent,
            created_by=created_by,
            updated_by=created_by,
            tenant_id=stamp_tenant_id(),
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        if is_default:
            return await self.set_default(agent=agent, updated_by=created_by)
        return agent

    async def _materialize_builtin_override(
        self,
        agent: Agent,
        *,
        name: str | None,
        description: str | None,
        icon: str | None,
        pics: list[str] | None,
        config_json: dict | None,
        is_subagent: bool | None,
        updated_by: str | None,
    ) -> Agent:
        """保存内置智能体 = 落一条租户级覆写行；此后该租户以库为准，其他租户仍走 YAML。"""
        spec = get_builtin_agent_spec(agent.slug)
        if spec is None:
            raise ValueError(f"内置智能体定义缺失：{agent.slug}")
        if is_subagent is not None and bool(is_subagent) != spec.is_subagent:
            raise ValueError("SubAgentBackend 与 is_subagent 必须保持一致")

        spec_context = dict((spec.config_json or {}).get("context") or {})
        incoming_context = (config_json or {}).get("context") if isinstance(config_json, dict) else None
        context = dict(incoming_context) if isinstance(incoming_context, dict) else spec_context
        extra = {key: value for key, value in (config_json or {}).items() if key != "context"}
        merged_config = {"context": context, **extra}
        ensure_agent_model_configured(merged_config)

        override = Agent(
            slug=agent.slug,
            backend_id=spec.backend_id,
            name=(name or agent.name).strip() or "未命名智能体",
            description=description if description is not None else agent.description,
            icon=icon if icon is not None else agent.icon,
            pics=list(pics) if pics is not None else list(agent.pics or []),
            config_json=merged_config,
            share_config=DEFAULT_SHARE_CONFIG.copy(),
            is_default=False,
            is_subagent=spec.is_subagent,
            is_builtin=True,
            created_by=updated_by,
            updated_by=updated_by,
            tenant_id=stamp_tenant_id(),
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
        self.db.add(override)
        await self.db.commit()
        await self.db.refresh(override)
        return override

    async def update(
        self,
        agent: Agent,
        *,
        name: str | None = None,
        description: str | None = None,
        icon: str | None = None,
        pics: list[str] | None = None,
        config_json: dict | None = None,
        share_config: dict | None = None,
        is_subagent: bool | None = None,
        updated_by: str | None = None,
        updater: User | None = None,
    ) -> Agent:
        effective_config = config_json if config_json is not None else (agent.config_json or {})
        ensure_agent_model_configured(effective_config)

        if is_builtin_virtual(agent):
            return await self._materialize_builtin_override(
                agent,
                name=name,
                description=description,
                icon=icon,
                pics=pics,
                config_json=config_json,
                is_subagent=is_subagent,
                updated_by=updated_by,
            )

        if is_subagent is not None:
            agent.is_subagent = resolve_agent_is_subagent(agent.backend_id, is_subagent)
        if name is not None:
            agent.name = name.strip() or "未命名智能体"
        if description is not None:
            agent.description = description
        if icon is not None:
            agent.icon = icon
        if pics is not None:
            agent.pics = pics
        if config_json is not None:
            agent.config_json = config_json
        if share_config is not None:
            if is_builtin_agent(agent):
                agent.share_config = DEFAULT_SHARE_CONFIG.copy()
            else:
                allowed_access_levels = get_allowed_agent_access_levels(updater) if updater else None
                agent.share_config = normalize_agent_share_config(
                    share_config,
                    allowed_access_levels=allowed_access_levels,
                )

        agent.updated_by = updated_by
        agent.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def delete(self, *, agent: Agent) -> None:
        if is_builtin_virtual(agent):
            raise ValueError("内置智能体未保存过，不能删除")
        await self.db.delete(agent)
        await self.db.commit()

    async def serialize(
        self,
        agent: Agent,
        *,
        user: User,
        include_configurable_items: bool = False,
        backend_info_cache: dict[tuple[str, bool, str], dict] | None = None,
    ) -> dict[str, Any]:
        data = agent.to_dict()
        data["share_config"] = normalize_permission_config(
            agent.share_config,
        )
        permission = resolve_agent_permission(user, agent)
        is_builtin = is_builtin_agent(agent)
        data["can_manage"] = user_can_manage_agent(user, agent)
        data["effective_permission"] = permission.value
        data["is_builtin"] = is_builtin
        data["permission_locked"] = is_builtin
        # 租户覆写行不带 is_default（避免跨租户撞唯一索引），默认身份仍按 slug 判定。
        if is_builtin and agent.slug == DEFAULT_AGENT_SLUG:
            data["is_default"] = True

        from yuxi.agents.buildin import agent_manager

        backend = agent_manager.get_agent(agent.backend_id)
        if backend:
            cache_key = (agent.backend_id, include_configurable_items, user.role)
            backend_info = backend_info_cache.get(cache_key) if backend_info_cache is not None else None
            if backend_info is None:
                backend_info = await backend.get_info(
                    include_configurable_items=include_configurable_items,
                    user_role=user.role,
                    db=self.db if include_configurable_items else None,
                    user=user if include_configurable_items else None,
                )
                if backend_info_cache is not None:
                    backend_info_cache[cache_key] = backend_info
            data["capabilities"] = backend_info.get("capabilities", [])
            data["metadata"] = backend_info.get("metadata", {})
            if include_configurable_items:
                data["configurable_items"] = backend_info.get("configurable_items", {})
        else:
            data["capabilities"] = []
            data["metadata"] = {}
            if include_configurable_items:
                data["configurable_items"] = {}
        return data
