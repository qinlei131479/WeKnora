from __future__ import annotations

import hashlib
import io
import os
import uuid
import zipfile
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from sqlalchemy import or_, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi.config.errors import ApiError
from yuxi.storage.postgres.models_business import (
    SkillRuntime,
    TenantSandboxConfig,
    TenantSkillCatalog,
    TenantSkillInstall,
)
from yuxi.tenancy.context import current_tenant_id
from yuxi.utils.datetime_utils import utc_now_naive
from yuxi.utils.logging_config import logger


_SKILL_ARCHIVE_IGNORE = {
    "__pycache__",
    ".DS_Store",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "venv",
}
_SKILL_ARCHIVE_SUFFIXES = {".pyc", ".pyo", ".pyd"}
_CATALOG_FALLBACK_SHARE_CONFIG = {
    "version": 2,
    "read_scope": {"access_level": "global", "department_ids": [], "user_uids": []},
    "manage_scope": None,
}


_USAGE_SOURCES = {"chat", "work", "common"}
_LIVE_INSTALL_STATUSES = {"installing", "ready", "removing"}


def is_builtin_tenant(tenant_id: int | None) -> bool:
    """内置技能只认目录行 tenant_id 为 0，空值不算内置。"""
    return tenant_id is not None and int(tenant_id) == 0


def usage_source(source_type: str | None, *, builtin: bool = False) -> str:
    """把历史来源值收成使用侧。内置固定为工作。"""
    value = str(source_type or "").strip()
    if value in _USAGE_SOURCES:
        return value
    if builtin or value == "builtin":
        return "work"
    return "chat"


def catalog_dir_path(tenant_id: int | None, slug: str) -> str:
    if is_builtin_tenant(tenant_id):
        return f"skills/{slug}"
    return f"skills/t{int(tenant_id)}/{slug}"


class SkillRecord:
    """tenant_skill_catalog 的内存视图。"""

    def __init__(self, *, raw: dict[str, Any], runtime: SkillRuntime | None) -> None:
        self.raw = raw
        self.runtime = runtime

    @property
    def app_core_id(self) -> str:
        return str(self.raw.get("id") or "")

    @property
    def id(self) -> Any:
        runtime_id = getattr(self.runtime, "id", None)
        if runtime_id is not None:
            return runtime_id
        return self.app_core_id or self.slug

    @property
    def slug(self) -> str:
        return str(getattr(self.runtime, "slug", None) or self.raw.get("name") or "")

    @property
    def name(self) -> str:
        return str(self.raw.get("name") or self.slug)

    @property
    def description(self) -> str:
        return str(self.raw.get("description") or "")

    @property
    def version(self) -> str | None:
        return self.raw.get("version") or getattr(self.runtime, "version", None)

    @property
    def content_hash(self) -> str | None:
        return self.raw.get("bundle_sha256")

    @property
    def source_type(self) -> str:
        return usage_source(getattr(self.runtime, "source_type", None), builtin=is_builtin_tenant(self.tenant_id))

    @property
    def tool_dependencies(self) -> list[str]:
        return list(getattr(self.runtime, "tool_dependencies", None) or [])

    @property
    def mcp_dependencies(self) -> list[str]:
        return list(getattr(self.runtime, "mcp_dependencies", None) or [])

    @property
    def skill_dependencies(self) -> list[str]:
        return list(getattr(self.runtime, "skill_dependencies", None) or [])

    @property
    def dir_path(self) -> str:
        return str(getattr(self.runtime, "dir_path", None) or "")

    @property
    def share_config(self) -> dict[str, Any]:
        # Go 端只维护 catalog 主数据；runtime 缺失或尚未补齐时先提供合法 v2 视图。
        config = getattr(self.runtime, "share_config", None)
        return config if isinstance(config, dict) and config else _CATALOG_FALLBACK_SHARE_CONFIG.copy()

    @property
    def enabled(self) -> bool:
        return bool(getattr(self.runtime, "enabled", True))

    @property
    def tenant_id(self) -> int | None:
        return getattr(self.runtime, "tenant_id", None)

    @property
    def created_by(self) -> str | None:
        return getattr(self.runtime, "created_by", None)

    @property
    def updated_by(self) -> str | None:
        return getattr(self.runtime, "updated_by", None)

    @property
    def created_at(self) -> Any:
        return self.raw.get("created_at") or getattr(self.runtime, "created_at", None)

    @property
    def updated_at(self) -> Any:
        return self.raw.get("updated_at") or getattr(self.runtime, "updated_at", None)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "app_core_id": self.app_core_id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "source_type": self.source_type,
            "tool_dependencies": self.tool_dependencies,
            "mcp_dependencies": self.mcp_dependencies,
            "skill_dependencies": self.skill_dependencies,
            "dir_path": self.dir_path,
            "version": self.version,
            "content_hash": self.content_hash,
            "share_config": self.share_config,
            "enabled": self.enabled,
            "created_by": self.created_by,
            "updated_by": self.updated_by,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


