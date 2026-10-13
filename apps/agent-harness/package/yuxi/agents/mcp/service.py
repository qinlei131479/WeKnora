"""MCP Service - Unified business logic and state management for MCP.

Responsibilities:
- Server configuration CRUD operations
- Built-in configuration synchronization (Code <-> Database)
- Unified entry point for Agent tool retrieval (auto-filtering disabled_tools)
- MCP Client and Tools management (formerly in agents/common/mcp.py)
"""

import asyncio
import hashlib
import json
import re
from datetime import datetime, timezone
from dataclasses import dataclass
from collections.abc import Callable
from typing import Any, cast

from langchain_mcp_adapters.client import MultiServerMCPClient
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.services import mcp_service as mcp_services
from yuxi.tenancy.context import get_tenant_principal
from yuxi.utils import logger

# =============================================================================
# === Global Cache & State ===
# =============================================================================

# Global Lock for MCP state
_mcp_lock = asyncio.Lock()

# 本地仅缓存工具对象。配置始终以数据库为准，每次按 server_slug 现查。
# cache key 使用 server_slug:config_hash，当配置变化时会自然失效。
_mcp_tools_cache: dict[str, list[Callable[..., Any]]] = {}

# MCP tools statistics (for reporting enabled/disabled counts)
_mcp_tools_stats: dict[str, dict[str, int]] = {}

# 内置图表服务的进程参数。列表接口会抹掉 stdio 配置，对话仍按这个 id 启动。
_DEFAULT_MCP_SERVERS = {
    "mcp-server-chart": {
        "command": "npx",
        "args": ["-y", "@antv/mcp-server-chart"],
        "transport": "stdio",
        "description": "图表生成工具，支持生成各类图表（柱状图、折线图、饼图等）",
        "icon": "📊",
        "tags": ["内置", "图表"],
    },
}
_BUILTIN_MCP_SERVER_SLUGS = tuple(_DEFAULT_MCP_SERVERS)


@dataclass
class MCPRecord:
    """mcp_services 的运行时视图。标识使用服务 id。"""

    raw: dict[str, Any]
    runtime: Any | None = None

    @property
    def app_core_id(self) -> str:
        return str(self.raw.get("id") or "")

    @property
    def slug(self) -> str:
        return str(getattr(self.runtime, "slug", None) or self.app_core_id)

    @property
    def transport(self) -> str:
        return str(self.raw.get("transport_type") or "")

    @property
    def name(self) -> str:
        return str(self.raw.get("name") or self.slug)

    @property
    def description(self) -> str | None:
        return self.raw.get("description")

    @property
    def enabled(self) -> bool:
        return bool(self.raw.get("enabled"))

    @property
    def icon(self) -> str | None:
        return getattr(self.runtime, "icon", None)

    @property
    def tags(self) -> list[str]:
        return getattr(self.runtime, "tags", None) or []

    @property
    def disabled_tools(self) -> list[str]:
        return getattr(self.runtime, "disabled_tools", None) or []

    def to_dict(self) -> dict[str, Any]:
        transport = "streamable_http" if self.transport == "http-streamable" else self.transport
        advanced = self.raw.get("advanced_config") or {}
        stdio = self.raw.get("stdio_config") or {}
        command = stdio.get("command")
        args = list(stdio.get("args") or [])
        # 列表会抹掉内置服务的 stdio 配置，展示参数改从代码目录补回。
        builtin = _DEFAULT_MCP_SERVERS.get(self.slug)
        if builtin:
            command = command or builtin.get("command")
            args = args or list(builtin.get("args") or [])
        auth = dict(self.raw.get("auth_config") or {})
        auth.pop("api_key", None)
        auth.pop("token", None)
        return {
            "id": self.app_core_id,
            "app_core_id": self.app_core_id,
            "slug": self.slug,
            "name": self.raw.get("name") or self.slug,
            "description": self.raw.get("description"),
            # 服务用途由用户在编辑抽屉里维护，列表与详情都必须带出，否则界面会
            # 退回展示 description，看起来像"保存没生效"。
            "usage_instructions": self.raw.get("usage_instructions") or "",
            "transport": transport,
            "url": self.raw.get("url"),
            "command": command,
            "args": args,
            "env": self.raw.get("env_vars") or {},
            "headers": self.raw.get("headers") or {},
            "timeout": advanced.get("timeout"),
            "transport_type": self.transport,
            "auth_config": auth or None,
            "advanced_config": advanced if isinstance(advanced, dict) else None,
            "credentials": self.raw.get("credentials"),
            "sse_read_timeout": getattr(self.runtime, "sse_read_timeout", None),
            "tags": getattr(self.runtime, "tags", None) or [],
            "icon": getattr(self.runtime, "icon", None),
            "enabled": bool(self.raw.get("enabled")),
            "disabled_tools": getattr(self.runtime, "disabled_tools", None) or [],
            "is_builtin": bool(self.raw.get("is_builtin")) or self.slug in _BUILTIN_MCP_SERVER_SLUGS,
            "created_by": getattr(self.runtime, "created_by", None),
            "updated_by": getattr(self.runtime, "updated_by", None),
            "created_at": self.raw.get("created_at"),
            "updated_at": self.raw.get("updated_at"),
        }


