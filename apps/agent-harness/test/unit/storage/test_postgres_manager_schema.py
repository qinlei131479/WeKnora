from __future__ import annotations

import pytest

from yuxi.storage.postgres.manager import PostgresManager


class _RecordingConnection:
    def __init__(self):
        self.statements: list[str] = []

    async def execute(self, statement):
        self.statements.append(str(statement))


class _RecordingBegin:
    def __init__(self, connection: _RecordingConnection):
        self.connection = connection

    async def __aenter__(self):
        return self.connection

    async def __aexit__(self, exc_type, exc, tb):
        return False


class _RecordingEngine:
    def __init__(self, connection: _RecordingConnection):
        self.connection = connection

    def begin(self):
        return _RecordingBegin(self.connection)


@pytest.mark.asyncio
async def test_business_maintenance_only_backfills_tenant_scope(monkeypatch):
    statements: list[str] = []

    async def backfill(conn):
        statements.extend(conn.statements)
        return {"resolved": 2, "catalog": 0, "unresolved": 0}

    monkeypatch.setattr("yuxi.tenancy.schema.backfill_tenant_scope", backfill)
    manager = PostgresManager()
    connection = _RecordingConnection()
    manager._initialized = True
    manager.async_engine = _RecordingEngine(connection)

    await manager.run_business_maintenance()

    assert statements == []


@pytest.mark.asyncio
async def test_business_maintenance_ignores_unknown_backfill_error(monkeypatch):
    async def backfill(_conn):
        raise RuntimeError("temporary database issue")

    monkeypatch.setattr("yuxi.tenancy.schema.backfill_tenant_scope", backfill)
    manager = PostgresManager()
    manager._initialized = True
    manager.async_engine = _RecordingEngine(_RecordingConnection())

    await manager.run_business_maintenance()


@pytest.mark.asyncio
async def test_business_maintenance_fails_when_tenant_backfill_is_incomplete(monkeypatch):
    from yuxi.tenancy.integrity import TenantBackfillIncomplete

    async def backfill(_conn):
        raise TenantBackfillIncomplete("unresolved null tenant_id rows: 1")

    monkeypatch.setattr("yuxi.tenancy.schema.backfill_tenant_scope", backfill)
    manager = PostgresManager()
    manager._initialized = True
    manager.async_engine = _RecordingEngine(_RecordingConnection())

    with pytest.raises(TenantBackfillIncomplete, match="unresolved null tenant_id rows"):
        await manager.run_business_maintenance()


@pytest.mark.asyncio
async def test_knowledge_schema_is_noop():
    manager = PostgresManager()
    manager._initialized = True
    manager.async_engine = _RecordingEngine(_RecordingConnection())

    await manager.ensure_knowledge_schema()
