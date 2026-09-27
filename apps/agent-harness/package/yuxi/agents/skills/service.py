from __future__ import annotations

import asyncio
import hashlib
import io
import json
import os
import re
import shutil
import tempfile
import threading
import time
import uuid
import zipfile
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager
from dataclasses import dataclass, replace
from datetime import UTC, datetime
from pathlib import Path, PurePosixPath
from typing import Any

import yaml
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from yuxi import config as sys_config
from yuxi.agents.mcp.service import get_enabled_mcp_server_slugs
from yuxi.agents.skills.repository import (
    SkillRecord,
    SkillRepository,
    SkillSandboxRepository,
    _scope_tenant_id,
    build_skill_bundle_for_dir,
)
from yuxi.appcore.client import AppCoreAuthError
from yuxi.permissions import ResourcePermission, normalize_permission_config, resolve_skill_permission
from yuxi.storage.postgres.models_business import User
from yuxi.storage.redis import get_async_redis_client
from yuxi.storage.redis.manager import RedisConfig, create_async_redis_client
from yuxi.utils.datetime_utils import utc_now_naive
from yuxi.utils.logging_config import logger
from yuxi.utils.paths import ensure_within_root

SKILL_SLUG_PATTERN = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
SKILL_NAME_PATTERN = SKILL_SLUG_PATTERN

TEXT_FILE_EXTENSIONS = {
    ".md",
    ".txt",
    ".py",
    ".js",
    ".ts",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".cfg",
    ".conf",
    ".xml",
    ".html",
    ".css",
    ".sql",
    ".sh",
    ".bat",
    ".ps1",
    ".env",
    ".csv",
    ".tsv",
    ".rst",
    ".ipynb",
    ".vue",
    ".jsx",
    ".tsx",
}

SKILL_TREE_IGNORE_NAMES = {
    "__pycache__",
    ".DS_Store",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "venv",
}
SKILL_TREE_IGNORE_SUFFIXES = {".pyc", ".pyo", ".pyd"}
_SKILL_COPY_IGNORE = shutil.ignore_patterns(
    "__pycache__",
    "*.pyc",
    "*.pyo",
    "*.pyd",
    ".DS_Store",
    ".git",
    ".mypy_cache",
    ".pytest_cache",
    ".ruff_cache",
    ".venv",
    "venv",
)

BUILTIN_SKILL_OPERATOR = "builtin-system"
SKILL_SOURCE_TYPES = {"builtin", "upload", "remote"}
ADMIN_ROLES = {"admin", "superadmin"}
DEFAULT_SKILL_SHARE_CONFIG = {"access_level": "user", "department_ids": [], "user_uids": []}
BUILTIN_SKILL_SHARE_CONFIG = {"access_level": "global", "department_ids": [], "user_uids": []}
BUILTIN_SKILL_PERMISSION_CONFIG = {
    "version": 2,
    "read_scope": BUILTIN_SKILL_SHARE_CONFIG.copy(),
    "manage_scope": None,
}
SKILL_DRAFT_TTL_SECONDS = 60 * 60
PERSONAL_SKILL_CACHE_TTL_SECONDS = 5 * 60
PERSONAL_SKILL_CACHE_PREFIX = "yuxi:skills:personal:v1:"
PERSONAL_SKILL_SCAN_LOCK_PREFIX = "yuxi:skills:personal:scan-lock:v1:"
PERSONAL_SKILL_SCAN_LOCK_TIMEOUT_SECONDS = 30
PERSONAL_SKILL_SCAN_LOCK_WAIT_SECONDS = 10
PERSONAL_SKILL_SOURCE_TYPE = "personal"
WORKSPACE_SKILLS_RELATIVE_DIR = Path("agents") / "skills"
_THREAD_SKILLS_LOCK = threading.Lock()
_THREAD_SKILLS_LOCKS: dict[str, threading.Lock] = {}


@dataclass(frozen=True, slots=True)
class ResolvedSkill:
    """描述当前用户最终可用的 Skill 及其真实来源。"""

    id: Any
    slug: str
    name: str
    description: str
    source_type: str
    source_scope: str
    source_dir: Path
    enabled: bool
    created_by: str | None
    share_config: dict[str, Any] | None
    tool_dependencies: list[str]
    mcp_dependencies: list[str]
    skill_dependencies: list[str]
    overrides_shared: bool = False
    shadowed_by_personal: bool = False

    def to_dict(self) -> dict[str, Any]:
        """返回可安全提供给前端的 Skill 元数据。"""
        data = {
            "id": self.id,
            "slug": self.slug,
            "name": self.name,
            "description": self.description,
            "source_type": self.source_type,
            "source_scope": self.source_scope,
            "enabled": self.enabled,
            "created_by": self.created_by,
            "tool_dependencies": self.tool_dependencies,
            "mcp_dependencies": self.mcp_dependencies,
            "skill_dependencies": self.skill_dependencies,
            "overrides_shared": self.overrides_shared,
            "shadowed_by_personal": self.shadowed_by_personal,
        }
        if self.share_config is not None:
            data["share_config"] = self.share_config
        return data


@dataclass(frozen=True, slots=True)
class PersonalSkillSnapshot:
    """承载一次个人 Skill 元数据快照。"""

    items: list[ResolvedSkill]
    scanned_at: str
    from_cache: bool


def _get_thread_skills_lock(thread_id: str) -> threading.Lock:
    with _THREAD_SKILLS_LOCK:
        lock = _THREAD_SKILLS_LOCKS.get(thread_id)
        if lock is None:
            lock = threading.Lock()
            _THREAD_SKILLS_LOCKS[thread_id] = lock
        return lock


def normalize_string_list(values: list[str] | None) -> list[str]:
    if not values:
        return []
    normalized: list[str] = []
    seen: set[str] = set()
    for value in values:
        if not isinstance(value, str):
            continue
        item = value.strip()
        if not item or item in seen:
            continue
        seen.add(item)
        normalized.append(item)
    return normalized


def is_valid_skill_slug(slug: str) -> bool:
    if not isinstance(slug, str):
        return False
    return bool(SKILL_SLUG_PATTERN.match(slug.strip()))


def is_builtin_skill(item: SkillRecord | dict) -> bool:
    tenant_id = item.get("tenant_id") if isinstance(item, dict) else getattr(item, "tenant_id", None)
    return tenant_id == 0


def get_allowed_skill_access_levels(user: User) -> list[str]:
    if user.role in ADMIN_ROLES:
        return ["global", "department", "user"]
    return ["user"]


def normalize_skill_share_config(
    share_config: dict | None,
    *,
    operator_uid: str,
    source_type: str = "upload",
    allowed_access_levels: set[str] | None = None,
) -> dict:
    if source_type == "builtin":
        return BUILTIN_SKILL_PERMISSION_CONFIG.copy()

    default_scope = {
        "access_level": "global",
        "department_ids": [],
        "user_uids": [],
    }
    return normalize_permission_config(
        share_config or {"version": 2, "read_scope": default_scope, "manage_scope": None},
        allowed_access_levels=allowed_access_levels,
        unauthorized_access_level_message="当前用户无权使用该 Skill 共享范围",
        strict=True,
    )


def user_can_access_skill(user: User, skill: SkillRecord, *, require_enabled: bool = True) -> bool:
    if require_enabled and not skill.enabled:
        return False
    return resolve_skill_permission(user, skill) != ResourcePermission.NONE


def user_can_manage_skill(user: User, skill: SkillRecord) -> bool:
    if is_builtin_skill(skill):
        return user.role in ADMIN_ROLES
    return resolve_skill_permission(user, skill) == ResourcePermission.MANAGE


def can_skill_depend_on(parent: SkillRecord, dependency: SkillRecord) -> bool:
    parent_source = getattr(parent, "source_type", "work") or "work"
    dependency_source = getattr(dependency, "source_type", "work") or "work"
    # 对话只能依赖对话和通用，工作只能依赖工作和通用，通用不能依赖其他技能。
    if parent_source == "common" or dependency_source not in {parent_source, "common"}:
        return False
    if not dependency.enabled:
        return False
    if is_builtin_skill(dependency):
        return True

    dep_config = normalize_permission_config(dependency.share_config)
    parent_config = normalize_permission_config(parent.share_config)
    dependency_scopes = [scope for scope in (dep_config["read_scope"], dep_config["manage_scope"]) if scope]
    parent_scopes = [scope for scope in (parent_config["read_scope"], parent_config["manage_scope"]) if scope]
    owner_scope = {"access_level": "user", "department_ids": [], "user_uids": []}
    if not dependency_scopes:
        dependency_scopes = [{**owner_scope, "user_uids": [str(dependency.created_by or "")]}]
    if not parent_scopes:
        parent_scopes = [{**owner_scope, "user_uids": [str(parent.created_by or "")]}]
    return all(
        any(_scope_contains(dependency_scope, parent_scope) for dependency_scope in dependency_scopes)
        for parent_scope in parent_scopes
    )


def _scope_contains(container: dict, target: dict) -> bool:
    """判断一个共享范围是否完整覆盖另一个范围。"""

    container_level = container.get("access_level")
    target_level = target.get("access_level")
    if container_level == "global":
        return True
    if target_level == "global" or container_level != target_level:
        return False
    if target_level == "department":
        container_ids = {int(value) for value in container.get("department_ids") or []}
        target_ids = {int(value) for value in target.get("department_ids") or []}
        return target_ids.issubset(container_ids)
    if target_level == "user":
        container_uids = {str(value) for value in container.get("user_uids") or []}
        target_uids = {str(value) for value in target.get("user_uids") or []}
        return target_uids.issubset(container_uids)
    return False


def _ensure_non_builtin(item: SkillRecord) -> None:
    if is_builtin_skill(item):
        raise ValueError("内置 skill 不允许执行该操作")


async def list_skill_sandbox_board(db: AsyncSession) -> dict[str, Any]:
    """技能页的沙箱列表和安装状态。"""
    tenant_id, _items = await SkillRepository(db)._local_catalog_items()
    board = SkillSandboxRepository(db)
    sandboxes = await board.list_sandboxes(int(tenant_id))
    installs = await board.list_installs(int(tenant_id))
    return {
        "sandboxes": [{"id": row.id, "name": row.name, "sandbox_type": row.sandbox_type} for row in sandboxes],
        "installations": [
            {
                "skill_id": row.id,
                "catalog_id": row.catalog_id,
                "name": row.name,
                "sandbox_config_id": row.sandbox_config_id,
                "sandbox_config_name": sandbox.name if sandbox is not None else row.sandbox_config_id,
                "sandbox_type": sandbox.sandbox_type if sandbox is not None else "",
                "status": row.status,
                "enabled": bool(row.enabled),
            }
            for row, sandbox in installs
        ],
    }


async def install_skill_to_sandboxes(db: AsyncSession, *, slug: str, sandbox_config_ids: list[str]) -> list[str]:
    """把目录技能登记到选定沙箱。镜像构建仍由设置页的安装流程完成。"""
    item = await get_skill_or_raise(db, slug)
    repo = SkillRepository(db)
    tenant_id = _scope_tenant_id() or item.tenant_id
    if tenant_id is None:
        raise ValueError("安装技能需要当前空间")
    catalog = await repo._require_row(item)
    board = SkillSandboxRepository(db)
    known = {row.id for row in await board.list_sandboxes(int(tenant_id))}
    targets = [config_id for config_id in sandbox_config_ids if config_id]
    if not targets:
        raise ValueError("请选择沙箱")
    missing = [config_id for config_id in targets if config_id not in known]
    if missing:
        raise ValueError("沙箱不存在")
    installed_ids: list[str] = []
    for config_id in targets:
        row = await board.install_catalog(tenant_id=int(tenant_id), sandbox_config_id=config_id, catalog=catalog)
        installed_ids.append(row.id)
    return installed_ids


