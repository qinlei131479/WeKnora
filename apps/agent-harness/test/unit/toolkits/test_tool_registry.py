from __future__ import annotations

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from yuxi.agents.toolkits import service as toolkit_service
from yuxi.agents.toolkits.registry import tool
from yuxi.storage.postgres import manager as postgres_manager
from yuxi.storage.postgres.models_business import BuiltinTool


def test_tool_decorator_sets_handle_tool_error():
    """测试通过 @tool 装饰器注册的工具是否自动设置了 handle_tool_error 为 True"""

    @tool(
        category="test",
        display_name="测试工具",
        description="这是一个单元测试工具",
    )
    def my_test_tool(arg: str) -> str:
        return f"hello {arg}"

    assert my_test_tool.name == "my_test_tool"
    assert my_test_tool.handle_tool_error is True


@pytest.mark.asyncio
async def test_builtin_tool_directory_syncs_work_registry(monkeypatch: pytest.MonkeyPatch) -> None:
    """目录同步应以 work 注册表为准，清理退役工具并保留 chat 目录。"""
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(BuiltinTool.__table__.create)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    session = session_factory()

    class _SessionContext:
        async def __aenter__(self):
            return session

        async def __aexit__(self, *_args):
            return False

    monkeypatch.setattr(
        postgres_manager.pg_manager,
        "get_async_session_context",
        lambda: _SessionContext(),
    )
    monkeypatch.setattr(
        toolkit_service,
        "_metadata_cache",
        [
            {
                "slug": "calculator",
                "name": "计算器",
                "description": "更新后的描述",
                "category": "buildin",
                "input_schema": {"type": "object", "properties": {"expression": {"type": "string"}}},
                "tags": ["计算"],
                "config_guide": "",
                "version": "v2",
            },
            {
                "slug": "new-tool",
                "name": "新工具",
                "description": "新工具描述",
                "category": "mysql",
                "input_schema": {},
                "tags": [],
                "config_guide": "",
                "version": None,
            },
        ],
    )
    session.add(
        BuiltinTool(
            tool_slug="retired-tool",
            capability_key="work:retired-tool",
            name="退役工具",
            description="",
            category="buildin",
        )
    )
    session.add(
        BuiltinTool(
            tool_slug="calculator",
            capability_key="work:calculator",
            name="计算器",
            description="旧描述",
            category="buildin",
        )
    )
    session.add(
        BuiltinTool(
            tool_slug="calculator",
            source="chat",
            capability_key="chat:calculator",
            name="平台计算器",
            description="平台侧描述",
            category="general",
        )
    )
    await session.commit()

    assert await toolkit_service.sync_builtin_tool_directory() == 2
    rows = {(row.tool_slug, row.source): row for row in (await session.execute(select(BuiltinTool))).scalars()}
    assert set(rows) == {("calculator", "chat"), ("calculator", "work"), ("new-tool", "work")}
    assert rows[("calculator", "work")].description == "更新后的描述"
    assert rows[("calculator", "work")].version == "v2"
    assert rows[("new-tool", "work")].category == "buildin"
    assert rows[("calculator", "chat")].name == "平台计算器"
    assert rows[("calculator", "chat")].capability_key == "chat:calculator"

    directory = await toolkit_service.get_directory_tool_metadata("buildin")
    assert {item["slug"] for item in directory} == {"calculator", "new-tool"}
    calculator = next(item for item in directory if item["slug"] == "calculator")
    assert calculator["capability_key"] == "work:calculator"
    assert calculator["args"][0]["name"] == "expression"

    work_directory = await toolkit_service.get_directory_tool_metadata(source="work")
    assert {item["slug"] for item in work_directory} == {"calculator", "new-tool"}
    chat_directory = await toolkit_service.get_directory_tool_metadata(source="chat")
    assert {item["source"] for item in chat_directory} == {"chat"}
    combined_directory = await toolkit_service.get_directory_tool_metadata("buildin", "chat")
    assert combined_directory == []

    await session.close()
    await engine.dispose()
