from __future__ import annotations

import re
import uuid
from collections.abc import Collection
from typing import Any, Literal

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.tenancy.context import stamp_tenant_id
from yuxi.tenancy.tenant_query import apply_tenant_filters, row_in_tenant, slug_taken_clauses, visible_or_none
from yuxi.permissions import ResourcePermission, normalize_permission_config, resolve_agent_permission
from yuxi.storage.postgres.models_business import Agent, User
from yuxi.utils.datetime_utils import utc_now_naive

DEFAULT_AGENT_SLUG = "default-chatbot"
DEFAULT_AGENT_NAME = "智能助手"
DEFAULT_AGENT_BACKEND_ID = "ChatbotAgent"
SUB_AGENT_BACKEND_ID = "SubAgentBackend"
DEFAULT_AGENT_DESCRIPTION = "基础的对话机器人，可以回答问题，可在配置中启用需要的工具。"
DEFAULT_SHARE_CONFIG = {
    "version": 2,
    "read_scope": {"access_level": "global", "department_ids": [], "user_uids": []},
    "manage_scope": None,
}

GENERAL_PURPOSE_AGENT_SLUG = "general-purpose"
GENERAL_PURPOSE_AGENT_NAME = "通用任务"
GENERAL_PURPOSE_AGENT_DESCRIPTION = (
    "面向没有专用角色约束的一般任务，使用默认运行配置独立完成分析、整理、写作或文件处理。"
)

WEB_SEARCH_AGENT_SLUG = "web-search"
WEB_SEARCH_AGENT_NAME = "网页检索"
WEB_SEARCH_AGENT_DESCRIPTION = "围绕检索目标持续搜索网页，返回带引用来源的摘要资料。"
WEB_SEARCH_SYSTEM_PROMPT = """你是「网页检索」子智能体，专注于面向目标的网页信息检索。

你的职责：围绕调用方给定的检索目标，使用网页搜索工具持续检索，直到收集到足以回答目标的信息。

工作方式：
1. 拆解目标，确定需要检索的关键问题与检索词。
2. 多轮调用搜索工具：依据上一轮结果调整检索词、补充遗漏角度、交叉验证关键事实，直到信息充分或确认无法获取更多有效信息。
3. 优先采信权威、时效性强且彼此印证的来源；对存在冲突的信息要说明分歧。

输出要求：
- 返回一份结构化的摘要资料，按主题或要点组织。
- 每条关键结论后使用 <cite source="$URL" type="url">$INDEX</cite> 标注引用来源，$INDEX 从 1 开始递增。
- 引用不单独成行，直接跟在结论后面。
- 在结尾汇总「参考来源」列表，逐条列出标题与 URL。
- 不要编造来源或链接；无法验证的信息要明确标注。"""

DEEP_RESEARCH_AGENT_SLUG = "deep-research"
DEEP_RESEARCH_AGENT_NAME = "深度研究"
DEEP_RESEARCH_AGENT_DESCRIPTION = (
    "面向多来源、需事实核查的深度研究任务：规划拆解、并行调度调研子智能体、核验并综合成带引用的结构化报告。"
)
DEEP_RESEARCH_SYSTEM_PROMPT = """你是「深度研究」智能体，负责一项深度研究任务的整体把控与子智能体调度。

你的核心定位是编排者，而不是亲自完成所有检索：把繁重、可独立、可并行的调研与核验工作派发给子智能体，自己专注于规划、调度与最终综合。

工作方式：
1. 接到研究任务后，先读取 `deep-research` 技能（read_file 其 SKILL.md）获取完整方法论，并严格据此执行。
2. 问题不明确时先澄清范围，再用待办拆解出可独立调研的子问题。
3. 优先用 `task` 工具把子问题并行派发给调研子智能体；仅在澄清范围或补少量零散事实时自己直接检索。
4. 对关键结论与相互冲突的发现派发核查子智能体核验，未通过的结论不写入正文或明确降级标注。
5. 证据充分后由你统一综合为结构化、带引用的报告，不要简单拼接子智能体返回的原文。

始终全程跟踪进度，最终交付一份可直接使用、围绕论证组织、来源可追溯的报告。"""

