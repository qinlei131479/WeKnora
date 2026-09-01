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


@pytest.fixture(autouse=True)
def _isolate_p2_machine_flags(monkeypatch: pytest.MonkeyPatch):
    """单测不吃本机 .env 的 tenant 开关，避免部门匹配用例被连带改写。"""
    monkeypatch.delenv("HARNESS_TENANT_SCOPE", raising=False)
    monkeypatch.delenv("HARNESS_DEPARTMENT_ENFORCED", raising=False)
    monkeypatch.delenv("HARNESS_WEKNORA_KB", raising=False)
