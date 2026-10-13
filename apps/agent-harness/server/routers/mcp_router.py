"""MCP 服务器管理路由"""

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.ext.asyncio import AsyncSession
from yuxi.services import mcp_oauth
from yuxi.services import mcp_service
from yuxi.agents.mcp.service import (
    MCPServerNotFoundError,
    connection_headers,
    create_mcp_server,
    delete_mcp_server,
    disabled_tool_names,
    get_all_mcp_servers,
    get_all_mcp_tools,
    get_mcp_server,
    is_builtin_mcp_server,
    live_mcp_tools,
    metadata_from_live_tools,
    probe_mcp_connection,
    requires_mcp_stdio_migration,
    set_server_enabled,
    toggle_tool_enabled,
    update_mcp_server,
)
from yuxi.storage.postgres.models_business import User
from yuxi.utils import logger

from server.utils.auth_middleware import get_admin_user, get_db, get_required_user

mcp = APIRouter(prefix="/system/mcp-servers", tags=["mcp"])


# =============================================================================
# === DTOs ===
# =============================================================================


class CreateMcpServerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(..., description="展示名称")
    description: str | None = Field(None, description="描述")
    enabled: bool = Field(True, description="是否启用")
    transport_type: str | None = Field(None, description="传输类型：sse/http-streamable")
    transport: str | None = Field(None, description="兼容字段：sse/streamable_http")
    url: str | None = Field(None, description="服务器 URL")
    headers: dict | None = Field(None, description="HTTP 请求头")
    auth_config: dict | None = Field(None, description="认证配置")
    advanced_config: dict | None = Field(None, description="超时与重试")
    timeout: int | None = Field(None, description="HTTP 超时时间（秒）")


class UpdateMcpServerRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(None, description="展示名称")
    description: str | None = Field(None, description="描述")
    # 服务用途：由用户在编辑抽屉维护，刷新工具目录不会覆盖。
    usage_instructions: str | None = Field(None, description="服务用途说明")
    enabled: bool | None = Field(None, description="是否启用")
    transport_type: str | None = Field(None, description="传输类型：sse/http-streamable")
    transport: str | None = Field(None, description="兼容字段：sse/streamable_http")
    url: str | None = Field(None, description="服务器 URL")
    headers: dict | None = Field(None, description="HTTP 请求头")
    auth_config: dict | None = Field(None, description="认证配置")
    advanced_config: dict | None = Field(None, description="超时与重试")
    timeout: int | None = Field(None, description="HTTP 超时时间（秒）")
    sse_read_timeout: int | None = Field(None, description="兼容字段，不再保存")
    tags: list | None = Field(None, description="兼容字段，不再保存")
    icon: str | None = Field(None, description="兼容字段，不再保存")


class UpdateMcpServerStatusRequest(BaseModel):
    enabled: bool = Field(..., description="是否启用")


# =============================================================================
# === Helpers ===
# =============================================================================


async def get_server_or_404(db: AsyncSession, slug: str):
    """Helper to get server or raise 404."""
    server = await get_mcp_server(db, slug)
    if not server:
        raise HTTPException(status_code=404, detail=f"服务器 '{slug}' 不存在")
    return server


def serialize_mcp_server(server) -> dict:
    """序列化 MCP，并补充代码内置与迁移状态。"""
    data = server.to_dict()
    data["is_builtin"] = is_builtin_mcp_server(server)
    data["requires_migration"] = requires_mcp_stdio_migration(server)
    if data["requires_migration"]:
        data["enabled"] = False
    return data


def ensure_mcp_server_runnable(server) -> None:
    """拒绝连接尚未迁移的历史用户 stdio MCP。"""
    if requires_mcp_stdio_migration(server):
        raise HTTPException(status_code=400, detail="历史 stdio MCP 已被禁用，请先迁移为远程 MCP")


# =============================================================================
# === MCP 服务器 CRUD ===
# =============================================================================


