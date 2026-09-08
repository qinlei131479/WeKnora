from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from server.routers import router
from yuxi.p1.flags import is_local_login_enabled

pytestmark = [pytest.mark.unit]


def test_python_login_stays_enabled():
    assert is_local_login_enabled() is True


@pytest.mark.asyncio
async def test_removed_harness_identity_routes_are_404():
    app = FastAPI()
    app.include_router(router, prefix="/api")
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
        departments = await client.get("/api/departments")
        assert departments.status_code == 404
        evaluation = await client.get("/api/evaluation/databases/kb_1/datasets")
        assert evaluation.status_code == 404
        graph = await client.get("/api/graph/kb_1")
        assert graph.status_code == 404
        apikey = await client.get("/api/user/apikey/")
        assert apikey.status_code == 404
