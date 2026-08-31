"""P2 影子列 DDL 与历史回填。WeKnora users / tenant_members 不得走 prefix_sql。"""

from __future__ import annotations

from sqlalchemy import text

from yuxi.p2.backfill import is_catalog_owner, resolve_owner_tenant, summarize_scan
from yuxi.storage.postgres.naming import ht
from yuxi.utils import logger

TENANT_SCOPE_TABLES: tuple[str, ...] = (
    "conversations",
    "agents",
    "skills",
    "mcp_servers",
    "agent_runs",
    "agent_run_requests",
    "subagent_threads",
    "message_feedbacks",
    "agent_envs",
    "user_config",
    "knowledge_bases",
)

# (table, pk, uid_col, created_by_col)
_BACKFILL_SOURCES: tuple[tuple[str, str, str | None, str | None], ...] = (
    ("conversations", "id", "uid", None),
    ("agents", "id", None, "created_by"),
    ("skills", "id", None, "created_by"),
    ("mcp_servers", "id", None, "created_by"),
    ("agent_runs", "id", "uid", None),
    ("agent_run_requests", "id", "uid", None),
    ("subagent_threads", "id", "uid", None),
    ("message_feedbacks", "id", "uid", None),
    ("agent_envs", "id", "uid", None),
    ("user_config", "id", "uid", None),
    ("knowledge_bases", "id", None, "created_by"),
)

P2_BACKFILL_BATCH = "p2-shadow-20260830"


def tenant_scope_ddl_statements() -> list[str]:
    stmts: list[str] = []
    for table in TENANT_SCOPE_TABLES:
        stmts.append(f"ALTER TABLE IF EXISTS {table} ADD COLUMN IF NOT EXISTS tenant_id BIGINT")
        stmts.append(f"CREATE INDEX IF NOT EXISTS ix_{table}_tenant_id ON {table}(tenant_id)")
    stmts.append(
        """
        CREATE TABLE IF NOT EXISTS tenant_backfill_map (
            id SERIAL PRIMARY KEY,
            table_name VARCHAR(64) NOT NULL,
            row_pk VARCHAR(64) NOT NULL,
            tenant_id BIGINT,
            source VARCHAR(64) NOT NULL,
            batch_id VARCHAR(64),
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
        """
    )
    stmts.append(
        "CREATE INDEX IF NOT EXISTS ix_tenant_backfill_map_table_name ON tenant_backfill_map(table_name)"
    )
    stmts.append(
        """
        CREATE INDEX IF NOT EXISTS ix_agent_run_requests_queue_tenant
        ON agent_run_requests(tenant_id, uid, agent_slug, conversation_thread_id, status, created_at, id)
        """
    )
    stmts.append(
        """
        CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_thread
        ON agent_runs(tenant_id, uid, agent_slug, conversation_thread_id)
        """
    )
    for table in ("agents", "skills", "mcp_servers"):
        stmts.append(f"ALTER TABLE IF EXISTS {table} DROP CONSTRAINT IF EXISTS {table}_slug_key")
        stmts.append(f"ALTER TABLE IF EXISTS {table} DROP CONSTRAINT IF EXISTS h_{table}_slug_key")
        stmts.append(f"DROP INDEX IF EXISTS ix_{table}_slug")
        stmts.append(
            f"CREATE UNIQUE INDEX IF NOT EXISTS uq_{table}_slug_tenant "
            f"ON {table}(tenant_id, slug) WHERE tenant_id IS NOT NULL"
        )
        stmts.append(
            f"CREATE UNIQUE INDEX IF NOT EXISTS uq_{table}_slug_catalog "
            f"ON {table}(slug) WHERE tenant_id IS NULL"
        )
    return stmts


