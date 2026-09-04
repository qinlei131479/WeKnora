"""模型供应商配置数据访问层。P7 后表已删除。"""

from typing import Any


async def list_model_providers(db: Any) -> list[Any]:
    return []


async def get_model_provider(db: Any, provider_id: str) -> None:
    return None


async def create_model_provider(db: Any, data: dict) -> None:
    raise RuntimeError("模型由 WeKnora 管理")


async def update_model_provider(db: Any, provider: Any, data: dict) -> Any:
    raise RuntimeError("模型由 WeKnora 管理")


async def delete_model_provider(db: Any, provider: Any) -> None:
    raise RuntimeError("模型由 WeKnora 管理")
