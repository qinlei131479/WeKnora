"""用户级配置与凭据路由"""

import re
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from server.utils.auth_middleware import get_current_user, get_db, get_required_user
from yuxi.config import UserConfig, UserConfigSchema
from yuxi.p2.context import stamp_tenant_id
from yuxi.storage.minio import upload_image_to_minio
from yuxi.storage.postgres.models_business import AgentEnv, User
from yuxi.utils.datetime_utils import format_utc_datetime, utc_now_naive

user_router = APIRouter(prefix="/user", tags=["user"])

ENV_KEY_PATTERN = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")
MAX_ENV_COUNT = 200
MAX_ENV_KEY_LENGTH = 128
MAX_ENV_VALUE_LENGTH = 32768
MAX_USER_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


class AgentEnvUpdate(BaseModel):
    env: dict[str, Any] = Field(default_factory=dict)


class AgentEnvResponse(BaseModel):
    env: dict[str, str]
    updated_at: str | None = None


async def get_logged_in_user(user: User | None = Depends(get_current_user)) -> User:
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="请登录后再访问",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


@user_router.get("/config", response_model=dict)
async def get_user_config(
    current_user: User = Depends(get_logged_in_user),
    db: AsyncSession = Depends(get_db),
):
    user_config = await UserConfig.load(db, current_user.uid)
    return user_config.dump_config()


@user_router.put("/config", response_model=dict)
async def update_user_config(
    data: UserConfigSchema,
    current_user: User = Depends(get_logged_in_user),
    db: AsyncSession = Depends(get_db),
):
    user_config = await UserConfig(uid=current_user.uid, schema=data).save(db)
    return user_config.dump_config()


@user_router.post("/upload-image", response_model=dict)
async def upload_user_image(file: UploadFile = File(...), current_user: User = Depends(get_required_user)):
    try:
        image_url = await upload_image_to_minio(
            file,
            object_prefix=f"images/{current_user.uid}",
            max_size_bytes=MAX_USER_IMAGE_SIZE_BYTES,
            too_large_message="图片大小不能超过 5MB",
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    return {"success": True, "image_url": image_url, "url": image_url}


def validate_agent_env(env: dict[str, Any]) -> dict[str, str]:
    if len(env) > MAX_ENV_COUNT:
        raise HTTPException(status_code=400, detail=f"环境变量数量不能超过 {MAX_ENV_COUNT} 个")

    normalized: dict[str, str] = {}
    for key, value in env.items():
        if not isinstance(key, str):
            raise HTTPException(status_code=400, detail="环境变量名必须是字符串")
        name = key.strip()
        if not name:
            raise HTTPException(status_code=400, detail="环境变量名不能为空")
        if len(name) > MAX_ENV_KEY_LENGTH:
            raise HTTPException(status_code=400, detail=f"环境变量名长度不能超过 {MAX_ENV_KEY_LENGTH}")
        if not ENV_KEY_PATTERN.match(name):
            raise HTTPException(status_code=400, detail=f"环境变量名 {name} 格式不正确")
        if name in normalized:
            raise HTTPException(status_code=400, detail=f"环境变量名 {name} 重复")
        if not isinstance(value, str):
            raise HTTPException(status_code=400, detail=f"环境变量 {name} 的值必须是字符串")
        if len(value) > MAX_ENV_VALUE_LENGTH:
            raise HTTPException(status_code=400, detail=f"环境变量 {name} 的值过长")
        normalized[name] = value
    return normalized


@user_router.get("/agent-env", response_model=AgentEnvResponse)
async def get_agent_env(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AgentEnv).filter(AgentEnv.uid == current_user.uid))
    agent_env = result.scalar_one_or_none()
    if agent_env is None:
        return AgentEnvResponse(env={})
    return AgentEnvResponse(env=agent_env.env or {}, updated_at=format_utc_datetime(agent_env.updated_at))


@user_router.put("/agent-env", response_model=AgentEnvResponse)
async def update_agent_env(
    data: AgentEnvUpdate,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    env = validate_agent_env(data.env)
    result = await db.execute(select(AgentEnv).filter(AgentEnv.uid == current_user.uid))
    current_agent_env = result.scalar_one_or_none()
    if current_agent_env is not None and (current_agent_env.env or {}) == env:
        return AgentEnvResponse(
            env=current_agent_env.env or {},
            updated_at=format_utc_datetime(current_agent_env.updated_at),
        )

    now = utc_now_naive()
    stmt = (
        pg_insert(AgentEnv)
        .values(uid=current_user.uid, env=env, updated_at=now, tenant_id=stamp_tenant_id())
        .on_conflict_do_update(
            index_elements=[AgentEnv.uid],
            set_={"env": env, "updated_at": now},
        )
        .returning(AgentEnv)
    )
    await db.execute(stmt)
    await db.commit()
    # 直接返回刚写入的 env/now，避免身份映射中的旧实例属性导致返回陈旧值
    return AgentEnvResponse(env=env, updated_at=format_utc_datetime(now))