def _scope_tenant_id() -> int | None:
    """运行请求使用上下文租户；启动同步回退到预配置租户。"""
    tenant_id = current_tenant_id()
    if tenant_id is not None:
        return int(tenant_id)
    value = os.environ.get("WEKNORA_APPCORE_TENANT_ID", "").strip()
    return int(value) if value.isdigit() else None


def _skill_dir(item: SkillRecord) -> Path:
    from yuxi import config as sys_config

    dir_path = Path(item.dir_path)
    if dir_path.is_absolute():
        return dir_path
    return (Path(sys_config.save_dir) / dir_path).resolve()


def _archive_name(path: Path, root: Path, slug: str) -> str:
    return (Path(slug) / path.relative_to(root)).as_posix()


def _archive_ignored(path: Path) -> bool:
    return path.name in _SKILL_ARCHIVE_IGNORE or path.suffix.lower() in _SKILL_ARCHIVE_SUFFIXES


def build_skill_bundle_for_dir(slug: str, source_dir: str | Path) -> bytes:
    """按 app-core 约定打包技能目录，顶层目录名使用稳定 slug。"""
    from yuxi import config as sys_config

    dir_path = Path(source_dir)
    root = dir_path if dir_path.is_absolute() else (Path(sys_config.save_dir) / dir_path).resolve()
    if not root.is_dir():
        raise ApiError("skill_dir_missing")

    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for path in sorted(root.rglob("*"), key=lambda value: value.as_posix()):
            if _archive_ignored(path):
                continue
            if path.is_file() and not path.is_symlink():
                archive.write(path, _archive_name(path, root, slug))
    if not any(name.endswith("/SKILL.md") for name in zipfile.ZipFile(buffer).namelist()):
        raise ApiError("skill_missing_skill_md")
    return buffer.getvalue()


def build_skill_bundle(item: SkillRecord) -> bytes:
    return build_skill_bundle_for_dir(item.slug, item.dir_path)


