from __future__ import annotations

import os
from pathlib import Path

import pytest

from yuxi.config.env import env_value, resolve_runtime_env, running_in_docker, validate_required_runtime_env

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
    "JWT_SECRET",
    "WEKNORA_BASE_URL",
    "SANDBOX_PROVISIONER_TOKEN",
    "SANDBOX_PROVISIONER_URL",
)


@pytest.fixture
def clean_connection_env(monkeypatch: pytest.MonkeyPatch):
    for key in _URL_KEYS:
        monkeypatch.delenv(key, raising=False)
    return monkeypatch


def test_postgres_url_always_builds_from_db_vars(clean_connection_env, tmp_path: Path):
    env_file = tmp_path / ".env"
    env_file.write_text(
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


def test_redis_url_always_builds_from_b_section(clean_connection_env, tmp_path: Path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "REDIS_ADDR=host.docker.internal:16379\n"
        "REDIS_PASSWORD=\n"
        "REDIS_DB=0\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["REDIS_URL"] == "redis://host.docker.internal:16379/0"


def test_leftover_derived_urls_are_ignored_and_rebuilt(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("POSTGRES_URL", "postgresql+asyncpg://old:old@old-db:5432/old")
    clean_connection_env.setenv("REDIS_URL", "redis://old-redis:6379/2")
    clean_connection_env.setenv("MINIO_URI", "http://old-minio:9000")
    env_file = tmp_path / ".env"
    env_file.write_text(
        "POSTGRES_URL=postgresql+asyncpg://should-not-use:pw@db:5432/other\n"
        "REDIS_URL=redis://should-not-use:6379/9\n"
        "MINIO_URI=http://should-not-use:9000\n"
        "DB_USER=postgres\n"
        "DB_PASSWORD=new\n"
        "DB_HOST=new-db\n"
        "DB_PORT=5432\n"
        "DB_NAME=agent-middle\n"
        "REDIS_ADDR=new-redis:6379\n"
        "REDIS_DB=0\n"
        "MINIO_ENDPOINT=new-minio:9000\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["POSTGRES_URL"] == "postgresql+asyncpg://postgres:new@new-db:5432/agent-middle"
    assert os.environ["REDIS_URL"] == "redis://new-redis:6379/0"
    assert os.environ["MINIO_URI"] == "http://new-minio:9000"


def test_redis_password_and_username_are_percent_encoded(clean_connection_env):
    clean_connection_env.setenv("REDIS_ADDR", "redis:6379")
    clean_connection_env.setenv("REDIS_PASSWORD", "redis123!@#")
    clean_connection_env.setenv("REDIS_USERNAME", "agent user")
    clean_connection_env.setenv("REDIS_DB", "0")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["REDIS_URL"] == "redis://agent+user:redis123%21%40%23@redis:6379/0"


def test_explicit_postgres_url_is_ignored(clean_connection_env):
    clean_connection_env.setenv("POSTGRES_URL", "postgresql+asyncpg://other:pw@db:5432/other")
    clean_connection_env.setenv("DB_USER", "postgres")
    clean_connection_env.setenv("DB_PASSWORD", "postgres")
    clean_connection_env.setenv("DB_HOST", "new-db")
    clean_connection_env.setenv("DB_PORT", "5432")
    clean_connection_env.setenv("DB_NAME", "agent-middle")

    resolve_runtime_env(dotenv_path=None)

    assert os.environ["POSTGRES_URL"] == "postgresql+asyncpg://postgres:postgres@new-db:5432/agent-middle"


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


def test_dotenv_without_legacy_urls_rebuilds_stale_process_urls(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("POSTGRES_URL", "postgresql+asyncpg://old:old@old-db:5432/old")
    clean_connection_env.setenv("REDIS_URL", "redis://old-redis:6379/2")
    clean_connection_env.setenv("MINIO_URI", "http://old-minio:9000")
    env_file = tmp_path / ".env"
    env_file.write_text(
        "DB_USER=postgres\n"
        "DB_PASSWORD=new\n"
        "DB_HOST=new-db\n"
        "DB_PORT=5432\n"
        "DB_NAME=agent-middle\n"
        "REDIS_ADDR=new-redis:6379\n"
        "REDIS_DB=0\n"
        "MINIO_ENDPOINT=new-minio:9000\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["POSTGRES_URL"] == "postgresql+asyncpg://postgres:new@new-db:5432/agent-middle"
    assert os.environ["REDIS_URL"] == "redis://new-redis:6379/0"
    assert os.environ["MINIO_URI"] == "http://new-minio:9000"


def test_blank_derived_url_in_dotenv_is_ignored(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("POSTGRES_URL", "postgresql+asyncpg://old:old@old-db:5432/old")
    env_file = tmp_path / ".env"
    env_file.write_text(
        "POSTGRES_URL=\n"
        "DB_USER=postgres\n"
        "DB_PASSWORD=new\n"
        "DB_HOST=new-db\n"
        "DB_PORT=5432\n"
        "DB_NAME=agent-middle\n"
    )

    resolve_runtime_env(dotenv_path=env_file)

    assert os.environ["POSTGRES_URL"] == "postgresql+asyncpg://postgres:new@new-db:5432/agent-middle"


def test_blank_dotenv_value_clears_stale_discrete_setting(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("REDIS_PASSWORD", "old-password")
    clean_connection_env.setenv("REDIS_URL", "redis://:old-password@redis:6379/0")
    env_file = tmp_path / ".env"
    env_file.write_text("REDIS_ADDR=redis:6379\nREDIS_PASSWORD=\nREDIS_DB=0\n")

    resolve_runtime_env(dotenv_path=env_file)

    assert "REDIS_PASSWORD" not in os.environ
    assert os.environ["REDIS_URL"] == "redis://redis:6379/0"


def test_removed_dotenv_key_clears_stale_managed_setting(clean_connection_env, tmp_path: Path):
    clean_connection_env.setenv("REDIS_PASSWORD", "old-password")
    clean_connection_env.setenv("REDIS_URL", "redis://:old-password@redis:6379/0")
    env_file = tmp_path / ".env"
    env_file.write_text("REDIS_ADDR=redis:6379\nREDIS_DB=0\n")

    resolve_runtime_env(dotenv_path=env_file)

    assert "REDIS_PASSWORD" not in os.environ
    assert os.environ["REDIS_URL"] == "redis://redis:6379/0"


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


def test_minio_uri_respects_ssl_and_ignores_explicit_override(clean_connection_env):
    clean_connection_env.setenv("MINIO_ENDPOINT", "minio:9000")
    clean_connection_env.setenv("MINIO_USE_SSL", "true")
    resolve_runtime_env(dotenv_path=None)
    assert os.environ["MINIO_URI"] == "https://minio:9000"

    clean_connection_env.setenv("MINIO_URI", "http://localhost:9000")
    resolve_runtime_env(dotenv_path=None)
    assert os.environ["MINIO_URI"] == "https://minio:9000"


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


def _complete_required_env(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("JWT_SECRET", "weknora-jwt-secret")
    monkeypatch.setenv("WEKNORA_BASE_URL", "http://app:8080/api/v1")
    monkeypatch.setenv("SANDBOX_PROVISIONER_TOKEN", "a" * 32)
    monkeypatch.setenv("SANDBOX_PROVISIONER_URL", "http://sandbox-provisioner:8002")
    monkeypatch.setenv("MINIO_ACCESS_KEY_ID", "minioadmin")
    monkeypatch.setenv("MINIO_SECRET_ACCESS_KEY", "minioadmin")


def test_validate_required_runtime_env_passes_after_resolve(clean_connection_env):
    _complete_required_env(clean_connection_env)
    resolve_runtime_env(dotenv_path=None)

    validate_required_runtime_env()


def test_validate_required_runtime_env_rejects_missing_jwt(clean_connection_env):
    _complete_required_env(clean_connection_env)
    clean_connection_env.delenv("JWT_SECRET", raising=False)
    resolve_runtime_env(dotenv_path=None)

    with pytest.raises(ValueError, match="JWT_SECRET"):
        validate_required_runtime_env()


def test_validate_required_runtime_env_rejects_missing_weknora_url(clean_connection_env):
    _complete_required_env(clean_connection_env)
    clean_connection_env.delenv("WEKNORA_BASE_URL", raising=False)
    resolve_runtime_env(dotenv_path=None)

    with pytest.raises(ValueError, match="WEKNORA_BASE_URL"):
        validate_required_runtime_env()


def test_validate_required_runtime_env_rejects_short_sandbox_token(clean_connection_env):
    _complete_required_env(clean_connection_env)
    clean_connection_env.setenv("SANDBOX_PROVISIONER_TOKEN", "too-short")
    resolve_runtime_env(dotenv_path=None)

    with pytest.raises(ValueError, match="SANDBOX_PROVISIONER_TOKEN"):
        validate_required_runtime_env()


def test_validate_required_runtime_env_rejects_missing_minio_keys(clean_connection_env):
    _complete_required_env(clean_connection_env)
    clean_connection_env.delenv("MINIO_ACCESS_KEY_ID", raising=False)
    resolve_runtime_env(dotenv_path=None)

    with pytest.raises(ValueError, match="MINIO"):
        validate_required_runtime_env()


def test_blank_harness_minio_bucket_defaults_to_agent_harness(clean_connection_env):
    resolve_runtime_env(dotenv_path=None)

    assert os.environ["HARNESS_MINIO_BUCKET_NAME"] == "agent-harness"