async def uninstall_skill_from_sandbox(db: AsyncSession, *, slug: str, sandbox_config_id: str) -> None:
    """从沙箱安装登记中移除技能。"""
    item = await get_skill_or_raise(db, slug)
    tenant_id = _scope_tenant_id() or item.tenant_id
    if tenant_id is None:
        raise ValueError("卸载技能需要当前空间")
    await SkillSandboxRepository(db).uninstall(
        tenant_id=int(tenant_id),
        sandbox_config_id=sandbox_config_id,
        name=item.slug,
    )


def _sandbox_tenant_id() -> int:
    tenant_id = _scope_tenant_id()
    if tenant_id is None:
        raise ValueError("需要当前空间")
    return int(tenant_id)


def _public_envs(raw: Any) -> list[dict[str, Any]]:
    if not isinstance(raw, list):
        return []
    envs: list[dict[str, Any]] = []
    for item in raw:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        envs.append(
            {
                "name": item.get("name"),
                "description": item.get("description") or "",
                "required": bool(item.get("required")),
                "is_set": bool(item.get("value")),
            }
        )
    return envs


def _config_skill_payload(row: Any) -> dict[str, Any]:
    """沙箱管理抽屉使用的安装记录。不返回环境变量明文。"""
    created_at = getattr(row, "created_at", None)
    updated_at = getattr(row, "updated_at", None)
    return {
        "id": row.id,
        "name": row.name,
        "version": row.version or "",
        "description": row.description or "",
        "enabled": bool(row.enabled),
        "status": row.status,
        "error": row.error or "",
        "bundle_sha256": row.bundle_sha256 or "",
        "installed_snapshot_id": row.installed_snapshot_id or "",
        "install_session_id": row.install_session_id or "",
        "install_message_id": row.install_message_id or "",
        "created_at": created_at.isoformat() if created_at is not None else "",
        "updated_at": updated_at.isoformat() if updated_at is not None else "",
        "envs": _public_envs(row.envs),
    }


def _apply_env_clears(raw: Any, updates: dict[str, str]) -> Any:
    """只接受清空。写入新值需要设置页的加密流程，这里不落明文。"""
    if any(str(value) for value in updates.values()):
        raise ValueError("环境变量请在设置页修改")
    if not isinstance(raw, list):
        return raw
    names = {name for name, value in updates.items() if value == ""}
    changed = []
    for item in raw:
        if isinstance(item, dict) and item.get("name") in names:
            item = {**item, "value": ""}
        changed.append(item)
    return changed


async def list_config_skills(db: AsyncSession, sandbox_config_id: str) -> list[dict[str, Any]]:
    rows = await SkillSandboxRepository(db).list_config_skills(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
    )
    return [_config_skill_payload(row) for row in rows]


def _json_field(value: Any) -> Any:
    if isinstance(value, str):
        try:
            return json.loads(value)
        except json.JSONDecodeError:
            return value
    return value


async def list_skill_install_messages(
    db: AsyncSession, *, sandbox_config_id: str, skill_id: str
) -> list[dict[str, Any]]:
    """读取这次安装留在会话里的记录，供管理抽屉回放安装过程。"""
    row = await SkillSandboxRepository(db).get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    session_id = row.install_session_id or ""
    if not session_id:
        return []
    result = await db.execute(
        text(
            """
            SELECT id, role, content, agent_steps, is_completed, is_fallback, agent_duration_ms, created_at
            FROM messages
            WHERE session_id = :session_id AND deleted_at IS NULL
            ORDER BY created_at ASC
            """
        ),
        {"session_id": session_id},
    )
    messages: list[dict[str, Any]] = []
    for item in result.mappings():
        created_at = item["created_at"]
        messages.append(
            {
                "id": item["id"],
                "role": item["role"],
                "content": item["content"] or "",
                "agent_steps": _json_field(item["agent_steps"]) or [],
                "is_completed": bool(item["is_completed"]),
                "is_fallback": bool(item["is_fallback"]),
                "agent_duration_ms": item["agent_duration_ms"] or 0,
                "created_at": created_at.isoformat() if created_at is not None else "",
            }
        )
    return messages


async def patch_config_skill(
    db: AsyncSession,
    *,
    sandbox_config_id: str,
    skill_id: str,
    enabled: bool | None = None,
    envs: dict[str, str] | None = None,
) -> dict[str, Any]:
    repo = SkillSandboxRepository(db)
    row = await repo.get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    if envs is not None:
        row.envs = _apply_env_clears(row.envs, envs)
    if enabled is not None:
        row.enabled = bool(enabled)
    await repo.save_install(row)
    return _config_skill_payload(row)


async def stop_config_skill(db: AsyncSession, *, sandbox_config_id: str, skill_id: str) -> dict[str, Any]:
    """停止仍停在安装中的登记。不改沙箱镜像。"""
    repo = SkillSandboxRepository(db)
    row = await repo.get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    if row.status != "installing":
        raise ValueError("当前状态不能停止")
    row.status = "failed"
    row.error = "已停止"
    row.installing_since = None
    await repo.save_install(row)
    return _config_skill_payload(row)


async def retry_config_skill(db: AsyncSession, *, sandbox_config_id: str, skill_id: str) -> None:
    """镜像重建仍在设置页。这里只确认记录存在，避免技能页打到 Go。"""
    await SkillSandboxRepository(db).get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    raise ValueError("镜像重建请在设置页操作")


async def remove_config_skill(db: AsyncSession, *, sandbox_config_id: str, skill_id: str) -> None:
    """撤销安装登记。镜像内容仍由设置页的卸载流程处理。"""
    repo = SkillSandboxRepository(db)
    row = await repo.get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    now = utc_now_naive()
    row.status = "removed"
    row.deleted_at = now
    await repo.save_install(row)


async def load_skill_transcript_frames(
    db: AsyncSession, *, sandbox_config_id: str, skill_id: str
) -> list[dict[str, Any]]:
    """回放安装过程。事件存在 Go 写入的 Redis 列表里，读不到就视为没有过程。"""
    row = await SkillSandboxRepository(db).get_install(
        tenant_id=_sandbox_tenant_id(),
        sandbox_config_id=sandbox_config_id,
        skill_id=skill_id,
    )
    session_id = row.install_session_id or ""
    message_id = row.install_message_id or ""
    if not session_id or not message_id:
        raise ValueError("安装过程不存在")
    prefix = os.environ.get("STREAM_EVENTS_PREFIX", "stream:events")
    key = f"{prefix}:{session_id}:{message_id}"
    client = None
    try:
        client = await create_async_redis_client(
            RedisConfig.from_env(socket_timeout=2, socket_connect_timeout=2),
            ping=True,
        )
        events = await client.lrange(key, 0, -1)
    except Exception:
        logger.warning("读取技能安装过程失败")
        raise ValueError("安装过程不存在")
    finally:
        if client is not None:
            await client.aclose()
    frames: list[dict[str, Any]] = []
    for raw in events or []:
        try:
            evt = json.loads(raw)
        except (TypeError, json.JSONDecodeError):
            continue
        if not isinstance(evt, dict):
            continue
        frames.append(
            {
                "id": message_id,
                "response_type": evt.get("type") or "",
                "content": evt.get("content") or "",
                "done": bool(evt.get("done")),
                "session_id": session_id,
                "assistant_message_id": message_id,
                "data": evt.get("data") or None,
            }
        )
        if evt.get("type") == "complete":
            break
    if not frames:
        raise ValueError("安装过程不存在")
    return frames


def get_skills_root_dir() -> Path:
    root = Path(sys_config.save_dir) / "skills"
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_skill_drafts_root_dir() -> Path:
    root = Path(sys_config.save_dir) / "skill_import_drafts"
    root.mkdir(parents=True, exist_ok=True)
    return root


def _cleanup_expired_skill_drafts() -> None:
    root = get_skill_drafts_root_dir()
    now = time.time()
    for entry in root.iterdir():
        if not entry.is_dir():
            continue
        metadata_path = entry / "metadata.json"
        try:
            if not metadata_path.exists() or now - entry.stat().st_mtime > SKILL_DRAFT_TTL_SECONDS:
                shutil.rmtree(entry, ignore_errors=True)
                continue
            data = json.loads(metadata_path.read_text(encoding="utf-8"))
            if data.get("expires_at", 0) < now:
                shutil.rmtree(entry, ignore_errors=True)
        except Exception:
            shutil.rmtree(entry, ignore_errors=True)


def _load_skill_draft(draft_id: str) -> tuple[Path, dict]:
    if not re.fullmatch(r"[0-9a-fA-F-]{32,36}", str(draft_id or "")):
        raise ValueError("无效的安装草稿")
    draft_dir = (get_skill_drafts_root_dir() / draft_id).resolve()
    try:
        draft_dir.relative_to(get_skill_drafts_root_dir().resolve())
    except ValueError:
        raise ValueError("无效的安装草稿") from None
    metadata_path = draft_dir / "metadata.json"
    if not metadata_path.exists():
        raise ValueError("安装草稿不存在或已过期")
    data = json.loads(metadata_path.read_text(encoding="utf-8"))
    if data.get("expires_at", 0) < time.time():
        shutil.rmtree(draft_dir, ignore_errors=True)
        raise ValueError("安装草稿已过期")
    return draft_dir, data


def _load_and_select_draft_items(
    draft_id: str, slugs: list[str] | None, operator: User
) -> tuple[Path, dict, list[dict]]:
    """加载安装草稿，校验权限与来源类型，并按需筛选选中的条目。"""
    draft_dir, data = _load_skill_draft(draft_id)
    if data.get("created_by") != operator.uid and operator.role not in ADMIN_ROLES:
        raise ValueError("无权确认该安装草稿")
    if data.get("source_type") not in {"upload", "remote"}:
        raise ValueError("无效的安装草稿来源")

    draft_items = data.get("items") or []
    if slugs is not None:
        selected_slugs = set(slugs)
        if not selected_slugs:
            raise ValueError("至少选择一个 Skill")
        available_slugs = {str(item.get("slug") or "").strip() for item in draft_items}
        if selected_slugs - available_slugs:
            raise ValueError("确认安装包含草稿外的 Skill")
        draft_items = [item for item in draft_items if str(item.get("slug") or "").strip() in selected_slugs]

    return draft_dir, data, draft_items


def get_thread_skills_root_dir(thread_id: str) -> Path:
    safe_thread_id = str(thread_id or "").strip()
    if not safe_thread_id:
        raise ValueError("thread_id is required")
    if not re.fullmatch(r"[A-Za-z0-9_-]+", safe_thread_id):
        raise ValueError("thread_id contains invalid characters")

    root = Path(sys_config.save_dir) / "threads" / safe_thread_id / "skills"
    root.mkdir(parents=True, exist_ok=True)
    return root


async def sync_thread_readable_skills_async(
    thread_id: str,
    selected_slugs: list[str] | None,
    source_dirs: dict[str, str | Path] | None = None,
) -> Path:
    """在线程池同步共享 Skill 投影，避免阻塞 Agent 事件循环。"""
    return await asyncio.to_thread(
        sync_thread_readable_skills,
        thread_id,
        selected_slugs,
        source_dirs,
    )


