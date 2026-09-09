from __future__ import annotations

import sys
from pathlib import Path

import pytest

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))


def pytest_configure(config: pytest.Config) -> None:
    """Register shared markers without binding every test to a live environment."""
    config.addinivalue_line("markers", "unit: marks tests that run without live services")
    config.addinivalue_line("markers", "auth: marks tests that require authentication")
    config.addinivalue_line("markers", "integration: marks tests that hit the live API service")
    config.addinivalue_line("markers", "e2e: marks tests that exercise an end-to-end workflow")
    config.addinivalue_line("markers", "slow: marks tests as slow")


pytest_plugins = ["pytest_asyncio"]

_DEFAULT_TEST_TENANT_ID = 1


@pytest.fixture(autouse=True)
def _bind_default_tenant_principal():
    """单测默认带当前空间，与生产写入必须 stamp tenant_id 一致。"""
    from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal

    bind_tenant_principal(
        TenantPrincipal(uid="test-user", tenant_id=_DEFAULT_TEST_TENANT_ID, role="user")
    )
    yield
    bind_tenant_principal(None)
