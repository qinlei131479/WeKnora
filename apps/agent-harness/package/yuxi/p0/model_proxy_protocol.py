"""P0 冻结的 WeKnora 内部模型代理协议。不调用上游，不读取密钥。"""

from __future__ import annotations

from typing import Any

ALLOWED_TASKS = frozenset({"chat", "chat_stream", "embedding", "rerank"})


def validate_proxy_request(payload: dict[str, Any]) -> dict[str, Any]:
    task = str(payload.get("task") or "").strip()
    model_id = str(payload.get("model_id") or "").strip()
    tenant_id = payload.get("tenant_id")
    if task not in ALLOWED_TASKS:
        raise ValueError("task 必须是 chat / chat_stream / embedding / rerank")
    if not model_id:
        raise ValueError("model_id 不能为空")
    try:
        tenant = int(tenant_id)
    except (TypeError, ValueError) as exc:
        raise ValueError("tenant_id 无效") from exc
    if tenant <= 0:
        raise ValueError("tenant_id 无效")
    if "api_key" in payload or "app_secret" in payload:
        raise ValueError("代理请求不得携带模型密钥")
    return {
        "task": task,
        "model_id": model_id,
        "tenant_id": tenant,
        "input": payload.get("input"),
        "documents": payload.get("documents") or [],
        "messages": payload.get("messages") or [],
    }


def sanitize_proxy_response(response: dict[str, Any]) -> dict[str, Any]:
    blocked = {"api_key", "app_secret", "APIKey", "AppSecret"}
    return {key: value for key, value in response.items() if key not in blocked}


def existing_weknora_invoke_paths() -> dict[str, str]:
    """现网已能证明 WeKnora 可在服务端持钥调用模型，但不能直接当 yuxi 代理。"""
    return {
        "list_models": "GET /api/v1/models — 响应剥离密钥，不能用于运行时",
        "debug": "POST /api/v1/models/:id/debug — Admin 调试，会真实调用 chat/stream/embedding/rerank，不写会话",
        "knowledge_chat": "POST /api/v1/knowledge-chat/:session_id — 会写 sessions/messages，P0 禁止当代理",
        "agent_chat": "POST /api/v1/agent-chat/:session_id — 会写 sessions/messages，P0 禁止当代理",
        "required_p7": "P7 需新增内部代理：透传用户 JWT，按 model_id+task 调用，永不返回密钥",
    }


def debug_capability_for_task(task: str) -> dict[str, Any]:
    """映射到现网 DebugModel，仅作 P0 可行性证明，不是 P7 代理。"""
    mapping = {
        "chat": {
            "model_type": "KnowledgeQA",
            "path": "POST /api/v1/models/:id/debug",
            "writes_session": False,
            "note": "现网用 ChatStream 再在服务端消费，可证明非会话 chat",
        },
        "chat_stream": {
            "model_type": "KnowledgeQA",
            "path": "POST /api/v1/models/:id/debug",
            "writes_session": False,
            "note": "DebugModel 内部走 instance.ChatStream",
        },
        "embedding": {
            "model_type": "Embedding",
            "path": "POST /api/v1/models/:id/debug",
            "writes_session": False,
            "note": "DebugModel 走 instance.Embed",
        },
        "rerank": {
            "model_type": "Rerank",
            "path": "POST /api/v1/models/:id/debug",
            "writes_session": False,
            "note": "DebugModel 走 instance.Rerank",
        },
    }
    if task not in mapping:
        raise ValueError("未知 task")
    return mapping[task]
