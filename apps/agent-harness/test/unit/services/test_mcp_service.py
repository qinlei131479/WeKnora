from __future__ import annotations

from types import SimpleNamespace

import pytest
from yuxi.agents.mcp import service as mcp_service
from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal


class _FakeMCPClient:
    def __init__(self, tools):
        self._tools = tools

    async def get_tools(self):
        return self._tools


class _MemoryMCPStore:
    """测试里用内存表代替 mcp_services / mcp_tool_approvals。"""

    def __init__(self, items=None):
        self.items = list(items or [])
        self.created_bodies: list[dict] = []
        self.updated_bodies: list[dict] = []
        self.deleted_ids: list[str] = []
        self.approvals: list[dict] = []
        self.tool_updates: list[tuple] = []

    async def list_services(self, db):
        del db
        return [dict(item) for item in self.items]

    async def create_service(self, db, body):
        del db
        from yuxi.utils.datetime_utils import utc_now_naive

        self.created_bodies.append(dict(body))
        item = {
            "id": f"mcp-{len(self.items) + 1}",
            "created_at": utc_now_naive(),
            "updated_at": utc_now_naive(),
            **body,
        }
        self.items.append(item)
        return dict(item)

    async def update_service(self, db, service_id, body):
        del db
        self.updated_bodies.append({"id": service_id, **body})
        for index, item in enumerate(self.items):
            if str(item.get("id")) != str(service_id):
                continue
            item.update(body)
            self.items[index] = dict(item)
            return dict(item)
        raise AssertionError(f"MCP 不存在: {service_id}")

    async def delete_service(self, db, service_id):
        del db
        self.deleted_ids.append(str(service_id))
        self.items = [item for item in self.items if str(item.get("id")) != str(service_id)]

    async def list_tool_approvals(self, db, service_id):
        del db
        return [dict(row) for row in self.approvals if row.get("service_id") == service_id]

    async def set_tool_enabled(self, db, service_id, tool_name, enabled):
        del db
        self.tool_updates.append((service_id, tool_name, enabled))
        self.approvals = [
            row
            for row in self.approvals
            if not (row.get("service_id") == service_id and row.get("tool_name") == tool_name)
        ]
        self.approvals.append({"service_id": service_id, "tool_name": tool_name, "enabled": enabled})

    async def get_oauth_token(self, db, service_id, user_id):
        del db, service_id, user_id
        return None


@pytest.fixture
def mcp_session():
    return None


@pytest.fixture(autouse=True)
def tenant_scope():
    bind_tenant_principal(TenantPrincipal(uid="admin", tenant_id=10000, role="admin"))
    yield
    bind_tenant_principal(None)


@pytest.fixture(autouse=True)
def memory_mcp(monkeypatch: pytest.MonkeyPatch) -> _MemoryMCPStore:
    store = _MemoryMCPStore()
    monkeypatch.setattr(mcp_service.mcp_services, "list_services", store.list_services)
    monkeypatch.setattr(mcp_service.mcp_services, "create_service", store.create_service)
    monkeypatch.setattr(mcp_service.mcp_services, "update_service", store.update_service)
    monkeypatch.setattr(mcp_service.mcp_services, "delete_service", store.delete_service)
    monkeypatch.setattr(mcp_service.mcp_services, "list_tool_approvals", store.list_tool_approvals)
    monkeypatch.setattr(mcp_service.mcp_services, "set_tool_enabled", store.set_tool_enabled)
    monkeypatch.setattr(mcp_service.mcp_services, "get_oauth_token", store.get_oauth_token)
    return store


@pytest.fixture
def appcore(memory_mcp: _MemoryMCPStore) -> _MemoryMCPStore:
    return memory_mcp


async def test_get_mcp_server_uses_service_id_and_builtin_fallback(mcp_session, appcore):
    appcore.items.append(
        {
            "id": "remote-a",
            "name": "空间 A",
            "description": "A",
            "enabled": True,
            "transport_type": "sse",
            "url": "https://example.com/a",
            "headers": {},
        }
    )

    records = await mcp_service.get_all_mcp_servers(mcp_session)
    own = await mcp_service.get_mcp_server(mcp_session, "remote-a")
    builtin = await mcp_service.get_mcp_server(mcp_session, "mcp-server-chart")

    assert "remote-a" in {record.slug for record in records}
    assert "mcp-server-chart" in {record.slug for record in records}
    assert own is not None and own.runtime is None
    assert own.slug == "remote-a"
    assert builtin is not None and mcp_service.is_builtin_mcp_server(builtin)


