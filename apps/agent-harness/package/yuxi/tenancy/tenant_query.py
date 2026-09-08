"""SQL / 行级租户过滤。开关关闭时为空操作。"""

from __future__ import annotations

from typing import Any

from sqlalchemy import false, or_

from yuxi.tenancy.context import current_tenant_id
from yuxi.tenancy.flags import is_tenant_scope_enabled


def tenant_clauses(column, *, catalog_null: bool = False):
    """追加到 where() 的条件列表。"""
    if not is_tenant_scope_enabled():
        return []
    tenant_id = current_tenant_id()
    if tenant_id is None:
        # 开关开着但解析不到空间：不回全表。目录行（NULL）仍可见。
        return [column.is_(None)] if catalog_null else [false()]
    if catalog_null:
        # btree 上 tenant_id 含 NULL，Postgres 用 BitmapOr：等值 + IS NULL。
        # 目录行很少，用户行走 tenant_id = ?，量级上来也不会退化成全表扫。
        return [or_(column == tenant_id, column.is_(None))]
    return [column == tenant_id]


def apply_tenant_filters(stmt, column, *, catalog_null: bool = False):
    """把 tenant_clauses 接到 SQLAlchemy select/update 上。"""
    for clause in tenant_clauses(column, catalog_null=catalog_null):
        stmt = stmt.where(clause)
    return stmt


def row_in_tenant(row: Any, *, catalog_null: bool = False) -> bool:
    if not is_tenant_scope_enabled():
        return True
    tenant_id = current_tenant_id()
    value = getattr(row, "tenant_id", None)
    if tenant_id is None:
        return catalog_null and value is None
    if value is None:
        return catalog_null
    return int(value) == int(tenant_id)


def visible_or_none(row: Any, *, catalog_null: bool = False):
    if row is None:
        return None
    return row if row_in_tenant(row, catalog_null=catalog_null) else None


def slug_taken_clauses(tenant_column, slug_column, slug: str):
    """slug 占用：开关关闭时全局；打开时仅目录 NULL 或当前空间。"""
    if not is_tenant_scope_enabled():
        return [slug_column == slug]
    tenant_id = current_tenant_id()
    if tenant_id is None:
        return [slug_column == slug, tenant_column.is_(None)]
    return [slug_column == slug, or_(tenant_column == tenant_id, tenant_column.is_(None))]
