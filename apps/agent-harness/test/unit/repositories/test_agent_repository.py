from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from yuxi.repositories.agent_repository import (
    DEFAULT_AGENT_DESCRIPTION,
    DEFAULT_AGENT_SLUG,
    DEFAULT_SHARE_CONFIG,
    GENERAL_PURPOSE_AGENT_DESCRIPTION,
    GENERAL_PURPOSE_AGENT_NAME,
    GENERAL_PURPOSE_AGENT_SLUG,
    QUOTE_AGENT_SLUG,
    SUB_AGENT_BACKEND_ID,
    AgentRepository,
    build_builtin_agent,
    get_builtin_agent_spec,
    is_builtin_agent,
    is_builtin_virtual,
    user_can_access_agent,
    user_can_manage_agent,
)
from yuxi.storage.postgres.models_business import Agent, User


class FakeDb:
    def __init__(self):
        self.added = None
        self.commit = AsyncMock()
        self.refresh = AsyncMock()

    def add(self, item):
        self.added = item

    async def execute(self, _stmt):
        return EmptyResult()


class EmptyResult:
    def scalars(self):
        return self

    def all(self):
        return []

    def first(self):
        return None

    def scalar_one_or_none(self):
        return None


def test_builtin_identity_uses_persisted_flag():
    assert is_builtin_agent(SimpleNamespace(is_builtin=True)) is True
    assert is_builtin_agent(SimpleNamespace(is_builtin=False)) is False
    assert is_builtin_agent(SimpleNamespace()) is False


@pytest.mark.asyncio
async def test_ensure_default_agent_uses_builtin_definition_without_persisting(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)

    async def get_by_slug(_slug):
        return None

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)

    agent = await repo.ensure_default_agent()

    assert agent.slug == DEFAULT_AGENT_SLUG
    assert agent.description == DEFAULT_AGENT_DESCRIPTION
    assert agent.config_json == {"context": {}}
    assert agent.is_builtin is True
    assert is_builtin_virtual(agent) is True
    # 内置智能体不落库：未保存过的租户读到的是 YAML 定义。
    assert db.added is None
    db.commit.assert_not_awaited()
    db.refresh.assert_not_awaited()


@pytest.mark.asyncio
async def test_ensure_default_agent_prefers_saved_tenant_override(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)
    override = SimpleNamespace(
        slug=DEFAULT_AGENT_SLUG,
        tenant_id=7,
        is_builtin=True,
        description="租户定制描述",
    )

    async def get_by_slug(_slug):
        return override

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)

    result = await repo.ensure_default_agent(created_by="admin")

    assert result is override
    assert db.added is None


@pytest.mark.asyncio
async def test_ensure_general_purpose_subagent_uses_builtin_definition(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)

    async def get_by_slug(_slug):
        return None

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)

    agent = await repo.ensure_general_purpose_subagent(created_by="system")

    assert agent.slug == GENERAL_PURPOSE_AGENT_SLUG
    assert agent.name == GENERAL_PURPOSE_AGENT_NAME
    assert agent.description == GENERAL_PURPOSE_AGENT_DESCRIPTION
    assert agent.backend_id == SUB_AGENT_BACKEND_ID
    assert agent.is_subagent is True
    assert agent.is_builtin is True
    assert agent.is_default is False
    assert agent.share_config == DEFAULT_SHARE_CONFIG
    assert db.added is None


def test_builtin_definition_overrides_legacy_row_but_keeps_runtime_config():
    """YAML 声明的键以 YAML 为准；部署侧绑定的 model/knowledges 等键仍从历史目录行保留。"""
    legacy = Agent(
        slug=QUOTE_AGENT_SLUG,
        backend_id="ChatbotAgent",
        name="报价评估",
        config_json={
            "context": {
                "system_prompt": "旧提示词",
                "model": "model-uuid-001",
                "knowledges": ["kb-001"],
                "max_execution_steps": 42,
            }
        },
        share_config=DEFAULT_SHARE_CONFIG.copy(),
    )
    spec = get_builtin_agent_spec(QUOTE_AGENT_SLUG)
    agent = build_builtin_agent(spec, legacy)
    context = agent.config_json["context"]

    assert context["system_prompt"].startswith("你是「报价评估」智能体")
    assert context["skills"] == ["quote", "knowledge-base", "xlsx"]
    assert context["subagents"] == ["general-purpose"]
    assert context["summary_prompt"].strip()
    # 部署侧绑定值不被 YAML 抹掉
    assert context["model"] == "model-uuid-001"
    assert context["knowledges"] == ["kb-001"]
    assert context["max_execution_steps"] == 42


