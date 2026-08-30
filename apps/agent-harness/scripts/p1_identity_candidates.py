#!/usr/bin/env python3
"""P1.8 映射候选（只读）。不写库、不自动确认、不执行 uid remap。"""

from __future__ import annotations

import json
import subprocess
import sys


def _run(cmd: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(cmd, check=False, capture_output=True, text=True)


def _psql(user: str, db: str, sql: str) -> str:
    result = _run(
        ["docker", "exec", "postgres17", "psql", "-U", user, "-d", db, "-v", "ON_ERROR_STOP=1", "-At", "-c", sql]
    )
    if result.returncode != 0:
        raise RuntimeError(result.stderr.strip() or result.stdout.strip() or "psql failed")
    return result.stdout


def main() -> int:
    probe = _run(["docker", "inspect", "-f", "{{.State.Running}}", "postgres17"])
    if probe.returncode != 0 or probe.stdout.strip() != "true":
        print(json.dumps({"ok": False, "error": "postgres17 unavailable"}, ensure_ascii=False, indent=2))
        return 2
    user = _run(["docker", "exec", "postgres17", "printenv", "POSTGRES_USER"]).stdout.strip()
    db = _run(["docker", "exec", "postgres17", "printenv", "POSTGRES_DB"]).stdout.strip()
    sql = """
        SELECT COALESCE(json_agg(row_to_json(t)), '[]'::json)
        FROM (
            SELECT
                h.id AS h_user_id,
                h.uid AS old_uid,
                h.username AS h_username,
                h.role AS h_role,
                w.id AS weknora_user_id,
                w.username AS weknora_username,
                w.email AS weknora_email,
                CASE
                    WHEN w.id IS NULL THEN 'unmatched'
                    WHEN (
                        SELECT count(*) FROM users w2
                        WHERE w2.deleted_at IS NULL
                          AND (w2.username = h.username OR w2.email = h.username OR w2.email = h.uid OR w2.username = h.uid)
                    ) > 1 THEN 'ambiguous'
                    ELSE 'candidate'
                END AS match_status
            FROM h_users h
            LEFT JOIN users w
              ON w.deleted_at IS NULL
             AND (w.username = h.username OR w.email = h.username OR w.email = h.uid OR w.username = h.uid)
            WHERE h.is_deleted = 0
            ORDER BY h.id
        ) t
    """
    rows = json.loads(_psql(user, db, sql).strip() or "[]")
    report = {
        "readonly": True,
        "note": "仅候选，必须人工确认后才能写入 h_user_identity_map 并做 uid remap",
        "counts": {
            "h_users": len(rows),
            "candidate": sum(1 for row in rows if row.get("match_status") == "candidate"),
            "unmatched": sum(1 for row in rows if row.get("match_status") == "unmatched"),
            "ambiguous": sum(1 for row in rows if row.get("match_status") == "ambiguous"),
        },
        "rows": rows,
    }
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
