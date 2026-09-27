"""
Dashboard Router - Statistics and monitoring endpoints
仪表板 - 统计和监控端点

Provides centralized dashboard APIs for monitoring system-wide statistics.
提供系统级统计和监控的API接口，用于监控系统运行状态、用户活动、工具调用、知识库使用等。
"""

import traceback
from datetime import datetime, timedelta
from types import SimpleNamespace
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import bindparam, distinct, func, select, text
from sqlalchemy.ext.asyncio import AsyncSession

from server.utils.auth_middleware import get_admin_user, get_db
from yuxi.tenancy.tenant_query import apply_tenant_filters
from yuxi.repositories.agent_repository import AgentRepository
from yuxi.dashboard.stats import (
    count_weknora_active_users,
    fetch_weknora_agent_call_buckets,
    fetch_weknora_agent_names,
    fetch_weknora_agent_stats,
    fetch_weknora_daily_active_users,
    fetch_weknora_knowledge_stats,
    fetch_weknora_overview,
    simple_sum,
    weknora_user_total,
)
from yuxi.storage.postgres.models_business import User
from yuxi.utils.datetime_utils import UTC, shanghai_now, utc_now
from yuxi.utils.logging_config import logger


dashboard = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _scope_column(stmt, column):
    return apply_tenant_filters(stmt, column)


async def _model_display_names(db: AsyncSession, model_ids: list[str]) -> dict[str, str]:
    """模型图例用 models.display_name。没有展示名时回退 name，再回退 id。"""
    ids = [model_id for model_id in dict.fromkeys(model_ids) if model_id and model_id != "unknown"]
    if not ids:
        return {}
    stmt = text(
        """
        SELECT id,
               COALESCE(NULLIF(display_name, ''), NULLIF(name, ''), id) AS label
        FROM models
        WHERE id IN :ids
          AND deleted_at IS NULL
        """
    ).bindparams(bindparam("ids", expanding=True))
    rows = (await db.execute(stmt, {"ids": ids})).all()
    return {row.id: row.label for row in rows}


async def _count_usage_users(db: AsyncSession, model, *, since=None, until=None) -> int:
    stmt = select(func.count(distinct(model.uid)))
    if since is not None:
        stmt = stmt.where(model.occurred_at >= since)
    if until is not None:
        stmt = stmt.where(model.occurred_at < until)
    result = await db.execute(_scope_column(stmt, model.tenant_id))
    return int(result.scalar() or 0)


async def _harness_daily_active_users(db: AsyncSession) -> list[dict]:
    from yuxi.storage.postgres.models_business import AgentUsageEvent

    now = utc_now()
    rows: list[dict] = []
    for i in range(7):
        day_start = now - timedelta(days=i + 1)
        day_end = now - timedelta(days=i)
        count = await _count_usage_users(db, AgentUsageEvent, since=day_start, until=day_end)
        rows.append({"date": day_start.strftime("%Y-%m-%d"), "active_users": count})
    return list(reversed(rows))


def _get_time_group_format(column, time_range: str) -> Any:
    """遥测时间是 timestamptz。先换到上海时区再格式化，避免在会话时区上再加 8 小时。"""
    local_time = func.timezone("Asia/Shanghai", column)
    if time_range == "14hours":
        return func.to_char(local_time, "YYYY-MM-DD HH24:00")
    if time_range == "14weeks":
        return func.to_char(local_time, "YYYY-IW")
    return func.to_char(local_time, "YYYY-MM-DD")


# =============================================================================
# Response Models
# =============================================================================


class UserActivityStats(BaseModel):
    """用户活跃度统计"""

    total_users: int
    active_users_24h: int
    active_users_30d: int
    daily_active_users: list[dict]  # 最近7天每日活跃用户


class ToolCallStats(BaseModel):
    """工具调用统计"""

    total_calls: int
    successful_calls: int
    failed_calls: int
    success_rate: float
    most_used_tools: list[dict]
    tool_error_distribution: dict
    daily_tool_calls: list[dict]  # 最近7天每日工具调用数


class KnowledgeStats(BaseModel):
    """知识库统计"""

    total_databases: int
    total_files: int
    total_nodes: int
    total_storage_size: int  # 字节
    databases_by_type: dict
    file_type_distribution: dict
    split_by_system: bool = False
    source: str = "yuxi"