class MCPServerNotFoundError(ValueError):
    """表示指定的 MCP 服务器不存在。"""


def is_builtin_mcp_server(server: Any) -> bool:
    """判断 MCP 是否为内置服务。以 mcp_services.is_builtin 为准，代码目录只覆盖启动命令。"""
    raw = getattr(server, "raw", None)
    if isinstance(raw, dict) and raw.get("is_builtin"):
        return True
    return getattr(server, "slug", "") in _BUILTIN_MCP_SERVER_SLUGS


def requires_mcp_stdio_migration(server: Any) -> bool:
    """判断 MCP 是否为升级后需要迁移的用户 stdio 配置。"""
    return getattr(server, "transport", "") == "stdio" and not is_builtin_mcp_server(server)


def _to_runtime_mcp_config(record: MCPRecord) -> dict[str, Any]:
    """生成运行时 MCP 配置。图表内置服务的 stdio 命令以代码定义为准，列表接口会抹掉这段配置。"""
    if record.slug in _DEFAULT_MCP_SERVERS:
        builtin = _DEFAULT_MCP_SERVERS[record.slug]
        return {
            key: builtin[key]
            for key in ("transport", "url", "command", "args", "env", "headers", "timeout", "sse_read_timeout")
            if builtin.get(key) is not None
        }

    data = record.to_dict()
    transport = data["transport"]
    config: dict[str, Any] = {"transport": transport}
    if transport in ("sse", "streamable_http"):
        headers = dict(data.get("headers") or {})
        headers.update(_auth_headers(record))
        config.update({"url": data.get("url"), "headers": headers})
    else:
        config.update(
            {
                "command": data.get("command"),
                "args": data.get("args") or [],
                "env": data.get("env") or {},
            }
        )
    if data.get("timeout") is not None:
        config["timeout"] = data["timeout"]
    if data.get("sse_read_timeout") is not None:
        config["sse_read_timeout"] = data["sse_read_timeout"]
    if data.get("disabled_tools"):
        config["disabled_tools"] = data["disabled_tools"]
    return config


def _auth_headers(record: MCPRecord) -> dict[str, str]:
    """把库里的密钥和当前用户的 OAuth 令牌收成请求头，不进入接口响应。"""
    auth = record.raw.get("auth_config") or {}
    headers: dict[str, str] = {}
    if not isinstance(auth, dict):
        return headers
    if auth.get("auth_type") == "api_key" and auth.get("api_key"):
        headers[str(auth.get("api_key_header") or "X-API-Key")] = str(auth["api_key"])
    elif auth.get("auth_type") == "bearer" and auth.get("token"):
        headers["Authorization"] = f"Bearer {auth['token']}"
    elif record.raw.get("_oauth_access_token"):
        headers["Authorization"] = f"Bearer {record.raw['_oauth_access_token']}"
    custom = auth.get("custom_headers") or {}
    if isinstance(custom, dict):
        headers.update({str(key): str(value) for key, value in custom.items() if value is not None})
    return headers


def _builtin_record(slug: str, runtime: Any | None = None) -> MCPRecord:
    """数据库还没有内置行时，用代码定义补一张只读卡片。"""
    config = _DEFAULT_MCP_SERVERS[slug]
    return MCPRecord(
        raw={
            "id": slug,
            "name": config.get("name", slug),
            "description": config.get("description"),
            "enabled": True,
            "transport_type": config["transport"],
            "stdio_config": {"command": config.get("command"), "args": config.get("args") or []},
            "env_vars": config.get("env") or {},
            "headers": config.get("headers") or {},
        },
        runtime=runtime,
    )


