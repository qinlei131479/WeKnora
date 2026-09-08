from __future__ import annotations

import importlib

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from server.routers import router

pytestmark = [pytest.mark.unit]


REMOVED = [
    ("GET", "/api/auth/check-first-run"),
    ("POST", "/api/auth/initialize"),
    ("GET", "/api/auth/oidc/config"),
    ("POST", "/api/auth/cli/sessions"),
    ("GET", "/api/departments"),
    ("GET", "/api/user/apikey/"),
    ("GET", "/api/evaluation/databases/kb_1/datasets"),
    ("GET", "/api/graph/kb_1"),
    # GET /api/knowledge/databases/external is captured by
    # knowledge_router GET /databases/{kb_id} (kb_id="external"); not a missing route.
]


@pytest.mark.parametrize("method,path", REMOVED)
async def test_p7_removed_capability_routes_are_404(method: str, path: str):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.request(method, path)
    assert response.status_code == 404, (path, response.status_code, response.text)


MOUNTED_DEAD = [
    ("POST", "/api/knowledge/databases"),
    ("GET", "/api/knowledge/databases/kb_1/graph-build/status"),
    ("POST", "/api/knowledge/databases/kb_1/graph-build/index"),
    ("POST", "/api/knowledge/databases/kb_1/graph-build/reset"),
]


@pytest.mark.parametrize("method,path", MOUNTED_DEAD)
async def test_native_kb_write_and_graph_build_are_404(method: str, path: str):
    app = FastAPI()
    app.include_router(router, prefix="/api")
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.request(method, path, json={})
    if method == "POST" and path == "/api/knowledge/databases":
        assert response.status_code in {404, 405}, (path, response.status_code, response.text)
    else:
        assert response.status_code == 404, (path, response.status_code, response.text)


@pytest.mark.parametrize(
    "mod",
    [
        "yuxi.services.oidc_service",
        "yuxi.services.auth_service",
        "yuxi.repositories.department_repository",
        "yuxi.repositories.evaluation_repository",
        "yuxi.repositories.knowledge_graph_repository",
        "yuxi.repositories.knowledge_chunk_repository",
        "server.routers.auth_dept_router",
        "server.routers.knowledge_eval_router",
        "server.routers.graph_router",
        "server.routers.external_kb_router",
        "yuxi.knowledge.graphs",
        "yuxi.knowledge.eval",
        "yuxi.knowledge.implementations.milvus",
        "yuxi.knowledge.implementations.dify",
        "yuxi.knowledge.implementations.notion",
        "yuxi.knowledge.implementations.read_only_connectors",
    ],
)
def test_removed_modules_are_gone(mod: str):
    with pytest.raises(ModuleNotFoundError):
        importlib.import_module(mod)
