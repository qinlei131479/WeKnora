"""P7 后用户只存在 WeKnora `users` 表。

请在 WeKnora 后台创建账号，不要再用本脚本往 harness 投影用户。
"""

from __future__ import annotations

import sys


def main() -> int:
    print(
        "用户由 WeKnora 管理。请在 WeKnora 登录页或后台创建账号，"
        "不要再运行 harness 种子用户脚本。",
        file=sys.stderr,
    )
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