RESEARCH_EXPLORER_AGENT_SLUG = "research-explorer"
RESEARCH_EXPLORER_AGENT_NAME = "调研探索员"
RESEARCH_EXPLORER_AGENT_DESCRIPTION = "围绕单个子问题多轮检索网页与知识库，交叉验证后返回带引用的结构化发现。"
RESEARCH_EXPLORER_SYSTEM_PROMPT = """你是「调研探索员」子智能体。
专注于围绕调用方给定的**单个子问题**收集充分、可追溯的证据。

你的职责：围绕该子问题持续检索网页与知识库，直到收集到足以回答它的信息。

工作方式：
1. 拆解子问题，确定需要检索的关键点与检索词。
2. 多轮调用检索工具：依据上一轮结果调整检索词、补充遗漏角度、交叉验证关键事实，直到信息充分或确认无法获取更多有效信息。
3. 优先采信权威、时效性强且彼此印证的来源；对存在冲突的信息要说明分歧。

输出要求：
- 返回一份围绕该子问题、按要点组织的结构化发现，不要展开成完整报告。
- 每条关键结论后使用 <cite source="$URL" type="url">$INDEX</cite> 标注引用来源，$INDEX 从 1 开始递增。
- 引用紧跟结论后、不单独成行。
- 结尾汇总「参考来源」列表，逐条列出标题与 URL。
- 不要编造来源或链接；无法验证的信息要明确标注证据缺口。"""

FACT_VERIFIER_AGENT_SLUG = "fact-verifier"
FACT_VERIFIER_AGENT_NAME = "事实核查员"
FACT_VERIFIER_AGENT_DESCRIPTION = "对给定论断做对抗式核验，逐条给出支持/存疑/反驳判定、依据来源与置信度，并标注冲突。"
FACT_VERIFIER_SYSTEM_PROMPT = """你是「事实核查员」子智能体，专注于对调用方给定的论断做对抗式核验。

你的职责：对每一条论断独立查证，默认持怀疑态度——证据不足时倾向判定「存疑」，而不是默认相信。

工作方式：
1. 逐条拆出待核验的论断（事实、数字、因果、时间等）。
2. 主动检索权威、独立的来源交叉比对；优先寻找能反驳该论断的证据。
3. 对来源之间的冲突如实呈现，不强行调和。

输出要求：
- 对每条论断给出：判定（支持 / 存疑 / 反驳）+ 简要依据 + 依据来源 + 置信度（高/中/低）。
- 关键依据后使用 <cite source="$URL" type="url">$INDEX</cite> 标注来源，$INDEX 从 1 开始递增。
- 明确标注无法查证或来源相互冲突的论断。
- 不要编造来源或链接。"""