@pytest.mark.asyncio
async def test_saving_builtin_agent_creates_tenant_override_row(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)

    async def get_by_slug(_slug):
        return None

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)
    monkeypatch.setattr("yuxi.repositories.agent_repository.stamp_tenant_id", lambda: 7)

    virtual = await repo.ensure_quote_agent()
    assert is_builtin_virtual(virtual) is True

    saved = await repo.update(
        virtual,
        config_json={"context": {"model": "model-1", "skills": ["quote"]}},
        updated_by="admin",
    )

    assert saved is db.added
    assert saved.slug == virtual.slug
    assert saved.tenant_id == 7
    assert saved.is_builtin is True
    assert saved.config_json == {"context": {"model": "model-1", "skills": ["quote"]}}
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_agent_defaults_to_creator_read_scope_without_manage_scope(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)

    async def fake_unique_slug(_slug, _name):
        return "personal-bot"

    monkeypatch.setattr(repo, "_unique_slug", fake_unique_slug)

    agent = await repo.create(
        name="Personal Bot",
        backend_id="ChatbotAgent",
        slug="personal-bot",
        created_by="user",
    )

    assert agent.share_config == {
        "version": 2,
        "read_scope": {"access_level": "user", "department_ids": [], "user_uids": ["user"]},
        "manage_scope": None,
    }
    assert db.added is agent


@pytest.mark.asyncio
async def test_set_default_is_limited_to_default_chatbot(monkeypatch):
    repo = AgentRepository(FakeDb())

    with pytest.raises(ValueError, match="默认智能体已固定为内置智能助手"):
        await repo.set_default(agent=SimpleNamespace(slug="deep-research", is_subagent=False))

    with pytest.raises(ValueError, match="默认智能体已固定为内置智能助手"):
        await repo.set_default(agent=SimpleNamespace(slug="custom-bot", is_subagent=False))


@pytest.mark.asyncio
async def test_create_agent_allows_same_explicit_share_scope_for_normal_user(monkeypatch):
    db = FakeDb()
    repo = AgentRepository(db)

    async def fake_unique_slug(_slug, _name):
        return "personal-bot"

    monkeypatch.setattr(repo, "_unique_slug", fake_unique_slug)
    agent = await repo.create(
        name="Personal Bot",
        backend_id="ChatbotAgent",
        slug="personal-bot",
        share_config={
            "version": 2,
            "read_scope": {"access_level": "global"},
            "manage_scope": None,
        },
        created_by="user",
    )

    assert agent.share_config == DEFAULT_SHARE_CONFIG


def test_user_shared_agent_is_manageable_for_normal_user():
    user = User(username="user", uid="user", password_hash="x", role="user", department_id=1)
    agent = Agent(
        slug="shared-bot",
        name="Shared Bot",
        backend_id="ChatbotAgent",
        created_by="other",
        share_config={
            "version": 2,
            "read_scope": {"access_level": "user", "department_ids": [], "user_uids": ["user"]},
            "manage_scope": {"access_level": "user", "department_ids": [], "user_uids": ["user"]},
        },
    )

    assert user_can_access_agent(user, agent) is True
    assert user_can_manage_agent(user, agent) is True


def test_readonly_global_agent_manageable_for_owner_and_admin():
    agent = Agent(
        slug="deep-research",
        name="深度研究",
        backend_id="ChatbotAgent",
        created_by="owner-1",
        share_config=DEFAULT_SHARE_CONFIG,
    )
    owner = User(username="owner", uid="owner-1", password_hash="x", role="user")
    admin = User(username="admin", uid="admin-1", password_hash="x", role="admin")
    reader = User(username="reader", uid="reader-1", password_hash="x", role="user")

    assert user_can_manage_agent(owner, agent) is True
    assert user_can_manage_agent(admin, agent) is True
    assert user_can_access_agent(reader, agent) is True
    assert user_can_manage_agent(reader, agent) is False