# =============================================================================
# === Core Logic (Moved from agents/common/mcp.py) ===
# =============================================================================


async def ensure_builtin_mcp_servers_in_db() -> None:
    """保留启动钩子；内置 MCP 连接定义迁移到代码目录，不再写旧 h 表。"""


def _tool_input_schema(tool: Any) -> dict[str, Any]:
    schema = getattr(tool, "args_schema", None)
    if schema is None:
        return {}
    if hasattr(schema, "model_json_schema"):
        return schema.model_json_schema()
    if hasattr(schema, "schema"):
        return schema.schema()
    return {}


def metadata_from_live_tools(service_id: str, tools: list[Any]) -> dict[str, Any]:
    """把现场拉到的工具整理成抽屉目录结构。内置 stdio 不走 Go 的目录刷新。"""
    return {
        "service_id": service_id,
        "tools": [
            {
                "name": getattr(tool, "name", ""),
                "description": getattr(tool, "description", "") or "",
                "inputSchema": _tool_input_schema(tool),
            }
            for tool in tools
        ],
        "instructions": "",
        "server_name": "",
        "server_version": "",
        "server_description": "",
        "synced_at": datetime.now(timezone.utc).isoformat(),
        "stale": False,
    }


async def probe_mcp_connection(transport: str, url: str, headers: dict[str, Any] | None = None) -> dict[str, Any]:
    """按表单里的地址试连，不要求服务已经保存。"""
    chosen = _transport_for_app_core(transport)
    if chosen not in ("sse", "http-streamable"):
        raise ValueError("传输类型必须是 sse 或 http-streamable")
    target = (url or "").strip()
    if not target.startswith(("http://", "https://")):
        raise ValueError("url 必须是 http 或 https 地址")
    config = {
        "transport": "streamable_http" if chosen == "http-streamable" else "sse",
        "url": target,
        "headers": headers or {},
    }
    client = await get_mcp_client({"probe": config})
    if client is None:
        raise ValueError("无法初始化 MCP 连接")
    tools = cast(list[Any], await client.get_tools())
    return {
        "success": True,
        "message": f"连接成功，共发现 {len(tools)} 个工具",
        "tool_count": len(tools),
        "tools": [
            {"name": getattr(tool, "name", ""), "description": getattr(tool, "description", "") or ""}
            for tool in tools
        ],
    }


def connection_headers(record: MCPRecord) -> dict[str, str]:
    """合并静态请求头、API Key、Bearer 和当前用户的 OAuth 令牌。"""
    raw_headers = record.raw.get("headers") or {}
    headers = {str(key): str(value) for key, value in raw_headers.items()} if isinstance(raw_headers, dict) else {}
    headers.update(_auth_headers(record))
    return headers


async def live_mcp_tools(record: MCPRecord) -> list[Any]:
    """按已保存的连接参数拉工具，不经过 app-core。"""
    config = _to_runtime_mcp_config(record)
    if config.get("transport") in ("sse", "streamable_http"):
        config["headers"] = connection_headers(record)
    client = await get_mcp_client({record.slug: config})
    if client is None:
        raise ValueError("无法初始化 MCP 连接")
    return cast(list[Any], await client.get_tools())


async def get_mcp_client(
    server_configs: dict[str, Any] | None = None,
) -> MultiServerMCPClient | None:
    """Initializes an MCP client with the given server configurations."""
    try:
        client = MultiServerMCPClient(server_configs)  # pyright: ignore[reportArgumentType]
        logger.info(f"Initialized MCP client with servers: {list(server_configs.keys())}")
        return client
    except Exception as e:
        logger.error("Failed to initialize MCP client: {}", e)
        return None


def to_camel_case(s: str) -> str:
    """Convert string to lowerCamelCase."""

    # Handle - and _
    s = re.sub(r"[-_]+(.)", lambda m: m.group(1).upper(), s)
    # Lowercase first letter
    if len(s) > 0:
        s = s[0].lower() + s[1:]
    return s


