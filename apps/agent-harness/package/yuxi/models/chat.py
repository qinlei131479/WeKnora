from langchain_core.messages import convert_to_messages

from yuxi.agents.models import load_chat_model
from yuxi.utils import logger


class GeneralResponse:
    def __init__(self, content):
        self.content = content
        self.is_full = False


class LangChainChatAdapter:
    def __init__(self, model, *, model_name: str, base_url: str | None = None, info: dict | None = None):
        self.model = model
        self.model_name = model_name
        self.base_url = base_url
        self.info = info or {}

    @staticmethod
    def _normalize_messages(message):
        if isinstance(message, str):
            return message
        return convert_to_messages(message)

    async def call(self, message, stream=False):
        messages = self._normalize_messages(message)
        try:
            if stream:
                return self._stream_response(messages)
            response = await self.model.ainvoke(messages)
            return GeneralResponse(response.text)
        except Exception as e:
            err = f"Error calling model: {e}, URL: {self.base_url}, Model: {self.model_name}"
            logger.error(err)
            raise Exception(err)

    async def _stream_response(self, messages):
        async for chunk in self.model.astream(messages):
            if chunk.text:
                yield GeneralResponse(chunk.text)


def _langchain_kwargs(provider_type: str, kwargs: dict) -> dict:
    langchain_kwargs = dict(kwargs.pop("model_params", {}) or {})
    langchain_kwargs.update(kwargs)
    if provider_type == "anthropic" and "max_completion_tokens" in langchain_kwargs:
        langchain_kwargs.setdefault("max_tokens", langchain_kwargs.pop("max_completion_tokens"))
    return langchain_kwargs


def select_model(model_spec: str, **kwargs) -> LangChainChatAdapter:
    if not model_spec:
        raise ValueError("model_spec 不能为空")

    from yuxi.agents.models import resolve_chat_model_spec
    from yuxi.models.weknora_proxy import chat_proxy_base_url, resolve_weknora_model

    model_spec = resolve_chat_model_spec(model_spec)
    resolved = resolve_weknora_model(model_spec, "chat")
    model_id = str(resolved.get("id") or "")
    logger.info(f"Selecting WeKnora chat model: {model_id}")
    model = load_chat_model(model_id, **_langchain_kwargs("openai", kwargs))
    return LangChainChatAdapter(
        model,
        model_name=model_id,
        base_url=chat_proxy_base_url(model_id),
        info={"provider_type": "openai", "provider_id": str(resolved.get("source") or "remote")},
    )



if __name__ == "__main__":
    pass
