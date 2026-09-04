"""P1 功能开关。P7 后身份只走 WeKnora JWT；Python 登录签发同一套 JWT。"""

from __future__ import annotations


def is_weknora_identity_enabled() -> bool:
    return True


def is_legacy_jwt_enabled() -> bool:
    return False


def is_local_login_enabled() -> bool:
    """Python 登录接口保留，校验 WeKnora users。"""
    return True