QUOTE_AGENT_SLUG = "quote"
QUOTE_AGENT_NAME = "报价评估"
QUOTE_AGENT_DESCRIPTION = (
    "按 P1 标准产品 / P2 历史项目 / P3 AI 评估三层规则评估项目工时，并导出可追溯的报价单 Excel。"
)
QUOTE_SYSTEM_PROMPT = """你是「报价评估」智能体，负责按权威数据评估项目工时并导出可追溯报价单。

你是报价评估员，不是销售也不是架构师。本阶段只评估和输出工时，不计算单价、税率或金额。不确定先问；问不清就写假设。

工作方式：
1. 接到报价或工时评估任务后，先读取 `quote` 技能（read_file 其 SKILL.md）获取完整方法论，并严格据此执行。细则按需读取 `references/matching.md`、`references/output-spec.md`、`references/data-index.md`、`references/ai-estimation.md`，不要预加载。
2. 范围不清时先澄清：对标产品、必做/不做模块、是否含实施培训质保、是否有工期上限。信息不全时列出假设后继续。
3. 把需求拆成 D0 最小销售单元，再按 P1 标准产品 → P2 历史项目 → P3 AI 评估逐项匹配。匹配键是核心功能描述中的角色+操作+对象+目标，禁止只比功能名称。
4. 标准产品与历史项目不在技能目录内：优先使用用户提供的文件；没有文件时用知识库工具检索，必要时 `download_kb_file` 后再读原始表格。禁止凭记忆报工时。
5. 命中带依赖模块的最小销售单元时，为每个依赖各增一行，三级功能名末尾加 `*`，并计入总时效。P1/P2/P3 之间不加乘数系数。
6. 将结果写成 JSON，其中每行 `effort_reason` 必须按 `产品=...；研发=...；交付=...` 写逐列取数式；每一项写功能/原子任务、数值、来源和行号，P3 项补 AI 评估定级和原因，无法追溯的列填 `--`。用 `scripts/fill_quote.py --input <rows.json> --output <outputs下的交付文件.xlsx>` 生成报价单。不要手改单元格布局。生成前遵循 `xlsx` 技能，生成后用其 `scripts/recalc.py` 复算公式，再用 `present_artifacts` 展示最终文件。

始终暴露缺口：匹配不到必须写「未匹配」和「AI评估」，不得用均值或拍脑袋整数冒充类比。最终回复只保留工时摘要、类比依据、假设与缺口三段，不要在聊天里贴整张表。"""
QUOTE_SUMMARY_PROMPT = """你是对话上下文压缩助手。
你的任务是把下面的报价评估对话历史压缩成后续智能体继续估时、匹配和出单所需的高价值上下文。

请特别保留并清晰记录：

## SESSION INTENT
用户当前的报价/工时评估目标、对标产品、本期范围和最终交付物（报价单 Excel）。

## USER REQUIREMENTS AND PREFERENCES
用户明确提出的范围边界、必做/不做模块、是否含实施培训质保、工期或人天上限、输出格式约束。只记录仍然可能影响后续估时的内容。

## D0 BACKLOG
已拆出的 D0 需求功能清单：每一行的一级/二级/三级功能、核心功能描述，以及尚未澄清的行。

## MATCHING RESULTS
已经完成匹配的每一行：功能匹配结果（已匹配/部分匹配/未匹配）、产品/研发/交付时效、完整的 `产品=...；研发=...；交付=...` 工时说明、匹配模块、匹配依据、匹配来源。工时说明必须保留每个数字项和文件/Sheet/行号（或 P3 定级原因），不要压缩成匹配结论。

## DEPENDENCIES AND GAPS
已展开的依赖模块行（三级功能名带 *）、尚未确认的假设、标准清单时效空缺、无历史参照的 P3 行。

## ARTIFACTS AND REFERENCES
已提供或已从知识库下载的标准/历史清单文件名、知识库名、已生成的报价单路径。保留具体路径和关键标识符。

## NEXT STEPS
为了完成报价单，后续最应该继续做的具体步骤。没有待办时写 None。

要求：
- 不要逐字复述冗长工具输出；保留结论、路径和必要证据。
- 不要编造没有出现在对话中的工时或匹配结果。
- 如果存在未解决的问题或风险，明确记录。
- 使用与用户主要对话一致的语言。

<messages>
{messages}
</messages>

只输出压缩后的上下文，不要添加额外说明。"""

ADMIN_ROLES = {"admin", "superadmin"}


