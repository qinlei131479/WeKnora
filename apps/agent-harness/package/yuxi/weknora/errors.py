"""WeKnora KB 调用错误。工具层按 str(e) 返回给模型。"""


class WeKnoraKBError(ValueError):
    """WeKnora 知识库调用失败。"""


class WeKnoraKBAuthError(WeKnoraKBError):
    """缺少或无效的用户 JWT，无法调 WeKnora。"""


class WeKnoraKBPermissionError(WeKnoraKBError):
    """无权限（跨租户、只读下载等）。"""