def sync_thread_readable_skills(
    thread_id: str,
    selected_slugs: list[str] | None,
    source_dirs: dict[str, str | Path] | None = None,
) -> Path:
    """将最终生效的 Skill 来源同步到线程只读目录。"""
    skills_root = get_skills_root_dir().resolve()
    thread_skills_root = get_thread_skills_root_dir(thread_id)
    normalized_slugs = [slug for slug in normalize_string_list(selected_slugs) if is_valid_skill_slug(slug)]
    normalized_sources = {
        slug: Path(path).resolve()
        for slug, path in (source_dirs or {}).items()
        if slug in normalized_slugs and isinstance(path, (str, Path))
    }
    readable_slugs = set(normalized_slugs)
    with _get_thread_skills_lock(thread_id):
        for entry in thread_skills_root.iterdir():
            if entry.name in readable_slugs:
                continue
            if entry.is_dir() and not entry.is_symlink():
                shutil.rmtree(entry)
            else:
                entry.unlink()

        for slug in normalized_slugs:
            source_dir = normalized_sources.get(slug, (skills_root / slug).resolve())
            target_dir = thread_skills_root / slug

            if source_dir.is_symlink() or not source_dir.is_dir() or _dir_contains_symlink(source_dir):
                logger.warning(f"跳过不存在或包含符号链接的 Skill 来源: slug={slug}")
                if target_dir.exists() or target_dir.is_symlink():
                    if target_dir.is_dir() and not target_dir.is_symlink():
                        shutil.rmtree(target_dir)
                    else:
                        target_dir.unlink()
                continue

            if target_dir.exists():
                if target_dir.is_symlink():
                    target_dir.unlink()
                elif target_dir.is_dir():
                    if _dirs_equal(target_dir, source_dir):
                        continue
                    shutil.rmtree(target_dir)
                else:
                    target_dir.unlink()

            temp_target = thread_skills_root / f".{slug}.tmp-{uuid.uuid4().hex[:8]}"
            try:
                shutil.copytree(source_dir, temp_target, symlinks=False, ignore=_SKILL_COPY_IGNORE)
                temp_target.rename(target_dir)
            finally:
                if temp_target.exists():
                    shutil.rmtree(temp_target, ignore_errors=True)

    return thread_skills_root


def _preloaded_skills_root() -> Path | None:
    for parent in Path(__file__).resolve().parents:
        candidate = parent / "skills" / "preloaded"
        if candidate.is_dir():
            return candidate
    return None


def _directory_mtime(source_dir: Path) -> datetime:
    files = [path for path in source_dir.rglob("*") if path.is_file() and not _is_skill_tree_noise(path)]
    latest = max((path.stat().st_mtime for path in files), default=source_dir.stat().st_mtime)
    return datetime.fromtimestamp(latest, tz=UTC)


def _preloaded_skill_specs() -> list[Any]:
    """skills/preloaded 是对话模式内置技能，版本取目录内最新修改时间。"""
    from yuxi.agents.skills.buildin import BuiltinSkillSpec

    root = _preloaded_skills_root()
    if root is None:
        return []
    specs: list[Any] = []
    for child in sorted(path for path in root.iterdir() if path.is_dir()):
        if not (child / "SKILL.md").is_file() or not is_valid_skill_slug(child.name):
            continue
        moment = _directory_mtime(child)
        specs.append(
            BuiltinSkillSpec(
                slug=child.name,
                source_dir=child,
                version=moment.strftime("%Y.%m.%d.%H%M%S"),
                usage_source="chat",
            )
        )
    return specs


def get_builtin_skill_specs() -> list[Any]:
    from yuxi.agents.skills.buildin import BUILTIN_SKILLS

    known = {spec.slug for spec in BUILTIN_SKILLS}
    return [*BUILTIN_SKILLS, *[spec for spec in _preloaded_skill_specs() if spec.slug not in known]]


def _build_builtin_skill_dir_path(slug: str) -> str:
    return (Path("skills") / slug).as_posix()


def _tenant_skill_relpath(slug: str) -> Path:
    """租户技能落在 skills/t{tenant_id}/{slug}，避免跨空间同 slug 互相覆盖。"""
    from yuxi.tenancy.context import stamp_tenant_id

    tenant_id = stamp_tenant_id()
    if tenant_id is None:
        return Path("skills") / slug
    return Path("skills") / f"t{tenant_id}" / slug


def _tenant_skill_absdir(slug: str) -> Path:
    return (Path(sys_config.save_dir) / _tenant_skill_relpath(slug)).resolve()


def _dir_contains_symlink(path: Path) -> bool:
    """检查目录内是否包含任意符号链接子路径。"""
    return any(child.is_symlink() for child in path.rglob("*"))


def _dirs_equal(dir1: Path, dir2: Path) -> bool:
    """检查两个目录的文件路径与内容是否完全一致。"""
    if not dir1.exists() or not dir2.exists():
        return False
    return _compute_dir_hash(dir1) == _compute_dir_hash(dir2)


def _compute_dir_hash(source_dir: Path) -> str:
    hasher = hashlib.sha256()
    file_paths = sorted(path for path in source_dir.rglob("*") if path.is_file() and not _is_skill_tree_noise(path))
    for file_path in file_paths:
        relative_path = file_path.relative_to(source_dir).as_posix()
        hasher.update(relative_path.encode("utf-8"))
        hasher.update(b"\0")
        with file_path.open("rb") as f:
            while chunk := f.read(1024 * 1024):
                hasher.update(chunk)
        hasher.update(b"\0")
    return hasher.hexdigest()


def _replace_skill_target(
    target_dir: Path,
    source_dir: Path,
    *,
    validate: Callable[[Path], None] | None = None,
) -> None:
    """将 source_dir 原子地复制为 target_dir：先复制到临时目录，可选校验后再替换。"""
    temp_target = target_dir.with_name(f".{target_dir.name}.tmp-{uuid.uuid4().hex[:8]}")
    trash_dir: Path | None = None
    if temp_target.exists():
        shutil.rmtree(temp_target, ignore_errors=True)

    shutil.copytree(source_dir, temp_target, symlinks=False, ignore=_SKILL_COPY_IGNORE)
    try:
        if validate is not None:
            validate(temp_target)
        if target_dir.exists():
            trash_dir = target_dir.with_name(f".{target_dir.name}.bak-{uuid.uuid4().hex[:8]}")
            target_dir.rename(trash_dir)
        temp_target.rename(target_dir)
    except Exception:
        shutil.rmtree(temp_target, ignore_errors=True)
        if trash_dir and trash_dir.exists() and not target_dir.exists():
            trash_dir.rename(target_dir)
        raise

    if trash_dir and trash_dir.exists():
        shutil.rmtree(trash_dir, ignore_errors=True)


async def list_accessible_skills(
    db: AsyncSession,
    user: User,
    *,
    require_enabled: bool = True,
    refresh_personal: bool = False,
) -> list[ResolvedSkill]:
    """返回当前用户最终生效的共享与个人 Skill。"""
    shared_items, personal_snapshot = await asyncio.gather(
        _list_accessible_shared_skills(db, user, require_enabled=require_enabled),
        list_personal_skills(str(user.uid), refresh=refresh_personal),
    )
    personal_by_slug = {item.slug: item for item in personal_snapshot.items}

    effective: dict[str, ResolvedSkill] = {}
    for item in shared_items:
        effective[item.slug] = _resolved_shared_skill(
            item,
            shadowed_by_personal=item.slug in personal_by_slug,
        )
    for slug, item in personal_by_slug.items():
        effective[slug] = replace(item, overrides_shared=slug in effective)
    return list(effective.values())


async def list_skill_cards_for_user(
    db: AsyncSession,
    user: User,
    *,
    refresh_personal: bool = False,
) -> tuple[list[ResolvedSkill], PersonalSkillSnapshot]:
    """返回管理页所需的共享与个人 Skill 卡片。"""
    shared_items, personal_snapshot = await asyncio.gather(
        list_visible_skills_for_management(db, user),
        list_personal_skills(str(user.uid), refresh=refresh_personal),
    )
    personal_slugs = {item.slug for item in personal_snapshot.items}
    shared_slugs = {item.slug for item in shared_items}

    personal_cards = [replace(item, overrides_shared=item.slug in shared_slugs) for item in personal_snapshot.items]
    shared_cards = [
        _resolved_shared_skill(item, shadowed_by_personal=item.slug in personal_slugs) for item in shared_items
    ]
    return [*personal_cards, *shared_cards], personal_snapshot



async def list_visible_skills_for_management(db: AsyncSession, user: User) -> list[SkillRecord]:
    items = await _list_all_with_runtime_reconcile(db)
    builtin_keys = {
        key
        for item in items
        if is_builtin_skill(item)
        for key in (item.name, item.slug)
        if key
    }
    visible: list[SkillRecord] = []
    seen: set[str] = set()
    for item in items:
        if item.slug in seen:
            continue
        # 安装内置技能时复制出的同名空间目录不单独成卡，状态留在内置卡片上。
        if not is_builtin_skill(item) and (item.name in builtin_keys or item.slug in builtin_keys):
            continue
        if user_can_manage_skill(user, item) or (item.enabled and user_can_access_skill(user, item)):
            visible.append(item)
            seen.add(item.slug)
    return visible


async def list_skills(db: AsyncSession) -> list[SkillRecord]:
    return await _list_all_with_runtime_reconcile(db)



def _tool_matches_skill(parent_source: str, tool_source: str) -> bool:
    """对话技能只用对话工具，工作技能可用工作或通用工具，通用技能不绑工具。"""
    if parent_source == "chat":
        return tool_source == "chat"
    if parent_source == "work":
        return tool_source in {"work", "common"}
    return False


async def _tool_catalog() -> list[dict]:
    """工具选项以目录表为准，才能带上对话/工作使用侧。代码注册表只补名称。"""
    from yuxi.agents.toolkits.service import get_directory_tool_metadata, get_tool_metadata

    registry = list(get_tool_metadata())
    if registry and all(item.get("source") for item in registry):
        return [
            {"slug": item["slug"], "name": item.get("name") or item["slug"], "source": str(item.get("source") or "work")}
            for item in registry
        ]
    directory = await get_directory_tool_metadata()
    by_slug = {item["slug"]: item for item in registry}
    if directory:
        merged: list[dict] = []
        seen: set[str] = set()
        for item in directory:
            slug = item["slug"]
            seen.add(slug)
            meta = by_slug.get(slug, {})
            merged.append(
                {
                    "slug": slug,
                    "name": item.get("name") or meta.get("name") or slug,
                    "source": str(item.get("source") or meta.get("source") or "work"),
                }
            )
        for slug, meta in by_slug.items():
            if slug in seen:
                continue
            merged.append({"slug": slug, "name": meta.get("name") or slug, "source": str(meta.get("source") or "work")})
        return merged
    return [
        {"slug": item["slug"], "name": item.get("name") or item["slug"], "source": str(item.get("source") or "work")}
        for item in registry
    ]


async def _tool_source_map() -> dict[str, str]:
    """工具标识到使用侧。"""
    return {item["slug"]: item["source"] for item in await _tool_catalog()}


