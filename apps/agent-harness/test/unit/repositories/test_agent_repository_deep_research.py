from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from yuxi.repositories.agent_repository import (
    DEEP_RESEARCH_AGENT_SLUG,
    DEFAULT_AGENT_BACKEND_ID,
    FACT_VERIFIER_AGENT_SLUG,
    RESEARCH_EXPLORER_AGENT_SLUG,
    SUB_AGENT_BACKEND_ID,
    AgentRepository,
    build_builtin_agent,
    get_builtin_agent_spec,
)


class CollectingDb:
    def __init__(self):
        self.added: list = []
        self.commit = AsyncMock()
        self.refresh = AsyncMock()

    def add(self, item):
        self.added.append(item)


def _virtual(slug: str):
    spec = get_builtin_agent_spec(slug)
    assert spec is not None, f"YAML 里缺少内置智能体定义：{slug}"
    return build_builtin_agent(spec)


@pytest.mark.asyncio
async def test_ensure_deep_research_agents_resolves_builtin_definitions(monkeypatch):
    db = CollectingDb()
    repo = AgentRepository(db)
    seen: list[str] = []

    async def get_by_slug(slug):
        seen.append(slug)
        return _virtual(slug)

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)

    await repo.ensure_deep_research_agents()

    assert seen == [
        RESEARCH_EXPLORER_AGENT_SLUG,
        FACT_VERIFIER_AGENT_SLUG,
        DEEP_RESEARCH_AGENT_SLUG,
    ]
    # 定义来自 YAML，不落库。
    assert db.added == []
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_ensure_deep_research_agents_is_idempotent(monkeypatch):
    db = CollectingDb()
    repo = AgentRepository(db)

    async def get_by_slug(slug):
        return _virtual(slug)

    monkeypatch.setattr(repo, "get_by_slug", get_by_slug)

    await repo.ensure_deep_research_agents()
    await repo.ensure_deep_research_agents()

    assert db.added == []
    db.commit.assert_not_awaited()


def test_deep_research_builtin_definition_wires_subagents_and_skills():
    context = _virtual(DEEP_RESEARCH_AGENT_SLUG).config_json["context"]

    assert _virtual(DEEP_RESEARCH_AGENT_SLUG).backend_id == DEFAULT_AGENT_BACKEND_ID
    assert _virtual(RESEARCH_EXPLORER_AGENT_SLUG).backend_id == SUB_AGENT_BACKEND_ID
    assert _virtual(FACT_VERIFIER_AGENT_SLUG).backend_id == SUB_AGENT_BACKEND_ID
    assert _virtual(RESEARCH_EXPLORER_AGENT_SLUG).is_subagent is True
    assert context["subagents"] == [RESEARCH_EXPLORER_AGENT_SLUG, FACT_VERIFIER_AGENT_SLUG]
    assert context["skills"] == [DEEP_RESEARCH_AGENT_SLUG]
    assert context["system_prompt"].strip()