def _runtime_from_row(row: TenantSkillCatalog) -> SkillRuntime:
    builtin = is_builtin_tenant(row.tenant_id)
    slug = str(row.id if builtin and row.id else row.name or "")
    share = (
        row.share_config
        if isinstance(row.share_config, dict) and row.share_config
        else _CATALOG_FALLBACK_SHARE_CONFIG.copy()
    )
    return SkillRuntime(
        id=row.id,
        app_core_skill_id=row.id,
        tenant_id=None if row.tenant_id is None else int(row.tenant_id),
        slug=slug,
        source_type=usage_source(row.source_type, builtin=builtin),
        tool_dependencies=list(row.tool_dependencies or []),
        mcp_dependencies=list(row.mcp_dependencies or []),
        skill_dependencies=list(row.skill_dependencies or []),
        dir_path=catalog_dir_path(row.tenant_id, slug),
        share_config=share,
        enabled=bool(row.enabled),
        created_by=row.created_by,
        updated_by=row.updated_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def _record_from_row(row: TenantSkillCatalog) -> SkillRecord:
    return SkillRecord(
        raw={
            "id": row.id,
            "name": row.name,
            "description": row.description or "",
            "version": row.version,
            "bundle_sha256": row.bundle_sha256,
            "bundle_ref": row.bundle_ref,
            "created_at": row.created_at,
            "updated_at": row.updated_at,
        },
        runtime=_runtime_from_row(row),
    )


def _store_catalog_zip(tenant_id: int, catalog_id: str, data: bytes) -> str:
    """把技能包放到 Go 能读取的 MinIO 路径。存储不可用时仍保留目录行。"""
    bucket = os.environ.get("MINIO_BUCKET_NAME", "weknora")
    object_name = f"{int(tenant_id)}/tenant-skills/catalog/{catalog_id}.zip"
    try:
        from yuxi.storage.minio.client import get_minio_client

        get_minio_client().upload_file(bucket, object_name, data, "application/zip")
        return f"minio://{bucket}/{object_name}"
    except Exception as exc:
        logger.warning(f"技能包未写入 MinIO，目录记录仍会保存: {exc}")
        return ""


class SkillRepository:
    """直接读写 tenant_skill_catalog，不再调用 app-core。"""

    def __init__(self, db_session: AsyncSession, client: Any | None = None):
        del client
        self.db = db_session

    async def _visible_rows(self) -> list[TenantSkillCatalog]:
        if self.db is None:
            return []
        tenant_id = _scope_tenant_id()
        stmt = select(TenantSkillCatalog).where(TenantSkillCatalog.deleted_at.is_(None))
        if tenant_id is not None:
            stmt = stmt.where(or_(TenantSkillCatalog.tenant_id == int(tenant_id), TenantSkillCatalog.tenant_id == 0))
        result = await self.db.execute(stmt.order_by(TenantSkillCatalog.created_at.asc(), TenantSkillCatalog.id.asc()))
        return list(result.scalars().all())

    async def _row_by_slug(self, slug: str) -> TenantSkillCatalog | None:
        for row in await self._visible_rows():
            if row.name == slug or row.id == slug:
                return row
        return None

    async def _local_catalog_items(self) -> tuple[int | None, list[dict[str, Any]]]:
        """启动阶段允许受控只读 Go 主数据，避免本地兼容修复依赖能力 API 凭证。"""
        if self.db is None:
            raise ValueError("补齐 Skill runtime 需要数据库会话")

        tenant_id = _scope_tenant_id()
        if tenant_id is None:
            result = await self.db.execute(
                text(
                    """
                    SELECT DISTINCT tenant_id
                    FROM tenant_skill_catalog
                    WHERE deleted_at IS NULL
                    """
                )
            )
            tenant_ids = [int(row[0]) for row in result.fetchall() if int(row[0]) != 0]
            if len(tenant_ids) != 1:
                detail = "未找到" if not tenant_ids else "存在多个"
                raise ValueError(
                    f"本地开发启动同步{detail}有效 tenant_id，请显式配置 WEKNORA_APPCORE_TENANT_ID"
                )
            tenant_id = tenant_ids[0]

        result = await self.db.execute(
            text(
                """
                SELECT id, tenant_id, name, version, description, bundle_sha256,
                       created_at, updated_at
                FROM tenant_skill_catalog
                WHERE tenant_id = :tenant_id
                  AND deleted_at IS NULL
                ORDER BY created_at ASC, id ASC
                """
            ),
            {"tenant_id": tenant_id},
        )
        items = [dict(row) for row in result.mappings()]
        return tenant_id, items

    async def _records(self) -> list[SkillRecord]:
        return sorted((_record_from_row(row) for row in await self._visible_rows()), key=lambda item: str(item.id), reverse=True)

    async def list_all(self) -> list[SkillRecord]:
        return await self._records()

    async def reconcile_runtime_records(
        self,
        runtime_specs: dict[str, dict[str, Any]],
        *,
        operator_uid: str = "system",
    ) -> list[SkillRecord]:
        """补齐目录上的使用侧和共享配置，不覆盖已经写过的依赖。"""
        _tenant_id, raw_items = await self._local_catalog_items()
        changed = False
        for raw in raw_items:
            row = await self.db.get(TenantSkillCatalog, raw["id"])
            if row is None:
                continue
            spec = runtime_specs.get(str(raw.get("name") or ""), {})
            if not row.source_type or row.source_type not in _USAGE_SOURCES:
                row.source_type = usage_source(spec.get("source_type"), builtin=is_builtin_tenant(row.tenant_id))
                changed = True
            if not isinstance(row.share_config, dict) or not row.share_config:
                row.share_config = spec.get("share_config") or _CATALOG_FALLBACK_SHARE_CONFIG.copy()
                row.updated_by = operator_uid
                changed = True
        if changed:
            await self.db.commit()
        return await self._records()

    async def list_enabled(self) -> list[SkillRecord]:
        return [item for item in await self._records() if item.enabled]

    async def list_by_slugs(self, slugs: list[str]) -> list[SkillRecord]:
        normalized = [slug for slug in dict.fromkeys(slugs) if isinstance(slug, str) and slug]
        item_map = {item.slug: item for item in await self._records()}
        return [item_map[slug] for slug in normalized if slug in item_map]

    async def get_by_slug_unscoped(self, slug: str, *, for_update: bool = False) -> SkillRecord | None:
        """catalog API 已按请求凭证限定租户；这里保留旧调用语义。"""
        del for_update
        return await self.get_by_slug(slug)

    async def get_by_slug(self, slug: str, *, for_update: bool = False) -> SkillRecord | None:
        del for_update
        items = [
            item
            for item in await self._records()
            if item.slug == slug or item.app_core_id == slug or str(item.id) == slug
        ]
        if not items:
            return None
        by_id = [item for item in items if item.app_core_id == slug or str(item.id) == slug]
        if len(by_id) == 1 and by_id[0].slug != slug:
            return by_id[0]
        builtin = next((item for item in items if item.tenant_id == 0 and item.slug == slug), None)
        return builtin or items[0]

    async def exists_slug(self, slug: str) -> bool:
        return await self.get_by_slug(slug) is not None

    async def _require_row(self, item: SkillRecord) -> TenantSkillCatalog:
        row = await self.db.get(TenantSkillCatalog, item.app_core_id or item.slug)
        if row is None:
            row = await self._row_by_slug(item.slug)
        if row is None:
            raise ApiError("skill_not_found", name=item.slug)
        return row

    async def _write_bundle(self, row: TenantSkillCatalog, bundle: bytes, *, updated_by: str | None) -> SkillRecord:
        row.bundle_sha256 = hashlib.sha256(bundle).hexdigest()
        ref = _store_catalog_zip(int(row.tenant_id), row.id, bundle)
        if ref:
            row.bundle_ref = ref
        if updated_by is not None:
            row.updated_by = updated_by
        row.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(row)
        return _record_from_row(row)

    async def create(
        self,
        *,
        slug: str,
        name: str,
        description: str,
        source_type: str,
        tool_dependencies: list[str] | None,
        mcp_dependencies: list[str] | None,
        skill_dependencies: list[str] | None,
        dir_path: str,
        share_config: dict,
        enabled: bool = True,
        version: str | None = None,
        content_hash: str | None = None,
        created_by: str | None,
        bundle_bytes: bytes | None = None,
        builtin: bool = False,
        source_mtime: datetime | None = None,
    ) -> SkillRecord:
        builtin = builtin or source_type == "builtin"
        usage = usage_source(source_type, builtin=builtin)
        tools = list(tool_dependencies or [])
        skills = list(skill_dependencies or [])
        if usage == "common" and (tools or skills):
            raise ApiError("skill_common_no_deps")
        display_name = name or slug
        if builtin:
            tenant_id = 0
            skill_id = slug
            occupied = any(item.slug == slug and item.tenant_id == 0 for item in await self._records())
            if occupied or await self.exists_slug(display_name):
                raise ApiError("skill_duplicate", name=display_name)
        else:
            tenant_id = _scope_tenant_id()
            if tenant_id is None:
                raise ApiError("skill_tenant_required")
            skill_id = str(uuid.uuid4())
            name_taken = await self.exists_slug(display_name)
            slug_taken = slug != display_name and await self.exists_slug(slug)
            if name_taken or slug_taken:
                raise ApiError("skill_duplicate", name=display_name if name_taken else slug)
        if bundle_bytes is None:
            bundle_bytes = build_skill_bundle_for_dir(slug, dir_path or catalog_dir_path(tenant_id, slug))
        now = utc_now_naive()
        row = TenantSkillCatalog(
            id=skill_id,
            tenant_id=int(tenant_id),
            name=display_name,
            version=version,
            description=description,
            bundle_sha256=hashlib.sha256(bundle_bytes).hexdigest(),
            bundle_ref=_store_catalog_zip(int(tenant_id), skill_id, bundle_bytes),
            source_type=usage,
            tool_dependencies=tools,
            mcp_dependencies=list(mcp_dependencies or []),
            skill_dependencies=skills,
            share_config=share_config or _CATALOG_FALLBACK_SHARE_CONFIG.copy(),
            enabled=enabled,
            created_by=created_by,
            updated_by=created_by,
            source_mtime=source_mtime,
            created_at=now,
            updated_at=now,
        )
        self.db.add(row)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            raise ApiError("skill_duplicate", name=display_name) from exc
        await self.db.refresh(row)
        return _record_from_row(row)

    async def update_builtin_install(
        self,
        item: SkillRecord,
        *,
        version: str,
        content_hash: str,
        updated_by: str | None,
        source_type: str | None = None,
        source_mtime: datetime | None = None,
    ) -> SkillRecord:
        row = await self._require_row(item)
        if version:
            row.version = version
        if source_mtime is not None:
            row.source_mtime = source_mtime
        if source_type in _USAGE_SOURCES and row.source_type != source_type:
            row.source_type = source_type
        return await self._write_bundle(row, build_skill_bundle(item), updated_by=updated_by or "builtin-system")

    async def update_dependencies(
        self,
        item: SkillRecord,
        *,
        tool_dependencies: list[str],
        mcp_dependencies: list[str],
        skill_dependencies: list[str],
        updated_by: str | None,
    ) -> SkillRecord:
        row = await self._require_row(item)
        row.tool_dependencies = tool_dependencies
        row.mcp_dependencies = mcp_dependencies
        row.skill_dependencies = skill_dependencies
        if updated_by is not None:
            row.updated_by = updated_by
        await self.db.commit()
        await self.db.refresh(row)
        return _record_from_row(row)

    async def sync_bundle(self, item: SkillRecord, *, updated_by: str | None) -> SkillRecord:
        row = await self._require_row(item)
        return await self._write_bundle(row, build_skill_bundle(item), updated_by=updated_by)

    async def update_share_config(
        self, item: SkillRecord, *, share_config: dict, updated_by: str | None
    ) -> SkillRecord:
        row = await self._require_row(item)
        row.share_config = share_config
        if updated_by is not None:
            row.updated_by = updated_by
        await self.db.commit()
        await self.db.refresh(row)
        return _record_from_row(row)

    async def update_enabled(self, item: SkillRecord, *, enabled: bool, updated_by: str | None) -> SkillRecord:
        row = await self._require_row(item)
        row.enabled = enabled
        if updated_by is not None:
            row.updated_by = updated_by
        await self.db.commit()
        await self.db.refresh(row)
        return _record_from_row(row)

    async def delete(self, item: SkillRecord) -> None:
        if item.tenant_id == 0:
            raise ApiError("skill_builtin_readonly")
        row = await self._require_row(item)
        row.deleted_at = utc_now_naive()
        await self.db.commit()


class SkillSandboxRepository:
    """读取沙箱配置，并把技能安装登记为安装中。"""

    def __init__(self, db_session: AsyncSession):
        self.db = db_session

    async def list_sandboxes(self, tenant_id: int) -> list[TenantSandboxConfig]:
        result = await self.db.execute(
            select(TenantSandboxConfig)
            .where(
                TenantSandboxConfig.tenant_id == int(tenant_id),
                TenantSandboxConfig.deleted_at.is_(None),
                TenantSandboxConfig.name != "__workspace_scripts_policy__",
            )
            .order_by(TenantSandboxConfig.name.asc())
        )
        return list(result.scalars().all())

    async def list_installs(self, tenant_id: int) -> list[tuple[TenantSkillInstall, TenantSandboxConfig | None]]:
        result = await self.db.execute(
            select(TenantSkillInstall, TenantSandboxConfig)
            .outerjoin(
                TenantSandboxConfig,
                TenantSandboxConfig.id == TenantSkillInstall.sandbox_config_id,
            )
            .where(
                TenantSkillInstall.tenant_id == int(tenant_id),
                TenantSkillInstall.deleted_at.is_(None),
            )
        )
        return list(result.all())

    async def install_catalog(self, *, tenant_id: int, sandbox_config_id: str, catalog: TenantSkillCatalog) -> TenantSkillInstall:
        result = await self.db.execute(
            select(TenantSkillInstall).where(
                TenantSkillInstall.tenant_id == int(tenant_id),
                TenantSkillInstall.sandbox_config_id == sandbox_config_id,
                TenantSkillInstall.name == catalog.name,
                TenantSkillInstall.deleted_at.is_(None),
            )
        )
        row = result.scalars().first()
        now = utc_now_naive()
        if row is None:
            row = TenantSkillInstall(
                id=str(uuid.uuid4()),
                tenant_id=int(tenant_id),
                sandbox_config_id=sandbox_config_id,
                name=catalog.name,
                created_at=now,
            )
            self.db.add(row)
        row.catalog_id = catalog.id
        row.version = catalog.version
        row.description = catalog.description
        row.bundle_sha256 = catalog.bundle_sha256
        row.enabled = True
        row.status = "installing"
        row.error = None
        row.installing_since = now
        row.updated_at = now
        row.deleted_at = None
        await self.db.commit()
        await self.db.refresh(row)
        return row

    async def uninstall(self, *, tenant_id: int, sandbox_config_id: str, name: str) -> None:
        """撤销沙箱上的安装登记。镜像内容仍由设置页的卸载流程处理。"""
        result = await self.db.execute(
            select(TenantSkillInstall).where(
                TenantSkillInstall.tenant_id == int(tenant_id),
                TenantSkillInstall.sandbox_config_id == sandbox_config_id,
                TenantSkillInstall.name == name,
                TenantSkillInstall.deleted_at.is_(None),
            )
        )
        row = result.scalars().first()
        if row is None:
            raise ApiError("skill_install_record_missing", status=404)
        now = utc_now_naive()
        row.status = "removed"
        row.deleted_at = now
        row.updated_at = now
        await self.db.commit()

    async def list_config_skills(self, *, tenant_id: int, sandbox_config_id: str) -> list[TenantSkillInstall]:
        result = await self.db.execute(
            select(TenantSkillInstall)
            .where(
                TenantSkillInstall.tenant_id == int(tenant_id),
                TenantSkillInstall.sandbox_config_id == sandbox_config_id,
                TenantSkillInstall.deleted_at.is_(None),
            )
            .order_by(TenantSkillInstall.created_at.asc())
        )
        return list(result.scalars().all())

    async def get_install(self, *, tenant_id: int, sandbox_config_id: str, skill_id: str) -> TenantSkillInstall:
        result = await self.db.execute(
            select(TenantSkillInstall).where(
                TenantSkillInstall.tenant_id == int(tenant_id),
                TenantSkillInstall.sandbox_config_id == sandbox_config_id,
                TenantSkillInstall.id == skill_id,
                TenantSkillInstall.deleted_at.is_(None),
            )
        )
        row = result.scalars().first()
        if row is None:
            raise ApiError("skill_install_record_missing", status=404)
        return row

    async def save_install(self, row: TenantSkillInstall) -> TenantSkillInstall:
        row.updated_at = utc_now_naive()
        await self.db.commit()
        await self.db.refresh(row)
        return row