@pytest.mark.asyncio
async def test_delegated_manager_update_preserves_shared_agent_acl():
    db = FakeDb()
    repo = AgentRepository(db)
    share_config = {
        "version": 2,
        "read_scope": {"access_level": "user", "user_uids": ["manager"]},
        "manage_scope": {"access_level": "user", "user_uids": ["manager"]},
    }
    agent = SimpleNamespace(
        slug="shared-bot",
        backend_id="ChatbotAgent",
        share_config=share_config,
        created_by="owner",
        updated_by=None,
        updated_at=None,
        name="Shared Bot",
        description="",
        icon=None,
        pics=[],
        config_json={"context": {"model": "model-1"}},
    )
    await repo.update(
        agent,
        share_config=share_config,
        updated_by="manager",
    )

    assert agent.share_config["read_scope"]["user_uids"] == ["manager"]
    assert agent.share_config["manage_scope"]["user_uids"] == ["manager"]


@pytest.mark.asyncio
async def test_delegated_manager_can_update_agent_acl_with_standard_validation():
    db = FakeDb()
    repo = AgentRepository(db)
    agent = SimpleNamespace(
        slug="shared-bot",
        backend_id="ChatbotAgent",
        share_config={
            "version": 2,
            "read_scope": {"access_level": "user", "user_uids": ["manager"]},
            "manage_scope": {"access_level": "user", "user_uids": ["manager"]},
        },
        created_by="owner",
        updated_by=None,
        updated_at=None,
        name="Shared Bot",
        description="",
        icon=None,
        pics=[],
        config_json={"context": {"model": "model-1"}},
    )
    await repo.update(
        agent,
        share_config={
            "version": 2,
            "read_scope": {"access_level": "global"},
            "manage_scope": None,
        },
        updated_by="manager",
    )

    assert agent.share_config == DEFAULT_SHARE_CONFIG
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_normal_user_can_update_read_scope_without_granting_manage_scope():
    db = FakeDb()
    repo = AgentRepository(db)
    agent = SimpleNamespace(
        slug="personal-bot",
        backend_id="ChatbotAgent",
        share_config={
            "version": 2,
            "read_scope": {"access_level": "user", "user_uids": ["manager"]},
            "manage_scope": {"access_level": "user", "user_uids": ["manager"]},
        },
        created_by="manager",
        updated_by=None,
        updated_at=None,
        name="Personal Bot",
        description="",
        icon=None,
        pics=[],
        config_json={"context": {"model": "model-1"}},
    )
    await repo.update(
        agent,
        share_config={
            "version": 2,
            "read_scope": {"access_level": "user", "user_uids": ["manager", "reader"]},
            "manage_scope": None,
        },
        updated_by="manager",
    )

    assert agent.share_config == {
        "version": 2,
        "read_scope": {
            "access_level": "user",
            "department_ids": [],
            "user_uids": ["manager", "reader"],
        },
        "manage_scope": None,
    }


@pytest.mark.asyncio
async def test_normal_user_can_update_agent_with_equivalent_v2_share_config():
    db = FakeDb()
    repo = AgentRepository(db)
    share_config = {
        "version": 2,
        "read_scope": {"access_level": "user", "user_uids": ["manager"]},
        "manage_scope": {"access_level": "user", "user_uids": ["manager"]},
    }
    agent = SimpleNamespace(
        slug="shared-bot",
        backend_id="ChatbotAgent",
        share_config=share_config,
        created_by="manager",
        updated_by=None,
        updated_at=None,
        name="Legacy Bot",
        description="",
        icon=None,
        pics=[],
        config_json={"context": {"model": "model-1"}},
    )
    await repo.update(
        agent,
        name="Renamed Bot",
        share_config=share_config,
        updated_by="manager",
    )

    assert agent.name == "Renamed Bot"
    assert agent.share_config["read_scope"] == {
        "access_level": "user",
        "department_ids": [],
        "user_uids": ["manager"],
    }
    assert agent.share_config["manage_scope"] == {
        "access_level": "user",
        "department_ids": [],
        "user_uids": ["manager"],
    }