async def _live_sandbox_names(db: AsyncSession, item: SkillRecord) -> list[str]:
    """仍挂在沙箱上的安装，返回沙箱名称。"""
    tenant_id = _scope_tenant_id() or item.tenant_id
    if tenant_id is None:
        return []
    catalog_id = str(item.id or "")
    names: list[str] = []
    for install, sandbox in await SkillSandboxRepository(db).list_installs(int(tenant_id)):
        if (install.status or "") == "removed":
            continue
        if str(install.catalog_id or "") != catalog_id and install.name != item.slug:
            continue
        label = (sandbox.name if sandbox is not None and sandbox.name else None) or install.sandbox_config_id
        if label and label not in names:
            names.append(str(label))
    return names


async def _dependent_skill_names(repo: SkillRepository, item: SkillRecord) -> list[str]:
    """仍把当前技能写在 skill_dependencies 里的其他技能。"""
    names: list[str] = []
    for other in await repo.list_all():
        if other.slug == item.slug:
            continue
        if item.slug in (other.skill_dependencies or []):
            label = other.name or other.slug
            if label not in names:
                names.append(label)
    return names


async def get_skill_dependency_options(
    db: AsyncSession, user: User, slug: str | None = None
) -> dict[str, list[str] | list[dict]]:
    parent = await get_skill_or_raise(db, slug) if slug else None
    parent_source = parent.source_type if parent is not None else ""
    skill_items = await _list_accessible_shared_skills(db, user)
    if parent is not None:
        skill_items = [item for item in skill_items if item.slug != parent.slug and can_skill_depend_on(parent, item)]
    elif slug:
        skill_items = [item for item in skill_items if item.slug != slug]

    tool_list = []
    for item in await _tool_catalog():
        if parent_source and not _tool_matches_skill(parent_source, item["source"]):
            continue
        tool_list.append(item)

    enabled_mcp_slugs = set(await get_enabled_mcp_server_slugs(db=db))
    from yuxi.agents.mcp.service import get_all_mcp_servers

    mcp_options = []
    for record in await get_all_mcp_servers(db):
        if not record.enabled:
            continue
        mcp_slug = record.slug
        if enabled_mcp_slugs and mcp_slug not in enabled_mcp_slugs and record.app_core_id not in enabled_mcp_slugs:
            continue
        mcp_options.append({"slug": mcp_slug, "name": record.name or mcp_slug})

    return {
        "tools": [] if parent_source == "common" else tool_list,
        "mcps": mcp_options,
        "skills": []
        if parent_source == "common"
        else [{"slug": item.slug, "name": getattr(item, "name", None) or item.slug} for item in skill_items],
    }


async def _list_accessible_shared_skills(
    db: AsyncSession,
    user: User,
    *,
    require_enabled: bool = True,
) -> list[SkillRecord]:
    """按现有共享范围返回用户可访问的数据库 Skill。"""
    items = await _list_all_with_runtime_reconcile(db)
    if require_enabled:
        items = [item for item in items if item.enabled]
    return [item for item in items if user_can_access_skill(user, item, require_enabled=require_enabled)]


async def _list_all_with_runtime_reconcile(db: AsyncSession) -> list[SkillRecord]:
    """列表路径自愈 Go 端已有 catalog 但 Python runtime 缺失的过渡状态。"""
    repo = SkillRepository(db)
    items = await repo.list_all()
    if not any(item.runtime is None for item in items):
        return items

    runtime_specs = _build_builtin_runtime_specs(list_builtin_skill_specs())
    await repo.reconcile_runtime_records(runtime_specs)
    return await repo.list_all()


async def _list_shared_skill_slugs(db: AsyncSession, user: User) -> list[str]:
    """返回依赖配置可引用的共享 Skill slug。"""
    return [item.slug for item in await _list_accessible_shared_skills(db, user) if isinstance(item.slug, str)]


def _get_all_tool_names() -> list[str]:
    """获取所有工具名称（包括 buildin 和其他来源）"""
    from yuxi.agents.toolkits.service import get_tool_metadata

    all_tools = get_tool_metadata()
    return [tool["slug"] for tool in all_tools]


async def _validate_dependencies(
    *,
    parent: SkillRecord,
    tool_dependencies: list[str],
    mcp_dependencies: list[str],
    skill_dependencies: list[str],
    available_skills: dict[str, SkillRecord],
) -> tuple[list[str], list[str], list[str]]:
    tools = normalize_string_list(tool_dependencies)
    mcps = normalize_string_list(mcp_dependencies)
    skills = normalize_string_list(skill_dependencies)
    if parent.source_type == "common" and (tools or skills):
        raise ValueError("通用技能不能绑定工具或其他技能")

    # 验证所有工具（不仅仅是 buildin）
    tool_sources = await _tool_source_map()
    invalid_tools = [name for name in tools if name not in tool_sources]
    if invalid_tools:
        raise ValueError(f"存在无效工具依赖: {', '.join(invalid_tools)}")
    mismatched_tools = [
        name for name in tools if not _tool_matches_skill(parent.source_type, tool_sources.get(name, "work"))
    ]
    if mismatched_tools:
        raise ValueError(f"存在使用范围不匹配的工具依赖: {', '.join(mismatched_tools)}")

    available_mcps = set(await get_enabled_mcp_server_slugs(db=None))
    invalid_mcps = [name for name in mcps if name not in available_mcps]
    if invalid_mcps:
        raise ValueError(f"存在无效 MCP 依赖: {', '.join(invalid_mcps)}")

    invalid_skills = [name for name in skills if name not in available_skills]
    if invalid_skills:
        raise ValueError(f"存在无效 skill 依赖: {', '.join(invalid_skills)}")

    if parent.slug in skills:
        raise ValueError("skill_dependencies 不允许包含自身")

    forbidden_skills = [name for name in skills if not can_skill_depend_on(parent, available_skills[name])]
    if forbidden_skills:
        raise ValueError(f"存在权限范围不匹配的 skill 依赖: {', '.join(forbidden_skills)}")

    return tools, mcps, skills


async def update_skill_dependencies(
    db: AsyncSession,
    *,
    slug: str,
    tool_dependencies: list[str],
    mcp_dependencies: list[str],
    skill_dependencies: list[str],
    operator: User,
) -> SkillRecord:
    item = await get_manageable_skill_or_raise(db, operator, slug)
    _ensure_non_builtin(item)
    installed = await _live_sandbox_names(db, item)
    if installed:
        raise ValueError(f"技能已安装到沙箱，不能调整依赖：{', '.join(installed)}")
    repo = SkillRepository(db)
    skill_items = await _list_accessible_shared_skills(db, operator)
    available_skills = {skill.slug: skill for skill in skill_items}
    tools, mcps, skills = await _validate_dependencies(
        parent=item,
        tool_dependencies=tool_dependencies,
        mcp_dependencies=mcp_dependencies,
        skill_dependencies=skill_dependencies,
        available_skills=available_skills,
    )

    return await repo.update_dependencies(
        item,
        tool_dependencies=tools,
        mcp_dependencies=mcps,
        skill_dependencies=skills,
        updated_by=operator.uid,
    )


def _validate_skill_slug_value(slug: str, *, field_name: str) -> str:
    slug = slug.strip()
    if not slug:
        raise ValueError(f"SKILL.md frontmatter 缺少 {field_name}")
    if len(slug) > 128:
        raise ValueError(f"SKILL.md frontmatter.{field_name} 长度不能超过 128")
    if not SKILL_NAME_PATTERN.match(slug):
        raise ValueError(f"SKILL.md frontmatter.{field_name} 必须是小写字母/数字/短横线，且不能连续短横线")
    return slug


def _validate_skill_display_name(name: str) -> str:
    name = name.strip()
    if not name:
        raise ValueError("SKILL.md frontmatter 缺少 name")
    if len(name) > 128:
        raise ValueError("SKILL.md frontmatter.name 长度不能超过 128")
    return name


def _split_frontmatter(content: str) -> tuple[str, str]:
    if not content.startswith("---"):
        raise ValueError("SKILL.md 缺少有效 frontmatter（--- ... ---）")

    lines = content.splitlines(keepends=True)
    if not lines or lines[0].strip() != "---":
        raise ValueError("SKILL.md 缺少有效 frontmatter（--- ... ---）")

    frontmatter_lines: list[str] = []
    body_start = 0
    for index, line in enumerate(lines[1:], start=1):
        if line.strip() == "---":
            body_start = index + 1
            break
        frontmatter_lines.append(line)
    else:
        raise ValueError("SKILL.md 缺少有效 frontmatter（--- ... ---）")

    frontmatter_raw = "".join(frontmatter_lines)
    body = "".join(lines[body_start:])
    return frontmatter_raw, body


def _parse_skill_markdown(content: str) -> tuple[str, str, str, dict[str, Any]]:
    frontmatter_raw, _body = _split_frontmatter(content)
    try:
        data = yaml.safe_load(frontmatter_raw)
    except yaml.YAMLError as e:
        raise ValueError(f"SKILL.md frontmatter YAML 解析失败: {e}") from e

    if not isinstance(data, dict):
        raise ValueError("SKILL.md frontmatter 必须是对象")

    name = _validate_skill_display_name(str(data.get("name", "")))
    raw_slug = str(data.get("slug", "")).strip()
    slug = (
        _validate_skill_slug_value(raw_slug, field_name="slug")
        if raw_slug
        else _validate_skill_slug_value(name, field_name="name")
    )
    description = str(data.get("description", "")).strip()
    if not description:
        raise ValueError("SKILL.md frontmatter 缺少 description")

    return slug, name, description, data


def _builtin_skill_markdown(content: str, slug: str) -> tuple[str, str, dict[str, Any]]:
    """内置技能以目录名为 slug，frontmatter.name 可以是中文展示名。"""
    frontmatter_raw, _body = _split_frontmatter(content)
    try:
        data = yaml.safe_load(frontmatter_raw)
    except yaml.YAMLError as exc:
        raise ValueError(f"SKILL.md frontmatter YAML 解析失败: {exc}") from exc
    if not isinstance(data, dict):
        raise ValueError("SKILL.md frontmatter 必须是对象")
    raw_slug = str(data.get("slug") or "").strip()
    if raw_slug and _validate_skill_slug_value(raw_slug, field_name="slug") != slug:
        raise ValueError(f"内置 skill frontmatter.slug 必须等于 slug: {slug}")
    name = _validate_skill_display_name(str(data.get("name") or slug))
    description = str(data.get("description") or "").strip()
    if not description:
        raise ValueError("SKILL.md frontmatter 缺少 description")
    return name, description, data


def _rewrite_frontmatter_slug(content: str, new_slug: str) -> str:
    frontmatter_raw, body = _split_frontmatter(content)
    data = yaml.safe_load(frontmatter_raw)
    if not isinstance(data, dict):
        raise ValueError("SKILL.md frontmatter 必须是对象")
    if data.get("slug"):
        data["slug"] = new_slug
    else:
        data["name"] = new_slug
    dumped = yaml.safe_dump(data, sort_keys=False, allow_unicode=True).strip()
    return f"---\n{dumped}\n---\n{body}"


def _validate_zip_paths(zip_file: zipfile.ZipFile) -> None:
    for name in zip_file.namelist():
        pure = PurePosixPath(name)
        if pure.is_absolute():
            raise ValueError(f"ZIP 包含不安全绝对路径: {name}")
        if ".." in pure.parts:
            raise ValueError(f"ZIP 包含路径穿越片段: {name}")


async def _generate_available_slug(repo: SkillRepository, base_slug: str) -> str:
    if not await repo.exists_slug(base_slug) and not _tenant_skill_absdir(base_slug).exists():
        return base_slug

    idx = 2
    while True:
        candidate = f"{base_slug}-v{idx}"
        if not await repo.exists_slug(candidate) and not _tenant_skill_absdir(candidate).exists():
            return candidate
        idx += 1


