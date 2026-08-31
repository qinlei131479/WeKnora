"""历史行 → tenant 候选。无法唯一确定则 unresolved，禁止静默乱归。"""

from __future__ import annotations

from typing import Any


def resolve_owner_tenant(
    *,
    uid: str | None,
    created_by: str | None,
    uid_to_tenant: dict[str, int],
    weknora_id_to_tenant: dict[str, int],
) -> tuple[int | None, str]:
    """返回 (tenant_id, source)。source 为 unresolved 时不要 UPDATE。"""
    keys = [str(uid or "").strip(), str(created_by or "").strip()]
    found: dict[int, str] = {}
    for key in keys:
        if not key or key in {"system", "admin"}:
            continue
        if key in weknora_id_to_tenant:
            found[int(weknora_id_to_tenant[key])] = "users.tenant_id"
        elif key in uid_to_tenant:
            found[int(uid_to_tenant[key])] = "h_users.uid"
    if len(found) == 1:
        tenant_id, source = next(iter(found.items()))
        return tenant_id, source
    if not found:
        if all(not k or k in {"system", "admin"} for k in keys):
            return None, "catalog"
        return None, "unresolved"
    return None, "unresolved"


def is_catalog_owner(uid: str | None, created_by: str | None) -> bool:
    keys = {str(uid or "").strip(), str(created_by or "").strip()}
    keys.discard("")
    return not keys or keys <= {"system", "admin"}


def summarize_scan(rows: list[dict[str, Any]]) -> dict[str, int]:
    counts = {"catalog": 0, "resolved": 0, "unresolved": 0}
    for row in rows:
        source = str(row.get("source") or "")
        if source == "unresolved":
            counts["unresolved"] += 1
        elif source == "catalog":
            counts["catalog"] += 1
        else:
            counts["resolved"] += 1
    return counts
