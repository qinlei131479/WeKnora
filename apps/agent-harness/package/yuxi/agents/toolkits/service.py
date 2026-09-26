from typing import Any

from sqlalchemy import select

from yuxi.storage.postgres.models_business import BuiltinTool
from yuxi.utils import logger

# 内置工具目录只暴露统一分类，历史或缺失分类统一回落到 buildin。
BUILTIN_TOOL_CATEGORIES = {"buildin", "knowledge", "wiki", "database"}

# 工具元数据缓存
_metadata_cache: list[dict] = []


def _normalize_builtin_tool_category(category: str | None) -> str:
    if category in BUILTIN_TOOL_CATEGORIES:
        return category
    return "buildin"


def _extract_tool_info(tool_obj) -> dict:
    """从 tool_obj 提取基础信息"""
    metadata = getattr(tool_obj, "metadata", {}) or {}
    info = {
        "slug": tool_obj.name,
        "name": metadata.get("name", tool_obj.name),  # 显示名称优先从 metadata 获取
        "description": tool_obj.description,
        "metadata": metadata,
        "args": [],
    }

    if hasattr(tool_obj, "args_schema") and tool_obj.args_schema:
        schema = tool_obj.args_schema
        if hasattr(schema, "schema"):
            schema = schema.schema()
        info["input_schema"] = schema
        for arg_name, arg_info in schema.get("properties", {}).items():
            info["args"].append(
                {
                    "name": arg_name,
                    "type": arg_info.get("type", ""),
                    "description": arg_info.get("description", ""),
                }
            )
    return info


def _ensure_metadata_loaded():
    """延迟加载工具元数据（首次调用时自动触发）"""
    global _metadata_cache

    if _metadata_cache:  # 已加载
        return

    # 触发各 toolkit 模块的 @tool 注册（buildin / knowledge / debug）
    import yuxi.agents.toolkits  # noqa: F401
    from yuxi.agents.toolkits.registry import (
        get_all_extra_metadata,
        get_all_tool_instances,
    )

    # 获取所有工具实例
    all_tools = get_all_tool_instances()
    extra_meta = get_all_extra_metadata()

    for tool in all_tools:
        tool_name = tool.name
        runtime_info = _extract_tool_info(tool)

        # 合并附加元数据
        if tool_name in extra_meta:
            extra = extra_meta[tool_name]
            runtime_info["category"] = _normalize_builtin_tool_category(extra.category)
            runtime_info["tags"] = extra.tags
            runtime_info["config_guide"] = extra.config_guide
            # display_name 优先级高于 tool.name
            if extra.display_name:
                runtime_info["name"] = extra.display_name
        else:
            # 未注册，设为默认分类
            runtime_info["category"] = _normalize_builtin_tool_category(None)
            runtime_info["tags"] = []
            runtime_info["config_guide"] = ""
        runtime_info.setdefault("input_schema", {})
        runtime_info.setdefault("version", None)

        _metadata_cache.append(runtime_info)

    logger.info(f"Tool service loaded {len(_metadata_cache)} tools (lazy load)")


def get_tool_metadata(category: str = None) -> list[dict]:
    """获取工具元数据列表（延迟加载）"""
    _ensure_metadata_loaded()

    if category:
        return [t for t in _metadata_cache if t.get("category") == category]
    return _metadata_cache


async def sync_builtin_tool_directory() -> int:
    """同步代码注册表到只读目录；数据库不作为第二定义源。"""
    from yuxi.storage.postgres.manager import pg_manager

    _ensure_metadata_loaded()
    expected = {item["slug"]: item for item in _metadata_cache}
    try:
        async with pg_manager.get_async_session_context() as session:
            rows = (await session.execute(select(BuiltinTool).where(BuiltinTool.source == "work"))).scalars().all()
            by_slug = {row.tool_slug: row for row in rows}
            changed = False
            for slug in sorted(set(by_slug) - set(expected)):
                await session.delete(by_slug[slug])
                changed = True
            for slug, item in expected.items():
                row = by_slug.get(slug)
                values = {
                    "name": item["name"],
                    "description": item.get("description") or "",
                    "category": _normalize_builtin_tool_category(item.get("category")),
                    "input_schema": item.get("input_schema") or {},
                    "enabled": True,
                    "source": "work",
                    "version": item.get("version"),
                }
                if row is None:
                    session.add(
                        BuiltinTool(
                            tool_slug=slug,
                            capability_key=f"work:{slug}",
                            **values,
                        )
                    )
                    changed = True
                    continue
                for key, value in values.items():
                    if getattr(row, key) != value:
                        setattr(row, key, value)
                        changed = True
            if changed:
                await session.commit()
            return len(expected)
    except Exception as exc:
        logger.warning(f"Failed to sync builtin tool directory: {exc}")
        raise


