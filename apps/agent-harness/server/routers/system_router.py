from fastapi import APIRouter
from yuxi import get_version

system = APIRouter(prefix="/system", tags=["system"])


@system.get("/health")
async def health_check():
    """系统健康检查接口（公开接口）"""
    return {"status": "ok", "message": "服务正常运行", "version": get_version()}
