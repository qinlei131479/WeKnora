"""Resolve Agent-Harness connection settings from WeKnora discrete env vars.

Compose injects `.env` at container create time. This module re-reads the
bind-mounted file on every process start so `restart` (without recreate) picks
up non-empty updates. 连接串只认 B 段离散项：POSTGRES_URL / REDIS_URL / MINIO_URI
一律现场重拼，不接受 .env 或进程残留值。
"""

from __future__ import annotations

import os
from pathlib import Path
from urllib.parse import quote_plus

from dotenv import dotenv_values

_POSTGRES_DRIVERS = {"", "postgres", "postgresql"}
_DERIVED_CONNECTION_KEYS = frozenset({"POSTGRES_URL", "REDIS_URL", "MINIO_URI"})
_MOUNTED_DOTENV_AUTHORITATIVE_KEYS = {
    "DB_DRIVER",
    "DB_HOST",
    "DB_PORT",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
    "REDIS_ADDR",
    "REDIS_USERNAME",
    "REDIS_PASSWORD",
    "REDIS_DB",
    "MINIO_ENDPOINT",
    "MINIO_USE_SSL",
    "MINIO_ACCESS_KEY_ID",
    "MINIO_SECRET_ACCESS_KEY",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "HARNESS_MINIO_BUCKET_NAME",
    "JWT_SECRET",
    "WEKNORA_BASE_URL",
    "SANDBOX_PROVISIONER_TOKEN",
    "SANDBOX_PROVISIONER_URL",
}


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


def _apply_dotenv_file(path: Path) -> dict[str, str | None] | None:
    if not path.is_file():
        return None
    values = dotenv_values(path)
    for key in _MOUNTED_DOTENV_AUTHORITATIVE_KEYS.difference(values):
        os.environ.pop(key, None)
    for key, value in values.items():
        if not key or key in _DERIVED_CONNECTION_KEYS:
            continue
        if _is_blank(value):
            os.environ.pop(key, None)
        else:
            os.environ[key] = str(value)
    return values


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
    for key in _DERIVED_CONNECTION_KEYS:
        os.environ.pop(key, None)
    os.environ["POSTGRES_URL"] = _build_postgres_url()
    os.environ["REDIS_URL"] = _build_redis_url()
    os.environ["MINIO_URI"] = _build_minio_uri()
    if _is_blank(os.environ.get("HARNESS_MINIO_BUCKET_NAME")):
        os.environ["HARNESS_MINIO_BUCKET_NAME"] = "agent-harness"
    _alias_minio_keys()


def validate_required_runtime_env() -> None:
    """Fail fast when Agent-Harness cannot start without a required setting."""
    missing: list[str] = []
    for key in (
        "JWT_SECRET",
        "WEKNORA_BASE_URL",
        "SANDBOX_PROVISIONER_URL",
    ):
        if _is_blank(os.environ.get(key)):
            missing.append(key)

    token = env_value("SANDBOX_PROVISIONER_TOKEN")
    if len(token) < 32:
        missing.append("SANDBOX_PROVISIONER_TOKEN")

    if _is_blank(env_value("MINIO_ACCESS_KEY", "MINIO_ACCESS_KEY_ID")) or _is_blank(
        env_value("MINIO_SECRET_KEY", "MINIO_SECRET_ACCESS_KEY")
    ):
        missing.append("MINIO_ACCESS_KEY_ID/MINIO_SECRET_ACCESS_KEY")

    if missing:
        raise ValueError("Agent-Harness 缺少必须配置: " + ", ".join(missing))
