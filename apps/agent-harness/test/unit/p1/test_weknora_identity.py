from __future__ import annotations

import time
from types import SimpleNamespace

import jwt
import pytest
from yuxi.p1.auth_token_status import access_token_cache_key, is_weknora_access_token_active
from yuxi.p1.flags import is_legacy_jwt_enabled, is_local_login_enabled, is_weknora_identity_enabled
from yuxi.services.weknora_identity_service import (
    PROJECTED_PASSWORD_PLACEHOLDER,
    WeKnoraIdentityError,
    ensure_projected_user,
    map_projected_role,
    next_unique_username,
    prefer_existing_role,
)
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


def test_flags_default_keep_old_path(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("HARNESS_WEKNORA_IDENTITY", raising=False)
    monkeypatch.delenv("HARNESS_LEGACY_JWT_ENABLED", raising=False)
    monkeypatch.delenv("HARNESS_LOCAL_LOGIN_ENABLED", raising=False)
    assert is_weknora_identity_enabled() is False
    assert is_legacy_jwt_enabled() is True
    assert is_local_login_enabled() is True


def test_weknora_auth_rejects_non_uuid_and_wrong_secret(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, user_id="not-a-uuid")
    with pytest.raises(WeKnoraTokenError, match="UUID"):
        verify_weknora_access_token(token)
    good = _access_token(monkeypatch)
    monkeypatch.setenv("JWT_SECRET", "other-secret-32-bytes-minimum!!")
    with pytest.raises(WeKnoraTokenError, match="无效"):
        verify_weknora_access_token(good)


def test_weknora_auth_rejects_forged_audience(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch, aud="yuxi-know-api")
    monkeypatch.setenv("JWT_SECRET", "wrong-key-32-bytes-minimum-value")
    with pytest.raises(WeKnoraTokenError):
        verify_weknora_access_token(token)


def test_role_mapping_does_not_flatten_admins():
    assert map_projected_role(is_system_admin=True, can_access_all_tenants=False, membership_role="viewer") == "superadmin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=True, membership_role="viewer") == "superadmin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="owner") == "admin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="admin") == "admin"
    assert map_projected_role(is_system_admin=False, can_access_all_tenants=False, membership_role="contributor") == "user"


def test_projected_role_does_not_downgrade_existing():
    assert prefer_existing_role("superadmin", "admin") == "superadmin"
    assert prefer_existing_role("admin", "user") == "admin"
    assert prefer_existing_role("user", "admin") == "admin"
    assert prefer_existing_role(None, "user") == "user"


def test_username_conflict_gets_suffix():
    assert next_unique_username("alice", {"alice"}) == "alice-wk1"
    assert next_unique_username("alice", {"alice", "alice-wk1"}) == "alice-wk2"


@pytest.mark.asyncio
async def test_ensure_projected_user_blocks_unconfirmed_candidate(monkeypatch: pytest.MonkeyPatch):
    existing = SimpleNamespace(id=3, uid="alice", username="alice")

    async def fake_source(db, user_id):
        return {
            "id": user_id,
            "username": "alice",
            "email": "alice@example.com",
            "avatar": None,
            "is_active": True,
            "is_system_admin": False,
            "can_access_all_tenants": False,
        }

    async def fake_membership(db, user_id, tenant_id):
        return {"role": "contributor", "status": "active"}

    async def fake_map(db, weknora_user_id):
        return None

    async def fake_candidates(db, *, username, email):
        return [existing]

    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_weknora_user", fake_source)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_membership", fake_membership)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_confirmed_map", fake_map)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.find_unmapped_candidates", fake_candidates)

    class _DB:
        async def execute(self, *_args, **_kwargs):
            return SimpleNamespace(scalar_one_or_none=lambda: None)

    with pytest.raises(WeKnoraIdentityError, match="尚未确认") as exc:
        await ensure_projected_user(_DB(), {"user_id": USER_ID, "tenant_id": 7})
    assert exc.value.status_code == 403


@pytest.mark.asyncio
async def test_ensure_projected_user_creates_new_when_no_candidate(monkeypatch: pytest.MonkeyPatch):
    added = []

    async def fake_source(db, user_id):
        return {
            "id": user_id,
            "username": "new-user",
            "email": "new@example.com",
            "avatar": None,
            "is_active": True,
            "is_system_admin": False,
            "can_access_all_tenants": False,
        }

    async def fake_membership(db, user_id, tenant_id):
        return {"role": "contributor", "status": "active"}

    async def fake_map(db, weknora_user_id):
        return None

    async def fake_candidates(db, *, username, email):
        return []

    async def fake_username(db, preferred, exclude_id=None):
        return preferred

    async def fake_dept(db):
        return 9

    class _DB:
        def add(self, obj):
            added.append(obj)

        async def flush(self):
            added[-1].id = 21

        async def execute(self, *_args, **_kwargs):
            return SimpleNamespace(scalar_one_or_none=lambda: None)

    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_weknora_user", fake_source)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_membership", fake_membership)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_confirmed_map", fake_map)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.find_unmapped_candidates", fake_candidates)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.allocate_username", fake_username)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.get_or_create_compat_department", fake_dept)

    user = await ensure_projected_user(_DB(), {"user_id": USER_ID, "tenant_id": 7})
    assert user.uid == USER_ID
    assert user.role == "user"
    assert user.password_hash == PROJECTED_PASSWORD_PLACEHOLDER
    assert user.department_id == 9
    assert not user.password_hash.startswith("$argon2")


