"""Skills 管理路由"""

from __future__ import annotations

from pathlib import Path

import json

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from server.utils.auth_middleware import get_admin_user, get_db, get_required_user
from yuxi.config.errors import ApiError
from yuxi.agents.skills.service import (
    confirm_skill_install_draft,
    create_skill_node,
    delete_skill,
    export_skill_zip,
    get_allowed_skill_access_levels,
    get_manageable_skill_or_raise,
    get_management_readable_skill_or_raise,
    get_skill_dependency_options,
    get_skill_tree,
    list_config_skills,
    list_skill_install_messages,
    load_skill_transcript_frames,
    patch_config_skill,
    remove_config_skill,
    retry_config_skill,
    stop_config_skill,
    is_builtin_skill,
    list_accessible_skills,
    list_skill_sandbox_board,
    list_skill_cards_for_user,
    list_visible_skills_for_management,
    prepare_remote_skill_install,
    prepare_skill_upload,
    read_skill_file,
    update_skill_dependencies,
    update_skill_enabled,
    update_skill_file,
    user_can_manage_skill,
)
from yuxi.permissions import resolve_skill_permission
from yuxi.agents.skills.remote_install import list_remote_skills
from yuxi.storage.postgres.models_business import User
from yuxi.utils.logging_config import logger

skills = APIRouter(prefix="/system/skills", tags=["skills"])
user_skills = APIRouter(prefix="/skills", tags=["skills"])


class SkillEnabledUpdateRequest(BaseModel):
    enabled: bool = Field(..., description="是否启用")


class SkillNodeCreateRequest(BaseModel):
    path: str = Field(..., description="相对 skill 根目录的路径")
    is_dir: bool = Field(False, description="是否创建目录")
    content: str | None = Field("", description="文件内容（仅文件创建时生效）")


class SkillFileUpdateRequest(BaseModel):
    path: str = Field(..., description="相对 skill 根目录的路径")
    content: str = Field(..., description="文件内容")


class SkillDependenciesUpdateRequest(BaseModel):
    tool_dependencies: list[str] = Field(default_factory=list, description="依赖的内置工具列表")
    mcp_dependencies: list[str] = Field(default_factory=list, description="依赖的 MCP 服务列表")
    skill_dependencies: list[str] = Field(default_factory=list, description="依赖的其他 skill slug 列表")


class RemoteSkillSourceRequest(BaseModel):
    source: str = Field(..., description="skills 仓库来源，如 owner/repo 或 GitHub URL")


class RemoteSkillPrepareRequest(RemoteSkillSourceRequest):
    skills: list[str] = Field(..., description="需要安装的 skill 名称列表")
    usage_source: str = Field("chat", description="使用侧：chat、work、common")


class SkillSandboxPatchRequest(BaseModel):
    enabled: bool | None = None
    envs: dict[str, str] | None = None


class _DraftConfirmRequestBase(BaseModel):
    slugs: list[str] | None = Field(None, description="本次确认安装的 Skill slug")


class SkillDraftConfirmRequest(_DraftConfirmRequestBase):
    share_config: dict | None = Field(None, description="共享权限配置")


def _raise_from_value_error(exc: Exception) -> None:
    """技能失败只把错误码交给界面，不回传异常原文。"""
    if isinstance(exc, ApiError):
        raise HTTPException(status_code=exc.status, detail=exc.payload()) from exc
    logger.warning(f"技能请求未映射为错误码: {exc}")
    raise HTTPException(status_code=400, detail={"error_code": "skill_failed", "params": {}}) from exc


def _cleanup_export_file(path: str) -> None:
    try:
        Path(path).unlink(missing_ok=True)
    except Exception as e:
        logger.warning(f"Failed to cleanup exported skill archive '{path}': {e}")


def _summarize_results(results: list[dict]) -> dict[str, int]:
    return {
        "total": len(results),
        "success": sum(1 for item in results if item.get("success")),
        "failed": sum(1 for item in results if not item.get("success")),
    }


def _serialize_skill_for_user(item, user: User) -> dict:
    data = item.to_dict()
    data["can_manage"] = user_can_manage_skill(user, item)
    data["effective_permission"] = resolve_skill_permission(user, item).value
    data["builtin"] = is_builtin_skill(item)
    return data


