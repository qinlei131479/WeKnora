"""MCP 数据访问层。"""

from __future__ import annotations

import uuid
from contextlib import asynccontextmanager
from typing import Any

from sqlalchemy import delete, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import (
    MCPMetadata,
    MCPOAuthClient,
    MCPOAuthToken,
    MCPService,
    MCPToolApproval,
)
from yuxi.utils.datetime_utils import utc_now_naive

_SERVICE_FIELDS = (
    "id",
    "tenant_id",
    "name",
    "description",
    "usage_instructions",
    "enabled",
    "transport_type",
    "url",
    "headers",
    "auth_config",
    "advanced_config",
    "stdio_config",
    "env_vars",
    "is_builtin",
    "created_at",
    "updated_at",
)


def _values(row: Any, fields: tuple[str, ...]) -> dict[str, Any]:
    return {name: getattr(row, name) for name in fields}


@asynccontextmanager
async def _session(db: AsyncSession | None):
    if db is not None:
        yield db
        return
    async with pg_manager.get_async_session_context() as session:
        yield session


class MCPServiceRepository:
    """mcp_services 读写。"""

    def _visible(self, tenant_id: int | None):
        stmt = select(MCPService).where(MCPService.deleted_at.is_(None))
        if tenant_id is None:
            return stmt.where(MCPService.is_builtin.is_(True))
        return stmt.where(or_(MCPService.tenant_id == tenant_id, MCPService.is_builtin.is_(True)))

    async def list_visible(self, db: AsyncSession | None, tenant_id: int | None) -> list[dict[str, Any]]:
        async with _session(db) as session:
            result = await session.execute(self._visible(tenant_id).order_by(MCPService.created_at.desc()))
            return [_values(row, _SERVICE_FIELDS) for row in result.scalars().all()]

    async def get_visible(self, db: AsyncSession | None, tenant_id: int | None, service_id: str) -> dict[str, Any] | None:
        async with _session(db) as session:
            result = await session.execute(self._visible(tenant_id).where(MCPService.id == service_id))
            row = result.scalar_one_or_none()
            return _values(row, _SERVICE_FIELDS) if row else None

    async def name_exists(self, db: AsyncSession | None, tenant_id: int, name: str) -> bool:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPService.id).where(
                    MCPService.tenant_id == tenant_id,
                    MCPService.name == name,
                    MCPService.deleted_at.is_(None),
                )
            )
            return result.scalar_one_or_none() is not None

    async def create(self, db: AsyncSession | None, data: dict[str, Any]) -> dict[str, Any]:
        async with _session(db) as session:
            row = MCPService(
                id=data.get("id") or str(uuid.uuid4()),
                tenant_id=data["tenant_id"],
                name=data["name"],
                description=data.get("description") or "",
                usage_instructions=data.get("usage_instructions") or "",
                enabled=bool(data.get("enabled", True)),
                transport_type=data["transport_type"],
                url=data.get("url"),
                headers=data.get("headers") or {},
                auth_config=data.get("auth_config"),
                advanced_config=data.get("advanced_config"),
                stdio_config=data.get("stdio_config"),
                env_vars=data.get("env_vars") or {},
                is_builtin=bool(data.get("is_builtin", False)),
                created_at=data.get("created_at") or utc_now_naive(),
                updated_at=data.get("updated_at") or utc_now_naive(),
            )
            session.add(row)
            await session.flush()
            await session.refresh(row)
            return _values(row, _SERVICE_FIELDS)

    async def update(self, db: AsyncSession | None, service_id: str, tenant_id: int, fields: dict[str, Any]) -> dict[str, Any] | None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPService).where(
                    MCPService.id == service_id,
                    MCPService.tenant_id == tenant_id,
                    MCPService.deleted_at.is_(None),
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                return None
            for key, value in fields.items():
                if key != "id":
                    setattr(row, key, value)
            row.updated_at = utc_now_naive()
            await session.flush()
            await session.refresh(row)
            return _values(row, _SERVICE_FIELDS)

    async def soft_delete(self, db: AsyncSession | None, service_id: str, tenant_id: int) -> bool:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPService).where(
                    MCPService.id == service_id,
                    MCPService.tenant_id == tenant_id,
                    MCPService.deleted_at.is_(None),
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                return False
            row.deleted_at = utc_now_naive()
            await session.flush()
            return True


class MCPToolApprovalRepository:
    """mcp_tool_approvals 读写。"""

    async def list_by_service(self, db: AsyncSession | None, tenant_id: int, service_id: str) -> list[dict[str, Any]]:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPToolApproval)
                .where(MCPToolApproval.tenant_id == tenant_id, MCPToolApproval.service_id == service_id)
                .order_by(MCPToolApproval.tool_name.asc())
            )
            return [
                _values(row, ("tool_name", "enabled", "require_approval", "created_at", "updated_at"))
                for row in result.scalars().all()
            ]

    async def upsert(
        self,
        db: AsyncSession | None,
        tenant_id: int,
        service_id: str,
        tool_name: str,
        *,
        enabled: bool | None,
        require_approval: bool | None,
    ) -> None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPToolApproval).where(
                    MCPToolApproval.tenant_id == tenant_id,
                    MCPToolApproval.service_id == service_id,
                    MCPToolApproval.tool_name == tool_name,
                )
            )
            row = result.scalar_one_or_none()
            now = utc_now_naive()
            if row is None:
                session.add(
                    MCPToolApproval(
                        id=str(uuid.uuid4()),
                        tenant_id=tenant_id,
                        service_id=service_id,
                        tool_name=tool_name,
                        enabled=True if enabled is None else enabled,
                        require_approval=False if require_approval is None else require_approval,
                        created_at=now,
                        updated_at=now,
                    )
                )
            else:
                if enabled is not None:
                    row.enabled = enabled
                if require_approval is not None:
                    row.require_approval = require_approval
                row.updated_at = now
            await session.flush()


