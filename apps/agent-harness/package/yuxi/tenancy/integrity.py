"""回填完整性：用户行不得长期停在 tenant_id IS NULL。"""

from __future__ import annotations

from typing import Any

from sqlalchemy import text

from yuxi.tenancy.backfill import is_catalog_owner
from yuxi.tenancy.schema import TENANT_SCOPE_TABLES, _BACKFILL_SOURCES

# 已无按 uid 免回填的退役表；保留分类入口便于未来扩展。
USER_SCOPED_TABLES = frozenset()
CATALOG_TABLES = frozenset({"amp_agents"})


class TenantBackfillIncomplete(RuntimeError):
    """仍有无法归类的用户行停在 tenant_id IS NULL。"""


def classify_null_row(*, table: str, uid: str | None, created_by: str | None) -> str:
    if table in USER_SCOPED_TABLES:
        return "user_scoped"
    if table in CATALOG_TABLES and is_catalog_owner(uid, created_by):
        return "catalog"
    return "unresolved"


def summarize_integrity(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts = {"catalog": 0, "user_scoped": 0, "unresolved": 0}
    for row in rows:
        kind = str(row.get("kind") or "unresolved")
        counts[kind] = counts.get(kind, 0) + 1
    return counts


def assert_backfill_complete(summary: dict[str, int]) -> None:
    unresolved = int(summary.get("unresolved") or 0)
    if unresolved:
        raise TenantBackfillIncomplete(f"unresolved null tenant_id rows: {unresolved}")


async def scan_null_tenant_rows(conn) -> dict[str, int]:
    """扫描影子列为 NULL 的行，把目录/用户级配置与未回填用户行分开。"""
    classified: list[dict[str, Any]] = []
    source_by_table = {table: (uid_col, created_by_col) for table, _pk, uid_col, created_by_col in _BACKFILL_SOURCES}
    for table in TENANT_SCOPE_TABLES:
        uid_col, created_by_col = source_by_table.get(table, (None, None))
        physical = table
        select_uid = uid_col or "NULL"
        select_cb = created_by_col or "NULL"
        result = await conn.execute(
            text(f"SELECT {select_uid} AS uid, {select_cb} AS created_by FROM {physical} WHERE tenant_id IS NULL")
        )
        for row in result.mappings():
            uid = None if row["uid"] is None else str(row["uid"])
            created_by = None if row["created_by"] is None else str(row["created_by"])
            classified.append({"kind": classify_null_row(table=table, uid=uid, created_by=created_by)})
    return summarize_integrity(classified)
