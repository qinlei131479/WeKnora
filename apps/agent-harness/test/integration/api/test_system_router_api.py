"""系统路由集成测试。"""

from __future__ import annotations

import pytest

pytestmark = [pytest.mark.asyncio, pytest.mark.integration]


async def test_health_endpoint_is_public(test_client):
    response = await test_client.get("/api/system/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
