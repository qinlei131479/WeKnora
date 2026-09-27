from __future__ import annotations

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from server.routers import router

pytestmark = [pytest.mark.unit]


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
        legacy_token = await client.post(
            "/api/auth/token", data={"username": "invalid", "password": "invalid"}
        )
        assert legacy_token.status_code == 404
        current_user = await client.get("/api/auth/me")
        assert current_user.status_code == 404
        access_options = await client.get("/api/auth/users/access-options")
        assert access_options.status_code == 404
        departments = await client.get("/api/departments")
        assert departments.status_code == 404
        evaluation = await client.get("/api/evaluation/databases/kb_1/datasets")
        assert evaluation.status_code == 404
        graph = await client.get("/api/graph/kb_1")
        assert graph.status_code == 404
        apikey = await client.get("/api/user/apikey/")
        assert apikey.status_code == 404
        created = await client.post("/api/knowledge/databases", json={})
        assert created.status_code in {404, 405}
        graph_status = await client.get("/api/knowledge/databases/kb_1/graph-build/status")
        assert graph_status.status_code == 404