async def test_runtime_configs_exclude_user_created_stdio_servers(mcp_session, appcore):
    appcore.items.extend(
        [
            {
                "id": "user-stdio",
                "name": "用户 stdio",
                "enabled": True,
                "transport_type": "stdio",
                "stdio_config": {"command": "python3", "args": ["-c", "print('unsafe')"]},
            },
            {
                "id": "remote-http",
                "name": "远程 HTTP",
                "enabled": True,
                "transport_type": "http-streamable",
                "url": "https://example.com/mcp",
                "stdio_config": {"command": "python3", "args": ["stale"]},
                "advanced_config": {"timeout": 30},
            },
        ]
    )

    configs = await mcp_service._load_enabled_mcp_server_configs(db=mcp_session)
    slugs = await mcp_service.get_enabled_mcp_server_slugs(db=mcp_session)

    assert set(configs) == {"mcp-server-chart", "remote-http"}
    assert set(slugs) == {"mcp-server-chart", "remote-http"}
    assert configs["mcp-server-chart"]["command"] == "npx"
    assert configs["remote-http"]["transport"] == "streamable_http"
    assert configs["remote-http"]["timeout"] == 30
    assert "command" not in configs["remote-http"]
    assert "args" not in configs["remote-http"]


async def test_create_mcp_server_rejects_stdio(appcore):
    with pytest.raises(ValueError, match="stdio"):
        await mcp_service.create_mcp_server(
            None,
            name="Unsafe MCP",
            transport="stdio",
        )

    assert appcore.items == []


async def test_create_mcp_server_writes_remote_service(mcp_session, appcore):
    record = await mcp_service.create_mcp_server(
        mcp_session,
        name="Remote MCP",
        transport="streamable_http",
        url="https://example.com/mcp",
        description="remote",
        headers={"Authorization": "Bearer secret"},
        timeout=45,
    )

    assert appcore.created_bodies == [
        {
            "name": "Remote MCP",
            "description": "remote",
            "enabled": True,
            "transport_type": "http-streamable",
            "url": "https://example.com/mcp",
            "headers": {"Authorization": "Bearer secret"},
            "advanced_config": {"timeout": 45},
        }
    ]
    assert record.slug == "mcp-1"
    assert record.runtime is None


async def test_update_mcp_server_rejects_builtin_connection_and_allows_disable(mcp_session, appcore):
    with pytest.raises(PermissionError, match="系统内置"):
        await mcp_service.update_mcp_server(
            mcp_session,
            slug="mcp-server-chart",
            transport="streamable_http",
            url="https://example.com/mcp",
            updated_by="admin",
        )

    appcore.items.append(
        {
            "id": "mcp-server-chart",
            "name": "Mcp Server Chart",
            "enabled": True,
            "is_builtin": True,
            "transport_type": "stdio",
        }
    )
    enabled, record = await mcp_service.set_server_enabled(mcp_session, "mcp-server-chart", enabled=False)
    assert enabled is False
    assert record.enabled is False

    appcore.items.append(
        {
            "id": "legacy-stdio",
            "name": "历史 stdio",
            "enabled": False,
            "transport_type": "stdio",
            "stdio_config": {"command": "python3", "args": []},
        }
    )

    with pytest.raises(ValueError, match="url 必填"):
        await mcp_service.update_mcp_server(
            mcp_session,
            slug="legacy-stdio",
            transport="streamable_http",
            updated_by="admin",
        )

    assert appcore.updated_bodies == [{"id": "mcp-server-chart", "enabled": False}]


async def test_update_mcp_server_syncs_remote_and_runtime(mcp_session, appcore):
    appcore.items.append(
        {
            "id": "remote-a",
            "name": "Old",
            "enabled": True,
            "transport_type": "sse",
            "url": "https://old.example.com",
            "headers": {},
        }
    )
    record = await mcp_service.update_mcp_server(
        mcp_session,
        slug="remote-a",
        name="New",
        description="updated",
        transport="streamable_http",
        url="https://new.example.com",
        headers={"X-Test": "1"},
        timeout=20,
        sse_read_timeout=60,
        tags=["updated"],
        icon="U",
        updated_by="release-bot",
    )

    assert appcore.updated_bodies == [
        {
            "id": "remote-a",
            "name": "New",
            "description": "updated",
            "transport_type": "http-streamable",
            "url": "https://new.example.com",
            "headers": {"X-Test": "1"},
            "advanced_config": {"timeout": 20},
        }
    ]
    assert record.to_dict()["url"] == "https://new.example.com"
    assert record.runtime is None


async def test_toggle_tool_writes_tool_approval(mcp_session, appcore):
    tool_enabled, _tool_record = await mcp_service.toggle_tool_enabled(
        mcp_session,
        "mcp-server-chart",
        "generate_chart",
        updated_by="admin",
    )

    assert tool_enabled is False
    assert appcore.tool_updates == [("mcp-server-chart", "generate_chart", False)]


