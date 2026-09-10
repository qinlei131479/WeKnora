from __future__ import annotations

import os
from pathlib import Path

import pytest

from yuxi.config.env import env_value, resolve_runtime_env, running_in_docker

pytestmark = pytest.mark.unit

_URL_KEYS = (
    "POSTGRES_URL",
    "REDIS_URL",
    "DB_DRIVER",
    "DB_USER",
    "DB_PASSWORD",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "REDIS_ADDR",
    "REDIS_PASSWORD",
    "REDIS_USERNAME",
    "REDIS_DB",
    "MINIO_ACCESS_KEY",
    "MINIO_SECRET_KEY",
    "MINIO_ACCESS_KEY_ID",
    "MINIO_SECRET_ACCESS_KEY",
    "MINIO_URI",
    "MINIO_ENDPOINT",
    "MINIO_USE_SSL",
    "MINIO_BUCKET_NAME",
    "HARNESS_MINIO_BUCKET_NAME",
)


@pytest.fixture
def clean_connection_env(monkeypatch: pytest.MonkeyPatch):
    for key in _URL_KEYS:
        monkeypatch.delenv(key, raising=False)
    return monkeypatch


def test_blank_postgres_url_builds_from_db_vars(clean_connection_env, tmp_path: Path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "POSTGRES_URL=\n"
        "DB_USER=postgres\n"
        "DB_PASSWORD=postgres123!@#\n"
        "DB_HOST=host.docker.internal\n"
        "DB_PORT=5432\n"
        "DB_NAME=agent-middle\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["POSTGRES_URL"] == (
        "postgresql+asyncpg://postgres:postgres123%21%40%23@host.docker.internal:5432/agent-middle"
    )


def test_blank_redis_url_builds_from_b_section(clean_connection_env, tmp_path: Path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "REDIS_URL=\n"
        "REDIS_ADDR=host.docker.internal:16379\n"
        "REDIS_PASSWORD=\n"
        "REDIS_DB=0\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["REDIS_URL"] == "redis://host.docker.internal:16379/0"


def test_redis_password_and_username_are_percent_encoded(clean_connection_env):
    clean_connection_env.setenv("REDIS_ADDR", "redis:6379")
    clean_connection_env.setenv("REDIS_PASSWORD", "redis123!@#")
    clean_connection_env.setenv("REDIS_USERNAME", "agent user")
    clean_connection_env.setenv("REDIS_DB", "0")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["REDIS_URL"] == "redis://agent+user:redis123%21%40%23@redis:6379/0"


def test_explicit_postgres_url_is_kept(clean_connection_env):
    clean_connection_env.setenv("POSTGRES_URL", "postgresql+asyncpg://other:pw@db:5432/other")
    clean_connection_env.setenv("DB_HOST", "ignored")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["POSTGRES_URL"] == "postgresql+asyncpg://other:pw@db:5432/other"


def test_dotenv_nonempty_overrides_stale_process_env(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("DB_PASSWORD", "old")
    clean_connection_env.setenv("DB_HOST", "postgres")
    clean_connection_env.setenv("DB_USER", "postgres")
    clean_connection_env.setenv("DB_PORT", "5432")
    clean_connection_env.setenv("DB_NAME", "agent-middle")
    env_file = tmp_path / ".env"
    env_file.write_text("DB_PASSWORD=new@pass\n")

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["DB_PASSWORD"] == "new@pass"
    assert os.environ["POSTGRES_URL"] == (
        "postgresql+asyncpg://postgres:new%40pass@postgres:5432/agent-middle"
    )


def test_minio_keys_alias_from_weknora_names(clean_connection_env):
    clean_connection_env.setenv("MINIO_ACCESS_KEY_ID", "from-id")
    clean_connection_env.setenv("MINIO_SECRET_ACCESS_KEY", "from-secret")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["MINIO_ACCESS_KEY"] == "from-id"
    assert os.environ["MINIO_SECRET_KEY"] == "from-secret"


def test_env_value_skips_blank_and_falls_back(clean_connection_env):
    clean_connection_env.setenv("MINIO_ACCESS_KEY", "  ")
    clean_connection_env.setenv("MINIO_ACCESS_KEY_ID", "id-key")

    assert env_value("MINIO_ACCESS_KEY", "MINIO_ACCESS_KEY_ID", default="minioadmin") == "id-key"


def test_non_postgres_driver_raises(clean_connection_env):
    clean_connection_env.setenv("DB_DRIVER", "sqlite")

    with pytest.raises(ValueError, match="PostgreSQL"):
        resolve_runtime_env(dotenv_path=None)


def test_minio_uri_builds_from_endpoint(clean_connection_env):
    clean_connection_env.setenv("MINIO_ENDPOINT", "minio:9000")
    clean_connection_env.setenv("MINIO_USE_SSL", "false")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["MINIO_URI"] == "http://minio:9000"


def test_minio_uri_respects_ssl_and_keeps_explicit_override(clean_connection_env):
    clean_connection_env.setenv("MINIO_ENDPOINT", "minio:9000")
    clean_connection_env.setenv("MINIO_USE_SSL", "true")
    resolve_runtime_env(dotenv_path=None)
    assert os.environ["MINIO_URI"] == "https://minio:9000"

    clean_connection_env.setenv("MINIO_URI", "http://localhost:9000")
    resolve_runtime_env(dotenv_path=None)
    assert os.environ["MINIO_URI"] == "http://localhost:9000"


def test_harness_minio_bucket_is_independent_of_weknora(clean_connection_env):
    from yuxi.storage.minio.client import MinIOClient, harness_minio_bucket

    clean_connection_env.setenv("MINIO_BUCKET_NAME", "weknora")
    clean_connection_env.setenv("HARNESS_MINIO_BUCKET_NAME", "agent-harness")

    assert harness_minio_bucket() == "agent-harness"
    assert MinIOClient.KB_BUCKETS["documents"] == "agent-harness"
    assert MinIOClient.KB_BUCKETS["parsed"] == "agent-harness"
    assert MinIOClient.KB_BUCKETS["images"] == "agent-harness"


def test_running_in_docker_reads_env_flag(monkeypatch: pytest.MonkeyPatch):
    monkeypatch.setenv("RUNNING_IN_DOCKER", "true")

    assert running_in_docker() is True
