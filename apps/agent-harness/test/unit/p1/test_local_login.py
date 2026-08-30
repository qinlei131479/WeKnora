from __future__ import annotations

import pytest
from fastapi import FastAPI, HTTPException
from httpx import ASGITransport, AsyncClient

from server.routers.auth_router import auth, reject_if_local_login_disabled
from yuxi.p1.flags import is_local_login_enabled

pytestmark = [pytest.mark.unit]


def test_local_login_flag_can_be_turned_off(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HARNESS_LOCAL_LOGIN_ENABLED", "false")
    assert is_local_login_enabled() is False
    with pytest.raises(HTTPException) as exc:
        reject_if_local_login_disabled()
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_disabled_local_login_routes_are_404(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HARNESS_LOCAL_LOGIN_ENABLED", "false")
    app = FastAPI()
    app.include_router(auth, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        token = await client.post("/api/auth/token", data={"username": "x", "password": "y"})
        assert token.status_code == 404
        first_run = await client.get("/api/auth/check-first-run")
        assert first_run.status_code == 404
        initialize = await client.post(
            "/api/auth/initialize", json={"uid": "admin", "password": "password1"}
        )
        assert initialize.status_code == 404
        oidc = await client.get("/api/auth/oidc/config")
        assert oidc.status_code == 404
        login_url = await client.get("/api/auth/oidc/login-url")
        assert login_url.status_code == 404