def _parse_skill_dir_metadata(source_skill_dir: Path) -> dict[str, Any]:
    skill_md_path = source_skill_dir / "SKILL.md"
    if not skill_md_path.exists() or not skill_md_path.is_file():
        raise ValueError("技能目录缺少根级 SKILL.md")

    content = skill_md_path.read_text(encoding="utf-8")
    parsed_slug, parsed_name, parsed_desc, meta = _parse_skill_markdown(content)
    return {
        "slug": parsed_slug,
        "name": parsed_name,
        "description": parsed_desc,
        "tool_dependencies": normalize_string_list(meta.get("tool_dependencies")),
        "mcp_dependencies": normalize_string_list(meta.get("mcp_dependencies")),
        "skill_dependencies": normalize_string_list(meta.get("skill_dependencies")),
    }


def get_personal_skills_root_dir(uid: str) -> Path:
    """返回认证用户的个人 Skill 根目录。"""
    from yuxi.agents.backends.sandbox.paths import global_user_data_dir

    root = global_user_data_dir(uid) / "workspace" / WORKSPACE_SKILLS_RELATIVE_DIR
    root.mkdir(parents=True, exist_ok=True)
    return root.resolve()


async def list_personal_skills(uid: str, *, refresh: bool = False) -> PersonalSkillSnapshot:
    """读取个人 Skill Redis 快照，必要时重新扫描工作区。"""
    redis = await get_async_redis_client()
    root = get_personal_skills_root_dir(uid)

    if not refresh:
        cached = await _read_personal_skill_cache(redis, uid, root)
        if cached is not None:
            return cached

    async with _personal_skill_scan_lock(redis, uid):
        if not refresh:
            cached = await _read_personal_skill_cache(redis, uid, root)
            if cached is not None:
                return cached
        return await _scan_and_cache_personal_skills(redis, uid)


async def install_personal_skill_dir(
    uid: str,
    source_dir: Path | str,
    *,
    refresh_cache: bool = True,
) -> ResolvedSkill:
    """将一个 Skill 原子安装到当前用户个人工作区。"""
    redis = await get_async_redis_client()
    async with _personal_skill_scan_lock(redis, uid):
        item = await asyncio.to_thread(_install_personal_skill_dir_sync, uid, Path(source_dir))
        if refresh_cache:
            try:
                await _scan_and_cache_personal_skills(redis, uid)
            except Exception as exc:
                logger.exception(f"个人 Skill 已安装但缓存刷新失败: uid={uid}, slug={item.slug}")
                raise RuntimeError("个人 Skill 已安装，但列表缓存刷新失败，请手动刷新") from exc
        return item


async def read_personal_skill_file(uid: str, slug: str, relative_path: str) -> dict[str, Any]:
    """读取个人 Skill 中的文本文件。"""
    skill_dir = _resolve_personal_skill_dir(uid, slug)
    if not skill_dir.is_dir():
        raise ValueError("个人 Skill 不存在")
    target, normalized_path = _resolve_relative_path(skill_dir, relative_path)
    if not target.is_file():
        raise ValueError("文件不存在")
    if not _is_text_path(target):
        raise ValueError("仅支持读取文本文件")
    return {"path": normalized_path, "content": target.read_text(encoding="utf-8")}


async def delete_personal_skill(uid: str, slug: str) -> PersonalSkillSnapshot:
    """删除当前用户个人 Skill，并立即刷新缓存。"""
    redis = await get_async_redis_client()
    async with _personal_skill_scan_lock(redis, uid):
        skill_dir = _resolve_personal_skill_dir(uid, slug)
        if not skill_dir.is_dir():
            raise ValueError("个人 Skill 不存在")
        await asyncio.to_thread(shutil.rmtree, skill_dir)
        try:
            return await _scan_and_cache_personal_skills(redis, uid)
        except Exception as exc:
            logger.exception(f"个人 Skill 已删除但缓存刷新失败: uid={uid}, slug={slug}")
            raise RuntimeError("个人 Skill 已删除，但列表缓存刷新失败，请手动刷新") from exc


def _resolved_shared_skill(item: SkillRecord, *, shadowed_by_personal: bool = False) -> ResolvedSkill:
    """将数据库 Skill 适配为统一的有效 Skill 描述。"""
    source_scope = "builtin" if is_builtin_skill(item) else "shared"
    return ResolvedSkill(
        id=item.id,
        slug=item.slug,
        name=item.name,
        description=item.description,
        source_type=item.source_type,
        source_scope=source_scope,
        source_dir=_resolve_skill_dir(item),
        enabled=bool(item.enabled),
        created_by=item.created_by,
        share_config=normalize_permission_config(
            item.share_config,
        ),
        tool_dependencies=normalize_string_list(item.tool_dependencies),
        mcp_dependencies=normalize_string_list(item.mcp_dependencies),
        skill_dependencies=normalize_string_list(item.skill_dependencies),
        shadowed_by_personal=shadowed_by_personal,
    )


def _resolved_personal_skill(uid: str, root: Path, metadata: dict[str, Any]) -> ResolvedSkill:
    """将个人目录元数据适配为不含共享语义的有效 Skill 描述。"""
    slug = str(metadata["slug"])
    if not is_valid_skill_slug(slug):
        raise ValueError("个人 Skill 缓存包含非法 slug")
    source_dir = ensure_within_root((root / slug).resolve(), root, error_message="个人 Skill 路径越界")

    return ResolvedSkill(
        id=f"personal:{slug}",
        slug=slug,
        name=str(metadata["name"]),
        description=str(metadata["description"]),
        source_type=PERSONAL_SKILL_SOURCE_TYPE,
        source_scope=PERSONAL_SKILL_SOURCE_TYPE,
        source_dir=source_dir,
        enabled=True,
        created_by=uid,
        share_config=None,
        tool_dependencies=[],
        mcp_dependencies=[],
        skill_dependencies=[],
    )


@asynccontextmanager
async def _personal_skill_scan_lock(redis: Any, uid: str) -> AsyncIterator[None]:
    """串行化同一用户的个人 Skill 扫描与文件变更。"""
    lock = redis.lock(
        _personal_skill_scan_lock_key(uid),
        timeout=PERSONAL_SKILL_SCAN_LOCK_TIMEOUT_SECONDS,
        blocking_timeout=PERSONAL_SKILL_SCAN_LOCK_WAIT_SECONDS,
    )
    async with lock:
        yield


async def _read_personal_skill_cache(
    redis: Any,
    uid: str,
    root: Path,
) -> PersonalSkillSnapshot | None:
    """读取并校验一个用户的个人 Skill 缓存。"""
    cache_key = _personal_skill_cache_key(uid)
    cached = await redis.get(cache_key)
    if not cached:
        return None

    try:
        payload = json.loads(cached)
        if payload.get("schema_version") != 1:
            raise ValueError("个人 Skill 缓存版本不匹配")
        items = [_resolved_personal_skill(uid, root, item) for item in payload["items"]]
        return PersonalSkillSnapshot(
            items=items,
            scanned_at=str(payload["scanned_at"]),
            from_cache=True,
        )
    except (KeyError, TypeError, ValueError, json.JSONDecodeError) as exc:
        logger.warning(f"个人 Skill 缓存无效，将重新扫描: uid={uid}, error={exc}")
        await redis.delete(cache_key)
        return None


async def _scan_and_cache_personal_skills(
    redis: Any,
    uid: str,
) -> PersonalSkillSnapshot:
    """扫描个人 Skill 并写入五分钟 Redis 快照。"""
    items = await asyncio.to_thread(_scan_personal_skills, uid)
    scanned_at = datetime.now(UTC).isoformat()
    payload = {
        "schema_version": 1,
        "scanned_at": scanned_at,
        "items": [{"slug": item.slug, "name": item.name, "description": item.description} for item in items],
    }
    await redis.set(
        _personal_skill_cache_key(uid),
        json.dumps(payload, ensure_ascii=False),
        ex=PERSONAL_SKILL_CACHE_TTL_SECONDS,
    )
    return PersonalSkillSnapshot(items=items, scanned_at=scanned_at, from_cache=False)


def _scan_personal_skills(uid: str) -> list[ResolvedSkill]:
    """扫描并校验当前用户个人 Skill 的直接子目录。"""
    root = get_personal_skills_root_dir(uid)
    items: list[ResolvedSkill] = []
    for entry in sorted(root.iterdir(), key=lambda path: path.name):
        if entry.is_symlink() or not entry.is_dir() or not is_valid_skill_slug(entry.name):
            logger.warning(f"跳过非法个人 Skill 目录: uid={uid}, name={entry.name}")
            continue
        if _dir_contains_symlink(entry):
            logger.warning(f"跳过包含符号链接的个人 Skill: uid={uid}, slug={entry.name}")
            continue

        try:
            metadata = _parse_skill_dir_metadata(entry)
            if metadata["slug"] != entry.name:
                raise ValueError("目录名必须与 SKILL.md slug 一致")
            items.append(_resolved_personal_skill(uid, root, metadata))
        except Exception as exc:
            logger.warning(f"跳过无法解析的个人 Skill: uid={uid}, slug={entry.name}, error={exc}")
    return items


def _install_personal_skill_dir_sync(uid: str, source_dir: Path) -> ResolvedSkill:
    """在持有用户级锁时将一个 Skill 原子复制到个人目录。"""
    root = get_personal_skills_root_dir(uid)
    source_dir = source_dir.resolve()
    if source_dir.is_symlink() or _dir_contains_symlink(source_dir):
        raise ValueError("个人 Skill 不允许包含符号链接")

    metadata = _parse_skill_dir_metadata(source_dir)
    slug = metadata["slug"]
    target_dir = root / slug
    if target_dir.exists() or target_dir.is_symlink():
        raise ValueError(f"个人工作区已存在同名 Skill: {slug}")

    def _validate_slug_unchanged(copied_dir: Path) -> None:
        copied_metadata = _parse_skill_dir_metadata(copied_dir)
        if copied_metadata["slug"] != slug:
            raise ValueError("个人 Skill slug 在复制过程中发生变化")

    _replace_skill_target(target_dir, source_dir, validate=_validate_slug_unchanged)
    return _resolved_personal_skill(uid, root, metadata)


def _resolve_personal_skill_dir(uid: str, slug: str) -> Path:
    """安全解析当前用户的个人 Skill 目录。"""
    if not is_valid_skill_slug(slug):
        raise ValueError("无效 skill slug")
    root = get_personal_skills_root_dir(uid)
    target = ensure_within_root((root / slug).resolve(), root, error_message="个人 Skill 路径越界")
    if target.is_symlink():
        raise ValueError("个人 Skill 路径非法")
    return target


def _personal_skill_cache_key(uid: str) -> str:
    """返回当前用户的个人 Skill 缓存 key。"""
    return f"{PERSONAL_SKILL_CACHE_PREFIX}{uid}"


def _personal_skill_scan_lock_key(uid: str) -> str:
    """返回当前用户的个人 Skill 扫描锁 key。"""
    return f"{PERSONAL_SKILL_SCAN_LOCK_PREFIX}{uid}"


