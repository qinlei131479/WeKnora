from __future__ import annotations

from datetime import date, datetime

import pytest
import pytest_asyncio
from fastapi import HTTPException
from fastapi.routing import APIRoute
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from server.routers.dashboard_router import (
    dashboard,
    get_all_conversations,
    get_call_timeseries_stats,
    get_conversation_detail,
    get_dashboard_stats,
    get_knowledge_stats,
    get_tool_call_stats,
    get_user_activity_stats,
)
from server.utils.auth_middleware import get_admin_user, get_required_user
from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal
from yuxi.storage.postgres.models_business import (
    AgentUsageDaily,
    Base,
    Conversation,
    Message,
    ToolCall,
    TokenUsageEvent,
    ToolUsageEvent,
    User,
)
from yuxi.utils.datetime_utils import UTC, utc_now_naive

pytestmark = [pytest.mark.asyncio, pytest.mark.unit]


@pytest_asyncio.fixture()
async def dashboard_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        superadmin = User(
            username="Super Admin",
            uid="superadmin",
            password_hash="$argon2id$placeholder",
            role="superadmin",
        )
        admin_a = User(
            username="Admin A",
            uid="admin_a",
            password_hash="$argon2id$placeholder",
            role="admin",
        )
        user_a = User(
            username="User A",
            uid="user_a",
            password_hash="$argon2id$placeholder",
            role="user",
        )
        admin_b = User(
            username="Admin B",
            uid="admin_b",
            password_hash="$argon2id$placeholder",
            role="admin",
        )
        user_b = User(
            username="User B",
            uid="user_b",
            password_hash="$argon2id$placeholder",
            role="user",
        )
        now = utc_now_naive()
        conversation_a = Conversation(
            thread_id="thread-a",
            uid="user_a",
            agent_id="agent-shared",
            title="Dept A conversation",
            status="active",
            created_at=now,
            updated_at=now,
            tenant_id=10000,
        )
        conversation_b = Conversation(
            thread_id="thread-b",
            uid="user_b",
            agent_id="agent-shared",
            title="Dept B conversation",
            status="active",
            created_at=now,
            updated_at=now,
            tenant_id=20000,
        )
        message_a = Message(conversation=conversation_a, role="assistant", content="A", created_at=now)
        message_b = Message(conversation=conversation_b, role="assistant", content="B", created_at=now)
        tool_call_a = ToolCall(message=message_a, tool_name="dept_a_tool", status="success", created_at=now)
        tool_call_b = ToolCall(message=message_b, tool_name="dept_b_tool", status="success", created_at=now)
        daily_a = AgentUsageDaily(
            stat_date=date.today(),
            tenant_id=10000,
            agent_id="agent-shared",
            session_count=1,
            message_count=1,
        )
        tool_event_a = ToolUsageEvent(
            event_id="tool-a",
            tenant_id=10000,
            uid="user_a",
            agent_id="agent-shared",
            tool_name="dept_a_tool",
            status="success",
            occurred_at=now,
        )
        tool_event_b = ToolUsageEvent(
            event_id="tool-b",
            tenant_id=20000,
            uid="user_b",
            agent_id="agent-shared",
            tool_name="dept_b_tool",
            status="success",
            occurred_at=now,
        )
        token_event_a = TokenUsageEvent(
            event_id="token-a",
            tenant_id=10000,
            uid="user_a",
            agent_id="agent-shared",
            model="model-a",
            prompt_tokens=30,
            completion_tokens=12,
            total_tokens=42,
            occurred_at=datetime(2026, 9, 24, 2, 30, tzinfo=UTC).replace(tzinfo=None),
        )
        token_event_b = TokenUsageEvent(
            event_id="token-b",
            tenant_id=20000,
            uid="user_b",
            agent_id="agent-shared",
            model="model-b",
            prompt_tokens=90,
            completion_tokens=8,
            total_tokens=98,
            occurred_at=datetime(2026, 9, 24, 2, 30, tzinfo=UTC).replace(tzinfo=None),
        )
        db.add_all(
            [
                superadmin,
                admin_a,
                user_a,
                admin_b,
                user_b,
                conversation_a,
                conversation_b,
                message_a,
                message_b,
                tool_call_a,
                tool_call_b,
                daily_a,
                tool_event_a,
                tool_event_b,
                token_event_a,
                token_event_b,
            ]
        )
        await db.commit()
        for item in [
            superadmin,
            admin_a,
            user_a,
            admin_b,
            user_b,
            conversation_a,
            conversation_b,
        ]:
            await db.refresh(item)
        yield {"db": db, "superadmin": superadmin, "admin_a": admin_a, "user_a": user_a}
    await engine.dispose()


async def test_dashboard_routes_require_admin():
    dashboard_routes = [route for route in dashboard.routes if isinstance(route, APIRoute)]

    assert dashboard_routes
    for route in dashboard_routes:
        dependency_calls = {dependency.call for dependency in route.dependant.dependencies}
        assert get_admin_user in dependency_calls


async def test_dashboard_allows_department_admin(dashboard_session):
    user = await get_required_user(dashboard_session["admin_a"])
    assert user.uid == "admin_a"


async def test_conversation_list_without_tenant_is_empty(dashboard_session):
    bind_tenant_principal(None)
    response = await get_all_conversations(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])

    assert response == []