async def test_get_enabled_mcp_tools_loads_latest_config_from_db(monkeypatch):
    captured: list[dict] = []

    async def fake_get_enabled_mcp_server_config(server_name: str, db=None):
        del db
        assert server_name == "demo"
        return {"transport": "stdio", "command": "demo", "disabled_tools": ["tool_b"]}

    async def fake_get_mcp_tools(server_name: str, additional_servers=None, disabled_tools=None, **kwargs):
        del kwargs
        captured.append(
            {
                "server_name": server_name,
                "additional_servers": additional_servers,
                "disabled_tools": list(disabled_tools or []),
            }
        )
        return ["tool-a"]

    monkeypatch.setattr(mcp_service, "get_enabled_mcp_server_config", fake_get_enabled_mcp_server_config)
    monkeypatch.setattr(mcp_service, "get_mcp_tools", fake_get_mcp_tools)

    tools = await mcp_service.get_enabled_mcp_tools("demo")

    assert tools == ["tool-a"]
    assert captured == [
        {
            "server_name": "demo",
            "additional_servers": {"demo": {"transport": "stdio", "command": "demo", "disabled_tools": ["tool_b"]}},
            "disabled_tools": ["tool_b"],
        }
    ]


async def test_get_mcp_tools_rebuilds_cache_when_config_hash_changes(monkeypatch):
    mcp_service.clear_mcp_cache()

    configs = [
        {"transport": "stdio", "command": "demo-v1", "disabled_tools": []},
        {"transport": "stdio", "command": "demo-v2", "disabled_tools": []},
    ]
    build_calls: list[str] = []

    async def fake_get_enabled_mcp_server_config(server_name: str, db=None):
        del db
        assert server_name == "demo"
        return configs[0]

    async def fake_get_mcp_client(server_configs):
        config = server_configs["demo"]
        build_calls.append(config["command"])
        tool = SimpleNamespace(name=f"tool_for_{config['command']}", metadata={})
        return _FakeMCPClient([tool])

    monkeypatch.setattr(mcp_service, "get_enabled_mcp_server_config", fake_get_enabled_mcp_server_config)
    monkeypatch.setattr(mcp_service, "get_mcp_client", fake_get_mcp_client)

    tools_v1_first = await mcp_service.get_mcp_tools("demo")
    tools_v1_second = await mcp_service.get_mcp_tools("demo")

    configs[0] = configs[1]
    tools_v2 = await mcp_service.get_mcp_tools("demo")

    assert [tool.name for tool in tools_v1_first] == ["tool_for_demo-v1"]
    assert [tool.name for tool in tools_v1_second] == ["tool_for_demo-v1"]
    assert [tool.name for tool in tools_v2] == ["tool_for_demo-v2"]
    assert build_calls == ["demo-v1", "demo-v2"]

    mcp_service.clear_mcp_cache()


async def test_get_tools_from_all_servers_loads_names_from_db_once(monkeypatch):
    server_configs = {
        "alpha": {"transport": "stdio", "command": "cmd-a", "disabled_tools": []},
        "beta": {"transport": "stdio", "command": "cmd-b", "disabled_tools": []},
    }
    calls: list[tuple[str, dict[str, dict]]] = []

    async def fake_load_enabled_mcp_server_configs(*, names=None, db=None):
        del names, db
        return server_configs

    async def fake_get_mcp_tools(server_name: str, additional_servers=None, **kwargs):
        del kwargs
        calls.append((server_name, additional_servers or {}))
        return [server_name]

    monkeypatch.setattr(mcp_service, "_load_enabled_mcp_server_configs", fake_load_enabled_mcp_server_configs)
    monkeypatch.setattr(mcp_service, "get_mcp_tools", fake_get_mcp_tools)

    tools = await mcp_service.get_tools_from_all_servers()

    assert tools == ["alpha", "beta"]
    assert calls == [
        ("alpha", server_configs),
        ("beta", server_configs),
    ]


async def test_get_mcp_tools_sets_handle_tool_error(monkeypatch):
    mcp_service.clear_mcp_cache()

    config = {"transport": "stdio", "command": "demo-tool", "disabled_tools": []}

    async def fake_get_enabled_mcp_server_config(server_name: str, db=None):
        del db, server_name
        return config

    async def fake_get_mcp_client(server_configs):
        del server_configs
        tool = SimpleNamespace(name="demo_tool", metadata={})
        return _FakeMCPClient([tool])

    monkeypatch.setattr(mcp_service, "get_enabled_mcp_server_config", fake_get_enabled_mcp_server_config)
    monkeypatch.setattr(mcp_service, "get_mcp_client", fake_get_mcp_client)

    tools = await mcp_service.get_mcp_tools("demo")

    assert len(tools) == 1
    assert tools[0].handle_tool_error is True

    mcp_service.clear_mcp_cache()