async def _load_enabled_mcp_server_configs(
    *,
    names: list[str] | None = None,
    db: AsyncSession | None = None,
) -> dict[str, dict[str, Any]]:
    """从 mcp_services 加载启用中的 MCP 配置。"""
    records = await get_all_mcp_servers(db)
    by_slug = {record.slug: record for record in records}
    if names:
        by_slug = {slug: by_slug[slug] for slug in names if slug in by_slug}
    return {
        slug: _to_runtime_mcp_config(record)
        for slug, record in by_slug.items()
        if record.raw.get("enabled") and (record.transport != "stdio" or slug in _BUILTIN_MCP_SERVER_SLUGS)
    }


async def get_enabled_mcp_server_config(server_slug: str, *, db: AsyncSession | None = None) -> dict[str, Any] | None:
    """Get the latest enabled MCP server config from the database."""
    configs = await _load_enabled_mcp_server_configs(names=[server_slug], db=db)
    return configs.get(server_slug)


async def get_enabled_mcp_server_slugs(*, db: AsyncSession | None = None) -> list[str]:
    """Get enabled MCP server slugs from the database."""
    configs = await _load_enabled_mcp_server_configs(db=db)
    return list(configs)


async def get_mcp_tools(
    server_slug: str,
    additional_servers: dict[str, dict[str, Any]] | None = None,
    disabled_tools: list[str] = None,
    cache: bool = True,
    force_refresh: bool = False,
) -> list[Callable[..., Any]]:
    """Get MCP tools for a specific server.

    Architecture:
    1. Fetching: Connects to MCP server to get ALL tools.
    2. Caching: Stores the FULL, UNFILTERED list of tools in `_mcp_tools_cache`.
    3. Filtering: Filters the return value based on `disabled_tools` argument.

    Args:
        server_slug: Server slug
        additional_servers: Additional server configurations
        disabled_tools: List of tool names to filter out from the RETURN value (does not affect cache)
        cache: Whether to use/update the cache (default: True)
        force_refresh: Whether to force a refresh from the server (default: False)
    """
    if additional_servers and server_slug in additional_servers:
        server_config = additional_servers[server_slug]
    else:
        server_config = await get_enabled_mcp_server_config(server_slug)

    if server_config is None:
        logger.warning(f"MCP server '{server_slug}' not found in database or disabled")
        return []

    # 配置 hash 直接基于完整配置生成。只要数据库中的配置发生变化，
    # 本地工具缓存 key 就会变化，从而自然触发重建。
    config_payload = json.dumps(server_config, sort_keys=True, ensure_ascii=True, separators=(",", ":"))
    config_hash = hashlib.sha256(config_payload.encode("utf-8")).hexdigest()[:16]
    cache_key = f"{server_slug}:{config_hash}"

    all_processed_tools: list[Callable[..., Any]] = []

    async with _mcp_lock:
        if not force_refresh and cache and cache_key in _mcp_tools_cache:
            all_processed_tools = _mcp_tools_cache[cache_key]

    if not all_processed_tools:
        try:
            # disabled_tools 只影响返回值过滤，不参与 MCP client 建连参数。
            client_config = {k: v for k, v in server_config.items() if k not in ("disabled_tools",)}

            client = await get_mcp_client({server_slug: client_config})
            if client is None:
                return []

            raw_tools = cast(list[Any], await client.get_tools())

            server_cc = to_camel_case(server_slug)
            for tool in raw_tools:
                original_name = tool.name
                tool_cc = to_camel_case(original_name)
                unique_id = f"mcp__{server_cc}__{tool_cc}"

                if tool.metadata is None:
                    tool.metadata = {}
                tool.metadata["id"] = unique_id
                # 开启错误处理，防止工具调用抛出 ToolException 时击穿服务
                tool.handle_tool_error = True
                all_processed_tools.append(tool)

            if cache:
                async with _mcp_lock:
                    stale_keys = [
                        key for key in _mcp_tools_cache if key.startswith(f"{server_slug}:") and key != cache_key
                    ]
                    for stale_key in stale_keys:
                        _mcp_tools_cache.pop(stale_key, None)
                    _mcp_tools_cache[cache_key] = all_processed_tools

                global_config_disabled = server_config.get("disabled_tools") or []
                enabled_count = len([t for t in all_processed_tools if t.name not in global_config_disabled])
                _mcp_tools_stats[server_slug] = {
                    "total": len(all_processed_tools),
                    "enabled": enabled_count,
                    "disabled": len(all_processed_tools) - enabled_count,
                }

                logger.info(
                    f"Refreshed MCP tools cache for '{server_slug}' with key '{cache_key}': "
                    f"{len(all_processed_tools)} tools loaded."
                )

        except Exception as e:
            logger.exception(f"Failed to load tools from MCP server '{server_slug}': {e}")
            return []

    # 3. Filtering (Apply to Return Value Only)
    if disabled_tools:
        filtered_tools = [t for t in all_processed_tools if t.name not in disabled_tools]
        logger.debug(
            f"Returning {len(filtered_tools)}/{len(all_processed_tools)} tools for '{server_slug}' "
            f"(filtered {len(disabled_tools)} by argument)"
        )
        return filtered_tools

    return all_processed_tools


