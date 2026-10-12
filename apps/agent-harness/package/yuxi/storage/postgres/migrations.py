"""启动时确认企业迁移已由 app-core 执行到位。本模块不修改表结构。"""

from __future__ import annotations

import asyncio
import os
import re
from pathlib import Path

from yuxi.utils.logging_config import logger

MIGRATIONS_TABLE = "schema_migrations_kjsc"
OFFICIAL_MIGRATIONS_TABLE = "schema_migrations"
_WAIT_LOG_INTERVAL_SECONDS = 5.0
_MIGRATION_FILE_RE = re.compile(r"^(\d+)_.*\.up\.sql$", re.IGNORECASE)


class KjscMigrationError(RuntimeError):
    """企业迁移版本与当前代码不一致，或等待 app-core 超时。"""


def auto_migrate_enabled() -> bool:
    """与 Go 服务共用 AUTO_MIGRATE 开关，默认启用。"""

    return os.getenv("AUTO_MIGRATE", "true") != "false"


def migration_wait_timeout_from_env() -> float:
    raw = os.getenv("YUXI_DB_MIGRATION_LOCK_WAIT_TIMEOUT_SECONDS", "300")
    try:
        timeout = float(raw)
    except ValueError as exc:
        raise KjscMigrationError("YUXI_DB_MIGRATION_LOCK_WAIT_TIMEOUT_SECONDS 必须是数字") from exc
    if timeout <= 0:
        raise KjscMigrationError("YUXI_DB_MIGRATION_LOCK_WAIT_TIMEOUT_SECONDS 必须大于 0")
    return timeout


def migrations_dir() -> Path:
    """解析容器与源码开发两种运行形态下的企业迁移目录。"""

    candidates = [
        Path("/app/migrations/version_kjsc"),
        Path.cwd() / "migrations" / "version_kjsc",
        *(parent / "migrations" / "version_kjsc" for parent in Path(__file__).resolve().parents),
    ]
    for candidate in candidates:
        if candidate.is_dir():
            return candidate
    raise KjscMigrationError("未找到 migrations/version_kjsc 目录")


def load_kjsc_versions(directory: Path | None = None) -> list[int]:
    """读取企业 up 迁移的版本号。只用来核对，不执行 SQL。"""

    root = directory or migrations_dir()
    versions: list[int] = []
    seen: dict[int, Path] = {}
    for path in root.iterdir():
        if not path.is_file():
            continue
        match = _MIGRATION_FILE_RE.fullmatch(path.name)
        if not match:
            continue
        version = int(match.group(1))
        if version in seen:
            raise KjscMigrationError(f"企业迁移版本重复: {version} ({seen[version]}, {path})")
        seen[version] = path
        versions.append(version)

    versions.sort()
    if not versions:
        raise KjscMigrationError(f"企业迁移目录为空: {root}")
    for previous, current in zip(versions, versions[1:], strict=False):
        if current != previous + 1:
            raise KjscMigrationError(f"企业迁移版本不连续: {previous} 之后是 {current}")
    return versions


def assess_schema(
    *,
    official_present: bool,
    official_version: int | None,
    official_dirty: bool,
    kjsc_present: bool,
    kjsc_version: int | None,
    kjsc_dirty: bool,
    expected_version: int,
) -> str | None:
    """返回 None 表示可以启动。版本高于当前代码时直接失败，其余情况返回等待原因。"""

    if not official_present or official_version is None:
        return "官方迁移尚未完成"
    if official_dirty:
        return "官方迁移处于 dirty 状态"
    if not kjsc_present or kjsc_version is None:
        return "企业迁移尚未完成"
    if kjsc_version > expected_version:
        raise KjscMigrationError(f"数据库企业迁移版本 {kjsc_version} 高于当前代码版本 {expected_version}")
    if kjsc_dirty:
        return f"企业迁移处于 dirty 状态: version={kjsc_version}"
    if kjsc_version < expected_version:
        return f"企业迁移版本 {kjsc_version}，需要 {expected_version}"
    return None


def _psycopg_url(url: str) -> str:
    return url.replace("+asyncpg", "", 1).replace("+psycopg", "", 1)


async def _read_schema_status(url: str) -> tuple[bool, int | None, bool, bool, int | None, bool]:
    import psycopg

    async with await psycopg.AsyncConnection.connect(_psycopg_url(url)) as conn:
        async with conn.cursor() as cursor:
            await cursor.execute(
                f"""
                SELECT
                    to_regclass('{OFFICIAL_MIGRATIONS_TABLE}') IS NOT NULL,
                    to_regclass('{MIGRATIONS_TABLE}') IS NOT NULL
                """
            )
            official_present, kjsc_present = await cursor.fetchone()
            official_version, official_dirty = None, False
            kjsc_version, kjsc_dirty = None, False
            if official_present:
                await cursor.execute(
                    f"SELECT MAX(version), COALESCE(bool_or(dirty), false) FROM {OFFICIAL_MIGRATIONS_TABLE}"
                )
                official_version, official_dirty = await cursor.fetchone()
            if kjsc_present:
                await cursor.execute(
                    f"SELECT MAX(version), COALESCE(bool_or(dirty), false) FROM {MIGRATIONS_TABLE}"
                )
                kjsc_version, kjsc_dirty = await cursor.fetchone()
            return (
                bool(official_present),
                None if official_version is None else int(official_version),
                bool(official_dirty),
                bool(kjsc_present),
                None if kjsc_version is None else int(kjsc_version),
                bool(kjsc_dirty),
            )


async def wait_for_kjsc_schema(postgres_url: str | None = None) -> None:
    """等待 app-core 把官方迁移和企业迁移都执行到当前代码要求的版本。"""

    if not auto_migrate_enabled():
        logger.info("Auto migration is disabled (AUTO_MIGRATE=false)")
        return

    url = postgres_url or os.getenv("POSTGRES_URL")
    if not url:
        raise KjscMigrationError("POSTGRES_URL 未配置，无法确认企业迁移")

    expected_version = load_kjsc_versions()[-1]
    loop = asyncio.get_running_loop()
    deadline = loop.time() + migration_wait_timeout_from_env()
    next_log_at = 0.0
    last_reason = ""
    while True:
        try:
            status = await _read_schema_status(url)
        except Exception as exc:
            reason = f"数据库不可用: {type(exc).__name__}"
        else:
            reason = assess_schema(
                official_present=status[0],
                official_version=status[1],
                official_dirty=status[2],
                kjsc_present=status[3],
                kjsc_version=status[4],
                kjsc_dirty=status[5],
                expected_version=expected_version,
            )
            if reason is None:
                logger.info(f"KJSC schema is ready at version {expected_version}")
                return
        if loop.time() >= deadline:
            raise KjscMigrationError(f"等待 app-core 完成数据库迁移超时: {reason}")
        if reason != last_reason or loop.time() >= next_log_at:
            remaining = max(0, int(deadline - loop.time()))
            logger.info(f"Waiting for app-core database migrations ({remaining}s left): {reason}")
            next_log_at = loop.time() + _WAIT_LOG_INTERVAL_SECONDS
            last_reason = reason
        await asyncio.sleep(0.5)


__all__ = [
    "KjscMigrationError",
    "MIGRATIONS_TABLE",
    "assess_schema",
    "auto_migrate_enabled",
    "load_kjsc_versions",
    "migration_wait_timeout_from_env",
    "migrations_dir",
    "wait_for_kjsc_schema",
]
