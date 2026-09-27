"""Viewer 文件系统路由

提供 Viewer UI 使用的文件系统 API 端点。
- /viewer/filesystem/* - Viewer UI 使用
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from server.utils.auth_middleware import get_db, get_required_user
from yuxi.services.viewer_filesystem_service import (
    delete_viewer_file,
    download_viewer_file,
    list_viewer_filesystem_tree,
    read_viewer_file_content,
)
from yuxi.storage.postgres.models_business import User

filesystem_router = APIRouter(prefix="/viewer/filesystem", tags=["viewer-filesystem"])


@filesystem_router.get("/tree", response_model=dict)
async def get_viewer_tree(
    thread_id: str = Query(..., description="线程 ID"),
    path: str = Query("/", description="目录路径"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    return await list_viewer_filesystem_tree(
        thread_id=thread_id,
        path=path,
        current_user=current_user,
        db=db,
    )


@filesystem_router.get("/file")
async def get_viewer_file(
    thread_id: str = Query(..., description="线程 ID"),
    path: str = Query(..., description="文件路径"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    return await read_viewer_file_content(
        thread_id=thread_id,
        path=path,
        current_user=current_user,
        db=db,
    )


@filesystem_router.delete("/file", response_model=dict)
async def delete_viewer_file_route(
    thread_id: str = Query(..., description="线程 ID"),
    path: str = Query(..., description="文件路径"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    return await delete_viewer_file(
        thread_id=thread_id,
        path=path,
        current_user=current_user,
        db=db,
    )


@filesystem_router.get("/download")
async def download_viewer(
    thread_id: str = Query(..., description="线程 ID"),
    path: str = Query(..., description="文件路径"),
    current_user: User = Depends(get_required_user),
    db: AsyncSession = Depends(get_db),
):
    return await download_viewer_file(
        thread_id=thread_id,
        path=path,
        current_user=current_user,
        db=db,
    )
