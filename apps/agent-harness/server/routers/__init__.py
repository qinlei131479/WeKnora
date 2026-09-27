from fastapi import APIRouter

from server.routers.agent_router import agent_router
from server.routers.auth_router import auth
from server.routers.chat_router import chat
from server.routers.dashboard_router import dashboard
from server.routers.filesystem_router import filesystem_router
from server.routers.mcp_router import mcp
from server.routers.model_provider_router import model_providers
from server.routers.skill_router import skills, user_skills
from server.routers.system_router import system
from server.routers.tool_router import tools
from server.routers.user_router import user_router
from server.routers.workspace_router import workspace

router = APIRouter()

router.include_router(system)
router.include_router(auth)
router.include_router(agent_router)
router.include_router(chat)
router.include_router(dashboard)
router.include_router(mcp)
router.include_router(model_providers)
router.include_router(skills)
router.include_router(user_skills)
router.include_router(tools)
router.include_router(user_router)
router.include_router(filesystem_router)
router.include_router(workspace)