async def _stage_skill_draft_item(
    repo: SkillRepository,
    *,
    source_skill_dir: Path,
    draft_items_dir: Path,
) -> dict[str, Any]:
    item_id = uuid.uuid4().hex
    item_dir = draft_items_dir / item_id
    shutil.copytree(source_skill_dir, item_dir, symlinks=False, ignore=_SKILL_COPY_IGNORE)
    parsed = _parse_skill_dir_metadata(item_dir)
    final_slug = await _generate_available_slug(repo, parsed["slug"])
    return {
        "draft_item_id": item_id,
        "source_dir": f"items/{item_id}",
        "slug": final_slug,
        "name": parsed["name"],
        "original_name": parsed["slug"],
        "description": parsed["description"],
        "tool_dependencies": parsed["tool_dependencies"],
        "mcp_dependencies": parsed["mcp_dependencies"],
        "skill_dependencies": parsed["skill_dependencies"],
        "warnings": [f"原始 slug {parsed['slug']} 已存在，将安装为 {final_slug}"]
        if final_slug != parsed["slug"]
        else [],
        "success": True,
    }


def _build_default_share_payload(operator: User) -> dict[str, Any]:
    default_share_config = normalize_skill_share_config(
        None,
        operator_uid=operator.uid,
    )
    return {
        "default_share_config": default_share_config,
        "allowed_access_levels": get_allowed_skill_access_levels(operator),
    }


async def _import_skill_dir_impl(
    db: AsyncSession,
    *,
    source_skill_dir: Path,
    created_by: str | None,
    source_type: str,
    share_config: dict,
) -> SkillRecord:
    skills_root = get_skills_root_dir()
    parsed = _parse_skill_dir_metadata(source_skill_dir)
    repo = SkillRepository(db)
    final_slug = await _generate_available_slug(repo, parsed["slug"])
    with tempfile.TemporaryDirectory(prefix=".skill-import-", dir=str(skills_root.parent)) as temp_root:
        stage_dir = Path(temp_root) / "stage"
        shutil.copytree(source_skill_dir, stage_dir, ignore=_SKILL_COPY_IGNORE)

        if final_slug != parsed["slug"]:
            content = (stage_dir / "SKILL.md").read_text(encoding="utf-8")
            (stage_dir / "SKILL.md").write_text(_rewrite_frontmatter_slug(content, final_slug), encoding="utf-8")

        temp_target = skills_root / f".{final_slug}.tmp-{uuid.uuid4().hex[:8]}"
        if temp_target.exists():
            await asyncio.to_thread(shutil.rmtree, temp_target)
        shutil.move(str(stage_dir), str(temp_target))

        final_dir = _tenant_skill_absdir(final_slug)
        final_dir.parent.mkdir(parents=True, exist_ok=True)
        if final_dir.exists():
            await asyncio.to_thread(shutil.rmtree, temp_target, ignore_errors=True)
            raise ValueError(f"技能目录冲突，请重试: {final_slug}")
        temp_target.rename(final_dir)

        try:
            bundle_bytes = build_skill_bundle_for_dir(final_slug, final_dir)
            item = await repo.create(
                slug=final_slug,
                name=parsed["name"],
                description=parsed["description"],
                source_type=source_type,
                tool_dependencies=parsed["tool_dependencies"],
                mcp_dependencies=parsed["mcp_dependencies"],
                skill_dependencies=parsed["skill_dependencies"],
                dir_path=_tenant_skill_relpath(final_slug).as_posix(),
                share_config=share_config,
                enabled=True,
                created_by=created_by,
                bundle_bytes=bundle_bytes,
            )
        except Exception:
            await asyncio.to_thread(shutil.rmtree, final_dir, ignore_errors=True)
            raise

    return item


_MINIO_BUNDLE = re.compile(r"minio://([^/]+)/(.+)$")


def _minio_bundle_location(value: str) -> tuple[str, str] | None:
    match = _MINIO_BUNDLE.search(value or "")
    if match is None:
        return None
    return match.group(1), match.group(2)


async def _load_skill_bundle(db: AsyncSession, item: SkillRecord) -> bytes | None:
    """本地目录缺失时，从目录包或 resource 记录把技能包取回来。"""
    ref = str(item.raw.get("bundle_ref") or "").strip()
    location = _minio_bundle_location(ref) if ref.startswith("minio://") else None
    if location is None and ref.startswith("resource://") and db is not None:
        handle = ref.removeprefix("resource://")
        result = await db.execute(
            text("SELECT physical_path FROM resources WHERE handle = :handle AND deleted_at IS NULL"),
            {"handle": handle},
        )
        row = result.first()
        location = _minio_bundle_location(str(row[0] or "")) if row is not None else None
    if location is None:
        return None
    from yuxi.storage.minio.client import get_minio_client

    bucket, object_name = location
    return await asyncio.to_thread(get_minio_client().download_file, bucket, object_name)


def _extract_skill_bundle(skill_dir: Path, payload: bytes) -> None:
    skill_dir.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(io.BytesIO(payload)) as archive:
        skill_files = [name for name in archive.namelist() if name.endswith("SKILL.md") and ".." not in PurePosixPath(name).parts]
        if not skill_files:
            raise ValueError("技能包缺少 SKILL.md")
        prefix = min(skill_files, key=len)[: -len("SKILL.md")]
        for info in archive.infolist():
            name = info.filename
            if not name.startswith(prefix):
                continue
            relative = name[len(prefix) :]
            if not relative or ".." in PurePosixPath(relative).parts:
                continue
            target = ensure_within_root((skill_dir / relative).resolve(), skill_dir, error_message="技能包路径非法")
            if info.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(info))


async def _ensure_skill_dir(db: AsyncSession, item: SkillRecord) -> Path:
    skill_dir = _resolve_skill_dir(item)
    if (skill_dir / "SKILL.md").is_file():
        return skill_dir
    payload = await _load_skill_bundle(db, item)
    if payload:
        await asyncio.to_thread(_extract_skill_bundle, skill_dir, payload)
    if not (skill_dir / "SKILL.md").is_file():
        raise ValueError(f"技能目录不存在: {item.dir_path}")
    return skill_dir


def _resolve_skill_dir(item: SkillRecord) -> Path:
    dir_path = Path(item.dir_path)
    if dir_path.is_absolute():
        return dir_path
    return (Path(sys_config.save_dir) / dir_path).resolve()


def _resolve_relative_path(skill_dir: Path, relative_path: str, *, allow_root: bool = False) -> tuple[Path, str]:
    rel = (relative_path or "").strip().replace("\\", "/")
    rel = rel.lstrip("/")
    if not rel and not allow_root:
        raise ValueError("path 不能为空")
    pure = PurePosixPath(rel) if rel else PurePosixPath(".")
    if ".." in pure.parts:
        raise ValueError("非法路径：不允许上级路径引用")

    target = ensure_within_root((skill_dir / pure).resolve(), skill_dir, error_message="非法路径：越界访问被拒绝")

    return target, rel


def _is_text_path(path: Path) -> bool:
    if path.name == "SKILL.md":
        return True
    suffix = path.suffix.lower()
    return suffix in TEXT_FILE_EXTENSIONS


def _is_skill_tree_noise(path: Path) -> bool:
    if path.name in SKILL_TREE_IGNORE_NAMES or path.suffix.lower() in SKILL_TREE_IGNORE_SUFFIXES:
        return True
    return any(part in SKILL_TREE_IGNORE_NAMES for part in path.parts)


def _purge_skill_tree_noise(root: Path) -> None:
    """删除技能目录中由运行脚本产生的缓存文件，避免出现在详情树里。"""
    if not root.is_dir():
        return
    for child in list(root.rglob("*")):
        if not child.is_dir() or child.name not in SKILL_TREE_IGNORE_NAMES:
            continue
        shutil.rmtree(child, ignore_errors=True)
    for child in list(root.rglob("*")):
        if child.is_file() and _is_skill_tree_noise(child):
            try:
                child.unlink(missing_ok=True)
            except OSError:
                logger.warning(f"无法删除技能缓存文件: {child}")


def _build_tree(path: Path, base_dir: Path) -> list[dict[str, Any]]:
    children: list[dict[str, Any]] = []
    for child in sorted(path.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower())):
        if _is_skill_tree_noise(child):
            continue
        rel = child.relative_to(base_dir).as_posix()
        if child.is_dir():
            children.append(
                {
                    "name": child.name,
                    "path": rel,
                    "is_dir": True,
                    "children": _build_tree(child, base_dir),
                }
            )
        else:
            children.append(
                {
                    "name": child.name,
                    "path": rel,
                    "is_dir": False,
                }
            )
    return children


