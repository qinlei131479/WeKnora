from __future__ import annotations

import time
from types import SimpleNamespace

import jwt
import pytest
from yuxi.auth.token_status import access_token_cache_key, is_weknora_access_token_active
from yuxi.services.weknora_identity_service import WeKnoraIdentityError, load_user_from_claims, map_projected_role
from yuxi.utils.weknora_auth import WeKnoraTokenError, verify_weknora_access_token

USER_ID = "11111111-1111-1111-1111-111111111111"


def _access_token(monkeypatch: pytest.MonkeyPatch, secret: str = "p1-test-jwt-secret-32bytes-min!!", **overrides) -> str:
    monkeypatch.setenv("JWT_SECRET", secret)
    now = int(time.time())
    payload = {
        "user_id": USER_ID,
        "email": "u@example.com",
        "tenant_id": 7,
        "exp": now + 3600,
        "iat": now,
        "type": "access",
    }
    payload.update(overrides)
    return jwt.encode(payload, secret, algorithm="HS256")


def test_weknora_auth_rejects_non_uuid_and_wrong_secret(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, user_id="not-a-uuid")
    with pytest.raises(WeKnoraTokenError, match="UUID"):
        verify_weknora_access_token(token)
    good = _access_token(monkeypatch)
    monkeypatch.setenv("JWT_SECRET", "other-secret-32-bytes-minimum!!")
    with pytest.raises(WeKnoraTokenError, match="无效"):
        verify_weknora_access_token(good)


def test_role_mapping_does_not_flatten_admins():
    assert map_projected_role(is_system_admin=True, can_access_all_tenants=False, membership_role="viewer") == "superadmin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=True, membership_role="viewer") == "superadmin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="owner") == "admin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="admin") == "admin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="contributor") == "user"


@pytest.mark.asyncio
async def test_load_user_from_claims_rejects_inactive(monkeypatch: pytest.MonkeyPatch):
    user = SimpleNamespace(
        id=USER_ID,
        deleted_at=None,
        is_active=False,
        is_system_admin=False,
        can_access_all_tenants=False,
    )

    class _Result:
        def scalar_one_or_none(self):
            return user

    class _DB:
        async def execute(self, *_args, **_kwargs):
            return _Result()

    with pytest.raises(WeKnoraIdentityError, match="禁用"):
        await load_user_from_claims(_DB(), {"user_id": USER_ID, "tenant_id": 7})


@pytest.mark.asyncio
async def test_auth_token_status_uses_hashed_cache(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    store = {}

    class _Redis:
        async def get(self, key):
            return store.get(key)

        async def set(self, key, value, ex=None):
            store[key] = value

    async def _redis():
        return _Redis()

    monkeypatch.setattr("yuxi.auth.token_status.get_async_redis_client", _redis)

    class _DB:
        async def execute(self, *_args, **_kwargs):
            class _R:
                def mappings(self):
                    return self

                def first(self):
                    return {"token_type": "access_token", "is_revoked": False}

            return _R()

    assert await is_weknora_access_token_active(token, _DB()) is True
    assert access_token_cache_key(token) in store