class AgentAnalytics(BaseModel):
    """AI智能体分析"""

    total_agents: int
    agent_conversation_counts: list[dict]
    agent_tool_usage: list[dict]
    top_performing_agents: list[dict]
    agent_names: dict[str, str] = {}  # agent_id -> agent_name 映射
    split_by_system: bool = False
    yuxi_total_agents: int = 0
    weknora_total_agents: int = 0
    weknora_agent_conversation_counts: list[dict] = Field(default_factory=list)
    weknora_agent_names: dict[str, str] = Field(default_factory=dict)


# =============================================================================
# 用户活动统计（当前 token 空间）
# =============================================================================


@dashboard.get("/stats/users", response_model=UserActivityStats)
async def get_user_activity_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的用户活动统计。工作侧活跃用户来自运行事实表。"""
    try:
        from yuxi.storage.postgres.models_business import AgentUsageEvent

        now = utc_now()
        overview = await fetch_weknora_overview(db)
        harness_total = await _count_usage_users(db, AgentUsageEvent)
        harness_24h = await _count_usage_users(db, AgentUsageEvent, since=now - timedelta(days=1))
        harness_30d = await _count_usage_users(db, AgentUsageEvent, since=now - timedelta(days=30))
        weknora_daily = await fetch_weknora_daily_active_users(db)
        harness_daily = {row["date"]: row["active_users"] for row in await _harness_daily_active_users(db)}
        daily_active_users = [
            {
                "date": row["date"],
                "active_users": int(row["active_users"] or 0) + int(harness_daily.get(row["date"], 0)),
            }
            for row in weknora_daily
        ]
        return UserActivityStats(
            total_users=simple_sum(weknora_user_total(weknora_users=overview.users), harness_total),
            active_users_24h=simple_sum(
                await count_weknora_active_users(db, since=now - timedelta(days=1)),
                harness_24h,
            ),
            active_users_30d=simple_sum(
                await count_weknora_active_users(db, since=now - timedelta(days=30)),
                harness_30d,
            ),
            daily_active_users=daily_active_users,
        )

    except Exception as e:
        logger.error(f"Error getting user activity stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get user activity stats: {str(e)}")


# =============================================================================
# Tool Call Statistics - 工具调用统计
# =============================================================================


@dashboard.get("/stats/tools", response_model=ToolCallStats)
async def get_tool_call_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的工具调用统计。数据来自工具遥测事实表。"""
    try:
        from yuxi.storage.postgres.models_business import ToolUsageEvent

        now = utc_now()
        total_calls_result = await db.execute(
            _scope_column(select(func.count(ToolUsageEvent.id)), ToolUsageEvent.tenant_id)
        )
        total_calls = total_calls_result.scalar() or 0

        successful_calls_result = await db.execute(
            _scope_column(
                select(func.count(ToolUsageEvent.id)).where(ToolUsageEvent.status == "success"),
                ToolUsageEvent.tenant_id,
            )
        )
        successful_calls = successful_calls_result.scalar() or 0
        failed_calls = total_calls - successful_calls
        success_rate = round((successful_calls / total_calls * 100), 2) if total_calls > 0 else 0

        most_used_tools_result = await db.execute(
            _scope_column(
                select(ToolUsageEvent.tool_name, func.count(ToolUsageEvent.id).label("count"))
                .group_by(ToolUsageEvent.tool_name)
                .order_by(func.count(ToolUsageEvent.id).desc())
                .limit(10),
                ToolUsageEvent.tenant_id,
            )
        )
        most_used_tools = [{"tool_name": name, "count": count} for name, count in most_used_tools_result.all()]

        tool_errors_result = await db.execute(
            _scope_column(
                select(ToolUsageEvent.tool_name, func.count(ToolUsageEvent.id).label("error_count"))
                .where(ToolUsageEvent.status == "error")
                .group_by(ToolUsageEvent.tool_name),
                ToolUsageEvent.tenant_id,
            )
        )
        tool_error_distribution = {name: count for name, count in tool_errors_result.all()}

        daily_tool_calls = []
        for i in range(7):
            day_start = now - timedelta(days=i + 1)
            day_end = now - timedelta(days=i)
            daily_count_result = await db.execute(
                _scope_column(
                    select(func.count(ToolUsageEvent.id)).where(
                        ToolUsageEvent.occurred_at >= day_start,
                        ToolUsageEvent.occurred_at < day_end,
                    ),
                    ToolUsageEvent.tenant_id,
                )
            )
            daily_tool_calls.append(
                {"date": day_start.strftime("%Y-%m-%d"), "call_count": daily_count_result.scalar() or 0}
            )

        return ToolCallStats(
            total_calls=total_calls,
            successful_calls=successful_calls,
            failed_calls=failed_calls,
            success_rate=success_rate,
            most_used_tools=most_used_tools,
            tool_error_distribution=tool_error_distribution,
            daily_tool_calls=list(reversed(daily_tool_calls)),
        )

    except Exception as e:
        logger.error(f"Error getting tool call stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get tool call stats: {str(e)}")


