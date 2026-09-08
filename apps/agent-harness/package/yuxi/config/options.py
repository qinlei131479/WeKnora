"""通用配置项定义、持久化、校验和运行时解析。

系统代码维护 `params`，管理员只修改 `value`。本模块只支持受控的基础字段，
不提供任意动态组件或可执行协议。
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any

from pydantic import HttpUrl, TypeAdapter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.storage.postgres.models_business import ConfigOption


@dataclass(frozen=True, slots=True)
class Option:
    """由代码定义、每次读取都查询数据库的通用配置项。"""

    key: str
    name: str
    description: str
    params: dict[str, Any]

    async def get(self, db: AsyncSession | None = None) -> dict[str, Any]:
        if db is None:
            from yuxi.storage.postgres.manager import pg_manager

            async with pg_manager.get_async_session_context() as session:
                return await self.get(session)

        record = await get_option(db, self.key)
        if record is None:
            raise ValueError(f"配置项不存在: {self.key}")
        stored = dict(record.value or {})
        return {
            field["key"]: stored.get(field["key"]) or os.getenv(field.get("environment", "")) or None
            for field in _fields(record)
        }


OPTION_DEFINITIONS: dict[str, Option] = {}

_URL_ADAPTER = TypeAdapter(HttpUrl)


async def ensure_options_in_db(db: AsyncSession) -> list[ConfigOption]:
    """幂等同步系统定义，保留管理员已经保存的值。"""

    existing = {record.key: record for record in await list_options(db)}
    synced = []
    for key, definition in OPTION_DEFINITIONS.items():
        record = existing.get(key)
        if record is None:
            record = ConfigOption(
                key=key,
                name=definition.name,
                description=definition.description,
                params=definition.params,
                value={},
                created_by="system",
                updated_by="system",
            )
            db.add(record)
        else:
            record.name = definition.name
            record.description = definition.description
            record.params = definition.params
        synced.append(record)
    await db.flush()
    return synced


async def list_options(db: AsyncSession) -> list[ConfigOption]:
    result = await db.execute(select(ConfigOption).order_by(ConfigOption.id.asc()))
    return list(result.scalars().all())


async def get_option(db: AsyncSession, key: str) -> ConfigOption | None:
    statement = select(ConfigOption).where(ConfigOption.key == key).execution_options(populate_existing=True)
    result = await db.execute(statement)
    return result.scalar_one_or_none()


def serialize_option(record: ConfigOption) -> dict[str, Any]:
    """返回表单定义和值；密钥只返回来源和脱敏预览。"""

    value = dict(record.value or {})
    sensitive_configured = {}
    sensitive_state = {}
    for field in _fields(record):
        if not field.get("sensitive"):
            continue
        field_key = field["key"]
        stored_value = str(value.get(field_key) or "")
        environment_value = os.getenv(field.get("environment", ""))
        if stored_value:
            state = {
                "source": "database",
                "configured": True,
                "preview": _mask_sensitive_value(stored_value),
            }
        elif environment_value:
            state = {"source": "environment", "configured": True, "preview": None}
        else:
            state = {"source": "none", "configured": False, "preview": None}
        sensitive_state[field_key] = state
        sensitive_configured[field_key] = state["configured"]
        value[field_key] = ""
    return {
        "key": record.key,
        "name": record.name,
        "description": record.description,
        "params": record.params or {},
        "value": value,
        "sensitive_configured": sensitive_configured,
        "sensitive_state": sensitive_state,
    }


async def update_option_value(
    db: AsyncSession,
    key: str,
    value: dict[str, Any],
    updated_by: str,
) -> ConfigOption | None:
    record = await get_option(db, key)
    if record is None:
        return None

    fields = {field["key"]: field for field in _fields(record)}
    unknown = set(value) - set(fields)
    if unknown:
        raise ValueError(f"未知配置字段: {', '.join(sorted(unknown))}")

    updated = dict(record.value or {})
    for field_key, raw_value in value.items():
        field = fields[field_key]
        updated[field_key] = _normalize_value(field, raw_value)
    record.value = updated
    record.updated_by = updated_by
    await db.flush()
    return record


def _fields(record: ConfigOption) -> list[dict[str, Any]]:
    return list((record.params or {}).get("fields") or [])


def _normalize_value(field: dict[str, Any], value: Any) -> str:
    normalized = str(value or "").strip()
    if field.get("type") == "url" and normalized:
        return str(_URL_ADAPTER.validate_python(normalized))
    return normalized


def _mask_sensitive_value(value: str) -> str:
    if len(value) == 1:
        return "*******"
    if len(value) <= 4:
        return f"{value[0]}*******{value[-1]}"
    return f"{value[:2]}*******{value[-2:]}"