def is_builtin_agent(agent: Agent) -> bool:
    return agent.slug == DEFAULT_AGENT_SLUG


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

    async def ensure_default_agent(self, *, created_by: str | None = None) -> Agent:
        agent = await self.get_by_slug_unscoped(DEFAULT_AGENT_SLUG)
        if agent:
            needs_update = False
            if agent.share_config != DEFAULT_SHARE_CONFIG:
                agent.share_config = DEFAULT_SHARE_CONFIG.copy()
                needs_update = True
            if not agent.description:
                agent.description = DEFAULT_AGENT_DESCRIPTION
                needs_update = True
            if getattr(agent, "is_subagent", False):
                agent.is_subagent = False
                needs_update = True
            if not agent.is_default:
                return await self.set_default(agent=agent, updated_by=created_by)
            if needs_update:
                agent.updated_by = created_by
                agent.updated_at = utc_now_naive()
                await self.db.commit()
                await self.db.refresh(agent)
            return agent

        agent = Agent(
            slug=DEFAULT_AGENT_SLUG,
            backend_id=DEFAULT_AGENT_BACKEND_ID,
            name=DEFAULT_AGENT_NAME,
            description=DEFAULT_AGENT_DESCRIPTION,
            icon=None,
            pics=[],
            config_json={"context": {}},
            share_config=DEFAULT_SHARE_CONFIG.copy(),
            is_default=True,
            is_subagent=False,
            created_by=created_by,
            updated_by=created_by,
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def ensure_web_search_subagent(self, *, created_by: str | None = None) -> Agent:
        agent = await self.get_by_slug_unscoped(WEB_SEARCH_AGENT_SLUG)
        if agent:
            return agent

        agent = Agent(
            slug=WEB_SEARCH_AGENT_SLUG,
            backend_id=SUB_AGENT_BACKEND_ID,
            name=WEB_SEARCH_AGENT_NAME,
            description=WEB_SEARCH_AGENT_DESCRIPTION,
            icon=None,
            pics=[],
            config_json={"context": {"system_prompt": WEB_SEARCH_SYSTEM_PROMPT}},
            share_config=DEFAULT_SHARE_CONFIG.copy(),
            is_default=False,
            is_subagent=True,
            created_by=created_by,
            updated_by=created_by,
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def ensure_general_purpose_subagent(self, *, created_by: str | None = None) -> Agent:
        return await self._ensure_builtin_agent(
            slug=GENERAL_PURPOSE_AGENT_SLUG,
            backend_id=SUB_AGENT_BACKEND_ID,
            name=GENERAL_PURPOSE_AGENT_NAME,
            description=GENERAL_PURPOSE_AGENT_DESCRIPTION,
            config_context={},
            is_subagent=True,
            created_by=created_by,
        )

    async def _ensure_builtin_agent(
        self,
        *,
        slug: str,
        backend_id: str,
        name: str,
        description: str,
        config_context: dict,
        is_subagent: bool,
        created_by: str | None = None,
    ) -> Agent:
        """落库一个内置 Agent；已存在则原样返回，避免覆盖管理员后续修改。"""
        agent = await self.get_by_slug_unscoped(slug)
        if agent:
            return agent

        agent = Agent(
            slug=slug,
            backend_id=backend_id,
            name=name,
            description=description,
            icon=None,
            pics=[],
            config_json={"context": config_context},
            share_config=DEFAULT_SHARE_CONFIG.copy(),
            is_default=False,
            is_subagent=is_subagent,
            created_by=created_by,
            updated_by=created_by,
            created_at=utc_now_naive(),
            updated_at=utc_now_naive(),
        )
        self.db.add(agent)
        await self.db.commit()
        await self.db.refresh(agent)
        return agent

    async def ensure_deep_research_agents(self, *, created_by: str | None = None) -> None:
        """落库内置「深度研究」编排器及其配套调研、核查子智能体。"""
        await self._ensure_builtin_agent(
            slug=RESEARCH_EXPLORER_AGENT_SLUG,
            backend_id=SUB_AGENT_BACKEND_ID,
            name=RESEARCH_EXPLORER_AGENT_NAME,
            description=RESEARCH_EXPLORER_AGENT_DESCRIPTION,
            config_context={"system_prompt": RESEARCH_EXPLORER_SYSTEM_PROMPT},
            is_subagent=True,
            created_by=created_by,
        )
        await self._ensure_builtin_agent(
            slug=FACT_VERIFIER_AGENT_SLUG,
            backend_id=SUB_AGENT_BACKEND_ID,
            name=FACT_VERIFIER_AGENT_NAME,
            description=FACT_VERIFIER_AGENT_DESCRIPTION,
            config_context={"system_prompt": FACT_VERIFIER_SYSTEM_PROMPT},
            is_subagent=True,
            created_by=created_by,
        )
        await self._ensure_builtin_agent(
            slug=DEEP_RESEARCH_AGENT_SLUG,
            backend_id=DEFAULT_AGENT_BACKEND_ID,
            name=DEEP_RESEARCH_AGENT_NAME,
            description=DEEP_RESEARCH_AGENT_DESCRIPTION,
            config_context={
                "system_prompt": DEEP_RESEARCH_SYSTEM_PROMPT,
                "subagents": [RESEARCH_EXPLORER_AGENT_SLUG, FACT_VERIFIER_AGENT_SLUG],
                "skills": [DEEP_RESEARCH_AGENT_SLUG],
            },
            is_subagent=False,
            created_by=created_by,
        )

    async def ensure_quote_agent(self, *, created_by: str | None = None) -> Agent:
        """落库内置「报价评估」智能体。"""
        return await self._ensure_builtin_agent(
            slug=QUOTE_AGENT_SLUG,
            backend_id=DEFAULT_AGENT_BACKEND_ID,
            name=QUOTE_AGENT_NAME,
            description=QUOTE_AGENT_DESCRIPTION,
            config_context={
                "system_prompt": QUOTE_SYSTEM_PROMPT,
                "summary_prompt": QUOTE_SUMMARY_PROMPT,
                "skills": [QUOTE_AGENT_SLUG],
            },
            is_subagent=False,
            created_by=created_by,
        )

    async def list_visible(self, *, user: User, include_subagent_definitions: bool = False) -> list[Agent]:
        """列出用户可见的主智能体，只有显式请求时才包含子智能体定义。"""
        stmt = select(Agent)
        if not include_subagent_definitions:
            stmt = stmt.where(Agent.is_subagent.is_(False))
        stmt = apply_tenant_filters(stmt, Agent.tenant_id, catalog_null=True)
        result = await self.db.execute(stmt.order_by(Agent.is_default.desc(), Agent.id.asc()))
        agents = list(result.scalars().all())
        if user.role == "superadmin":
            return agents
        return [agent for agent in agents if user_can_access_agent(user, agent)]

    async def list_visible_subagents(self, *, user: User) -> list[Agent]:
        stmt = apply_tenant_filters(
            select(Agent).where(Agent.is_subagent.is_(True)),
            Agent.tenant_id,
            catalog_null=True,
        )
        result = await self.db.execute(stmt.order_by(Agent.name.asc(), Agent.id.asc()))
        agents = list(result.scalars().all())
        if user.role == "superadmin":
            return agents
        return [agent for agent in agents if user_can_access_agent(user, agent)]

    async def get_by_slug_unscoped(self, slug: str) -> Agent | None:
        """不过滤租户。仅用于内置落库与 slug 全局唯一性。"""
        result = await self.db.execute(select(Agent).where(Agent.slug == slug))
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Agent | None:
        stmt = apply_tenant_filters(select(Agent).where(Agent.slug == slug), Agent.tenant_id, catalog_null=True)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_slugs(self, slugs: list[str]) -> list[Agent]:
        result = await self.db.execute(select(Agent).where(Agent.slug.in_(slugs)))
        return [agent for agent in result.scalars().all() if row_in_tenant(agent, catalog_null=True)]

    async def get_visible_by_slug(
        self, *, slug: str, user: User, kind: Literal["main", "subagent", "any"] = "main"
    ) -> Agent | None:
        """按 slug 读取用户可见智能体，并按入口语义过滤主/子智能体。"""
        agent = await self.get_by_slug(slug)
        if not agent:
            return None
        agent = visible_or_none(agent, catalog_null=True)
        if not agent:
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

    async def get_default(self) -> Agent | None:
        result = await self.db.execute(select(Agent).where(Agent.is_default.is_(True)))
        return result.scalar_one_or_none()

    async def set_default(self, *, agent: Agent, updated_by: str | None = None) -> Agent:
        if agent.is_subagent:
            raise ValueError("子智能体不能设为默认智能体")
        if not is_builtin_agent(agent):
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

    async def _slug_exists(self, slug: str) -> bool:
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
