"""接口失败的统一返回。

用户能看见的句子放在前端 locales_backend，这里只给出错误码和参数。
响应体为 {"detail": {"error_code", "params"}}，与 FastAPI HTTPException 的 detail 一致。
"""

from __future__ import annotations


class ApiError(ValueError):
    """带稳定错误码的接口失败。异常文本就是错误码，避免把内部原文返回给界面。"""

    def __init__(self, code: str, *, status: int = 400, **params: object) -> None:
        self.code = code
        self.status = status
        self.params = {key: "" if value is None else str(value) for key, value in params.items()}
        super().__init__(code)

    def payload(self) -> dict[str, object]:
        return {"error_code": self.code, "params": self.params}


_UNIQUE_MARKERS = ("duplicate key", "UniqueViolation", "unique constraint")


def failure_result(
    exc: Exception,
    *,
    error_code: str,
    fallback_code: str,
    duplicate_params: dict[str, object] | None = None,
    duplicate_markers: tuple[str, ...] = (),
) -> dict[str, object]:
    """把异常收成错误码和参数，不回传异常原文。"""
    if isinstance(exc, ApiError):
        return {"error_code": exc.code, "params": exc.params}
    text = str(exc)
    if any(marker in text for marker in (*_UNIQUE_MARKERS, *duplicate_markers)):
        params = {key: "" if value is None else str(value) for key, value in (duplicate_params or {}).items()}
        return {"error_code": error_code, "params": params}
    return {"error_code": fallback_code, "params": {}}