async def _fetch_maps(conn) -> tuple[dict[str, int], dict[str, int]]:
    weknora_id_to_tenant: dict[str, int] = {}
    result = await conn.execute(
        text(
            "SELECT id::text AS id, tenant_id FROM users "
            "WHERE deleted_at IS NULL AND tenant_id IS NOT NULL"
        )
    )
    for row in result.mappings():
        weknora_id_to_tenant[str(row["id"])] = int(row["tenant_id"])

    memberships: dict[str, set[int]] = {}
    result = await conn.execute(
        text(
            "SELECT user_id::text AS user_id, tenant_id FROM tenant_members "
            "WHERE deleted_at IS NULL AND status = 'active'"
        )
    )
    for row in result.mappings():
        memberships.setdefault(str(row["user_id"]), set()).add(int(row["tenant_id"]))
    for user_id, tenants in memberships.items():
        if user_id not in weknora_id_to_tenant and len(tenants) == 1:
            weknora_id_to_tenant[user_id] = next(iter(tenants))

    uid_to_tenant: dict[str, int] = {}
    result = await conn.execute(
        text(f"SELECT uid, username FROM {ht('users')} WHERE is_deleted = 0")
    )
    for row in result.mappings():
        uid = str(row["uid"] or "").strip()
        username = str(row["username"] or "").strip()
        tenant_id = weknora_id_to_tenant.get(uid)
        if tenant_id is None:
            continue
        if uid:
            uid_to_tenant[uid] = tenant_id
        if username:
            uid_to_tenant[username] = tenant_id
    return uid_to_tenant, weknora_id_to_tenant


async def backfill_tenant_scope(conn) -> dict[str, int]:
    """回填可唯一确定的 tenant_id；unresolved 只记映射表，不 UPDATE。"""
    uid_to_tenant, weknora_id_to_tenant = await _fetch_maps(conn)
    existing = set()
    result = await conn.execute(
        text(f"SELECT table_name, row_pk FROM {ht('tenant_backfill_map')}")
    )
    for row in result.mappings():
        existing.add((str(row["table_name"]), str(row["row_pk"])))

    scan_rows: list[dict] = []
    for table, pk, uid_col, created_by_col in _BACKFILL_SOURCES:
        physical = ht(table)
        select_uid = uid_col or "NULL"
        select_cb = created_by_col or "NULL"
        rows = await conn.execute(
            text(
                f"SELECT {pk} AS pk, {select_uid} AS uid, {select_cb} AS created_by "
                f"FROM {physical} WHERE tenant_id IS NULL"
            )
        )
        for row in rows.mappings():
            uid = None if row["uid"] is None else str(row["uid"])
            created_by = None if row["created_by"] is None else str(row["created_by"])
            if is_catalog_owner(uid, created_by):
                tenant_id, source = None, "catalog"
            else:
                tenant_id, source = resolve_owner_tenant(
                    uid=uid,
                    created_by=created_by,
                    uid_to_tenant=uid_to_tenant,
                    weknora_id_to_tenant=weknora_id_to_tenant,
                )
            scan_rows.append({"source": source})
            pk_value = str(row["pk"])
            key = (table, pk_value)
            if key not in existing:
                await conn.execute(
                    text(
                        f"INSERT INTO {ht('tenant_backfill_map')} "
                        "(table_name, row_pk, tenant_id, source, batch_id) "
                        "VALUES (:table_name, :row_pk, :tenant_id, :source, :batch_id)"
                    ),
                    {
                        "table_name": table,
                        "row_pk": pk_value,
                        "tenant_id": tenant_id,
                        "source": source,
                        "batch_id": P2_BACKFILL_BATCH,
                    },
                )
                existing.add(key)
            if source != "unresolved" and source != "catalog" and tenant_id is not None:
                await conn.execute(
                    text(
                        f"UPDATE {physical} SET tenant_id = :tenant_id "
                        f"WHERE {pk} = :pk AND tenant_id IS NULL"
                    ),
                    {"tenant_id": int(tenant_id), "pk": row["pk"]},
                )

    summary = summarize_scan(scan_rows)
    logger.info(
        f"P2 tenant backfill: resolved={summary['resolved']} "
        f"catalog={summary['catalog']} unresolved={summary['unresolved']}"
    )
    try:
        from yuxi.p2.integrity import scan_null_tenant_rows

        integrity = await scan_null_tenant_rows(conn)
        if integrity.get("unresolved"):
            logger.warning(
                f"P2 backfill integrity: unresolved null tenant_id rows={integrity['unresolved']} "
                f"(catalog={integrity.get('catalog', 0)} user_scoped={integrity.get('user_scoped', 0)})"
            )
        else:
            logger.info(
                f"P2 backfill integrity: catalog={integrity.get('catalog', 0)} "
                f"user_scoped={integrity.get('user_scoped', 0)} unresolved=0"
            )
    except Exception as exc:
        logger.warning(f"P2 backfill integrity scan skipped: {exc}")
    return summary
