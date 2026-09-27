"""
Integration tests for the retained Harness authentication login route.
"""

from __future__ import annotations

import pytest

pytestmark = [pytest.mark.asyncio, pytest.mark.integration]


async def test_login_with_invalid_credentials(test_client):
    response = await test_client.post(
        "/api/auth/login",
        json={"email": "invalid", "password": "invalid"},
    )
    assert response.status_code == 401
    assert "detail" in response.json()


async def test_removed_identity_routes_are_404(test_client):
    for method, path in (
        ("get", "/api/auth/me"),
        ("get", "/api/auth/users/access-options"),
    ):
        response = await getattr(test_client, method)(path)
        assert response.status_code == 404, response.text

    response = await test_client.post("/api/auth/token", data={"username": "invalid", "password": "invalid"})
    assert response.status_code == 404
