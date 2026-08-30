"""P1 功能开关。身份主路径默认关闭；legacy JWT 默认开启。"""

from __future__ import annotations

import os


def _flag(name: str, default: str = "") -> bool:
    return os.environ.get(name, default).strip().lower() in {"1", "true", "yes", "on"}


def is_weknora_identity_enabled() -> bool:
    """用 WeKnora JWT 投影 h_users。默认关闭。"""
    return _flag("HARNESS_WEKNORA_IDENTITY")


def is_legacy_jwt_enabled() -> bool:
    """回落 yuxi 自有 JWT。P1 期间默认开启。"""
    return _flag("HARNESS_LEGACY_JWT_ENABLED", "true")


def is_local_login_enabled() -> bool:
    """harness 自有密码/OIDC/初始化/用户增删改。默认开启以便回滚；融合环境在 .env 设 false。"""
    return _flag("HARNESS_LOCAL_LOGIN_ENABLED", "true")
