from langchain.chat_models import BaseChatModel
from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from yuxi.utils.logging_config import logger


def resolve_chat_model_spec(model_spec: str | None, *, fallback: str | None = None) -> str:
    """解析空模型配置：请求值优先，其次调用方 fallback。不回落到 yuxi default_model。"""
    for candidate in (model_spec, fallback):
        if isinstance(candidate, str) and candidate.strip():
            return candidate.strip()
    raise ValueError("model spec 不能为空")


def load_chat_model(fully_specified_name: str | None, **kwargs) -> BaseChatModel:
    """聊天模型只走 WeKnora 代理。"""
    fully_specified_name = resolve_chat_model_spec(fully_specified_name)
    from yuxi.models.weknora_proxy import (
        chat_proxy_base_url,
        extra_request_headers,
        request_access_token,
        resolve_weknora_model,
    )

    model = resolve_weknora_model(fully_specified_name, "chat")
    model_id = str(model.get("id") or "")
    headers = extra_request_headers()
    logger.debug(f"Loading WeKnora chat model {model_id}")
    openai_kwargs = dict(kwargs)
    if headers:
        openai_kwargs["default_headers"] = {**headers, **dict(openai_kwargs.get("default_headers") or {})}
    return _ToolCallChunkFixChatOpenAI(
        model=model_id,
        api_key=SecretStr(request_access_token()),
        base_url=chat_proxy_base_url(model_id),
        stream_usage=True,
        **openai_kwargs,
    )


class _ToolCallChunkFixChatOpenAI(ChatOpenAI):
    """归一化流式 tool_call 续片中的空串 name/id，规避 v3 流式累积缺陷。"""

    async def _astream(self, *args, **kwargs):
        async for chunk in super()._astream(*args, **kwargs):
            _normalize_tool_call_chunks(chunk.message)
            yield chunk

    def _stream(self, *args, **kwargs):
        for chunk in super()._stream(*args, **kwargs):
            _normalize_tool_call_chunks(chunk.message)
            yield chunk


def _normalize_tool_call_chunks(message) -> None:
    """把工具调用续片里空字符串的 name/id 归一化为 None。

    LangGraph v3 流式累积对 tool_call 字段是“后值覆盖”：部分 OpenAI 兼容提供商
    （siliconflow、阿里云百炼等）在续片里把 name/id 下发为空字符串 ""，会覆盖首片
    的真实值（siliconflow 丢 name、百炼丢 id），导致工具结果无法按 tool_call_id
    关联、工具状态停留在“进行中”。OpenAI 官方在续片里发 None 不会触发覆盖，这里
    把空串归一化为 None 对齐该行为。待上游修复 v3 协议后可移除。
    """
    for chunk in message.tool_call_chunks:
        if chunk.get("name") == "":
            chunk["name"] = None
        if chunk.get("id") == "":
            chunk["id"] = None
