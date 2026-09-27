"""读取 WeKnora 模型列表。"""

from fastapi import APIRouter, Depends, HTTPException

from server.utils.auth_middleware import get_required_user
from yuxi.storage.postgres.models_business import User

model_providers = APIRouter(prefix="/system/model-providers", tags=["model-providers"])


@model_providers.get("/models/v2")
async def get_v2_models(
    model_type: str = "chat",
    _current_user: User = Depends(get_required_user),
):
    """获取模型列表，按 provider 分组。spec 为 WeKnora 模型 UUID。"""
    from yuxi.models.weknora_proxy import grouped_v2_models, list_weknora_models_async
    from yuxi.weknora.errors import WeKnoraKBError

    try:
        models = await list_weknora_models_async()
    except WeKnoraKBError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return {
        "success": True,
        "data": grouped_v2_models(models, model_type),
        "weknora_managed": True,
    }