@user_skills.get("")
async def list_skill_cards_route(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        items = await list_skill_cards_for_user(db, current_user)
        return {
            "success": True,
            "data": [_serialize_skill_for_user(item, current_user) for item in items],
            "allowed_access_levels": get_allowed_skill_access_levels(current_user),
        }
    except Exception as e:
        logger.error(f"Failed to list Skill cards: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.get("/sandbox-board")
async def skill_sandbox_board_route(
    _current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return {"success": True, "data": await list_skill_sandbox_board(db)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to list skill sandbox board: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.get("/sandbox-configs/{sandbox_config_id}/skills")
async def list_sandbox_config_skills_route(
    sandbox_config_id: str,
    _current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return {"success": True, "data": await list_config_skills(db, sandbox_config_id)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to list sandbox skills: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.patch("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}")
async def patch_sandbox_config_skill_route(
    sandbox_config_id: str,
    skill_id: str,
    payload: SkillSandboxPatchRequest,
    _current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        data = await patch_config_skill(
            db,
            sandbox_config_id=sandbox_config_id,
            skill_id=skill_id,
            enabled=payload.enabled,
            envs=payload.envs,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to update sandbox skill: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}/stop")
async def stop_sandbox_config_skill_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return {
            "success": True,
            "data": await stop_config_skill(db, sandbox_config_id=sandbox_config_id, skill_id=skill_id),
        }
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to stop sandbox skill: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}/reinstall")
async def retry_sandbox_config_skill_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await retry_config_skill(db, sandbox_config_id=sandbox_config_id, skill_id=skill_id)
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to retry sandbox skill: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.delete("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}")
async def remove_sandbox_config_skill_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await remove_config_skill(db, sandbox_config_id=sandbox_config_id, skill_id=skill_id)
        return {"success": True, "data": {"skill_id": skill_id}}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to remove sandbox skill: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.get("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}/messages")
async def sandbox_skill_messages_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        return {
            "success": True,
            "data": await list_skill_install_messages(
                db, sandbox_config_id=sandbox_config_id, skill_id=skill_id
            ),
        }
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to read sandbox skill messages: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.get("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}/transcript")
async def sandbox_skill_transcript_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        frames = await load_skill_transcript_frames(
            db, sandbox_config_id=sandbox_config_id, skill_id=skill_id
        )
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to read sandbox skill transcript: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})

    async def body():
        for frame in frames:
            yield f"event: message\ndata: {json.dumps(frame, ensure_ascii=False)}\n\n"

    return StreamingResponse(
        body(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@user_skills.get("/sandbox-configs/{sandbox_config_id}/skills/{skill_id}/guidance")
async def sandbox_skill_guidance_route(
    sandbox_config_id: str,
    skill_id: str,
    _current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await list_config_skills(db, sandbox_config_id)
        return {"success": True, "data": {"accepting": False, "messages": []}}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to read sandbox skill guidance: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.get("/accessible")
async def list_accessible_skills_route(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        items = await list_accessible_skills(db, current_user)
        return {"success": True, "data": [_serialize_skill_for_user(item, current_user) for item in items]}
    except Exception as e:
        logger.error(f"Failed to list accessible skills: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/import/prepare")
async def prepare_skill_upload_route(
    file: UploadFile = File(...),
    usage_source: str = Form("chat"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        data = await prepare_skill_upload(
            db,
            filename=file.filename or "",
            file_bytes=await file.read(),
            operator=current_user,
            usage_source=usage_source,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to prepare skill upload: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/remote/list")
async def list_remote_skills_route(payload: RemoteSkillSourceRequest, _current_user: User = Depends(get_required_user)):
    try:
        return {"success": True, "data": await list_remote_skills(payload.source)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to list remote skills from '{payload.source}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/remote/prepare")
async def prepare_remote_skills_route(
    payload: RemoteSkillPrepareRequest,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        data = await prepare_remote_skill_install(
            db,
            source=payload.source,
            skills=payload.skills,
            operator=current_user,
            usage_source=payload.usage_source,
        )
        return {"success": True, "data": data}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to prepare remote skills from '{payload.source}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@user_skills.post("/install-drafts/{draft_id}/confirm")
async def confirm_skill_install_draft_route(
    draft_id: str,
    payload: SkillDraftConfirmRequest,
    current_user: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        results = await confirm_skill_install_draft(
            db,
            draft_id=draft_id,
            share_config=payload.share_config,
            slugs=payload.slugs,
            operator=current_user,
        )
        return {"success": True, "data": results, "summary": _summarize_results(results)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to confirm skill install draft '{draft_id}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.get("")
async def list_skills_route(
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        items = await list_visible_skills_for_management(db, current_user)
        return {
            "success": True,
            "data": [_serialize_skill_for_user(item, current_user) for item in items],
            "allowed_access_levels": get_allowed_skill_access_levels(current_user),
        }
    except Exception as e:
        logger.error(f"Failed to list manageable skills: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.get("/dependency-options")
async def get_skill_dependency_options_route(
    slug: str | None = Query(None, description="当前 Skill slug"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        if slug:
            await get_management_readable_skill_or_raise(db, current_user, slug)
        return {"success": True, "data": await get_skill_dependency_options(db, current_user, slug)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to get skill dependency options: {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.put("/{slug}/enabled")
async def update_skill_enabled_route(
    slug: str,
    payload: SkillEnabledUpdateRequest,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        item = await update_skill_enabled(db, slug=slug, enabled=payload.enabled, operator=current_user)
        return {"success": True, "data": _serialize_skill_for_user(item, current_user)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to update skill enabled '{slug}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.get("/{slug}/tree")
async def get_skill_tree_route(
    slug: str,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_management_readable_skill_or_raise(db, current_user, slug)
        return {"success": True, "data": await get_skill_tree(db, slug)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to get skill tree '{slug}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.get("/{slug}/file")
async def get_skill_file_route(
    slug: str,
    path: str = Query(..., description="相对 skill 根目录路径"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_management_readable_skill_or_raise(db, current_user, slug)
        return {"success": True, "data": await read_skill_file(db, slug, path)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to read skill file '{slug}/{path}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.post("/{slug}/file")
async def create_skill_file_route(
    slug: str,
    payload: SkillNodeCreateRequest,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_manageable_skill_or_raise(db, current_user, slug)
        await create_skill_node(
            db,
            slug=slug,
            relative_path=payload.path,
            is_dir=payload.is_dir,
            content=payload.content,
            updated_by=current_user.uid,
        )
        return {"success": True}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to create skill node '{slug}/{payload.path}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.put("/{slug}/file")
async def update_skill_file_route(
    slug: str,
    payload: SkillFileUpdateRequest,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_manageable_skill_or_raise(db, current_user, slug)
        await update_skill_file(
            db,
            slug=slug,
            relative_path=payload.path,
            content=payload.content,
            updated_by=current_user.uid,
        )
        return {"success": True}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to update skill file '{slug}/{payload.path}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.put("/{slug}/dependencies")
async def update_skill_dependencies_route(
    slug: str,
    payload: SkillDependenciesUpdateRequest,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        item = await update_skill_dependencies(
            db,
            slug=slug,
            tool_dependencies=payload.tool_dependencies,
            mcp_dependencies=payload.mcp_dependencies,
            skill_dependencies=payload.skill_dependencies,
            operator=current_user,
        )
        return {"success": True, "data": _serialize_skill_for_user(item, current_user)}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to update skill dependencies '{slug}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.get("/{slug}/export")
async def export_skill_route(
    slug: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_manageable_skill_or_raise(db, current_user, slug)
        export_path, download_name = await export_skill_zip(db, slug)
        background_tasks.add_task(_cleanup_export_file, export_path)
        return FileResponse(path=export_path, media_type="application/zip", filename=download_name)
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to export skill '{slug}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})


@skills.delete("/{slug}")
async def delete_skill_route(
    slug: str,
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    try:
        await get_manageable_skill_or_raise(db, current_user, slug)
        await delete_skill(db, slug=slug)
        return {"success": True}
    except ValueError as e:
        _raise_from_value_error(e)
    except Exception as e:
        logger.error(f"Failed to delete skill '{slug}': {e}")
        raise HTTPException(status_code=500, detail={"error_code": "skill_failed", "params": {}})
