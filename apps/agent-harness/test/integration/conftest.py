"""
Shared pytest fixtures for integration tests that exercise the live API service.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import uuid
from collections.abc import AsyncGenerator
from pathlib import Path

import anyio
import httpx
import pytest
import pytest_asyncio
from dotenv import load_dotenv
from sqlalchemy import text

from yuxi.storage.postgres.manager import pg_manager
from yuxi.storage.postgres.models_business import User
from yuxi.utils.auth_utils import AuthUtils
from yuxi.utils.weknora_auth import verify_weknora_access_token

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

load_dotenv(PROJECT_ROOT / ".env", override=False)
load_dotenv(PROJECT_ROOT / "test/.env.test", override=False)

API_BASE_URL = os.getenv("TEST_BASE_URL", "http://localhost:9990").rstrip("/")
ADMIN_LOGIN = os.getenv("TEST_USERNAME")
ADMIN_PASSWORD = os.getenv("TEST_PASSWORD")
LITE_MODE = os.getenv("LITE_MODE", "").lower() in {"true", "1"}

_ADMIN_TOKEN_CACHE: str | None = None
HTTP_TIMEOUT = httpx.Timeout(60.0, connect=5.0)
SANDBOX_CONTAINER_PREFIX = os.getenv("YUXI_SANDBOX_CONTAINER_PREFIX", "yuxi-sandbox")


@pytest.fixture(scope="session", autouse=True)
def ensure_live_api_schema():
    if not ADMIN_LOGIN or not ADMIN_PASSWORD:
        return

    async def run_schema_setup() -> None:
        from yuxi.storage.postgres.manager import pg_manager

        pg_manager.initialize()
        await pg_manager.create_tables()
        await pg_manager.ensure_business_schema()
        await pg_manager.ensure_knowledge_schema()

    anyio.run(run_schema_setup)


def _require_admin_credentials() -> tuple[str, str]:
    if not ADMIN_LOGIN or not ADMIN_PASSWORD:
        pytest.skip("Integration credentials are not configured via TEST_USERNAME / TEST_PASSWORD.")
    return ADMIN_LOGIN, ADMIN_PASSWORD


@pytest_asyncio.fixture(scope="function")
async def test_client() -> AsyncGenerator[httpx.AsyncClient, None]:
    async with httpx.AsyncClient(base_url=API_BASE_URL, timeout=HTTP_TIMEOUT, follow_redirects=True) as client:
        yield client


@pytest_asyncio.fixture(scope="function")
async def admin_token() -> str:
    global _ADMIN_TOKEN_CACHE

    if _ADMIN_TOKEN_CACHE:
        return _ADMIN_TOKEN_CACHE

    username, password = _require_admin_credentials()

    async with httpx.AsyncClient(
        base_url=API_BASE_URL,
        timeout=HTTP_TIMEOUT,
        follow_redirects=True,
    ) as bootstrap_client:
        response = await bootstrap_client.post(
            "/api/auth/login",
            json={"email": username, "password": password},
        )

    if response.status_code != 200:
        pytest.fail(f"Failed to authenticate as admin (status={response.status_code}): {response.text}")

    token = response.json().get("access_token")
    if not token:
        pytest.fail("Admin authentication did not return an access token.")

    _ADMIN_TOKEN_CACHE = token
    return token


@pytest.fixture(scope="function")
def admin_headers(admin_token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {admin_token}"}


def _docker_api_request(method: str, path: str) -> list[dict] | dict:
    cmd = [
        "curl",
        "-sS",
        "--unix-socket",
        os.getenv("YUXI_DOCKER_API_SOCKET", "/var/run/docker.sock"),
        "-X",
        method,
        f"{os.getenv('YUXI_DOCKER_API_BASE', 'http://localhost').rstrip('/')}{path}",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=15, check=False)
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or "Docker API request failed")
    text = (result.stdout or "").strip()
    if not text:
        return {}
    return json.loads(text)


def _cleanup_sandbox_containers() -> None:
    try:
        containers = _docker_api_request("GET", "/containers/json?all=true")
    except Exception as exc:
        print(f"Warning: Failed to list sandbox containers for cleanup: {exc}")
        return

    for container in containers if isinstance(containers, list) else []:
        names = container.get("Names") or []
        if not any(name.lstrip("/").startswith(f"{SANDBOX_CONTAINER_PREFIX}-") for name in names):
            continue
        container_id = container.get("Id")
        if not container_id:
            continue
        try:
            _docker_api_request("POST", f"/containers/{container_id}/stop?t=2")
        except Exception:
            pass
        try:
            _docker_api_request("DELETE", f"/containers/{container_id}?force=true")
        except Exception as exc:
            print(f"Warning: Failed to cleanup sandbox container {container_id[:12]}: {exc}")


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_sandboxes():
    _cleanup_sandbox_containers()
    yield
    _cleanup_sandbox_containers()


@pytest_asyncio.fixture(scope="function")
async def standard_user(test_client: httpx.AsyncClient, admin_token: str) -> AsyncGenerator[dict, None]:
    username = f"pytest_user_{uuid.uuid4().hex[:8]}"
    password = f"Pw!{uuid.uuid4().hex[:8]}"
    uid = str(uuid.uuid4())
    claims = verify_weknora_access_token(admin_token)
    tenant_id = int(claims["tenant_id"])
    email = f"{username}@integration.invalid"

    # 用户管理接口已下线；集成夹具改为直连业务库准备一次性的标准用户。
    async with pg_manager.get_async_session_context() as db:
        user = User(
            id=uid,
            username=username,
            email=email,
            password_hash=AuthUtils.hash_password(password),
            tenant_id=tenant_id,
            is_active=True,
        )
        db.add(user)
        await db.flush()
        await db.execute(
            text(
                "INSERT INTO tenant_members (user_id, tenant_id, role, status) "
                "VALUES (:user_id, :tenant_id, 'contributor', 'active')"
            ),
            {"user_id": uid, "tenant_id": tenant_id},
        )

    user_payload = {
        "id": uid,
        "uid": uid,
        "username": username,
        "email": email,
        "role": "user",
        "department_id": None,
    }
    login_response = await test_client.post(
        "/api/auth/login",
        json={"email": user_payload["email"], "password": password},
    )
    if login_response.status_code != 200:
        pytest.fail(
            f"Failed to authenticate as standard user (status={login_response.status_code}): {login_response.text}"
        )

    access_token = login_response.json().get("access_token")
    if not access_token:
        pytest.fail("Standard user login succeeded but no access token was returned.")

    try:
        yield {
            "user": user_payload,
            "password": password,
            "headers": {"Authorization": f"Bearer {access_token}"},
        }
    finally:
        async with pg_manager.get_async_session_context() as db:
            await db.execute(
                text("UPDATE tenant_members SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = :uid"),
                {"uid": uid},
            )
            await db.execute(
                text("UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = :uid"),
                {"uid": uid},
            )
