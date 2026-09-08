"""OCR 方法选择、运行时配置和健康检测。"""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession


def get_ocr_options() -> dict[str, Any]:
    return {"default_engine": "weknora", "weknora_managed": True, "engines": []}


async def parse_document(
    source: str,
    params: dict[str, Any] | None = None,
    db: AsyncSession | None = None,
) -> str:
    """使用 WeKnora 将文件解析为 Markdown。

    这是业务代码唯一应调用的文档解析入口。P7 后附件解析只走
    ``parse_source_via_weknora``，不再调用本地 OCR 引擎。
    """

    del params, db
    from yuxi.models.weknora_proxy import parse_source_via_weknora
    from yuxi.p3.errors import WeKnoraKBError

    try:
        return await parse_source_via_weknora(source)
    except WeKnoraKBError as exc:
        raise ValueError(str(exc)) from exc


async def check_all_ocr_health(db: AsyncSession) -> dict[str, Any]:
    """Native OCR engines are gone; WeKnora owns parse health."""

    del db
    return {}