async def get_directory_tool_metadata(
    category: str | None = None,
    source: str | None = None,
) -> list[dict]:
    """优先读取统一目录；目录暂不可用时回退代码注册表，保证工具预览不中断。"""
    from yuxi.storage.postgres.manager import pg_manager

    _ensure_metadata_loaded()
    registry_by_slug = {item["slug"]: item for item in get_tool_metadata(category)}
    try:
        async with pg_manager.get_async_session_context() as session:
            stmt = select(BuiltinTool).order_by(BuiltinTool.id)
            if category:
                stmt = stmt.where(BuiltinTool.category == category)
            if source:
                stmt = stmt.where(BuiltinTool.source == source)
            rows = (await session.execute(stmt)).scalars().all()
            results = []
            for row in rows:
                registry = registry_by_slug.get(row.tool_slug, {})
                results.append(
                    {
                        "slug": row.tool_slug,
                        "name": row.name,
                        "description": row.description,
                        "metadata": registry.get("metadata") or {},
                        "args": [
                            {"name": key, "type": spec.get("type", ""), "description": spec.get("description", "")}
                            for key, spec in (row.input_schema or {}).get("properties", {}).items()
                        ],
                        "input_schema": row.input_schema or {},
                        "category": row.category,
                        "tags": registry.get("tags") or [],
                        "config_guide": registry.get("config_guide") or "",
                        "capability_key": row.capability_key,
                        "enabled": bool(row.enabled),
                        "source": row.source,
                        "version": row.version,
                    }
                )
            return results
    except Exception as exc:
        logger.warning(f"Failed to read builtin tool directory, using code registry: {exc}")
        return get_tool_metadata(category)


def get_tool_instances_by_category(category: str) -> list[Any]:
    from yuxi.agents.toolkits.registry import get_all_extra_metadata, get_all_tool_instances

    extra_meta = get_all_extra_metadata()
    tools = []
    for tool in get_all_tool_instances():
        tool_meta = extra_meta.get(tool.name)
        tool_category = _normalize_builtin_tool_category(tool_meta.category if tool_meta else None)
        if tool_category == category:
            tools.append(tool)
    return tools


async def resolve_configured_runtime_tools(context) -> list[Any]:
    from yuxi.agents.mcp.service import get_enabled_mcp_tools

    selected_tools = []
    selected_tool_names: set[str] = set()
    buildin_tools = {tool.name: tool for tool in get_tool_instances_by_category("buildin")}

    for tool_name in getattr(context, "tools", None) or []:
        if not isinstance(tool_name, str) or tool_name in selected_tool_names:
            continue
        tool = buildin_tools.get(tool_name)
        if tool is None:
            logger.warning(f"Configured buildin tool not found, skip: {tool_name}")
            continue
        selected_tools.append(tool)
        selected_tool_names.add(tool_name)

    selected_mcp_servers: set[str] = set()
    for server_name in getattr(context, "mcps", None) or []:
        if not isinstance(server_name, str) or server_name in selected_mcp_servers:
            continue
        selected_mcp_servers.add(server_name)
        try:
            mcp_tools = await get_enabled_mcp_tools(server_name)
        except Exception as e:
            logger.warning(f"Failed to load configured MCP tools '{server_name}': {e}")
            continue
        if not mcp_tools:
            logger.warning(f"Configured MCP unavailable, skip: {server_name}")
            continue
        for tool in mcp_tools:
            if tool.name in selected_tool_names:
                continue
            selected_tools.append(tool)
            selected_tool_names.add(tool.name)

    # Skill 依赖的本地工具：必须随基础工具一起注册进 create_agent 的 ToolNode 才可执行，
    # 否则 Skill 激活后模型虽能发起调用，执行器仍报 "not a valid tool"。
    # 默认绑定给模型的可见性由 SkillsMiddleware 按 Skill 激活状态门控（保持按需加载）。
    from yuxi.agents.middlewares.skills import resolve_skill_gated_tools

    for tool in resolve_skill_gated_tools(context):
        if tool.name in selected_tool_names:
            continue
        selected_tools.append(tool)
        selected_tool_names.add(tool.name)

    return selected_tools