@pytest.mark.asyncio
async def test_ensure_projected_user_rejects_inactive_and_missing_membership(monkeypatch: pytest.MonkeyPatch):
    async def inactive(db, user_id):
        return {
            "id": user_id,
            "username": "alice",
            "email": "a@b.c",
            "avatar": None,
            "is_active": False,
            "is_system_admin": False,
            "can_access_all_tenants": False,
        }

    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_weknora_user", inactive)
    with pytest.raises(WeKnoraIdentityError, match="禁用"):
        await ensure_projected_user(SimpleNamespace(), {"user_id": USER_ID, "tenant_id": 7})

    async def active(db, user_id):
        row = dict((await inactive(db, user_id)))
        row["is_active"] = True
        return row

    async def no_member(db, user_id, tenant_id):
        return None

    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_weknora_user", active)
    monkeypatch.setattr("yuxi.services.weknora_identity_service.fetch_membership", no_member)
    with pytest.raises(WeKnoraIdentityError, match="成员资格"):
        await ensure_projected_user(SimpleNamespace(), {"user_id": USER_ID, "tenant_id": 7})


@pytest.mark.asyncio
async def test_auth_token_status_uses_hashed_cache(monkeypatch: pytest.MonkeyPatch):
    token = _access_token(monkeypatch)
    store = {}

    class _Redis:
        async def get(self, key):
            return store.get(key)

        async def set(self, key, value, ex=None):
            assert ex == 30
            assert "eyJ" not in key
            store[key] = value

    class _Result:
        def mappings(self):
            return self

        def first(self):
            return {"token_type": "access_token", "is_revoked": False}

    class _DB:
        async def execute(self, *_args, **_kwargs):
            return _Result()

    async def fake_redis():
        return _Redis()

    monkeypatch.setattr("yuxi.p1.auth_token_status.get_async_redis_client", fake_redis)
    assert await is_weknora_access_token_active(token, _DB()) is True
    assert store[access_token_cache_key(token)] == "1"
    assert token not in store


def test_docker_env_requires_jwt_secret(monkeypatch: pytest.MonkeyPatch):
    import importlib.util
    from pathlib import Path

    path = Path(__file__).resolve().parents[3] / "scripts" / "docker-env.py"
    spec = importlib.util.spec_from_file_location("docker_env_p1", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)

    monkeypatch.delenv("JWT_SECRET", raising=False)
    with pytest.raises(SystemExit, match="JWT_SECRET"):
        module.require_jwt_secret()
    monkeypatch.setenv("JWT_SECRET", "present")
    module.require_jwt_secret()


@pytest.mark.asyncio
async def test_get_current_user_keeps_legacy_when_identity_off(monkeypatch: pytest.MonkeyPatch):
    from server.utils import auth_middleware

    monkeypatch.delenv("HARNESS_WEKNORA_IDENTITY", raising=False)
    user = SimpleNamespace(id=1, is_deleted=0, is_login_locked=lambda: False)

    class _Result:
        def scalar_one_or_none(self):
            return user

    class _DB:
        async def execute(self, *_args, **_kwargs):
            return _Result()

    monkeypatch.setattr(auth_middleware.AuthUtils, "verify_access_token", lambda token: {"sub": "1"})
    got = await auth_middleware.get_current_user(authorization="Bearer legacy-token", db=_DB())
    assert got is user


@pytest.mark.asyncio
async def test_get_current_user_weknora_path_and_legacy_off(monkeypatch: pytest.MonkeyPatch):
    from server.utils import auth_middleware

    monkeypatch.setenv("HARNESS_WEKNORA_IDENTITY", "1")
    monkeypatch.setenv("HARNESS_LEGACY_JWT_ENABLED", "false")
    token = _access_token(monkeypatch)
    projected = SimpleNamespace(id=4, uid=USER_ID, is_login_locked=lambda: False)

    async def fake_active(raw, db):
        assert raw == token
        return True

    async def fake_project(db, claims):
        assert claims["user_id"] == USER_ID
        return projected

    monkeypatch.setattr(auth_middleware, "is_weknora_access_token_active", fake_active)
    monkeypatch.setattr(auth_middleware, "ensure_projected_user", fake_project)
    got = await auth_middleware.get_current_user(authorization=f"Bearer {token}", db=SimpleNamespace())
    assert got is projected

    from fastapi import HTTPException

    monkeypatch.setenv("JWT_SECRET", "other-secret-32-bytes-minimum!!")
    with pytest.raises(HTTPException) as exc:
        await auth_middleware.get_current_user(authorization="Bearer leftover-yuxi-token", db=SimpleNamespace())
    assert exc.value.status_code == 401