async def get_tools_from_all_servers() -> list[Callable[..., Any]]:
    """Get all tools from all configured MCP servers."""
    server_configs = await _load_enabled_mcp_server_configs()
    all_tools = []
    for server_slug in server_configs:
        tools = await get_mcp_tools(server_slug, additional_servers=server_configs)
        all_tools.extend(tools)
    return all_tools


def clear_mcp_cache() -> None:
    """Clear the MCP tools cache (useful for testing)."""
    global _mcp_tools_cache, _mcp_tools_stats
    _mcp_tools_cache = {}
    _mcp_tools_stats = {}


def clear_mcp_server_tools_cache(server_slug: str) -> None:
    """Clear the tools cache for a specific MCP server."""
    global _mcp_tools_cache, _mcp_tools_stats
    server_prefix = f"{server_slug}:"
    stale_keys = [key for key in _mcp_tools_cache if key.startswith(server_prefix)]
    for stale_key in stale_keys:
        _mcp_tools_cache.pop(stale_key, None)
    _mcp_tools_stats.pop(server_slug, None)
    logger.info(f"Cleared tools cache for MCP server '{server_slug}'")


def get_mcp_tools_stats(server_slug: str) -> dict[str, int] | None:
    """Get tools statistics for a MCP server.

    Returns:
        dict with 'total', 'enabled', 'disabled' counts, or None if not available
    """
    return _mcp_tools_stats.get(server_slug)


# =============================================================================
# === Server Config CRUD ===
# =============================================================================


def _transport_for_app_core(transport: str | None) -> str | None:
    """把工作台的 streamable_http 收成 mcp_services 使用的 http-streamable。"""
    if transport == "streamable_http":
        return "http-streamable"
    return transport


def _service_write_body(
    *,
    name: str | None = None,
    description: str | None = None,
    usage_instructions: str | None = None,
    enabled: bool | None = None,
    transport: str | None = None,
    url: str | None = None,
    headers: dict | None = None,
    auth_config: dict | None = None,
    advanced_config: dict | None = None,
    timeout: int | None = None,
) -> dict[str, Any]:
    """只写入 mcp_services 已有字段。标签、图标和独立 slug 不再落库。"""
    body: dict[str, Any] = {}
    if name is not None:
        body["name"] = name
    if description is not None:
        body["description"] = description
    if usage_instructions is not None:
        body["usage_instructions"] = usage_instructions
    if enabled is not None:
        body["enabled"] = enabled
    mapped = _transport_for_app_core(transport)
    if mapped is not None:
        body["transport_type"] = mapped
    if url is not None:
        body["url"] = url
    if headers is not None:
        body["headers"] = headers
    if auth_config is not None:
        body["auth_config"] = auth_config
    if advanced_config is not None:
        body["advanced_config"] = advanced_config
    elif timeout is not None:
        body["advanced_config"] = {"timeout": timeout}
    return body


async def disabled_tool_names(service_id: str, db: AsyncSession | None = None) -> list[str]:
    """读取 mcp_tool_approvals 里被关掉的工具。读失败时不阻断对话。"""
    try:
        rows = await mcp_services.list_tool_approvals(db, service_id)
    except Exception as exc:
        logger.warning(f"Failed to load MCP tool approvals for '{service_id}': {exc}")
        return []
    names: list[str] = []
    for row in rows:
        if not isinstance(row, dict) or row.get("enabled") is not False:
            continue
        tool_name = row.get("tool_name")
        if isinstance(tool_name, str) and tool_name:
            names.append(tool_name)
    return names


