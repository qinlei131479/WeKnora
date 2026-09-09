from __future__ import annotations

import time
from types import SimpleNamespace

import jwt
import pytest
from yuxi.auth.request_token import bind_request_access_token, get_request_access_token
from yuxi.auth.run_token_store import (
    delete_run_access_token,
    is_weknora_access_token_active,
    load_run_access_token,
    run_token_key,
    save_run_access_token,
    ttl_for_access_token,
    validate_stored_run_token,
)
from yuxi.services import agent_run_service
from yuxi.utils.weknora_auth import WeKnoraTokenError, verify_weknora_access_token


def _access_token(monkeypatch: pytest.MonkeyPatch, **overrides) -> str:
    secret = "p0-test-jwt-secret"
    monkeypatch.setenv("JWT_SECRET", secret)
    now = int(time.time())
    payload = {
        "user_id": "11111111-1111-1111-1111-111111111111",
        "email": "u@example.com",
        "tenant_id": 7,
        "exp": now + 3600,
        "iat": now,
        "type": "access",
    }
    payload.update(overrides)
    return jwt.encode(payload, secret, algorithm="HS256")


def test_weknora_auth_requires_secret(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(WeKnoraTokenError, match="JWT_SECRET"):
        verify_weknora_access_token("any")


def test_weknora_auth_rejects_yxkey_and_refresh(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    with pytest.raises(WeKnoraTokenError, match="不是 WeKnora"):
        verify_weknora_access_token("yxkey_abc")
    refresh = _access_token(monkeypatch, type="refresh")
    with pytest.raises(WeKnoraTokenError, match="type=access"):
        verify_weknora_access_token(refresh)
    claims = verify_weknora_access_token(token)
    assert claims["user_id"] == "11111111-1111-1111-1111-111111111111"
    assert claims["tenant_id"] == 7


def test_weknora_auth_rejects_expired(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, exp=int(time.time()) - 10)
    with pytest.raises(WeKnoraTokenError, match="过期"):
        verify_weknora_access_token(token)


def test_ttl_does_not_exceed_remaining_life(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, exp=int(time.time()) + 90)
    assert 1 <= ttl_for_access_token(token) <= 90


@pytest.mark.asyncio
async def test_validate_stored_run_token_missing_is_none(monkeypatch: pytest.MonkeyPatch):
    async def fake_load(run_id: str):
        assert run_id == "run-1"
        return None

    monkeypatch.setattr("yuxi.auth.run_token_store.load_run_access_token", fake_load)
    assert await validate_stored_run_token("run-1") is None


@pytest.mark.asyncio
async def test_validate_stored_run_token_revoked(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)

    async def fake_load(run_id: str):
        return token

    class _Result:
        def mappings(self):
            return self

        def first(self):
            return {"token_type": "access_token", "is_revoked": True}

    class _DB:
        async def execute(self, *_args, **_kwargs):
            return _Result()

    monkeypatch.setattr("yuxi.auth.run_token_store.load_run_access_token", fake_load)
    with pytest.raises(WeKnoraTokenError, match="吊销"):
        await validate_stored_run_token("run-1", _DB())


@pytest.mark.asyncio
async def test_auth_token_check_skips_db_when_session_missing(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    assert await is_weknora_access_token_active(token, db=None) is True


class _FakeRedis:
    def __init__(self):
        self.store: dict[str, tuple[str, int | None]] = {}

    async def set(self, key: str, value: str, ex: int | None = None):
        self.store[key] = (value, ex)

    async def get(self, key: str):
        item = self.store.get(key)
        return None if item is None else item[0]

    async def delete(self, key: str):
        self.store.pop(key, None)


@pytest.mark.asyncio
async def test_run_token_store_roundtrip_and_ttl(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, exp=int(time.time()) + 120)
    redis = _FakeRedis()

    async def fake_client():
        return redis

    monkeypatch.setattr("yuxi.auth.run_token_store.get_async_redis_client", fake_client)
    ttl = await save_run_access_token("run-9", token)
    assert 1 <= ttl <= 120
    assert await load_run_access_token("run-9") == token
    assert run_token_key("run-9") in redis.store
    await delete_run_access_token("run-9")
    assert await load_run_access_token("run-9") is None


@pytest.mark.asyncio
async def test_enqueue_saves_token_when_request_has_jwt(monkeypatch: pytest.MonkeyPatch):
    saved: list[tuple[str, str]] = []

    class Queue:
        async def enqueue_job(self, job_name: str, run_id: str, _job_id: str):
            del job_name, run_id, _job_id

    async def fake_pool():
        return Queue()

    async def fake_save(run_id: str, token: str) -> int:
        saved.append((run_id, token))
        return 30

    monkeypatch.setattr(agent_run_service, "get_arq_pool", fake_pool)
    monkeypatch.setattr("yuxi.auth.run_token_store.save_run_access_token", fake_save)
    bind_request_access_token("jwt-value")
    await agent_run_service.enqueue_agent_run("run-1")
    assert saved == [("run-1", "jwt-value")]
    assert get_request_access_token() == "jwt-value"


@pytest.mark.asyncio
async def test_http_request_binds_jwt(monkeypatch: pytest.MonkeyPatch):
    from server.utils.auth_middleware import get_current_user

    bind_request_access_token(None)
    monkeypatch.setattr(
        "server.utils.auth_middleware.verify_weknora_access_token",
        lambda token: {"user_id": "u1", "tenant_id": 1},
    )

    async def fake_tenant(*_args, **_kwargs):
        return 1

    async def fake_active(*_args, **_kwargs):
        return True

    async def fake_user(*_args, **_kwargs):
        return SimpleNamespace(uid="u1", role="user", id="u1")

    monkeypatch.setattr("server.utils.auth_middleware.resolve_request_tenant_id", fake_tenant)
    monkeypatch.setattr("server.utils.auth_middleware.is_weknora_access_token_active", fake_active)
    monkeypatch.setattr("server.utils.auth_middleware.load_user_from_claims", fake_user)

    user = await get_current_user(
        authorization="Bearer user-jwt-token",
        x_tenant_id=None,
        db=object(),
    )
    assert user.uid == "u1"
    assert get_request_access_token() == "user-jwt-token"
