"""Resolve Agent-Harness connection settings from WeKnora discrete env vars.

Compose injects `.env` at container create time. This module re-reads the
bind-mounted file on every process start so `restart` (without recreate) picks
up non-empty updates, then derives POSTGRES_URL / REDIS_URL / MINIO_URI when those keys
are blank.
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import dotenv_values

_POSTGRES_DRIVERS = {"", "postgres", "postgresql"}


def _is_blank(value: str | None) -> bool:
    return value is None or not str(value).strip()


def env_value(*keys: str, default: str = "") -> str:
    """Return the first non-blank environment value among keys."""
    for key in keys:
        value = os.environ.get(key)
        if not _is_blank(value):
            return str(value).strip()
    return default


def running_in_docker() -> bool:
    return Path("/.dockerenv").exists() or os.getenv("RUNNING_IN_DOCKER") == "true"


def _apply_dotenv_file(path: Path) -> None:
    if not path.is_file():
        return
    for key, value in dotenv_values(path).items():
        if key and not _is_blank(value):
            os.environ[key] = str(value)


def _drop_blank(key: str) -> None:
    if _is_blank(os.environ.get(key)):
        os.environ.pop(key, None)


def _build_postgres_url() -> str:
    driver = env_value("DB_DRIVER").lower()
    if driver not in _POSTGRES_DRIVERS:
        raise ValueError(f"Agent-Harness 需要 PostgreSQL，当前 DB_DRIVER={driver!r}")
    user = quote_plus(env_value("DB_USER", default="postgres"))
    password = quote_plus(env_value("DB_PASSWORD", default="postgres"))
    host = env_value("DB_HOST", default="postgres")
    port = env_value("DB_PORT", default="5432")
    name = env_value("DB_NAME", default="agent-middle")
    return f"postgresql+asyncpg://{user}:{password}@{host}:{port}/{name}"


def _split_redis_addr(addr: str) -> tuple[str, str]:
    host, sep, port = addr.partition(":")
    if not sep or not port:
        return addr, "6379"
    return host, port


def _build_redis_url() -> str:
    host, port = _split_redis_addr(env_value("REDIS_ADDR", default="redis:6379"))
    db = env_value("REDIS_DB", default="0")
    username = env_value("REDIS_USERNAME")
    password = env_value("REDIS_PASSWORD")
    if username or password:
        userinfo = f"{quote_plus(username)}:{quote_plus(password)}@"
        return f"redis://{userinfo}{host}:{port}/{db}"
    return f"redis://{host}:{port}/{db}"


def _alias_minio_keys() -> None:
    if _is_blank(os.environ.get("MINIO_ACCESS_KEY")) and not _is_blank(os.environ.get("MINIO_ACCESS_KEY_ID")):
        os.environ["MINIO_ACCESS_KEY"] = os.environ["MINIO_ACCESS_KEY_ID"].strip()
    if _is_blank(os.environ.get("MINIO_SECRET_KEY")) and not _is_blank(
        os.environ.get("MINIO_SECRET_ACCESS_KEY")
    ):
        os.environ["MINIO_SECRET_KEY"] = os.environ["MINIO_SECRET_ACCESS_KEY"].strip()


def _truthy(value: str) -> bool:
    return value.lower() in {"1", "true", "yes", "on"}


def _build_minio_uri() -> str:
    endpoint = env_value("MINIO_ENDPOINT", default="minio:9000")
    if "://" in endpoint:
        return endpoint
    scheme = "https" if _truthy(env_value("MINIO_USE_SSL")) else "http"
    return f"{scheme}://{endpoint}"


def resolve_runtime_env(*, dotenv_path: str | Path | None = ".env") -> None:
    if dotenv_path is not None:
        _apply_dotenv_file(Path(dotenv_path))
    _drop_blank("POSTGRES_URL")
    _drop_blank("REDIS_URL")
    _drop_blank("MINIO_URI")
    if _is_blank(os.environ.get("POSTGRES_URL")):
        os.environ["POSTGRES_URL"] = _build_postgres_url()
    if _is_blank(os.environ.get("REDIS_URL")):
        os.environ["REDIS_URL"] = _build_redis_url()
    if _is_blank(os.environ.get("MINIO_URI")):
        os.environ["MINIO_URI"] = _build_minio_uri()
    _alias_minio_keys()
