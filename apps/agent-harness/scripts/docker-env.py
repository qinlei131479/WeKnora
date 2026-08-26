#!/usr/bin/env python3
"""Fill Agent-Harness connection URLs from WeKnora kjsc credentials, then exec CMD."""

from __future__ import annotations

import os
import sys
import urllib.parse


def _set_if_empty(key: str, value: str) -> None:
    if not (os.environ.get(key) or "").strip():
        os.environ[key] = value


def _quote(value: str) -> str:
    return urllib.parse.quote_plus(value or "")


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: docker-env.py <command> [args...]")

    db_user = os.environ.get("DB_USER", "postgres")
    db_password = os.environ.get("DB_PASSWORD", "postgres")
    # Share WeKnora's database; harness tables live under the h_ prefix.
    # AGENT_HARNESS_DB_NAME is legacy (separate DB) and must not win over DB_NAME.
    db_name = os.environ.get("DB_NAME") or os.environ.get("AGENT_HARNESS_DB_NAME") or "agent-middle"
    _set_if_empty(
        "POSTGRES_URL",
        f"postgresql+asyncpg://{_quote(db_user)}:{_quote(db_password)}@postgres:5432/{db_name}",
    )

    redis_password = os.environ.get("REDIS_PASSWORD", "")
    redis_db = os.environ.get("AGENT_HARNESS_REDIS_DB", "2")
    if redis_password:
        redis_url = f"redis://:{_quote(redis_password)}@redis:6379/{redis_db}"
    else:
        redis_url = f"redis://redis:6379/{redis_db}"
    _set_if_empty("REDIS_URL", redis_url)

    if not os.environ.get("MINIO_ACCESS_KEY") and os.environ.get("MINIO_ACCESS_KEY_ID"):
        os.environ["MINIO_ACCESS_KEY"] = os.environ["MINIO_ACCESS_KEY_ID"]
    if not os.environ.get("MINIO_SECRET_KEY") and os.environ.get("MINIO_SECRET_ACCESS_KEY"):
        os.environ["MINIO_SECRET_KEY"] = os.environ["MINIO_SECRET_ACCESS_KEY"]

    os.execvp(sys.argv[1], sys.argv[1:])


if __name__ == "__main__":
    main()