async def get_mcp_server(db: AsyncSession, slug: str) -> MCPRecord | None:
    """按 slug 取当前 token 空间可见的 MCP。"""
    records = await get_all_mcp_servers(db)
    for record in records:
        if record.slug == slug:
            return record
    return None


async def _attach_oauth_tokens(db: AsyncSession | None, raw_items: list[dict[str, Any]]) -> None:
    principal = get_tenant_principal()
    if principal is None or not principal.uid:
        return
    for raw in raw_items:
        auth = raw.get("auth_config") or {}
        if not isinstance(auth, dict) or auth.get("auth_type") != "oauth":
            continue
        try:
            token = await mcp_services.get_oauth_token(db, str(raw.get("id") or ""), principal.uid)
        except Exception as exc:
            logger.warning(f"Failed to load MCP OAuth token for '{raw.get('id')}': {exc}")
            continue
        if token and token.get("access_token"):
            raw["_oauth_access_token"] = token["access_token"]


async def get_all_mcp_servers(db: AsyncSession | None = None) -> list[MCPRecord]:
    """读取当前空间和内置 MCP。"""
    raw_items = await mcp_services.list_services(db)
    await _attach_oauth_tokens(db, raw_items)
    records: list[MCPRecord] = []
    seen: set[str] = set()
    for raw in raw_items:
        raw_id = str(raw.get("id") or "")
        if not raw_id or raw_id in seen:
            continue
        seen.add(raw_id)
        records.append(MCPRecord(raw=raw))
    # 迁移尚未写入内置行时，仍用代码定义兜底，避免对话和列表丢图表服务。
    for slug in _BUILTIN_MCP_SERVER_SLUGS:
        if slug not in seen:
            records.append(_builtin_record(slug))
    return records


async def create_mcp_server(
    db: AsyncSession,
    *,
    name: str,
    transport: str | None = None,
    transport_type: str | None = None,
    url: str | None = None,
    description: str | None = None,
    headers: dict | None = None,
    auth_config: dict | None = None,
    advanced_config: dict | None = None,
    enabled: bool = True,
    timeout: int | None = None,
) -> MCPRecord:
    """创建 MCP，直接写入 mcp_services。"""
    chosen = _transport_for_app_core(transport_type or transport)
    if chosen not in ("sse", "http-streamable"):
        raise ValueError("用户创建的 MCP 仅支持 sse 或 http-streamable，不允许启动 stdio 本地进程")

    body = _service_write_body(
        name=name,
        description=description,
        enabled=enabled,
        transport=chosen,
        url=url,
        headers=headers or {},
        auth_config=auth_config,
        advanced_config=advanced_config,
        timeout=timeout,
    )
    raw = await mcp_services.create_service(db, body)
    service_id = str(raw.get("id") or "")
    clear_mcp_server_tools_cache(service_id)
    logger.info(f"Created MCP server '{service_id}'")
    return MCPRecord(raw=raw)


async def update_mcp_server(
    db: AsyncSession,
    slug: str,
    name: str = None,
    description: str = None,
    usage_instructions: str = None,
    transport: str = None,
    transport_type: str = None,
    url: str = None,
    headers: dict = None,
    auth_config: dict = None,
    advanced_config: dict = None,
    enabled: bool = None,
    timeout: int = None,
    sse_read_timeout: int = None,
    tags: list = None,
    icon: str = None,
    updated_by: str = None,
) -> MCPRecord:
    """更新 MCP。内置服务的连接参数不能改；标签和图标不再保存。"""
    del sse_read_timeout, tags, icon, updated_by
    server = await get_mcp_server(db, slug)
    if not server:
        raise MCPServerNotFoundError(f"Server '{slug}' does not exist")
    if is_builtin_mcp_server(server):
        raise PermissionError("系统内置 MCP 的连接配置由代码管理，无法通过接口修改")

    chosen = _transport_for_app_core(transport_type or transport)
    next_transport = chosen or server.transport
    if next_transport not in ("sse", "http-streamable", "streamable_http"):
        raise ValueError("用户创建的 MCP 仅支持 sse 或 http-streamable，不允许启动 stdio 本地进程")

    next_url = url if url is not None else server.to_dict().get("url")
    if not next_url or not str(next_url).strip():
        raise ValueError(f"传输类型为 {next_transport} 时，url 必填")

    body = _service_write_body(
        name=name,
        description=description,
        usage_instructions=usage_instructions,
        enabled=enabled,
        transport=chosen,
        url=url,
        headers=headers,
        auth_config=auth_config,
        advanced_config=advanced_config,
        timeout=timeout,
    )
    raw = await mcp_services.update_service(db, server.app_core_id, body)
    clear_mcp_server_tools_cache(slug)
    logger.info(f"Updated MCP server '{slug}'")
    return MCPRecord(raw=raw)


