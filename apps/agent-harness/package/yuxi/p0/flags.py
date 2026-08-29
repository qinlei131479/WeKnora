"""P0 功能开关。默认全部关闭，关闭后行为与改造前一致。"""

from __future__ import annotations

import os


def _flag(name: str) -> bool:
    return os.environ.get(name, "").strip().lower() in {"1", "true", "yes", "on"}


def is_run_token_store_enabled() -> bool:
    """API → Worker 通过 Redis 传递用户 JWT。"""
    return _flag("HARNESS_P0_RUN_TOKEN_STORE")


def is_auth_token_db_check_enabled() -> bool:
    """Worker 复检 WeKnora auth_tokens 是否吊销。依赖 run token store。"""
    return is_run_token_store_enabled() and _flag("HARNESS_P0_CHECK_AUTH_TOKENS")
