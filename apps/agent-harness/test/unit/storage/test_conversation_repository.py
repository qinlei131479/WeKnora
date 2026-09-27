from __future__ import annotations

from datetime import timedelta

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from yuxi.repositories.conversation_repository import (
    ConversationRepository,
    INVOCATION_CONVERSATION_SOURCES,
    MAX_CONVERSATION_TITLE_LENGTH,
)
from yuxi.storage.postgres.models_business import Base, Conversation
from yuxi.utils.datetime_utils import utc_now_naive

pytestmark = pytest.mark.unit


@pytest_asyncio.fixture()
async def conversation_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as db:
        yield db
    await engine.dispose()


def test_normalize_title_truncates_when_too_long():
    repo = ConversationRepository(None)  # type: ignore[arg-type]
    raw = "a" * (MAX_CONVERSATION_TITLE_LENGTH + 50)

    normalized = repo._normalize_title(raw)

    assert normalized is not None
    assert len(normalized) == MAX_CONVERSATION_TITLE_LENGTH
    assert normalized == "a" * MAX_CONVERSATION_TITLE_LENGTH


def test_normalize_title_trims_spaces():
    repo = ConversationRepository(None)  # type: ignore[arg-type]

    normalized = repo._normalize_title("   hello world   ")

    assert normalized == "hello world"


@pytest.mark.asyncio
async def test_list_conversations_excludes_invocation_sources(conversation_session):
    now = utc_now_naive()
    normal =     Conversation(
        tenant_id=1,
        thread_id="thread-normal",
        uid="user-a",
        agent_id="agent-a",
        title="Normal",
        status="active",
        created_at=now,
        updated_at=now,
        extra_metadata={},
    )
    agent_call =     Conversation(
        tenant_id=1,
        thread_id="thread-call",
        uid="user-a",
        agent_id="agent-a",
        title="Agent Call Run",
        status="active",
        is_pinned=True,
        created_at=now,
        updated_at=now + timedelta(minutes=2),
        extra_metadata={"source": "agent_call"},
    )
    agent_eval =     Conversation(
        tenant_id=1,
        thread_id="thread-eval",
        uid="user-a",
        agent_id="agent-a",
        title="Agent Evaluation Run",
        status="active",
        created_at=now,
        updated_at=now + timedelta(minutes=1),
        extra_metadata={"source": "agent_evaluation"},
    )
    conversation_session.add_all([normal, agent_call, agent_eval])
    await conversation_session.commit()

    repo = ConversationRepository(conversation_session)
    items = await repo.list_conversations(
        uid="user-a",
        limit=20,
        offset=0,
        exclude_sources=INVOCATION_CONVERSATION_SOURCES,
    )

    assert [item.thread_id for item in items] == ["thread-normal"]
