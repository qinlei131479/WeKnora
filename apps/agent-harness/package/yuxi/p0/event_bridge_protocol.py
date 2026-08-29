"""P0 冻结的外部渠道桥接协议。仅常量与校验，不接入现网 IM/嵌入/API。"""

from __future__ import annotations

from typing import Any

from yuxi.p0.channel_assertion import ALLOWED_PRINCIPAL_TYPES, ASSERTION_AUDIENCE, ASSERTION_ISSUER

BACKEND_HARNESS = "harness"
BACKEND_WEKNORA = "weknora"
BINDING_FIELD = "harness_agent_slug"
SESSION_ISOLATION_RULE = (
    "backend=harness 只写 h_conversations/h_messages/h_agent_runs，"
    "禁止调用 WeKnora resolveSession()，禁止写 sessions/messages"
)

RUN_EVENT_TYPES = ("metadata", "chunk", "interrupt", "error", "end")
BRIDGE_TRANSPORTS = ("sse", "webhook", "poll")

CONTROL_SUPPORT = {
    "stop": "supported",
    "tool_step": "supported",
    "approval": "supported",
    "ask_user_question": "supported",
    "mcp_oauth": "degrade",
}

CONTROL_RULES = {
    "stop": "映射为 harness 取消 run，不创建 WeKnora session",
    "tool_step": "作为 run chunk/tool 事件转发",
    "approval": "映射 human_approval_required interrupt，由渠道回传 resume",
    "ask_user_question": "映射 interrupt，resume 走 harness run，不写 WeKnora messages",
    "mcp_oauth": "把授权 URL 回传渠道；OAuth 完成前不在 WeKnora 会话里继续",
}


def frozen_channel_protocol() -> dict[str, Any]:
    return {
        "assertion": {
            "iss": ASSERTION_ISSUER,
            "aud": ASSERTION_AUDIENCE,
            "principal_types": sorted(ALLOWED_PRINCIPAL_TYPES),
            "claims": (
                "principal_type",
                "principal_id",
                "tenant_id",
                "backend_agent_id",
                "aud",
                "exp",
            ),
        },
        "agent_binding": {
            "field": BINDING_FIELD,
            "note": "WeKnora Agent UUID 绑定 yuxi agent_slug；P8 再落库，P0 只冻结字段名",
        },
        "session": {
            "backend_harness": BACKEND_HARNESS,
            "backend_weknora": BACKEND_WEKNORA,
            "rule": SESSION_ISOLATION_RULE,
        },
        "event_bridge": {
            "transports": BRIDGE_TRANSPORTS,
            "run_events": RUN_EVENT_TYPES,
            "controls": CONTROL_SUPPORT,
            "control_rules": CONTROL_RULES,
        },
    }


def validate_bridge_event(event_type: str) -> str:
    name = str(event_type or "").strip()
    if name not in RUN_EVENT_TYPES:
        raise ValueError("不支持的 run 事件类型")
    return name


def validate_control(name: str) -> str:
    key = str(name or "").strip()
    if key not in CONTROL_SUPPORT:
        raise ValueError("不支持的渠道控制")
    return key