@mcp.get("")
async def get_mcp_servers(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    """获取所有 MCP 服务器配置（普通用户仅获取脱敏的基础信息）"""
    try:
        servers = await get_all_mcp_servers(db)
        if current_user.role in ["admin", "superadmin"]:
            return {"success": True, "data": [serialize_mcp_server(s) for s in servers]}

        data = []
        for s in servers:
            data.append(
                {
                    "slug": getattr(s, "slug", ""),
                    "name": getattr(s, "name", ""),
                    "description": getattr(s, "description", None),
                    "icon": getattr(s, "icon", None),
                    "enabled": bool(getattr(s, "enabled", True)) and not requires_mcp_stdio_migration(s),
                    "tags": getattr(s, "tags", None) or [],
                }
            )
        return {"success": True, "data": data}
    except Exception as e:
        logger.error(f"Failed to get MCP servers: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.post("")
async def create_mcp_server_route(
    request: CreateMcpServerRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """创建新的 MCP 服务器"""
    chosen = request.transport_type or request.transport
    if chosen not in ("sse", "http-streamable", "streamable_http"):
        raise HTTPException(status_code=400, detail="传输类型必须是 sse 或 http-streamable")
    if not request.url:
        raise HTTPException(status_code=400, detail="创建远程 MCP 时，url 必填")

    try:
        server = await create_mcp_server(
            db,
            name=request.name,
            description=request.description,
            enabled=request.enabled,
            transport=request.transport,
            transport_type=request.transport_type,
            url=request.url,
            headers=request.headers,
            auth_config=request.auth_config,
            advanced_config=request.advanced_config,
            timeout=request.timeout,
        )
        return {"success": True, "data": serialize_mcp_server(server)}
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to create MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.get("/{slug}")
async def get_mcp_server_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """获取单个 MCP 服务器配置"""
    try:
        server = await get_server_or_404(db, slug)
        return {"success": True, "data": serialize_mcp_server(server)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.put("/{slug}")
async def update_mcp_server_route(
    slug: str,
    request: UpdateMcpServerRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """更新 MCP 服务器配置"""
    chosen = request.transport_type or request.transport
    if chosen is not None and chosen not in ("sse", "http-streamable", "streamable_http"):
        raise HTTPException(status_code=400, detail="传输类型必须是 sse 或 http-streamable")

    try:
        server = await update_mcp_server(
            db,
            slug=slug,
            name=request.name,
            description=request.description,
            usage_instructions=request.usage_instructions,
            enabled=request.enabled,
            transport=request.transport,
            transport_type=request.transport_type,
            url=request.url,
            headers=request.headers,
            auth_config=request.auth_config,
            advanced_config=request.advanced_config,
            timeout=request.timeout,
            sse_read_timeout=request.sse_read_timeout,
            tags=request.tags,
            icon=request.icon,
            updated_by=current_user.username,
        )
        return {"success": True, "data": serialize_mcp_server(server)}
    except HTTPException:
        raise
    except MCPServerNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to update MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.delete("/{slug}")
async def delete_mcp_server_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """删除 MCP 服务器"""
    try:
        # 检查是否为系统内置服务器
        server = await get_mcp_server(db, slug)
        if server and is_builtin_mcp_server(server):
            raise HTTPException(status_code=403, detail="系统内置的 MCP 服务器无法删除")

        deleted = await delete_mcp_server(db, slug)
        if not deleted:
            raise HTTPException(status_code=404, detail=f"服务器 '{slug}' 不存在")
        return {"success": True, "message": f"服务器 '{slug}' 已删除"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# === MCP 服务器操作 ===
# =============================================================================


class TestConnectionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    transport_type: str | None = None
    transport: str | None = None
    url: str
    headers: dict | None = None


@mcp.post("/test-connection")
async def test_mcp_connection(
    request: TestConnectionRequest,
    current_user: User = Depends(get_admin_user),
):
    """按当前表单地址测试连接，不要求服务已经保存。"""
    del current_user
    try:
        payload = await probe_mcp_connection(
            request.transport_type or request.transport or "",
            request.url,
            request.headers,
        )
        return {
            "success": True,
            "message": payload.get("message"),
            "tool_count": payload.get("tool_count", 0),
            "data": payload,
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.error(f"Failed to probe MCP connection: {exc}")
        raise HTTPException(status_code=500, detail=f"连接失败: {exc}")


@mcp.get("/oauth/callback")
async def mcp_oauth_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """授权服务器回调。不校验登录态，单次 state 完成换票后跳回前端。"""
    from urllib.parse import quote

    fallback = "/"
    provider_error = (error or "").strip()
    if provider_error:
        return RedirectResponse(f"{fallback}#mcp_oauth_error={quote(provider_error)}", status_code=302)
    if not (state or "").strip() or not (code or "").strip():
        return RedirectResponse(f"{fallback}#mcp_oauth_error=missing_code_or_state", status_code=302)
    try:
        frontend, _service_id = await mcp_oauth.complete_authorization(db, state.strip(), code.strip())
    except Exception as exc:
        logger.error(f"MCP OAuth callback failed: {exc}")
        target = fallback
        return RedirectResponse(f"{target}#mcp_oauth_error=authorization_failed", status_code=302)
    target = frontend or fallback
    glue = "&" if "#" in target else "#"
    return RedirectResponse(f"{target}{glue}mcp_oauth_result=success", status_code=302)


async def _directory_or_none(db: AsyncSession, slug: str):
    """内置 stdio 直接返回现场工具；远程服务的目录由本进程读写 mcp_metadata。"""
    server = await get_server_or_404(db, slug)
    if is_builtin_mcp_server(server) and server.transport == "stdio":
        tools = await get_all_mcp_tools(slug)
        return server, metadata_from_live_tools(server.app_core_id or slug, tools)
    return server, None


@mcp.get("/{slug}/metadata")
async def get_mcp_metadata_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """读取已保存的工具目录。"""
    try:
        server, local = await _directory_or_none(db, slug)
        if local is not None:
            return {"success": True, "data": local}
        data = await mcp_service.get_metadata(db, server.raw, str(current_user.id or ""))
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to get MCP metadata: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.post("/{slug}/metadata/refresh")
async def refresh_mcp_metadata_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """连接远程服务并覆盖当前用户可见的工具目录。"""
    try:
        server, local = await _directory_or_none(db, slug)
        if local is not None:
            return {"success": True, "data": local}
        tools = await live_mcp_tools(server)
        snapshot = metadata_from_live_tools(server.app_core_id or slug, tools)
        data = await mcp_service.save_metadata(db, server.raw, snapshot, str(current_user.id or ""))
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to refresh MCP metadata: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.get("/{slug}/tool-approvals")
async def list_mcp_tool_approvals_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    del current_user
    try:
        server = await get_server_or_404(db, slug)
        rows = await mcp_service.list_tool_approvals(db, server.app_core_id)
        return {"success": True, "data": rows}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to list MCP tool approvals: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.put("/{slug}/tool-approvals/{tool_name}")
async def set_mcp_tool_approval_route(
    slug: str,
    tool_name: str,
    body: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    del current_user
    try:
        server = await get_server_or_404(db, slug)
        await mcp_service.set_tool_policy(db, server.app_core_id, tool_name, body)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to update MCP tool policy: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.put("/{slug}/credentials")
async def put_mcp_credentials_route(
    slug: str,
    body: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    del current_user
    try:
        server = await get_server_or_404(db, slug)
        data = await mcp_service.put_credentials(db, server.app_core_id, body.get("api_key"), body.get("token"))
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to update MCP credentials: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.delete("/{slug}/credentials/{field}")
async def delete_mcp_credential_route(
    slug: str,
    field: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    del current_user
    try:
        server = await get_server_or_404(db, slug)
        await mcp_service.clear_credential(db, server.app_core_id, field)
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to delete MCP credential: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.post("/{slug}/oauth/authorize-url")
async def mcp_oauth_authorize_route(
    slug: str,
    body: dict = Body(...),
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        server = await get_server_or_404(db, slug)
        data = await mcp_oauth.start_authorization(
            db,
            server.raw,
            str(current_user.id or ""),
            str(body.get("redirect_uri") or ""),
            str(body.get("frontend_redirect") or "/"),
        )
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to start MCP OAuth: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.get("/{slug}/oauth/status")
async def mcp_oauth_status_route(
    slug: str,
    authorization_attempt: str | None = None,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        server = await get_server_or_404(db, slug)
        data = await mcp_oauth.authorization_status(
            db,
            server.app_core_id,
            str(current_user.id or ""),
            authorization_attempt,
        )
        return {"success": True, "data": data}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to read MCP OAuth status: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.delete("/{slug}/oauth/token")
async def mcp_oauth_revoke_route(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        server = await get_server_or_404(db, slug)
        await mcp_oauth.revoke(db, server.app_core_id, str(current_user.id or ""))
        return {"success": True}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error(f"Failed to revoke MCP OAuth token: {exc}")
        raise HTTPException(status_code=500, detail=str(exc))


@mcp.post("/{slug}/test")
async def test_mcp_server(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """测试 MCP 服务器连接"""
    try:
        server = await get_server_or_404(db, slug)
        ensure_mcp_server_runnable(server)

        try:
            if is_builtin_mcp_server(server) and server.transport == "stdio":
                tools = await get_all_mcp_tools(slug)
                payload = {
                    "success": True,
                    "message": f"连接成功，共发现 {len(tools)} 个工具",
                    "tool_count": len(tools),
                    "tools": [
                        {"name": getattr(tool, "name", ""), "description": getattr(tool, "description", "") or ""}
                        for tool in tools
                    ],
                }
            else:
                payload = await probe_mcp_connection(
                    server.transport,
                    str(server.raw.get("url") or ""),
                    connection_headers(server),
                )
            return {
                "success": bool(payload.get("success")),
                "message": payload.get("message"),
                "tool_count": payload.get("tool_count", 0),
                "data": payload,
            }
        except Exception as test_error:
            raise HTTPException(status_code=500, detail=f"连接失败: {str(test_error)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to test MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.put("/{slug}/status")
async def update_mcp_server_status_route(
    slug: str,
    request: UpdateMcpServerStatusRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """更新 MCP 服务器启用状态"""
    try:
        is_enabled, server = await set_server_enabled(db, slug, request.enabled, current_user.username)
        return {
            "success": True,
            "enabled": is_enabled,
            "data": serialize_mcp_server(server),
            "message": f"MCP '{slug}' 已{'添加' if is_enabled else '移除'}",
        }
    except MCPServerNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except PermissionError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to toggle MCP server: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# === MCP 工具管理 ===
# =============================================================================


@mcp.get("/{slug}/tools")
async def get_mcp_server_tools(
    slug: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """获取 MCP 服务器的工具列表"""
    try:
        server = await get_server_or_404(db, slug)
        ensure_mcp_server_runnable(server)
        disabled_tools = await disabled_tool_names(server.app_core_id or slug)

        try:
            # 获取所有工具（不过滤 disabled_tools）
            tools = await get_all_mcp_tools(slug)
            tool_list = []

            for tool in tools:
                original_name = tool.name
                unique_id = tool.metadata.get("id") if tool.metadata else original_name

                tool_info = {
                    "name": original_name,
                    "id": unique_id,
                    "description": getattr(tool, "description", ""),
                    "enabled": original_name not in disabled_tools,
                }
                # 提取参数信息
                if hasattr(tool, "args_schema") and tool.args_schema:
                    schema = tool.args_schema.schema() if hasattr(tool.args_schema, "schema") else {}
                    tool_info["parameters"] = schema.get("properties", {})
                    tool_info["required"] = schema.get("required", [])
                else:
                    tool_info["parameters"] = {}
                    tool_info["required"] = []
                tool_list.append(tool_info)

            return {
                "success": True,
                "data": tool_list,
                "total": len(tool_list),
            }
        except Exception as tool_error:
            logger.error(f"Failed to get tools from MCP server '{slug}': {tool_error}")
            raise HTTPException(status_code=500, detail=f"获取工具失败: {str(tool_error)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get MCP server tools: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@mcp.put("/{slug}/tools/{tool_name}/toggle")
async def toggle_mcp_server_tool_route(
    slug: str,
    tool_name: str,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    """切换单个工具的启用状态"""
    try:
        enabled, _ = await toggle_tool_enabled(db, slug, tool_name, current_user.username)
        return {
            "success": True,
            "tool_name": tool_name,
            "enabled": enabled,
            "message": f"工具 '{tool_name}' 已{'启用' if enabled else '禁用'}",
        }
    except ValueError as ve:
        raise HTTPException(status_code=404, detail=str(ve))
    except Exception as e:
        logger.error(f"Failed to toggle MCP server tool: {e}")
        raise HTTPException(status_code=500, detail=str(e))
