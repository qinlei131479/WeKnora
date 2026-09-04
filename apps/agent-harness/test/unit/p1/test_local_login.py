from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from server.routers.auth_router import auth
from yuxi.p1.flags import is_local_login_enabled

pytestmark = [pytest.mark.unit]


def test_python_login_stays_enabled():
    assert is_local_login_enabled() is True


@pytest.mark.asyncio
async def test_removed_harness_identity_routes_are_404():
    app = FastAPI()
    app.include_router(auth, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        first_run = await client.get("/api/auth/check-first-run")
        assert first_run.status_code == 404
        initialize = await client.post(
            "/api/auth/initialize", json={"uid": "admin", "password": "password1"}
        )
        assert initialize.status_code == 404
        oidc = await client.get("/api/auth/oidc/config")
        assert oidc.status_code == 404
        cli = await client.post("/api/auth/cli/sessions", json={"key_name": "x"})
        assert cli.status_code == 404
