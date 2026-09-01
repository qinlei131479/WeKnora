from __future__ import annotations

from types import SimpleNamespace

import pytest
from yuxi.p2.context import TenantPrincipal, bind_tenant_principal
from yuxi.p6.flags import is_weknora_dashboard_enabled
from yuxi.p6.stats import (
    dashboard_tenant_id,
    file_type_label,
    kb_type_label,
    simple_sum,
    weknora_user_total,
)


def test_flag_default_off(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("HARNESS_WEKNORA_DASHBOARD", raising=False)
    assert is_weknora_dashboard_enabled() is False
    monkeypatch.setenv("HARNESS_WEKNORA_DASHBOARD", "true")
    assert is_weknora_dashboard_enabled() is True


def test_simple_sum_does_not_dedup():
    assert simple_sum(10, 10) == 20
    assert simple_sum(0, 0) == 0


def test_user_total_never_counts_h_users():
    assert weknora_user_total(weknora_users=3, h_users=99) == 3
    assert weknora_user_total(weknora_users=0, h_users=5) == 0


def test_dashboard_tenant_id_fail_closed_without_scope(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.delenv("HARNESS_TENANT_SCOPE", raising=False)
    bind_tenant_principal(TenantPrincipal(uid="u", tenant_id=10000, role="superadmin"))
    assert dashboard_tenant_id() is None
    bind_tenant_principal(None)


def test_dashboard_tenant_id_uses_token_tenant(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("HARNESS_TENANT_SCOPE", "true")
    bind_tenant_principal(TenantPrincipal(uid="u", tenant_id=10000, role="superadmin"))
    assert dashboard_tenant_id() == 10000
    bind_tenant_principal(None)


def test_labels():
    assert kb_type_label("faq") == "FAQ"
    assert kb_type_label("") == "文档库"
    assert file_type_label("pdf") == "PDF文档"
    assert file_type_label("") == "其他"


@pytest.mark.asyncio
async def test_overview_zeros_without_tenant(monkeypatch: pytest.MonkeyPatch):
    from yuxi.p6.stats import fetch_weknora_overview

    monkeypatch.setenv("HARNESS_TENANT_SCOPE", "true")
    bind_tenant_principal(None)
    overview = await fetch_weknora_overview(SimpleNamespace())
    assert overview.users == 0
    assert overview.sessions == 0
    bind_tenant_principal(None)
