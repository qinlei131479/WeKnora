"""P0 验证原型。默认关闭，不改变现网路径。"""

from yuxi.p0.flags import (
    is_auth_token_db_check_enabled,
    is_run_token_store_enabled,
)

__all__ = [
    "is_auth_token_db_check_enabled",
    "is_run_token_store_enabled",
]
