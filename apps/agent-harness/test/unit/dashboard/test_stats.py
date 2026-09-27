from __future__ import annotations

from types import SimpleNamespace

import pytest
from yuxi.tenancy.context import TenantPrincipal, bind_tenant_principal
from yuxi.dashboard.stats import (
    dashboard_tenant_id,
    file_type_label,
    kb_type_label,
    simple_sum,
    weknora_user_total,
)


def test_simple_sum_does_not_dedup():
    assert simple_sum(10, 10) == 20
    assert simple_sum(0, 0) == 0


def test_user_total_never_counts_h_users():
    assert weknora_user_total(weknora_users=3, h_users=99) == 3
    assert weknora_user_total(weknora_users=0, h_users=5) == 0


def test_dashboard_tenant_id_fail_closed_without_principal():
    bind_tenant_principal(None)
    assert dashboard_tenant_id() is None


def test_dashboard_tenant_id_uses_token_tenant():
    bind_tenant_principal(TenantPrincipal(uid="u", tenant_id=10000, role="superadmin"))
    assert dashboard_tenant_id() == 10000
    bind_tenant_principal(None)


def test_chat_tool_calls_skip_pipeline_and_keep_identity():
    from yuxi.services.chat_usage_sync import iter_chat_tool_calls, tool_event_id

    calls = iter_chat_tool_calls(
        [
            {
                "tool_calls": [
                    {"id": "ragpipe-1", "name": "search", "result": {"success": True}},
                    {"id": "call-1", "name": "thinking", "result": {"success": False}, "duration": 12},
                    {"name": "ask_user_question", "result": {"success": True}},
                ]
            }
        ]
    )
    assert [item[1] for item in calls] == ["thinking", "ask_user_question"]
    assert calls[0][2] == "error"
    assert tool_event_id("msg", "call-1") == tool_event_id("msg", "call-1")
    assert tool_event_id("msg", "call-1") != tool_event_id("msg", "call-2")
    assert len(tool_event_id("msg", "call-1")) <= 64


def test_chat_tool_calls_prefer_target_and_avoid_step_collision():
    from yuxi.services.chat_usage_sync import iter_chat_tool_calls, tool_event_id

    calls = iter_chat_tool_calls(
        [
            {"tool_calls": [{"name": "proxy", "target": {"name": "actual_tool"}, "duration": 3}]},
            {"tool_calls": [{"name": "proxy", "target": {"name": "actual_tool"}, "duration": 5}]},
        ]
    )

    assert [item[1] for item in calls] == ["actual_tool", "actual_tool"]
    assert calls[0][0] != calls[1][0]
    assert tool_event_id("msg", calls[0][0]) != tool_event_id("msg", calls[1][0])


def test_usage_categories_keep_side_identity():
    from server.routers.dashboard_router import _fold_agent_categories, _fold_model_categories

    date = "2026-09-27"
    agents = _fold_agent_categories(
        [
            SimpleNamespace(date=date, category="shared-agent", count=2, usage_side="chat"),
            SimpleNamespace(date=date, category="shared-agent", count=3, usage_side="work"),
            SimpleNamespace(date=date, category="unknown", count=1, usage_side="chat"),
        ]
    )
    assert {(row.category, row.count) for row in agents} == {
        ("chat:shared-agent", 2),
        ("work:shared-agent", 3),
        ("chat:builtin-quick-answer", 1),
    }

    models = _fold_model_categories(
        [
            SimpleNamespace(date=date, category="unknown", count=4, usage_side="chat"),
            SimpleNamespace(date=date, category="unknown", count=5, usage_side="work"),
        ],
        "default-model",
    )
    assert {(row.category, row.count) for row in models} == {
        ("default-model", 4),
        ("unknown", 5),
    }


def test_unresolved_agent_folds_into_default():
    from yuxi.services.usage_telemetry import fold_usage_agent_id

    assert fold_usage_agent_id("unknown", "chat") == "builtin-quick-answer"
    assert fold_usage_agent_id("", "work") == "default-chatbot"
    assert fold_usage_agent_id("builtin-smart-reasoning", "chat") == "builtin-smart-reasoning"


def test_chat_usage_numbers_default_zero():
    from yuxi.services.chat_usage_sync import chat_usage_numbers

    assert chat_usage_numbers(None) == (0, 0, 0)
    assert chat_usage_numbers({"prompt_tokens": 3, "completion_tokens": 4, "total_tokens": 7}) == (3, 4, 7)


def test_labels():
    assert kb_type_label("faq") == "FAQ"
    assert kb_type_label("") == "文档库"
    assert file_type_label("pdf") == "PDF文档"
    assert file_type_label("") == "其他"


@pytest.mark.asyncio
async def test_overview_zeros_without_tenant(monkeypatch: pytest.MonkeyPatch):
    from yuxi.dashboard.stats import fetch_weknora_overview

    bind_tenant_principal(None)
    overview = await fetch_weknora_overview(SimpleNamespace())
    assert overview.users == 0
    assert overview.sessions == 0
    bind_tenant_principal(None)
