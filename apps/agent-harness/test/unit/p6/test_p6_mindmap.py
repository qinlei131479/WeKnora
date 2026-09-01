from __future__ import annotations

from types import SimpleNamespace

import pytest

from yuxi.agents.toolkits.kbs import tools as kb_tools


def _mindmap_callable():
    callback = getattr(kb_tools.get_mindmap, "coroutine", None) or getattr(kb_tools.get_mindmap, "func", None)
    assert callback is not None
    return callback


@pytest.mark.asyncio
async def test_get_mindmap_uses_weknora_when_flag_on(monkeypatch):
    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    kb_id = "11111111-1111-1111-1111-111111111111"

    async def fake_visible(_runtime):
        return [{"name": "Docs", "kb_id": kb_id}]

    async def fake_mindmap(target_id: str):
        assert target_id == kb_id
        return {"content": "Docs", "children": [{"content": "a.pdf", "children": []}]}

    monkeypatch.setattr(kb_tools, "_resolve_visible_knowledge_bases_for_query", fake_visible)
    monkeypatch.setattr("yuxi.models.weknora_proxy.get_or_generate_mindmap", fake_mindmap)

    text = await _mindmap_callable()(kb_name="Docs", runtime=SimpleNamespace())
    assert "Docs" in text
    assert "a.pdf" in text
    assert "不提供思维导图" not in text


@pytest.mark.asyncio
async def test_get_mindmap_surfaces_weknora_error_without_crashing(monkeypatch):
    """对话中调用 get_mindmap 时，WeKnora 侧错误应转成可读文本回给用户，而不是抛异常中断对话。"""
    from yuxi.p3.errors import WeKnoraKBError

    monkeypatch.setenv("HARNESS_WEKNORA_KB", "true")
    kb_id = "22222222-2222-2222-2222-222222222222"

    async def fake_visible(_runtime):
        return [{"name": "Docs", "kb_id": kb_id}]

    async def fake_mindmap_error(target_id: str):
        assert target_id == kb_id
        raise WeKnoraKBError("知识库还没有可展示的思维导图")

    monkeypatch.setattr(kb_tools, "_resolve_visible_knowledge_bases_for_query", fake_visible)
    monkeypatch.setattr("yuxi.models.weknora_proxy.get_or_generate_mindmap", fake_mindmap_error)

    text = await _mindmap_callable()(kb_name="Docs", runtime=SimpleNamespace())
    assert text == "知识库还没有可展示的思维导图"