class MCPMetadataRepository:
    """mcp_metadata 读写。"""

    async def get(
        self, db: AsyncSession | None, tenant_id: int, service_id: str, principal: str
    ) -> dict[str, Any] | None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPMetadata).where(
                    MCPMetadata.tenant_id == tenant_id,
                    MCPMetadata.service_id == service_id,
                    MCPMetadata.principal == principal,
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                return None
            return _values(
                row,
                (
                    "service_id",
                    "tools",
                    "instructions",
                    "server_name",
                    "server_version",
                    "server_description",
                    "synced_at",
                    "config_fingerprint",
                ),
            )

    async def save(self, db: AsyncSession | None, data: dict[str, Any]) -> None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPMetadata).where(
                    MCPMetadata.tenant_id == data["tenant_id"],
                    MCPMetadata.service_id == data["service_id"],
                    MCPMetadata.principal == data["principal"],
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                session.add(MCPMetadata(**data))
            else:
                for key, value in data.items():
                    setattr(row, key, value)
            await session.flush()


class MCPOAuthRepository:
    """mcp_oauth_clients 与 mcp_oauth_tokens 读写。"""

    async def get_client(self, db: AsyncSession | None, tenant_id: int, service_id: str) -> dict[str, Any] | None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPOAuthClient).where(
                    MCPOAuthClient.tenant_id == tenant_id,
                    MCPOAuthClient.service_id == service_id,
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                return None
            return _values(row, ("client_id", "client_secret", "redirect_uri"))

    async def save_client(self, db: AsyncSession | None, data: dict[str, Any]) -> None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPOAuthClient).where(
                    MCPOAuthClient.tenant_id == data["tenant_id"],
                    MCPOAuthClient.service_id == data["service_id"],
                )
            )
            row = result.scalar_one_or_none()
            now = utc_now_naive()
            if row is None:
                session.add(
                    MCPOAuthClient(
                        id=str(uuid.uuid4()),
                        created_at=now,
                        updated_at=now,
                        **data,
                    )
                )
            else:
                for key, value in data.items():
                    setattr(row, key, value)
                row.updated_at = now
            await session.flush()

    async def get_token(
        self, db: AsyncSession | None, tenant_id: int, service_id: str, user_id: str
    ) -> dict[str, Any] | None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPOAuthToken).where(
                    MCPOAuthToken.tenant_id == tenant_id,
                    MCPOAuthToken.principal_type == "web_user",
                    MCPOAuthToken.principal_id == user_id,
                    MCPOAuthToken.service_id == service_id,
                )
            )
            row = result.scalar_one_or_none()
            if row is None:
                return None
            return _values(row, ("access_token", "refresh_token", "token_type", "expires_at"))

    async def save_token(self, db: AsyncSession | None, data: dict[str, Any]) -> None:
        async with _session(db) as session:
            result = await session.execute(
                select(MCPOAuthToken).where(
                    MCPOAuthToken.tenant_id == data["tenant_id"],
                    MCPOAuthToken.principal_type == data["principal_type"],
                    MCPOAuthToken.principal_id == data["principal_id"],
                    MCPOAuthToken.service_id == data["service_id"],
                )
            )
            row = result.scalar_one_or_none()
            now = utc_now_naive()
            if row is None:
                session.add(MCPOAuthToken(id=str(uuid.uuid4()), created_at=now, updated_at=now, **data))
            else:
                for key, value in data.items():
                    setattr(row, key, value)
                row.updated_at = now
            await session.flush()

    async def delete_token(self, db: AsyncSession | None, tenant_id: int, service_id: str, user_id: str) -> None:
        async with _session(db) as session:
            await session.execute(
                delete(MCPOAuthToken).where(
                    MCPOAuthToken.tenant_id == tenant_id,
                    MCPOAuthToken.principal_type == "web_user",
                    MCPOAuthToken.principal_id == user_id,
                    MCPOAuthToken.service_id == service_id,
                )
            )
            await session.flush()


mcp_service_repository = MCPServiceRepository()
mcp_tool_approval_repository = MCPToolApprovalRepository()
mcp_metadata_repository = MCPMetadataRepository()
mcp_oauth_repository = MCPOAuthRepository()
