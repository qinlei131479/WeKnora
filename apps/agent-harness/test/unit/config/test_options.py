from __future__ import annotations

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from yuxi.config import options
from yuxi.config.options import Option
from yuxi.storage.postgres.models_business import Base


@pytest_asyncio.fixture
async def db_session():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    async with async_sessionmaker(engine, expire_on_commit=False)() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_ensure_options_syncs_empty_definitions(db_session):
    records = await options.ensure_options_in_db(db_session)

    assert records == []
    assert list(options.OPTION_DEFINITIONS) == []


@pytest.mark.asyncio
async def test_generic_option_roundtrip_and_url_validation(db_session, monkeypatch):
    sample = Option(
        key="sample_host_opts",
        name="Sample",
        description="Generic option used only by tests.",
        params={
            "fields": [
                {
                    "key": "server_url",
                    "label": "服务地址",
                    "type": "url",
                    "environment": "SAMPLE_URI",
                },
                {
                    "key": "api_key",
                    "label": "API Key",
                    "type": "password",
                    "environment": "SAMPLE_API_KEY",
                    "sensitive": True,
                },
            ]
        },
    )
    monkeypatch.setattr(options, "OPTION_DEFINITIONS", {sample.key: sample})
    monkeypatch.delenv("SAMPLE_API_KEY", raising=False)

    records = await options.ensure_options_in_db(db_session)
    assert [record.key for record in records] == ["sample_host_opts"]

    record = await options.update_option_value(
        db_session,
        "sample_host_opts",
        {"server_url": "http://sample:8080", "api_key": "database-secret"},
        "tester",
    )
    serialized = options.serialize_option(record)
    assert serialized["value"]["server_url"] == "http://sample:8080/"
    assert serialized["value"]["api_key"] == ""
    assert serialized["sensitive_state"]["api_key"]["source"] == "database"

    with pytest.raises(ValueError, match="未知配置字段"):
        await options.update_option_value(db_session, "sample_host_opts", {"unknown": "x"}, "tester")
    with pytest.raises(ValueError):
        await options.update_option_value(
            db_session, "sample_host_opts", {"server_url": "not-url"}, "tester"
        )