async def delete_mcp_server(db: AsyncSession, slug: str) -> bool:
    """删除 MCP 服务。"""
    server = await get_mcp_server(db, slug)
    if not server:
        return False

    await mcp_services.delete_service(db, server.app_core_id)
    clear_mcp_server_tools_cache(slug)
    logger.info(f"Deleted MCP server '{slug}'")
    return True


# =============================================================================
# === Tool Management ===
# =============================================================================


async def set_server_enabled(
    db: AsyncSession, slug: str, enabled: bool, updated_by: str = None
) -> tuple[bool, MCPRecord]:
    """Set server enabled status."""
    del updated_by
    server = await get_mcp_server(db, slug)
    if not server:
        raise MCPServerNotFoundError(f"Server '{slug}' does not exist")
    if enabled and requires_mcp_stdio_migration(server):
        raise ValueError("历史 stdio MCP 已被禁用，请改为 sse 或 http-streamable 后再启用")

    raw = await mcp_services.update_service(
        db,
        server.app_core_id,
        {"enabled": enabled},
    )
    server = MCPRecord(raw=raw)

    is_enabled = bool(server.enabled)
    clear_mcp_server_tools_cache(slug)

    logger.info(f"Set MCP server '{slug}' enabled={is_enabled}")
    return is_enabled, server


async def toggle_tool_enabled(
    db: AsyncSession,
    server_slug: str,
    tool_name: str,
    updated_by: str = None,
) -> tuple[bool, MCPRecord]:
    """Toggle single tool enabled status.

    Args:
        db: Database session
        server_slug: Server slug
        tool_name: Tool name
        updated_by: Updater

    Returns:
        (enabled, server): Tool enabled status and updated server object
    """
    del updated_by
    server = await get_mcp_server(db, server_slug)
    if not server:
        raise MCPServerNotFoundError(f"Server '{server_slug}' does not exist")

    disabled = set(await disabled_tool_names(server.app_core_id, db))
    enabled = tool_name in disabled
    await mcp_services.set_tool_enabled(db, server.app_core_id, tool_name, enabled)

    # Clear tool cache (re-filtered on next fetch)
    clear_mcp_server_tools_cache(server_slug)

    logger.info(f"Toggled tool '{tool_name}' for server '{server_slug}' enabled={enabled}")
    return enabled, server


# =============================================================================
# === Unified Entry Points (Wrappers) ===
# =============================================================================


async def get_enabled_mcp_tools(server_slug: str) -> list:
    """Get MCP server tools (auto-filtering disabled_tools).

    Unified entry point for Agents, automatically:
    1. Gets the latest server config from database
    2. Gets all tools
    3. Filters out disabled_tools

    Args:
        server_slug: Server slug

    Returns:
        List of enabled tools
    """
    config = await get_enabled_mcp_server_config(server_slug)
    if config is None:
        logger.warning(f"MCP server '{server_slug}' not found in database or disabled")
        return []

    disabled_tools = list(config.get("disabled_tools") or [])
    for tool_name in await disabled_tool_names(server_slug):
        if tool_name not in disabled_tools:
            disabled_tools.append(tool_name)
    return await get_mcp_tools(server_slug, additional_servers={server_slug: config}, disabled_tools=disabled_tools)



async def get_all_mcp_tools(server_slug: str) -> list:
    """Get all tools of an MCP server (no filtering).

    For management UI to display tool list, supports viewing all tools and their enabled status.
    Does NOT update the global tools cache to avoid polluting agent's filtered view.

    Args:
        server_slug: Server slug

    Returns:
        List of all tools (unfiltered)
    """
    config = await get_enabled_mcp_server_config(server_slug)
    if config is None:
        logger.warning(f"MCP server '{server_slug}' not found in database or disabled")
        return []

    # Get all tools (no filtering, force refresh, no cache update)
    return await get_mcp_tools(
        server_slug,
        additional_servers={server_slug: config},
        disabled_tools=[],
        cache=False,
        force_refresh=True,
    )
