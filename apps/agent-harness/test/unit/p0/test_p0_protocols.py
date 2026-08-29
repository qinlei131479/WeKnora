from __future__ import annotations

import time
from types import SimpleNamespace

import jwt
import pytest
from yuxi.p0.channel_assertion import create_channel_assertion, verify_channel_assertion
from yuxi.p0.event_bridge_protocol import (
    BACKEND_HARNESS,
    BINDING_FIELD,
    SESSION_ISOLATION_RULE,
    frozen_channel_protocol,
    validate_bridge_event,
    validate_control,
)
from yuxi.p0.kb_fulltext import (
    CHUNKS_PAGE_SIZE_MAX,
    capability_for_kb_type,
    flatten_pages,
    paginate_chunks,
    reconstruct_document_text,
)
from yuxi.p0.model_proxy_protocol import (
    debug_capability_for_task,
    existing_weknora_invoke_paths,
    sanitize_proxy_response,
    validate_proxy_request,
)
from yuxi.p0.request_token import bind_request_access_token, get_request_access_token
from yuxi.p0.run_token_store import (
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
        "user_id": "user-1",
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
    assert claims["user_id"] == "user-1"
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

    monkeypatch.setattr("yuxi.p0.run_token_store.load_run_access_token", fake_load)
    assert await validate_stored_run_token("run-1") is None


@pytest.mark.asyncio
async def test_validate_stored_run_token_revoked(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    monkeypatch.setenv("HARNESS_P0_RUN_TOKEN_STORE", "1")
    monkeypatch.setenv("HARNESS_P0_CHECK_AUTH_TOKENS", "1")

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

    monkeypatch.setattr("yuxi.p0.run_token_store.load_run_access_token", fake_load)
    with pytest.raises(WeKnoraTokenError, match="吊销"):
        await validate_stored_run_token("run-1", _DB())


@pytest.mark.asyncio
async def test_auth_token_check_skips_db_when_flag_off(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    monkeypatch.delenv("HARNESS_P0_CHECK_AUTH_TOKENS", raising=False)
    assert await is_weknora_access_token_active(token, db=SimpleNamespace()) is True


def test_reconstruct_document_with_overlap_and_pages():
    text = "ABCDEFGHIJ" * 15
    chunks = []
    cursor = 0
    window = 20
    step = 15
    index = 0
    while cursor < len(text):
        end = min(len(text), cursor + window)
        chunks.append(
            {
                "id": f"c{index}",
                "chunk_index": index,
                "start_at": cursor,
                "end_at": end,
                "content": text[cursor:end],
            }
        )
        cursor += step
        index += 1

    pages = paginate_chunks(chunks, page_size=CHUNKS_PAGE_SIZE_MAX)
    assert all(len(page) <= CHUNKS_PAGE_SIZE_MAX for page in pages)
    result = reconstruct_document_text(flatten_pages(pages))
    assert result["reconstructable"] is True
    assert result["used_offsets"] is True
    assert result["overlap_count"] >= 1
    assert result["text"] == text
    assert len(chunks) > 1


def test_paginate_chunks_caps_page_size_and_covers_over_100():
    chunks = [{"id": str(i), "chunk_index": i, "content": f"c{i}"} for i in range(105)]
    pages = paginate_chunks(chunks, page_size=1000)
    assert len(pages) == 2
    assert len(pages[0]) == CHUNKS_PAGE_SIZE_MAX
    assert len(pages[1]) == 5
    assert reconstruct_document_text(flatten_pages(pages))["chunk_count"] == 105


def test_reconstruct_falls_back_when_offsets_are_zero():
    chunks = [
        {"id": "b", "chunk_index": 1, "start_at": 0, "end_at": 0, "content": "world"},
        {"id": "a", "chunk_index": 0, "start_at": 0, "end_at": 0, "content": "hello"},
    ]
    result = reconstruct_document_text(chunks)
    assert result["used_offsets"] is False
    assert result["text"] == "hello\nworld"


def test_kb_type_capabilities_differ():
    assert capability_for_kb_type("faq")["open_find"] == "entry"
    assert capability_for_kb_type("wiki")["open_find"] == "page"
    assert capability_for_kb_type("document")["open_find"] == "document"


def test_model_proxy_protocol_rejects_secrets():
    parsed = validate_proxy_request(
        {"task": "chat", "model_id": "m1", "tenant_id": 3, "messages": [{"role": "user"}]}
    )
    assert parsed["task"] == "chat"
    with pytest.raises(ValueError, match="密钥"):
        validate_proxy_request({"task": "chat", "model_id": "m1", "tenant_id": 3, "api_key": "secret"})
    sanitized = sanitize_proxy_response({"content": "ok", "api_key": "secret", "AppSecret": "x"})
    assert sanitized == {"content": "ok"}
    assert "knowledge_chat" in existing_weknora_invoke_paths()
    assert debug_capability_for_task("embedding")["writes_session"] is False
    assert debug_capability_for_task("rerank")["writes_session"] is False
    assert debug_capability_for_task("chat_stream")["writes_session"] is False


def test_channel_assertion_roundtrip(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET", "p0-test-jwt-secret")
    token = create_channel_assertion(
        principal_type="im_user",
        principal_id="im-1",
        tenant_id=3,
        backend_agent_id="agent-slug",
    )
    claims = verify_channel_assertion(token)
    assert claims["aud"] == "weknora-harness-internal"
    assert claims["principal_type"] == "im_user"
    assert claims["tenant_id"] == 3


def test_channel_assertion_rejects_wrong_audience(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("JWT_SECRET", "p0-test-jwt-secret")
    now = int(time.time())
    token = jwt.encode(
        {
            "iss": "weknora",
            "aud": "other",
            "exp": now + 60,
            "iat": now,
            "principal_type": "im_user",
            "principal_id": "im-1",
            "tenant_id": 1,
            "backend_agent_id": "a",
        },
        "p0-test-jwt-secret",
        algorithm="HS256",
    )
    with pytest.raises(WeKnoraTokenError):
        verify_channel_assertion(token)


def test_event_bridge_protocol_frozen():
    spec = frozen_channel_protocol()
    assert spec["agent_binding"]["field"] == BINDING_FIELD
    assert BACKEND_HARNESS in spec["session"]["rule"] or spec["session"]["backend_harness"] == BACKEND_HARNESS
    assert "resolveSession" in SESSION_ISOLATION_RULE
    assert validate_bridge_event("interrupt") == "interrupt"
    assert validate_control("mcp_oauth") == "mcp_oauth"
    assert spec["event_bridge"]["controls"]["mcp_oauth"] == "degrade"
    with pytest.raises(ValueError):
        validate_bridge_event("session_created")


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

    monkeypatch.setattr("yuxi.p0.run_token_store.get_async_redis_client", fake_client)
    ttl = await save_run_access_token("run-9", token)
    assert 1 <= ttl <= 120
    assert await load_run_access_token("run-9") == token
    assert run_token_key("run-9") in redis.store
    await delete_run_access_token("run-9")
    assert await load_run_access_token("run-9") is None


@pytest.mark.asyncio
async def test_enqueue_saves_token_only_when_flag_on(monkeypatch: pytest.MonkeyPatch):
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
    monkeypatch.setattr("yuxi.p0.run_token_store.save_run_access_token", fake_save)
    bind_request_access_token("jwt-value")
    monkeypatch.delenv("HARNESS_P0_RUN_TOKEN_STORE", raising=False)
    await agent_run_service.enqueue_agent_run("run-off")
    assert saved == []
    assert get_request_access_token() == "jwt-value"

    monkeypatch.setenv("HARNESS_P0_RUN_TOKEN_STORE", "1")
    await agent_run_service.enqueue_agent_run("run-on")
    assert saved == [("run-on", "jwt-value")]
