"""当前请求绑定的 WeKnora access token（ContextVar，不落库）。"""

from __future__ import annotations

from contextvars import ContextVar

_REQUEST_ACCESS_TOKEN: ContextVar[str | None] = ContextVar("request_access_token", default=None)


def bind_request_access_token(token: str | None) -> None:
    _REQUEST_ACCESS_TOKEN.set(token)


def get_request_access_token() -> str | None:
    value = _REQUEST_ACCESS_TOKEN.get()
    if not value:
        return None
    return value.strip() or None