async def prepare_skill_upload(
    db: AsyncSession,
    *,
    filename: str,
    file_bytes: bytes,
    operator: User,
    usage_source: str = "chat",
) -> dict[str, Any]:
    normalized_filename = filename.lower()
    is_zip_upload = normalized_filename.endswith(".zip")
    is_skill_md_upload = normalized_filename.endswith("skill.md")
    if not is_zip_upload and not is_skill_md_upload:
        raise ValueError("仅支持上传 .zip 或 SKILL.md 文件")

    repo = SkillRepository(db)
    draft_dir = get_skill_drafts_root_dir() / str(uuid.uuid4())
    items_dir = draft_dir / "items"
    draft_dir.mkdir(parents=True, exist_ok=False)
    items_dir.mkdir(parents=True, exist_ok=True)

    try:
        with tempfile.TemporaryDirectory(prefix=".skill-prepare-", dir=str(get_skills_root_dir().parent)) as temp_root:
            extract_dir = Path(temp_root) / "extract"
            extract_dir.mkdir(parents=True, exist_ok=True)
            if is_zip_upload:
                zip_path = Path(temp_root) / "upload.zip"
                zip_path.write_bytes(file_bytes)
                with zipfile.ZipFile(zip_path, "r") as zf:
                    _validate_zip_paths(zf)
                    zf.extractall(extract_dir)
                skill_md_files = list(extract_dir.rglob("SKILL.md"))
                if len(skill_md_files) != 1:
                    raise ValueError("ZIP 必须且只能包含一个技能（检测到一个 SKILL.md）")
                source_skill_dir = skill_md_files[0].parent
            else:
                source_skill_dir = extract_dir
                (source_skill_dir / "SKILL.md").write_bytes(file_bytes)

            item = await _stage_skill_draft_item(repo, source_skill_dir=source_skill_dir, draft_items_dir=items_dir)

        data = {
            "draft_id": draft_dir.name,
            "created_by": operator.uid,
            "source_type": "upload",
            "usage_source": usage_source if usage_source in {"chat", "work", "common"} else "chat",
            "source": filename,
            "created_at": time.time(),
            "expires_at": time.time() + SKILL_DRAFT_TTL_SECONDS,
            "items": [item],
            **_build_default_share_payload(operator),
        }
        (draft_dir / "metadata.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data
    except Exception:
        shutil.rmtree(draft_dir, ignore_errors=True)
        raise


async def prepare_remote_skill_install(
    db: AsyncSession,
    *,
    source: str,
    skills: list[str],
    operator: User,
    usage_source: str = "chat",
) -> dict[str, Any]:
    from yuxi.agents.skills.remote_install import prepare_remote_skills_batch

    repo = SkillRepository(db)
    draft_dir = get_skill_drafts_root_dir() / str(uuid.uuid4())
    items_dir = draft_dir / "items"
    draft_dir.mkdir(parents=True, exist_ok=False)
    items_dir.mkdir(parents=True, exist_ok=True)

    preparation = None
    try:
        preparation = await prepare_remote_skills_batch(source=source, skills=skills)
        items: list[dict[str, Any]] = []
        for result in preparation.results:
            slug = result.get("slug", "")
            if not result.get("success"):
                item = {"slug": slug, "success": False, "error": result.get("error", "安装失败")}
                items.append(item)
                continue

            try:
                item = await _stage_skill_draft_item(
                    repo,
                    source_skill_dir=Path(result["source_dir"]),
                    draft_items_dir=items_dir,
                )
            except Exception as e:
                item = {"slug": slug, "success": False, "error": str(e)}
                items.append(item)
                continue

            items.append(item)

        data = {
            "draft_id": draft_dir.name,
            "created_by": operator.uid,
            "source_type": "remote",
            "usage_source": usage_source if usage_source in {"chat", "work", "common"} else "chat",
            "source": source,
            "created_at": time.time(),
            "expires_at": time.time() + SKILL_DRAFT_TTL_SECONDS,
            "items": items,
            **_build_default_share_payload(operator),
        }
        (draft_dir / "metadata.json").write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        return data
    except Exception:
        shutil.rmtree(draft_dir, ignore_errors=True)
        raise
    finally:
        if preparation is not None:
            await preparation.cleanup()


async def confirm_skill_install_draft(
    db: AsyncSession,
    *,
    draft_id: str,
    share_config: dict | None,
    slugs: list[str] | None = None,
    operator: User,
) -> list[dict[str, Any]]:
    draft_dir, data, draft_items = _load_and_select_draft_items(draft_id, slugs, operator)
    source_type = data.get("source_type")

    normalized_share_config = normalize_skill_share_config(
        share_config,
        operator_uid=operator.uid,
        source_type=source_type,
        allowed_access_levels=set(get_allowed_skill_access_levels(operator)),
    )

    repo = SkillRepository(db)
    skills_root = get_skills_root_dir()
    results: list[dict[str, Any]] = []

    for draft_item in draft_items:
        slug = str(draft_item.get("slug") or "").strip()
        if not draft_item.get("success", True):
            result = {"slug": slug, "success": False, "error": draft_item.get("error", "安装失败")}
            results.append(result)
            continue

        if not is_valid_skill_slug(slug):
            result = {"slug": slug, "success": False, "error": "无效 skill slug"}
            results.append(result)
            continue
        if await repo.exists_slug(slug) or _tenant_skill_absdir(slug).exists():
            result = {"slug": slug, "success": False, "error": "Skill slug 已被占用，请重新解析安装"}
            results.append(result)
            continue

        source_dir = (draft_dir / str(draft_item.get("source_dir", ""))).resolve()
        try:
            source_dir.relative_to(draft_dir.resolve())
        except ValueError:
            result = {"slug": slug, "success": False, "error": "安装草稿路径非法"}
            results.append(result)
            continue

        try:
            parsed = _parse_skill_dir_metadata(source_dir)
            with tempfile.TemporaryDirectory(prefix=".skill-confirm-", dir=str(skills_root.parent)) as temp_root:
                stage_dir = Path(temp_root) / "stage"
                shutil.copytree(source_dir, stage_dir, ignore=_SKILL_COPY_IGNORE)
                if parsed["slug"] != slug:
                    content = (stage_dir / "SKILL.md").read_text(encoding="utf-8")
                    (stage_dir / "SKILL.md").write_text(_rewrite_frontmatter_slug(content, slug), encoding="utf-8")

                temp_target = skills_root / f".{slug}.tmp-{uuid.uuid4().hex[:8]}"
                shutil.move(str(stage_dir), str(temp_target))
                final_dir = _tenant_skill_absdir(slug)
                final_dir.parent.mkdir(parents=True, exist_ok=True)
                if final_dir.exists():
                    shutil.rmtree(temp_target, ignore_errors=True)
                    result = {"slug": slug, "success": False, "error": "Skill slug 已被占用，请重新解析安装"}
                    results.append(result)
                    continue
                temp_target.rename(final_dir)

                bundle_bytes = build_skill_bundle_for_dir(slug, final_dir)
                try:
                    item = await repo.create(
                        slug=slug,
                        name=parsed["name"],
                        description=parsed["description"],
                        source_type=str(data.get("usage_source") or "chat"),
                        tool_dependencies=parsed["tool_dependencies"],
                        mcp_dependencies=parsed["mcp_dependencies"],
                        skill_dependencies=parsed["skill_dependencies"],
                        dir_path=_tenant_skill_relpath(slug).as_posix(),
                        share_config=normalized_share_config,
                        enabled=True,
                        created_by=operator.uid,
                        bundle_bytes=bundle_bytes,
                    )
                    result = {"slug": item.slug, "success": True, "skill": item.to_dict()}
                    results.append(result)
                except Exception:
                    shutil.rmtree(final_dir, ignore_errors=True)
                    raise
        except Exception as e:
            if hasattr(db, "rollback"):
                await db.rollback()
            result = {"slug": slug, "success": False, "error": str(e)}
            results.append(result)

    if any(item.get("success") for item in results):
        shutil.rmtree(draft_dir, ignore_errors=True)
    return results


async def confirm_personal_skill_install_draft(
    *,
    draft_id: str,
    slugs: list[str] | None,
    operator: User,
) -> list[dict[str, Any]]:
    """确认草稿并将选中 Skill 安装到当前用户个人工作区。"""
    draft_dir, _data, draft_items = _load_and_select_draft_items(draft_id, slugs, operator)

    results: list[dict[str, Any]] = []
    for draft_item in draft_items:
        requested_slug = str(draft_item.get("slug") or "").strip()
        personal_slug = str(draft_item.get("original_name") or requested_slug).strip()
        if not draft_item.get("success", True):
            results.append(
                {
                    "slug": personal_slug,
                    "requested_slug": requested_slug,
                    "success": False,
                    "error": draft_item.get("error", "安装失败"),
                }
            )
            continue
        if not is_valid_skill_slug(personal_slug):
            results.append(
                {
                    "slug": personal_slug,
                    "requested_slug": requested_slug,
                    "success": False,
                    "error": "无效 skill slug",
                }
            )
            continue

        source_dir = (draft_dir / str(draft_item.get("source_dir", ""))).resolve()
        try:
            source_dir.relative_to(draft_dir.resolve())
            parsed = _parse_skill_dir_metadata(source_dir)
            if parsed["slug"] != personal_slug:
                raise ValueError("安装草稿中的个人 Skill slug 不一致")
            item = await install_personal_skill_dir(
                str(operator.uid),
                source_dir,
                refresh_cache=False,
            )
            results.append(
                {
                    "slug": item.slug,
                    "requested_slug": requested_slug,
                    "success": True,
                    "skill": item.to_dict(),
                }
            )
        except Exception as exc:
            results.append(
                {
                    "slug": personal_slug,
                    "requested_slug": requested_slug,
                    "success": False,
                    "error": str(exc),
                }
            )

    if any(item.get("success") for item in results):
        await list_personal_skills(str(operator.uid), refresh=True)
        shutil.rmtree(draft_dir, ignore_errors=True)
    return results


async def discard_skill_install_draft(*, draft_id: str, operator: User) -> None:
    draft_dir, data = _load_skill_draft(draft_id)
    if data.get("created_by") != operator.uid and operator.role not in ADMIN_ROLES:
        raise ValueError("无权删除该安装草稿")
    shutil.rmtree(draft_dir, ignore_errors=True)


async def import_skill_dir(
    db: AsyncSession,
    *,
    source_dir: Path | str,
    created_by: str | None,
    source_type: str = "upload",
    share_config: dict | None = None,
) -> SkillRecord:
    source_skill_dir = Path(source_dir).resolve()
    tmp_root = Path(tempfile.gettempdir()).resolve()
    if not source_skill_dir.is_relative_to(tmp_root):
        raise ValueError("技能目录路径不合法")
    if not source_skill_dir.exists() or not source_skill_dir.is_dir():
        raise ValueError("技能目录不存在")
    return await _import_skill_dir_impl(
        db,
        source_skill_dir=source_skill_dir,
        created_by=created_by,
        source_type=source_type,
        share_config=normalize_skill_share_config(
            share_config,
            operator_uid=created_by or "",
            source_type=source_type,
        ),
    )


async def get_skill_or_raise(db: AsyncSession, slug: str) -> SkillRecord:
    slug = slug.strip() if isinstance(slug, str) else ""
    if not is_valid_skill_slug(slug):
        raise ValueError("无效 skill slug")

    repo = SkillRepository(db)
    item = await repo.get_by_slug(slug)
    if not item:
        raise ValueError(f"技能 '{slug}' 不存在")
    return item



async def get_management_readable_skill_or_raise(db: AsyncSession, user: User, slug: str) -> SkillRecord:
    item = await get_skill_or_raise(db, slug)
    if not user_can_manage_skill(user, item) and not user_can_access_skill(user, item):
        raise ValueError(f"技能 '{slug}' 不存在或无权访问")
    return item


async def get_manageable_skill_or_raise(db: AsyncSession, user: User, slug: str) -> SkillRecord:
    item = await get_skill_or_raise(db, slug)
    if is_builtin_skill(item):
        if not user_can_manage_skill(user, item):
            raise ValueError(f"技能 '{slug}' 不存在或无权管理")
        return item
    # 租户共享技能按可见即可维护，不再要求创建者才有管理范围。
    if not user_can_manage_skill(user, item) and not user_can_access_skill(user, item, require_enabled=False):
        raise ValueError(f"技能 '{slug}' 不存在或无权管理")
    return item


async def get_skill_tree(db: AsyncSession, slug: str) -> list[dict[str, Any]]:
    item = await get_skill_or_raise(db, slug)
    skill_dir = await _ensure_skill_dir(db, item)
    _purge_skill_tree_noise(skill_dir)
    return _build_tree(skill_dir, skill_dir)


async def read_skill_file(db: AsyncSession, slug: str, relative_path: str) -> dict[str, Any]:
    item = await get_skill_or_raise(db, slug)
    skill_dir = await _ensure_skill_dir(db, item)
    target, rel = _resolve_relative_path(skill_dir, relative_path)
    if not target.exists() or not target.is_file():
        raise ValueError(f"文件不存在: {relative_path}")
    if not _is_text_path(target):
        raise ValueError("仅支持读取文本文件")
    try:
        content = target.read_text(encoding="utf-8")
    except UnicodeDecodeError as e:
        raise ValueError(f"文件编码不支持（仅支持 UTF-8）: {e}") from e

    return {"path": rel, "content": content}


async def create_skill_node(
    db: AsyncSession,
    *,
    slug: str,
    relative_path: str,
    is_dir: bool,
    content: str | None,
    updated_by: str | None,
) -> None:
    item = await get_skill_or_raise(db, slug)
    if is_builtin_skill(item):
        raise ValueError("内置 skill 不允许直接修改文件")
    skill_dir = _resolve_skill_dir(item)
    target, _ = _resolve_relative_path(skill_dir, relative_path)
    if target.exists():
        raise ValueError("目标已存在")

    if is_dir:
        target.mkdir(parents=True, exist_ok=False)
        return

    if not _is_text_path(target):
        raise ValueError("仅支持创建文本文件")

    target.parent.mkdir(parents=True, exist_ok=True)

    # 先写入文件，再更新元数据
    target.write_text(content or "", encoding="utf-8")

    await _sync_skill_bundle(db, item, skill_dir, target, updated_by)


async def update_skill_file(
    db: AsyncSession,
    *,
    slug: str,
    relative_path: str,
    content: str,
    updated_by: str | None,
) -> None:
    item = await get_skill_or_raise(db, slug)
    if is_builtin_skill(item):
        raise ValueError("内置 skill 不允许直接修改文件")
    skill_dir = _resolve_skill_dir(item)
    target, _ = _resolve_relative_path(skill_dir, relative_path)
    if not target.exists() or not target.is_file():
        raise ValueError("文件不存在")
    if not _is_text_path(target):
        raise ValueError("仅支持编辑文本文件")

    target.write_text(content, encoding="utf-8")
    await _sync_skill_bundle(db, item, skill_dir, target, updated_by)


async def _sync_skill_bundle(
    db: AsyncSession,
    item: SkillRecord,
    skill_dir: Path,
    target: Path,
    updated_by: str | None,
) -> None:
    """文件变更后校验根级元数据，并把本地 bundle 同步到 app-core 主数据。"""
    if target.name == "SKILL.md" and target.parent == skill_dir:
        parsed_slug, _parsed_name, _parsed_desc, _ = _parse_skill_markdown(target.read_text(encoding="utf-8"))
        if parsed_slug != item.slug:
            raise ValueError("SKILL.md frontmatter.slug 必须与 skill slug 一致")
    await SkillRepository(db).sync_bundle(item, updated_by=updated_by)


async def delete_skill_node(db: AsyncSession, *, slug: str, relative_path: str) -> None:
    item = await get_skill_or_raise(db, slug)
    if is_builtin_skill(item):
        raise ValueError("内置 skill 不允许直接修改文件")
    skill_dir = _resolve_skill_dir(item)
    target, rel = _resolve_relative_path(skill_dir, relative_path, allow_root=False)
    if not target.exists():
        raise ValueError("目标不存在")

    if rel == "SKILL.md":
        raise ValueError("不允许删除根目录 SKILL.md")

    if target.is_dir():
        await asyncio.to_thread(shutil.rmtree, target)
    else:
        target.unlink()
    await SkillRepository(db).sync_bundle(item, updated_by=None)


async def export_skill_zip(db: AsyncSession, slug: str) -> tuple[str, str]:
    item = await get_skill_or_raise(db, slug)
    skill_dir = await _ensure_skill_dir(db, item)

    fd, export_path = tempfile.mkstemp(prefix=f"skill-{slug}-", suffix=".zip")
    Path(export_path).unlink(missing_ok=True)
    export_file = Path(export_path)
    try:
        with zipfile.ZipFile(export_file, "w", compression=zipfile.ZIP_DEFLATED) as zf:
            for p in skill_dir.rglob("*"):
                arcname = Path(slug) / p.relative_to(skill_dir)
                zf.write(p, arcname.as_posix())
    except Exception:
        export_file.unlink(missing_ok=True)
        raise
    return export_path, f"{slug}.zip"


async def delete_skill(db: AsyncSession, *, slug: str) -> None:
    repo = SkillRepository(db)
    item = await repo.get_by_slug(slug, for_update=True)
    if not item:
        raise ValueError(f"技能 '{slug}' 不存在")
    _ensure_non_builtin(item)
    dependents = await _dependent_skill_names(repo, item)
    if dependents:
        raise ValueError(f"技能仍被依赖，请先解绑：{', '.join(dependents)}")
    installed = await _live_sandbox_names(db, item)
    if installed:
        raise ValueError(f"技能已安装到沙箱，不能删除：{', '.join(installed)}")

    skill_dir = _resolve_skill_dir(item)
    trash_dir: Path | None = None

    if skill_dir.exists():
        trash_dir = skill_dir.with_name(f".deleted-{slug}-{uuid.uuid4().hex[:8]}")
        skill_dir.rename(trash_dir)

    try:
        await repo.delete(item)
    except Exception:
        if trash_dir and trash_dir.exists():
            trash_dir.rename(skill_dir)
        raise

    if trash_dir and trash_dir.exists():
        await asyncio.to_thread(shutil.rmtree, trash_dir, ignore_errors=True)


async def delete_skills_batch(db: AsyncSession, *, slugs: list[str]) -> list[dict]:
    """批量删除多个 skills（单技能独立的子事务与回滚）。

    当前前端已移除批量管理入口，因此该能力暂无前端调用方；保留供 API
    兼容和后续管理工具复用。
    """
    if len(slugs) > 50:
        raise ValueError("批量删除的技能数量不能超过 50 个")
    results = []
    for slug in slugs:
        try:
            await delete_skill(db, slug=slug)
            results.append({"slug": slug, "success": True})
        except Exception as e:
            if hasattr(db, "rollback"):
                await db.rollback()
            results.append({"slug": slug, "success": False, "error": str(e)})
    return results


async def update_skill_share_config(
    db: AsyncSession,
    *,
    slug: str,
    share_config: dict | None,
    operator: User,
) -> SkillRecord:
    item = await get_manageable_skill_or_raise(db, operator, slug)
    _ensure_non_builtin(item)
    normalized = normalize_skill_share_config(
        share_config,
        operator_uid=operator.uid,
        source_type=item.source_type,
        allowed_access_levels=set(get_allowed_skill_access_levels(operator)),
    )
    return await SkillRepository(db).update_share_config(item, share_config=normalized, updated_by=operator.uid)


async def update_skill_enabled(db: AsyncSession, *, slug: str, enabled: bool, operator: User) -> SkillRecord:
    item = await get_manageable_skill_or_raise(db, operator, slug)
    return await SkillRepository(db).update_enabled(item, enabled=enabled, updated_by=operator.uid)


def list_builtin_skill_specs() -> list[dict[str, Any]]:
    specs: list[dict[str, Any]] = []
    for raw_spec in get_builtin_skill_specs():
        slug = str(getattr(raw_spec, "slug", "")).strip()
        source_dir = Path(str(getattr(raw_spec, "source_dir", ""))).resolve()
        configured_description = str(getattr(raw_spec, "description", "")).strip()
        usage = str(getattr(raw_spec, "usage_source", "work") or "work")
        if usage not in {"chat", "work", "common"}:
            usage = "work"
        configured_tools = normalize_string_list(getattr(raw_spec, "tool_dependencies", None))
        configured_mcps = normalize_string_list(getattr(raw_spec, "mcp_dependencies", None))
        configured_skills = normalize_string_list(getattr(raw_spec, "skill_dependencies", None))
        if usage == "common":
            configured_tools = []
            configured_skills = []

        if not is_valid_skill_slug(slug):
            raise ValueError(f"内置 skill slug 非法: {slug}")
        if not source_dir.exists() or not source_dir.is_dir():
            logger.warning(f"跳过不存在的内置 skill 目录: {source_dir}")
            continue

        skill_md = source_dir / "SKILL.md"
        if not skill_md.exists():
            raise ValueError(f"内置 skill 缺少 SKILL.md: {source_dir}")

        content = skill_md.read_text(encoding="utf-8")
        parsed_name, parsed_desc, meta = _builtin_skill_markdown(content, slug)
        moment = _directory_mtime(source_dir)
        version = str(getattr(raw_spec, "version", "") or "").strip() or moment.strftime("%Y.%m.%d.%H%M%S")

        specs.append(
            {
                "slug": slug,
                "name": parsed_name,
                "description": parsed_desc or configured_description,
                "version": version,
                "source_mtime": moment,
                "tool_dependencies": []
                if usage == "common"
                else configured_tools or normalize_string_list(meta.get("tool_dependencies")),
                "mcp_dependencies": configured_mcps or normalize_string_list(meta.get("mcp_dependencies")),
                "skill_dependencies": []
                if usage == "common"
                else configured_skills or normalize_string_list(meta.get("skill_dependencies")),
                "usage_source": usage,
                "content_hash": _compute_dir_hash(source_dir),
                "source_dir": source_dir,
            }
        )

    return specs


def _build_builtin_runtime_specs(
    specs: list[dict[str, Any]], *, operator_uid: str = "system"
) -> dict[str, dict[str, Any]]:
    return {
        spec["slug"]: {
            **spec,
            "source_type": spec.get("usage_source") or "work",
            "dir_path": _build_builtin_skill_dir_path(spec["slug"]),
            "share_config": BUILTIN_SKILL_PERMISSION_CONFIG.copy(),
            "enabled": True,
            "created_by": operator_uid or BUILTIN_SKILL_OPERATOR,
        }
        for spec in specs
    }


async def init_builtin_skills(db: AsyncSession, *, created_by: str = "system") -> list[SkillRecord]:
    """把代码内置技能同步到运行目录、app-core catalog 和 runtime 扩展。

    展示名/描述以 SKILL.md frontmatter 为准。目录技能每次启动都会重新注册同名 bundle；
    runtime 中的禁用状态只在首次安装时初始化，升级不会被重置。
    """
    repo = SkillRepository(db)
    synced_items: list[SkillRecord] = []

    specs = list_builtin_skill_specs()
    runtime_specs = _build_builtin_runtime_specs(specs, operator_uid=created_by)
    # 多租户且没有请求上下文时，补齐已有目录会失败。不能因此跳过内置技能写入。
    try:
        await repo.reconcile_runtime_records(runtime_specs, operator_uid=created_by or "system")
    except ValueError as exc:
        logger.warning(f"启动时未能按单一租户补齐已有技能目录，继续写入内置技能: {exc}")

    for spec in specs:
        slug = spec["slug"]
        try:
            existing = await repo.get_by_slug_unscoped(slug)
            if existing and not is_builtin_skill(existing):
                logger.warning(f"内置 skill '{slug}' 与租户技能同名，仍写入内置记录")
                existing = None

            target_dir = get_skills_root_dir() / slug
            _replace_skill_target(target_dir, Path(spec["source_dir"]))

            if existing:
                dependencies_changed = (
                    normalize_string_list(existing.tool_dependencies or []) != spec["tool_dependencies"]
                    or normalize_string_list(existing.mcp_dependencies or []) != spec["mcp_dependencies"]
                    or normalize_string_list(existing.skill_dependencies or []) != spec["skill_dependencies"]
                )
                if dependencies_changed:
                    await repo.update_dependencies(
                        existing,
                        tool_dependencies=spec["tool_dependencies"],
                        mcp_dependencies=spec["mcp_dependencies"],
                        skill_dependencies=spec["skill_dependencies"],
                        updated_by=created_by,
                    )
                synced_items.append(
                    await repo.update_builtin_install(
                        existing,
                        version=spec["version"],
                        content_hash=spec["content_hash"],
                        updated_by=created_by,
                        source_type=spec.get("usage_source") or "work",
                        source_mtime=spec.get("source_mtime"),
                    )
                )
                continue

            synced_items.append(
                await repo.create(
                    slug=slug,
                    name=spec["name"],
                    description=spec["description"],
                    source_type=spec.get("usage_source") or "work",
                    tool_dependencies=spec["tool_dependencies"],
                    mcp_dependencies=spec["mcp_dependencies"],
                    skill_dependencies=spec["skill_dependencies"],
                    dir_path=_build_builtin_skill_dir_path(slug),
                    share_config=BUILTIN_SKILL_PERMISSION_CONFIG.copy(),
                    enabled=True,
                    version=spec["version"],
                    content_hash=spec["content_hash"],
                    created_by=created_by or BUILTIN_SKILL_OPERATOR,
                    builtin=True,
                    source_mtime=spec.get("source_mtime"),
                )
            )
        except AppCoreAuthError as exc:
            logger.warning(f"内置 skill '{slug}' 同步需要用户 JWT 或 WEKNORA_APPCORE_API_KEY：{exc}")
        except Exception as exc:
            logger.error(f"同步内置 skill '{slug}' 失败: {exc}")

    return synced_items
