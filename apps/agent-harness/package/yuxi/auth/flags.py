"""鉴权运行时开关：API → Worker 的 JWT 传递，以及 Worker 对 auth_tokens 的吊销复检。"""

from __future__ import annotations

import os


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def is_run_token_store_enabled() -> bool:
    """打开后，enqueue 把当前请求 JWT 写入 Redis，Worker 再取出绑定。"""
    return _flag("HARNESS_RUN_TOKEN_STORE")


def is_auth_token_db_check_enabled() -> bool:
    """Worker 复检 WeKnora auth_tokens 是否吊销。依赖 run token store。"""
    return is_run_token_store_enabled() and _flag("HARNESS_CHECK_AUTH_TOKENS")