# =============================================================================
# 知识库统计（当前 token 空间）
# =============================================================================


@dashboard.get("/stats/knowledge", response_model=KnowledgeStats)
async def get_knowledge_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的知识库统计"""
    try:
        wk = await fetch_weknora_knowledge_stats(db)
        return KnowledgeStats(
            total_databases=wk.total_databases,
            total_files=wk.total_files,
            total_nodes=wk.total_nodes,
            total_storage_size=wk.total_storage_size,
            databases_by_type=wk.databases_by_type,
            file_type_distribution=wk.file_type_distribution,
            split_by_system=True,
            source="weknora",
        )

    except Exception as e:
        logger.error(f"Error getting knowledge stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get knowledge stats: {str(e)}")


# =============================================================================
# 智能体分析（当前 token 空间）
# =============================================================================


@dashboard.get("/stats/agents", response_model=AgentAnalytics)
async def get_agent_analytics(
    start: str | None = Query(default=None, description="开始日期 YYYY-MM-DD，含当天"),
    end: str | None = Query(default=None, description="结束日期 YYYY-MM-DD，含当天"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的智能体分析。工作侧读日聚合，TOP 5 按 score。"""
    try:
        from yuxi.storage.postgres.models_business import AgentUsageDaily

        today = utc_now().date()
        start_date = datetime.strptime(start, "%Y-%m-%d").date() if start else today - timedelta(days=29)
        end_date = datetime.strptime(end, "%Y-%m-%d").date() if end else today
        agents_result = await db.execute(
            _scope_column(
                select(
                    AgentUsageDaily.agent_id,
                    func.coalesce(func.sum(AgentUsageDaily.session_count), 0).label("conversation_count"),
                    func.coalesce(func.sum(AgentUsageDaily.tool_call_count), 0).label("tool_usage_count"),
                    func.coalesce(func.sum(AgentUsageDaily.score), 0).label("score"),
                )
                .where(AgentUsageDaily.stat_date >= start_date, AgentUsageDaily.stat_date <= end_date)
                .group_by(AgentUsageDaily.agent_id),
                AgentUsageDaily.tenant_id,
            )
        )
        agents = agents_result.all()
        total_agents = len(agents)
        agent_conversation_counts = [
            {"agent_id": agent_id, "conversation_count": int(count or 0)}
            for agent_id, count, _tool_count, _score in agents
        ]
        agent_tool_usage = [
            {"agent_id": agent_id, "tool_usage_count": int(tool_count or 0)}
            for agent_id, _count, tool_count, _score in agents
        ]
        top_performing_agents = [
            {
                "agent_id": agent_id,
                "conversation_count": int(count or 0),
                "score": float(score or 0),
            }
            for agent_id, count, _tool_count, score in agents
        ]
        top_performing_agents.sort(key=lambda item: item["score"], reverse=True)
        top_performing_agents = top_performing_agents[:5]

        agent_slugs = [agent_id for agent_id, *_rest in agents if agent_id]
        agent_names = {}
        if agent_slugs:
            agent_repo = AgentRepository(db)
            agent_names = {agent.slug: agent.name for agent in await agent_repo.list_by_slugs(agent_slugs)}

        wk = await fetch_weknora_agent_stats(db)
        wk_agents = wk.total_agents if wk else 0
        wk_counts = wk.agent_conversation_counts if wk else []
        wk_names = wk.agent_names if wk else {}

        return AgentAnalytics(
            total_agents=simple_sum(total_agents, wk_agents) if wk is not None else total_agents,
            agent_conversation_counts=agent_conversation_counts,
            agent_tool_usage=agent_tool_usage,
            top_performing_agents=top_performing_agents,
            agent_names=agent_names,
            split_by_system=wk is not None,
            yuxi_total_agents=total_agents,
            weknora_total_agents=wk_agents,
            weknora_agent_conversation_counts=wk_counts,
            weknora_agent_names=wk_names,
        )

    except Exception as e:
        logger.error(f"Error getting agent analytics: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get agent analytics: {str(e)}")


