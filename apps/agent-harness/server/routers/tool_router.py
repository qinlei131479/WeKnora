from fastapi import APIRouter, Depends

from yuxi.agents.toolkits.service import get_directory_tool_metadata
from server.utils.auth_middleware import get_required_user
from yuxi.storage.postgres.models_business import User

tools = APIRouter(prefix="/system/tools", tags=["tools"])


@tools.get("")
async def list_tools(
    category: str = None,
    source: str = None,
    _user: User = Depends(get_required_user),
):
    """获取工具列表。能打开工具页的登录成员即可访问，不再额外要求管理员。"""
    return {"success": True, "data": await get_directory_tool_metadata(category, source)}


@tools.get("/options")
async def get_tool_options(
    _user: User = Depends(get_required_user),
):
    """获取工具选项（前端下拉框用）。与列表接口同一登录成员权限。"""
    all_tools = await get_directory_tool_metadata()
    return {"success": True, "data": [{"label": t["name"], "value": t["slug"]} for t in all_tools]}