async def test_conversation_detail_without_tenant_is_hidden(dashboard_session):
    bind_tenant_principal(None)
    with pytest.raises(HTTPException) as exc:
        await get_conversation_detail(
            "thread-b",
            db=dashboard_session["db"],
            current_user=dashboard_session["superadmin"],
        )

    assert exc.value.status_code == 404


async def test_user_activity_stats_without_tenant_are_zero(dashboard_session):
    bind_tenant_principal(None)
    stats = await get_user_activity_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])

    assert stats.total_users == 0
    assert stats.active_users_24h == 0
    assert stats.active_users_30d == 0


async def test_tool_stats_without_tenant_are_empty(dashboard_session):
    bind_tenant_principal(None)
    stats = await get_tool_call_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])

    assert stats.total_calls == 0
    assert stats.successful_calls == 0
    assert stats.most_used_tools == []


async def test_token_timeseries_returns_input_output_and_model_detail(
    dashboard_session,
    monkeypatch: pytest.MonkeyPatch,
):
    from sqlalchemy import func

    async def fake_model_names(_db, model_ids):
        return {model_id: f"{model_id}-label" for model_id in model_ids}

    def fake_time_group(_column, _time_range):
        return func.strftime("%Y-%m-%d", _column)

    monkeypatch.setattr(
        "server.routers.dashboard_router.shanghai_now",
        lambda: datetime(2026, 9, 24, 10, 30, tzinfo=UTC),
    )
    monkeypatch.setattr("server.routers.dashboard_router._model_display_names", fake_model_names)
    monkeypatch.setattr("server.routers.dashboard_router._get_time_group_format", fake_time_group)
    bind_tenant_principal(TenantPrincipal(uid="superadmin", tenant_id=10000, role="superadmin"))
    try:
        stats = await get_call_timeseries_stats(
            type="tokens",
            time_range="14days",
            db=dashboard_session["db"],
            current_user=dashboard_session["superadmin"],
        )
    finally:
        bind_tenant_principal(None)

    assert stats.categories == ["input", "output"]
    assert stats.total_count == 42
    today = [item for item in stats.data if item["total"] > 0]
    assert len(today) == 1
    assert today[0]["data"] == {"input": 30, "output": 12}
    assert today[0]["models"] == {"model-a-label": {"input": 30, "output": 12}}


async def test_dashboard_filters_to_token_tenant(dashboard_session, monkeypatch: pytest.MonkeyPatch):
    from yuxi.dashboard.stats import WeKnoraOverview

    async def fake_overview(_db):
        return WeKnoraOverview(users=1, sessions=1, messages=1, agents=1)

    async def fake_active(_db, *, since, until=None):
        return 1

    async def fake_daily(_db, *, days=7):
        return [{"date": "2026-09-01", "active_users": 1}]

    monkeypatch.setattr("server.routers.dashboard_router.fetch_weknora_overview", fake_overview)
    monkeypatch.setattr("server.routers.dashboard_router.count_weknora_active_users", fake_active)
    monkeypatch.setattr("server.routers.dashboard_router.fetch_weknora_daily_active_users", fake_daily)
    bind_tenant_principal(TenantPrincipal(uid="superadmin", tenant_id=10000, role="superadmin"))
    try:
        conversations = await get_all_conversations(
            db=dashboard_session["db"], current_user=dashboard_session["superadmin"]
        )
        stats = await get_user_activity_stats(
            db=dashboard_session["db"], current_user=dashboard_session["superadmin"]
        )
        tools = await get_tool_call_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])
    finally:
        bind_tenant_principal(None)

    assert {item["thread_id"] for item in conversations} == {"thread-a"}
    assert stats.total_users == 1
    assert stats.active_users_24h == 1
    assert tools.total_calls == 1
    assert {tool["tool_name"] for tool in tools.most_used_tools} == {"dept_a_tool"}


async def test_p6_dashboard_split_does_not_count_h_users(dashboard_session, monkeypatch: pytest.MonkeyPatch):
    from yuxi.dashboard.stats import WeKnoraKnowledgeStats, WeKnoraOverview

    bind_tenant_principal(TenantPrincipal(uid="superadmin", tenant_id=10000, role="superadmin"))

    async def fake_overview(_db):
        return WeKnoraOverview(users=4, sessions=7, messages=11, agents=2)

    async def fake_knowledge(_db):
        return WeKnoraKnowledgeStats(total_databases=3, total_files=9)

    async def fake_active(_db, *, since, until=None):
        return 2

    async def fake_daily(_db, *, days=7):
        return [{"date": "2026-09-01", "active_users": 1}]

    monkeypatch.setattr("server.routers.dashboard_router.fetch_weknora_overview", fake_overview)
    monkeypatch.setattr("server.routers.dashboard_router.fetch_weknora_knowledge_stats", fake_knowledge)
    monkeypatch.setattr("server.routers.dashboard_router.count_weknora_active_users", fake_active)
    monkeypatch.setattr("server.routers.dashboard_router.fetch_weknora_daily_active_users", fake_daily)
    try:
        basic = await get_dashboard_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])
        users = await get_user_activity_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])
        knowledge = await get_knowledge_stats(db=dashboard_session["db"], current_user=dashboard_session["superadmin"])
    finally:
        bind_tenant_principal(None)

    assert basic["split_by_system"] is True
    assert basic["weknora_sessions"] == 7
    assert basic["yuxi_conversations"] == 1
    assert basic["total_conversations"] == 8
    assert basic["total_users"] == 4
    assert users.total_users == 4
    assert users.active_users_24h == 2
    assert knowledge.source == "weknora"
    assert knowledge.total_databases == 3