# =============================================================================
# 基础统计（当前 token 空间）
# =============================================================================


@dashboard.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的基础统计。工作侧会话和消息读日聚合。"""
    from yuxi.storage.postgres.models_business import AgentUsageDaily, AgentUsageEvent

    try:
        daily_result = await db.execute(
            _scope_column(
                select(
                    func.coalesce(func.sum(AgentUsageDaily.session_count), 0),
                    func.coalesce(func.sum(AgentUsageDaily.message_count), 0),
                ),
                AgentUsageDaily.tenant_id,
            )
        )
        total_conversations, total_messages = daily_result.one()
        total_conversations = int(total_conversations or 0)
        total_messages = int(total_messages or 0)
        active_since = utc_now() - timedelta(days=1)
        active_result = await db.execute(
            _scope_column(
                select(func.count(distinct(AgentUsageEvent.session_id))).where(
                    AgentUsageEvent.event_type == "start",
                    AgentUsageEvent.occurred_at >= active_since,
                    AgentUsageEvent.session_id.isnot(None),
                ),
                AgentUsageEvent.tenant_id,
            )
        )
        active_conversations = int(active_result.scalar() or 0)
        harness_users = await _count_usage_users(db, AgentUsageEvent)
        total_users = harness_users

        payload = {
            "total_conversations": total_conversations,
            "active_conversations": active_conversations,
            "total_messages": total_messages,
            "total_users": total_users,
        }
        wk = await fetch_weknora_overview(db)
        payload.update(
            {
                "split_by_system": True,
                "weknora_sessions": wk.sessions,
                "yuxi_conversations": total_conversations,
                "total_conversations": simple_sum(wk.sessions, total_conversations),
                "weknora_messages": wk.messages,
                "yuxi_messages": total_messages,
                "total_messages": simple_sum(wk.messages, total_messages),
                "total_users": simple_sum(weknora_user_total(weknora_users=wk.users), total_users),
            }
        )
        return payload
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get dashboard stats: {str(e)}")


# =============================================================================
# 调用分析时间序列统计（当前 token 空间）
# =============================================================================


class TimeSeriesStats(BaseModel):
    """时间序列统计数据"""

    data: list[dict]  # [{"date": "2024-01-01", "data": {"item1": 50, "item2": 30}, "total": 80}, ...]
    categories: list[str]  # 所有类别名称
    total_count: int
    average_count: float
    peak_count: int
    peak_date: str
    agent_names: dict[str, str] | None = None  # agent_id / model_id -> 展示名映射


@dashboard.get("/stats/calls/timeseries", response_model=TimeSeriesStats)
async def get_call_timeseries_stats(
    type: str = "models",  # models/agents/tokens/tools
    time_range: str = "14days",  # 14hours/14days/14weeks
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_admin_user),
):
    """获取当前 token 空间的调用分析时间序列统计。读遥测事实表。"""
    try:
        from yuxi.storage.postgres.models_business import AgentUsageEvent, TokenUsageEvent, ToolUsageEvent

        # 计算时间范围（使用北京时间 UTC+8）
        local_now = shanghai_now()

        if time_range == "14hours":
            intervals = 14
            # 包含当前小时：从13小时前开始
            local_start = local_now - timedelta(hours=intervals - 1)
            local_start = local_start.replace(minute=0, second=0, microsecond=0)
            start_time = local_start.astimezone(UTC)
            base_local_time = local_start
        elif time_range == "14weeks":
            intervals = 14
            # 包含当前周：从13周前开始，并对齐到当周周一 00:00
            local_start = local_now - timedelta(weeks=intervals - 1)
            local_start = local_start - timedelta(days=local_start.weekday())
            local_start = local_start.replace(hour=0, minute=0, second=0, microsecond=0)
            start_time = local_start.astimezone(UTC)
            base_local_time = local_start
        else:  # 14days (default)
            intervals = 14
            # 包含当前天：从13天前开始
            local_start = local_now - timedelta(days=intervals - 1)
            local_start = local_start.replace(hour=0, minute=0, second=0, microsecond=0)
            start_time = local_start.astimezone(UTC)
            base_local_time = local_start

        query_start_time = start_time

        if type == "models":
            group_format = _get_time_group_format(TokenUsageEvent.occurred_at, time_range)
            query_result = await db.execute(
                _scope_column(
                    select(
                        group_format.label("date"),
                        func.count(TokenUsageEvent.id).label("count"),
                        TokenUsageEvent.model.label("category"),
                    )
                    .where(TokenUsageEvent.occurred_at >= query_start_time)
                    .group_by(group_format, TokenUsageEvent.model)
                    .order_by(group_format),
                    TokenUsageEvent.tenant_id,
                )
            )
            query = query_result.all()
        elif type == "agents":
            group_format = _get_time_group_format(AgentUsageEvent.occurred_at, time_range)
            query_result = await db.execute(
                _scope_column(
                    select(
                        group_format.label("date"),
                        func.count(AgentUsageEvent.id).label("count"),
                        AgentUsageEvent.agent_id.label("category"),
                    )
                    .where(
                        AgentUsageEvent.occurred_at >= query_start_time,
                        AgentUsageEvent.event_type == "start",
                    )
                    .group_by(group_format, AgentUsageEvent.agent_id)
                    .order_by(group_format),
                    AgentUsageEvent.tenant_id,
                )
            )
            query = list(query_result.all()) + await fetch_weknora_agent_call_buckets(
                db, time_range=time_range, start_time=query_start_time
            )
        elif type == "tokens":
            group_format = _get_time_group_format(TokenUsageEvent.occurred_at, time_range)
            token_rows = (
                await db.execute(
                    _scope_column(
                        select(
                            group_format.label("date"),
                            TokenUsageEvent.model.label("model"),
                            func.coalesce(func.sum(TokenUsageEvent.prompt_tokens), 0).label("input_tokens"),
                            func.coalesce(func.sum(TokenUsageEvent.completion_tokens), 0).label("output_tokens"),
                            func.coalesce(func.sum(TokenUsageEvent.total_tokens), 0).label("total_tokens"),
                        )
                        .where(TokenUsageEvent.occurred_at >= query_start_time)
                        .group_by(group_format, TokenUsageEvent.model)
                        .order_by(group_format),
                        TokenUsageEvent.tenant_id,
                    )
                )
            ).all()
            token_model_names = await _model_display_names(db, [row.model or "" for row in token_rows])
            results = []
            token_models: dict[str, dict[str, dict[str, int]]] = {}
            for row in token_rows:
                model_id = row.model or "unknown"
                model_label = token_model_names.get(model_id) or (
                    "unknown" if model_id == "unknown" else model_id
                )
                prompt = int(row.input_tokens or 0)
                completion = int(row.output_tokens or 0)
                total = int(row.total_tokens or 0)
                if prompt == 0 and completion == 0 and total > 0:
                    prompt = total
                date_key = row.date
                bucket = token_models.setdefault(date_key, {})
                model_bucket = bucket.setdefault(model_label, {"input": 0, "output": 0})
                model_bucket["input"] += prompt
                model_bucket["output"] += completion
                results.append(SimpleNamespace(date=date_key, category="input", count=prompt))
                results.append(SimpleNamespace(date=date_key, category="output", count=completion))
        elif type == "tools":
            group_format = _get_time_group_format(ToolUsageEvent.occurred_at, time_range)
            query_result = await db.execute(
                _scope_column(
                    select(
                        group_format.label("date"),
                        func.count(ToolUsageEvent.id).label("count"),
                        ToolUsageEvent.tool_name.label("category"),
                    )
                    .where(ToolUsageEvent.occurred_at >= query_start_time)
                    .group_by(group_format, ToolUsageEvent.tool_name)
                    .order_by(group_format),
                    ToolUsageEvent.tenant_id,
                )
            )
            query = query_result.all()
        else:
            raise HTTPException(status_code=422, detail=f"Invalid type: {type}")

        if type != "tokens":
            results = query

        # 处理堆叠数据格式
        # 首先收集所有类别
        categories = set()
        for result in results:
            if hasattr(result, "category") and result.category:
                categories.add(result.category)

        # 如果没有类别数据，提供默认类别
        categories = sorted(list(categories))

        agent_names = None
        if type == "models" and categories:
            agent_names = await _model_display_names(db, categories)
        elif type == "agents" and categories:
            agent_slugs = [c for c in categories if c]
            if agent_slugs:
                agent_repo = AgentRepository(db)
                agent_names = {agent.slug: agent.name for agent in await agent_repo.list_by_slugs(agent_slugs)}
                missing = [agent_id for agent_id in agent_slugs if agent_id not in agent_names]
                if missing:
                    agent_names.update(await fetch_weknora_agent_names(db, missing))

        # 重新组织数据：按时间点分组每个类别的数据
        time_data = {}

        def normalize_week_key(raw_key: str) -> str:
            base_date = datetime.strptime(f"{raw_key}-1", "%Y-%W-%w")
            iso_year, iso_week, _ = base_date.isocalendar()
            return f"{iso_year}-{iso_week:02d}"

        if type == "tokens" and time_range == "14weeks":
            token_models = {normalize_week_key(key): value for key, value in token_models.items()}

        for result in results:
            date_key = result.date
            if time_range == "14weeks":
                date_key = normalize_week_key(date_key)
            category = getattr(result, "category", "unknown")
            count = result.count

            if date_key not in time_data:
                time_data[date_key] = {}

            if type == "tokens":
                time_data[date_key][category] = time_data[date_key].get(category, 0) + count
            else:
                time_data[date_key][category] = count

        # 填充缺失的时间点（使用北京时间）
        data = []
        # 从起始点开始（北京时间）
        current_time = base_local_time

        if time_range == "14hours":
            delta = timedelta(hours=1)
        elif time_range == "14weeks":
            delta = timedelta(weeks=1)
        else:
            delta = timedelta(days=1)

        for i in range(intervals):
            if time_range == "14hours":
                date_key = current_time.strftime("%Y-%m-%d %H:00")
            elif time_range == "14weeks":
                iso_year, iso_week, _ = current_time.isocalendar()
                date_key = f"{iso_year}-{iso_week:02d}"
            else:
                date_key = current_time.strftime("%Y-%m-%d")

            # 获取该时间点的数据
            day_data = time_data.get(date_key, {})
            day_total = sum(day_data.values())

            # 确保所有类别都有值（缺失的补0）
            for category in categories:
                if category not in day_data:
                    day_data[category] = 0

            point = {"date": date_key, "data": day_data, "total": day_total}
            if type == "tokens":
                point["models"] = token_models.get(date_key, {})
            data.append(point)
            current_time += delta

        # 计算统计指标
        if type == "tools":
            # 工具总数与工具统计卡一致，读全部工具事实，不限时间窗口。
            total_count_result = await db.execute(
                _scope_column(select(func.count(ToolUsageEvent.id)), ToolUsageEvent.tenant_id)
            )
            total_count = total_count_result.scalar() or 0
        else:
            # 其他类型使用时间序列数据的总和
            total_count = sum(item["total"] for item in data)

        average_count = round(total_count / intervals, 2) if intervals > 0 else 0
        peak_data = max(data, key=lambda x: x["total"]) if data else {"total": 0, "date": ""}

        return TimeSeriesStats(
            data=data,
            categories=categories,
            total_count=total_count,
            average_count=average_count,
            peak_count=peak_data["total"],
            peak_date=peak_data["date"],
            agent_names=agent_names,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting call timeseries stats: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Failed to get call timeseries stats: {str(e)}")
