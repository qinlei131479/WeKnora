from __future__ import annotations

import pytest

from yuxi.agents.models import resolve_chat_model_spec
from yuxi.models.weknora_proxy import grouped_v2_models, resolve_weknora_model


CHAT_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
EMBED_ID = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
DUP_A = "cccccccc-cccc-cccc-cccc-cccccccccccc"
DUP_B = "dddddddd-dddd-dddd-dddd-dddddddddddd"

MODELS = [
    {
        "id": CHAT_ID,
        "name": "deepseek-v4-flash",
        "display_name": "DeepSeek V4 Flash",
        "type": "KnowledgeQA",
        "source": "siliconflow",
        "parameters": {},
    },
    {
        "id": EMBED_ID,
        "name": "bge-m3",
        "display_name": "BGE-M3",
        "type": "Embedding",
        "source": "remote",
        "parameters": {"embedding_parameters": {"dimension": 1024}},
    },
    {
        "id": DUP_A,
        "name": "qwen-plus",
        "display_name": "Qwen Plus",
        "type": "KnowledgeQA",
        "source": "aliyun",
    },
    {
        "id": DUP_B,
        "name": "qwen-plus",
        "display_name": "Qwen Plus 2",
        "type": "KnowledgeQA",
        "source": "aliyun",
    },
]


def test_resolve_uuid_and_unique_name():
    assert resolve_weknora_model(CHAT_ID, "chat", MODELS)["id"] == CHAT_ID
    assert resolve_weknora_model("siliconflow:DeepSeek-V4-Flash", "chat", MODELS)["id"] == CHAT_ID
    assert resolve_weknora_model("DeepSeek-V4-Flash", "chat", MODELS)["id"] == CHAT_ID
    assert resolve_weknora_model(
        "siliconflow-cn:deepseek-ai/DeepSeek-V4-Flash", "chat", MODELS
    )["id"] == CHAT_ID
    assert resolve_weknora_model("deepseek-v4-flash", "chat", MODELS)["id"] == CHAT_ID


def test_resolve_miss_and_collision_hard_fail():
    with pytest.raises(ValueError, match="找不到聊天模型"):
        resolve_weknora_model("missing-model", "chat", MODELS)
    with pytest.raises(ValueError, match="匹配到多个"):
        resolve_weknora_model("qwen-plus", "chat", MODELS)
    with pytest.raises(ValueError, match="未指定"):
        resolve_weknora_model("", "chat", MODELS)


def test_grouped_v2_uses_weknora_uuid_as_spec():
    grouped = grouped_v2_models(MODELS, "chat")
    specs = [item["spec"] for group in grouped.values() for item in group["models"]]
    assert CHAT_ID in specs
    assert all(len(spec) == 36 for spec in specs)


def test_resolve_chat_model_spec_skips_default_when_weknora(monkeypatch):
    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    monkeypatch.setattr("yuxi.agents.models.sys_config.default_model", "yuxi-default:model")
    assert resolve_chat_model_spec(" explicit:model ") == "explicit:model"
    with pytest.raises(ValueError, match="不能为空"):
        resolve_chat_model_spec("", fallback=None)


def test_load_chat_model_uses_proxy_not_cache(monkeypatch):
    from yuxi.agents.models import load_chat_model, _ToolCallChunkFixChatOpenAI

    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    monkeypatch.setenv("WEKNORA_BASE_URL", "http://weknora.example/api/v1")
    monkeypatch.setattr("yuxi.models.weknora_proxy.list_weknora_models", lambda: MODELS)
    monkeypatch.setattr("yuxi.p3.client.get_request_access_token", lambda: "user-jwt")
    monkeypatch.setattr("yuxi.p3.client.current_tenant_id", lambda: 7)

    def boom(*_args, **_kwargs):
        raise AssertionError("must not read yuxi model_cache")

    monkeypatch.setattr("yuxi.agents.models.model_cache.get_model_info", boom)

    model = load_chat_model("DeepSeek-V4-Flash")
    assert isinstance(model, _ToolCallChunkFixChatOpenAI)
    base_url = str(getattr(model, "openai_api_base", None) or getattr(model, "base_url", "") or "")
    if not base_url and getattr(model, "root_client", None) is not None:
        base_url = str(getattr(model.root_client, "base_url", "") or "")
    assert CHAT_ID in str(getattr(model, "model_name", "") or getattr(model, "model", "") or "")
    assert f"internal/models/{CHAT_ID}" in base_url
