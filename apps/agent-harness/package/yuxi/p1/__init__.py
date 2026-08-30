"""P1 身份统一。默认关闭，关闭后验票路径与改造前一致。"""

from yuxi.p1.flags import (
    is_legacy_jwt_enabled,
    is_local_login_enabled,
    is_weknora_identity_enabled,
)

__all__ = [
    "is_legacy_jwt_enabled",
    "is_local_login_enabled",
    "is_weknora_identity_enabled",
]
