#!/usr/bin/env python3
"""P0 只读验证：不写库、不删数据、不打印密钥。"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

PACKAGE_DIR = Path(__file__).resolve().parents[1] / "package"
if str(PACKAGE_DIR) not in sys.path:
    sys.path.insert(0, str(PACKAGE_DIR))

from yuxi.p0.kb_fulltext import (  # noqa: E402
    CHUNKS_PAGE_SIZE_MAX,
    capability_for_kb_type,
    flatten_pages,
    paginate_chunks,
    reconstruct_document_text,
)
from yuxi.p0.model_proxy_protocol import existing_weknora_invoke_paths  # noqa: E402

COUNT_TABLES = (
    "users",
    "auth_tokens",
    "sessions",
    "messages",
    "knowledge_bases",
    "knowledges",
    "chunks",
    "h_users",
    "h_conversations",
    "h_messages",
    "h_agent_runs",
    "schema_migrations",
)
SECRET_KEYS = {"api_key", "app_secret", "apikey", "appsecret", "authorization", "token", "jwt"}


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=False, capture_output=True, text=True)


def _psql(user: str, db: str, sql: str) -> str:
    result = _run(
        ["docker", "exec", "postgres17", "psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql]
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "psql failed")
    return result.stdout


def _container_env() -> tuple[str, str] | None:
    probe = _run(["docker", "inspect", "-f", "{{.State.Running}}", "postgres17"])
    if probe.returncode != 0 or probe.stdout.strip() != "true":
        return None
    user = _run(["docker", "exec", "postgres17", "printenv", "POSTGRES_USER"]).stdout.strip()
    db = _run(["docker", "exec", "postgres17", "printenv", "POSTGRES_DB"]).stdout.strip()
    if not user or not db:
        return None
    return user, db


def _table_counts(user: str, db: str) -> dict[str, int | str]:
    counts: dict[str, int | str] = {}
    for table in COUNT_TABLES:
        try:
            raw = _psql(user, db, f"SELECT count(*) FROM {table}").strip()
            counts[table] = int(raw)
        except RuntimeError as exc:
            counts[table] = f"skip:{exc}"
    return counts


def _contains_secret(payload: Any) -> bool:
    if isinstance(payload, dict):
        for key, value in payload.items():
            if str(key).lower() in SECRET_KEYS and value:
                return True
            if _contains_secret(value):
                return True
        return False
    if isinstance(payload, list):
        return any(_contains_secret(item) for item in payload)
    return False


def _verify_chunks(user: str, db: str) -> dict[str, Any]:
    summary: dict[str, Any] = {"samples": []}
    type_sql = """
        SELECT kb.type, count(DISTINCT k.id)
        FROM knowledges k
        JOIN knowledge_bases kb ON kb.id = k.knowledge_base_id
        WHERE k.deleted_at IS NULL
        GROUP BY kb.type
        ORDER BY 1
    """
    summary["kb_types"] = [line.split("|") for line in _psql(user, db, type_sql).splitlines() if line]
    sample_sql = """
        SELECT k.id, kb.type, count(*)
        FROM knowledges k
        JOIN knowledge_bases kb ON kb.id = k.knowledge_base_id
        JOIN chunks c ON c.knowledge_id = k.id
        WHERE k.deleted_at IS NULL AND c.deleted_at IS NULL
        GROUP BY k.id, kb.type
        ORDER BY count(*) DESC
        LIMIT 8
    """
    samples = [line.split("|") for line in _psql(user, db, sample_sql).splitlines() if line]
    for knowledge_id, kb_type, chunk_count in samples:
        cap = capability_for_kb_type(kb_type)
        item: dict[str, Any] = {
            "knowledge_id": knowledge_id,
            "kb_type": kb_type,
            "chunk_count": int(chunk_count),
            "capability": cap,
        }
        if cap["open_find"] != "document":
            item["reconstruct"] = "skipped_non_document"
            summary["samples"].append(item)
            continue
        chunk_sql = f"""
            SELECT COALESCE(json_agg(json_build_object(
                'id', id,
                'chunk_index', chunk_index,
                'start_at', start_at,
                'end_at', end_at,
                'content', content
            ) ORDER BY chunk_index ASC, start_at ASC), '[]'::json)
            FROM chunks
            WHERE knowledge_id = '{knowledge_id}' AND deleted_at IS NULL
        """
        raw = _psql(user, db, chunk_sql).strip()
        chunks = json.loads(raw or "[]")
        pages = paginate_chunks(chunks, page_size=CHUNKS_PAGE_SIZE_MAX)
        result = reconstruct_document_text(flatten_pages(pages))
        item["pages"] = len(pages)
        item["page_size_max"] = CHUNKS_PAGE_SIZE_MAX
        item["reconstruct"] = {
            "reconstructable": result["reconstructable"],
            "used_offsets": result["used_offsets"],
            "overlap_count": result["overlap_count"],
            "gap_count": result["gap_count"],
            "text_chars": len(result["text"]),
        }
        summary["samples"].append(item)
    return summary


def _verify_models() -> dict[str, Any]:
    paths = existing_weknora_invoke_paths()
    token = os.environ.get("WEKNORA_P0_ACCESS_TOKEN", "").strip()
    base = os.environ.get("WEKNORA_P0_BASE_URL", "http://127.0.0.1:8080").rstrip("/")
    result: dict[str, Any] = {"protocol_paths": paths, "list_models": "skipped_no_token"}
    if not token:
        return result
    req = Request(
        f"{base}/api/v1/models",
        headers={"Authorization": f"Bearer {token}", "Accept": "application/json"},
    )
    try:
        with urlopen(req, timeout=10) as resp:
            payload = json.loads(resp.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError) as exc:
        result["list_models"] = f"error:{type(exc).__name__}"
        return result
    leaked = _contains_secret(payload)
    models = payload.get("data") if isinstance(payload, dict) else None
    result["list_models"] = {
        "ok": True,
        "count": len(models) if isinstance(models, list) else None,
        "secrets_stripped": not leaked,
    }
    return result


def main() -> int:
    report: dict[str, Any] = {
        "readonly": True,
        "flags_default_off": {
            "HARNESS_P0_RUN_TOKEN_STORE": os.environ.get("HARNESS_P0_RUN_TOKEN_STORE", ""),
            "HARNESS_P0_CHECK_AUTH_TOKENS": os.environ.get("HARNESS_P0_CHECK_AUTH_TOKENS", ""),
        },
    }
    env = _container_env()
    if env is None:
        report["postgres"] = "unavailable"
        report["ok"] = False
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return 2
    user, db = env
    report["postgres"] = {"running": True, "db": db}
    before = _table_counts(user, db)
    report["counts_before"] = before
    try:
        report["chunks"] = _verify_chunks(user, db)
    except RuntimeError as exc:
        report["chunks"] = f"error:{exc}"
    report["models"] = _verify_models()
    after = _table_counts(user, db)
    report["counts_after"] = after
    report["counts_unchanged"] = before == after
    document_ok = False
    samples = report.get("chunks", {}).get("samples") if isinstance(report.get("chunks"), dict) else []
    for sample in samples or []:
        reconstruct = sample.get("reconstruct")
        if isinstance(reconstruct, dict) and reconstruct.get("reconstructable"):
            document_ok = True
            break
    if not samples:
        report["chunks_note"] = "no_chunk_samples"
    report["ok"] = bool(report["counts_unchanged"]) and (
        document_ok or report.get("chunks_note") == "no_chunk_samples"
    )
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
