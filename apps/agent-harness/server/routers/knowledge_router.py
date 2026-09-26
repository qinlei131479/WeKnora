import asyncio
import os
import textwrap
import traceback
from urllib.parse import quote, unquote

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.responses import StreamingResponse
from yuxi import config
from yuxi.knowledge.chunking.ragflow_like.presets import get_chunk_preset_options
from yuxi.knowledge.parser.unified import SUPPORTED_FILE_EXTENSIONS
from yuxi.knowledge.runtime import knowledge_base
from yuxi.knowledge.utils import is_minio_url, parse_minio_url
from yuxi.knowledge.utils.mindmap_utils import (
    generate_database_mindmap,
    get_database_mindmap_data,
    get_mindmap_database_files,
    get_mindmap_databases_overview,
    get_mindmap_diff,
)
from yuxi.knowledge.utils.sample_question_utils import (
    generate_database_sample_questions,
    get_database_sample_questions,
)
from yuxi.permissions import (
    ResourcePermission,
    resolve_knowledge_base_permission,
)
from yuxi.storage.minio.client import StorageError, get_minio_client
from yuxi.storage.postgres.models_business import User
from yuxi.utils import logger

from server.utils.auth_middleware import get_admin_user, get_required_user
from server.utils.knowledge_response import serialize_knowledge_base, serialize_knowledge_base_list
from server.utils.knowledge_permissions import (
    require_knowledge_base_manage,
    require_knowledge_base_read,
)

knowledge = APIRouter(prefix="/knowledge", tags=["knowledge"])



class UpdateDatabaseRequest(BaseModel):
    name: str
    description: str
    llm_model_spec: str | None = None
    additional_params: dict | None = None
    share_config: dict | None = None




media_types = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".md": "text/markdown",
    ".json": "application/json",
    ".csv": "text/csv",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls": "application/vnd.ms-excel",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".ppt": "application/vnd.ms-powerpoint",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".bmp": "image/bmp",
    ".svg": "image/svg+xml",
    ".zip": "application/zip",
    ".rar": "application/x-rar-compressed",
    ".7z": "application/x-7z-compressed",
    ".tar": "application/x-tar",
    ".gz": "application/gzip",
    ".html": "text/html",
    ".htm": "text/html",
    ".xml": "text/xml",
    ".css": "text/css",
    ".js": "application/javascript",
    ".py": "text/x-python",
    ".java": "text/x-java-source",
    ".cpp": "text/x-c++src",
    ".c": "text/x-csrc",
    ".h": "text/x-chdr",
    ".hpp": "text/x-c++hdr",
}


async def _ensure_database_supports_documents(kb_id: str, operation: str) -> dict:
    db_info, supports_documents = await knowledge_base.get_database_document_support(kb_id)
    if not db_info:
        raise HTTPException(status_code=404, detail=f"知识库 {kb_id} 不存在")
    kb_type = db_info.kb_type.lower()
    if not supports_documents:
        raise HTTPException(status_code=400, detail=f"{db_info.name or kb_type} 只支持检索，不支持{operation}")
    return db_info


# =============================================================================
# === 知识库管理分组 ===
# =============================================================================


@knowledge.get("/databases")
async def get_databases(current_user: User = Depends(get_admin_user)):
    """获取所有知识库（根据用户权限过滤）"""
    try:
        return serialize_knowledge_base_list(await knowledge_base.get_databases_by_uid(current_user.uid))
    except Exception as e:
        logger.error(f"获取数据库列表失败 {e}, {traceback.format_exc()}")
        return {"message": f"获取数据库列表失败 {e}", "databases": []}


@knowledge.get("/databases/accessible")
async def get_accessible_databases(current_user: User = Depends(get_required_user)):
    """获取当前用户有权访问的知识库列表（用于智能体配置）"""
    try:
        databases = await knowledge_base.get_databases_by_uid(current_user.uid)

        accessible = [
            {
                "name": db.name,
                "kb_id": db.kb_id,
                "description": db.description or "",
                "created_by": db.created_by,
                "kb_type": db.kb_type,
                "supports_documents": knowledge_base.database_type_supports_documents(db.kb_type),
            }
            for db in databases
        ]

        return {"databases": accessible}
    except Exception as e:
        logger.error(f"获取可访问知识库列表失败: {e}, {traceback.format_exc()}")
        return {"message": f"获取可访问知识库列表失败: {str(e)}", "databases": []}


@knowledge.get("/mindmap/databases")
async def get_mindmap_databases(current_user: User = Depends(get_admin_user)):
    """获取所有知识库的概览信息，用于思维导图界面选择。"""
    try:
        return await get_mindmap_databases_overview(current_user.uid)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取知识库列表失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取知识库列表失败: {str(e)}")


@knowledge.get("/databases/{kb_id}/mindmap/files")
async def get_database_mindmap_files(kb_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取指定知识库的所有文件列表。"""
    try:
        return await get_mindmap_database_files(kb_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取文件列表失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取文件列表失败: {str(e)}")


@knowledge.post("/databases/{kb_id}/mindmap/generate")
async def generate_mindmap(
    kb_id: str,
    file_ids: list[str] | None = Body(default=None, description="选择的文件ID列表"),
    user_prompt: str = Body(default="", description="用户自定义提示词"),
    incremental: bool = Body(default=False, description="是否增量更新"),
    current_user: User = Depends(require_knowledge_base_manage),
):
    """使用 AI 分析知识库文件，生成思维导图结构。支持增量更新模式。"""
    try:
        return await generate_database_mindmap(kb_id, file_ids, user_prompt, incremental)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成思维导图失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"生成思维导图失败: {str(e)}")


@knowledge.get("/databases/{kb_id}/mindmap")
async def get_database_mindmap(kb_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取知识库关联的思维导图。"""
    try:
        return await get_database_mindmap_data(kb_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取知识库思维导图失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取知识库思维导图失败: {str(e)}")


@knowledge.get("/databases/{kb_id}/mindmap/diff")
async def get_mindmap_diff_route(kb_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """检测思维导图与知识库文件的变更差异。"""
    try:
        return await get_mindmap_diff(kb_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"检测思维导图变更失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"检测思维导图变更失败: {str(e)}")


@knowledge.get("/databases/{kb_id}")
async def get_database_info(
    kb_id: str,
    include_files: bool = Query(False, description="是否包含全量文件列表，默认关闭以避免大知识库响应过大"),
    current_user: User = Depends(require_knowledge_base_read),
):
    """获取知识库详细信息"""
    database = await knowledge_base.get_database_info(kb_id, include_files=include_files)
    if database is None:
        raise HTTPException(status_code=404, detail="Database not found")
    permission = resolve_knowledge_base_permission(current_user, database)
    return serialize_knowledge_base(
        database,
        permission=permission,
        redact_secrets=permission != ResourcePermission.MANAGE,
    )


@knowledge.put("/databases/{kb_id}")
async def update_database_info(
    kb_id: str,
    data: UpdateDatabaseRequest,
    current_user: User = Depends(require_knowledge_base_manage),
):
    """更新知识库信息"""
    logger.debug(
        f"[update_database_info] 接收到的参数: name={data.name}, llm_model_spec={data.llm_model_spec}, "
        f"additional_params={data.additional_params}, share_config={data.share_config}"
    )
    try:
        update_llm_model_spec = "llm_model_spec" in data.model_fields_set

        database = await knowledge_base.update_database(
            kb_id,
            data.name,
            data.description,
            data.llm_model_spec,
            update_llm_model_spec=update_llm_model_spec,
            additional_params=data.additional_params,
            share_config=data.share_config,
            operator_uid=current_user.uid,
            operator_department_id=current_user.department_id,
        )
        return {"message": "更新成功", "database": serialize_knowledge_base(database)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新数据库失败 {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=400, detail=f"更新数据库失败: {e}")


@knowledge.delete("/databases/{kb_id}")
async def delete_database(kb_id: str, current_user: User = Depends(require_knowledge_base_manage)):
    """原生知识库已删除；WeKnora 知识库请在 WeKnora 管理，不在此删除。"""
    del current_user
    raise HTTPException(status_code=404, detail=f"知识库 {kb_id} 不存在")


@knowledge.get("/databases/{kb_id}/export")
async def export_database(
    kb_id: str,
    format: str = Query("csv", enum=["csv", "xlsx", "md", "txt"]),
    include_vectors: bool = Query(False, description="是否在导出中包含向量数据"),
    current_user: User = Depends(require_knowledge_base_read),
):
    """导出知识库数据"""
    logger.debug(f"Exporting database {kb_id} with format {format}")
    try:
        file_path = await knowledge_base.export_data(kb_id, format=format, include_vectors=include_vectors)

        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Exported file not found.")

        media_type = media_types.get(f".{format}", "application/octet-stream")

        return FileResponse(path=file_path, filename=os.path.basename(file_path), media_type=media_type)
    except HTTPException:
        raise
    except NotImplementedError as e:
        logger.warning(f"A disabled feature was accessed: {e}")
        raise HTTPException(status_code=501, detail=str(e))
    except Exception as e:
        logger.error(f"导出数据库失败 {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"导出数据库失败: {e}")


# =============================================================================
# === 知识库文档管理分组 ===
# =============================================================================


@knowledge.get("/databases/{kb_id}/documents")
async def list_documents(
    kb_id: str,
    parent_id: str | None = Query(None, description="父文件夹 ID，空值表示根目录"),
    path_prefix: str | None = Query(None, description="路径型目录前缀，用于懒加载 source_path 形成的虚拟目录"),
    status: str = Query("all", description="文件状态筛选"),
    page: int = Query(1, ge=1, description="页码"),
    page_size: int = Query(100, ge=1, le=500, description="每页数量"),
    recursive: bool = Query(False, description="是否跨目录筛选"),
    current_user: User = Depends(require_knowledge_base_read),
):
    """分页获取知识库文件列表。"""
    await _ensure_database_supports_documents(kb_id, "文档查看")
    try:
        return await knowledge_base.list_document_files(
            kb_id,
            parent_id=parent_id,
            path_prefix=path_prefix,
            status=status,
            page=page,
            page_size=page_size,
            recursive=recursive,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@knowledge.get("/databases/{kb_id}/documents/search")
async def search_documents(
    kb_id: str,
    query: str = Query("", description="文件名关键词，仅匹配文件名不匹配内容"),
    offset: int = Query(0, ge=0, description="偏移量，从 0 开始"),
    limit: int = Query(100, ge=1, le=500, description="每页数量"),
    current_user: User = Depends(require_knowledge_base_read),
):
    """按文件名搜索知识库文件（仅匹配文件名，不搜索文件内容）。"""
    database = await knowledge_base.get_database_info(kb_id)
    if not database:
        raise HTTPException(status_code=404, detail=f"知识库 {kb_id} 不存在或无权访问")
    if not knowledge_base.database_type_supports_documents(database.kb_type):
        kb_type = database.kb_type.lower()
        raise HTTPException(status_code=400, detail=f"{database.name or kb_type} 只支持检索，不支持文档搜索")
    normalized_query = (query or "").strip()
    if not normalized_query:
        return {"files": [], "total": 0, "offset": 0, "limit": limit, "has_more": False}
    return await knowledge_base.search_document_files(
        [{"kb_id": database.kb_id, "name": database.name}],
        query=normalized_query,
        offset=offset,
        limit=limit,
        include_parent_id=True,
    )


@knowledge.get("/databases/{kb_id}/documents/exists")
async def document_file_exists(
    kb_id: str,
    filename: str = Query(..., min_length=1, description="知识库文件展示名或相对路径"),
    current_user: User = Depends(require_knowledge_base_read),
):
    """检查知识库中是否已存在指定文件名或相对路径的文件。"""
    await _ensure_database_supports_documents(kb_id, "文档存在性检查")
    normalized_filename = filename.strip()
    if not normalized_filename:
        raise HTTPException(status_code=400, detail="filename is required")
    try:
        exists = await knowledge_base.document_file_exists(kb_id, normalized_filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"kb_id": kb_id, "filename": normalized_filename, "exists": exists}


@knowledge.get("/databases/{kb_id}/documents/{doc_id}")
async def get_document_info(kb_id: str, doc_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取文档详细信息（包含基本信息和内容信息）"""
    logger.debug(f"GET document {doc_id} info in {kb_id}")
    await _ensure_database_supports_documents(kb_id, "文档查看")

    try:
        info = await knowledge_base.get_file_info(kb_id, doc_id)
        return info
    except Exception as e:
        logger.error(f"Failed to get file info, {e}, {kb_id=}, {doc_id=}, {traceback.format_exc()}")
        return {"message": "Failed to get file info", "status": "failed"}


@knowledge.get("/databases/{kb_id}/documents/{doc_id}/basic")
async def get_document_basic_info(kb_id: str, doc_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取文档基本信息（仅元数据）"""
    logger.debug(f"GET document {doc_id} basic info in {kb_id}")
    await _ensure_database_supports_documents(kb_id, "文档查看")

    try:
        info = await knowledge_base.get_file_basic_info(kb_id, doc_id)
        return info
    except Exception as e:
        logger.error(f"Failed to get file basic info, {e}, {kb_id=}, {doc_id=}, {traceback.format_exc()}")
        return {"message": "Failed to get file basic info", "status": "failed"}


@knowledge.get("/databases/{kb_id}/documents/{doc_id}/content")
async def get_document_content(kb_id: str, doc_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取文档内容信息（chunks和lines）"""
    logger.debug(f"GET document {doc_id} content in {kb_id}")
    await _ensure_database_supports_documents(kb_id, "文档查看")

    try:
        info = await knowledge_base.get_file_content(kb_id, doc_id)
        internal_graph_fields = {"ent_id", "ent_ids", "extraction_result"}
        info["lines"] = [
            {key: value for key, value in line.items() if key not in internal_graph_fields}
            for line in info.get("lines", [])
        ]
        return info
    except Exception as e:
        logger.error(f"Failed to get file content, {e}, {kb_id=}, {doc_id=}, {traceback.format_exc()}")
        return {"message": "Failed to get file content", "status": "failed"}


@knowledge.get("/databases/{kb_id}/documents/{doc_id}/download")
async def download_document(kb_id: str, doc_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """下载原始文件"""
    logger.debug(f"Download document {doc_id} from {kb_id}")
    await _ensure_database_supports_documents(kb_id, "文档下载")
    try:
        file_info = await knowledge_base.get_file_basic_info(kb_id, doc_id)
        file_meta = file_info.get("meta", {})

        # 获取文件类型、路径和文件名
        file_type = file_meta.get("file_type", "file")
        file_path = file_meta.get("path", "")
        filename = file_meta.get("filename", "file")

        # URL 类型文件没有原始文件可下载
        if file_type == "url":
            raise HTTPException(status_code=400, detail="URL 类型文件不支持下载原始文件")
        logger.debug(f"File path from database: {file_path}")
        logger.debug(f"Original filename from database: {filename}")

        # 解码URL编码的文件名（如果有的话）
        try:
            decoded_filename = unquote(filename, encoding="utf-8")
            logger.debug(f"Decoded filename: {decoded_filename}")
        except Exception as e:
            logger.debug(f"Failed to decode filename {filename}: {e}")
            decoded_filename = filename  # 如果解码失败，使用原文件名

        _, ext = os.path.splitext(decoded_filename)
        media_type = media_types.get(ext.lower(), "application/octet-stream")

        if not is_minio_url(file_path):
            raise HTTPException(status_code=400, detail="文件路径必须是 MinIO URL")

        logger.debug(f"Downloading from MinIO: {file_path}")

        try:
            bucket_name, object_name = parse_minio_url(file_path)
            logger.debug(f"Parsed bucket_name: {bucket_name}, object_name: {object_name}")

            minio_client = get_minio_client()

            # 直接使用解析出的完整对象名称下载
            minio_response = await minio_client.adownload_response(
                bucket_name=bucket_name,
                object_name=object_name,
            )
            logger.debug(f"Successfully downloaded object: {object_name}")

        except Exception as e:
            logger.error(f"Failed to download MinIO file: {e}")
            raise StorageError(f"下载文件失败: {e}")

        # 创建流式生成器
        async def minio_stream():
            try:
                while True:
                    chunk = await asyncio.to_thread(minio_response.read, 8192)
                    if not chunk:
                        break
                    yield chunk
            finally:
                minio_response.close()
                minio_response.release_conn()

        response = StreamingResponse(
            minio_stream(),
            media_type=media_type,
        )
        try:
            decoded_filename.encode("ascii")
            response.headers["Content-Disposition"] = f'attachment; filename="{decoded_filename}"'
        except UnicodeEncodeError:
            encoded_filename = quote(decoded_filename.encode("utf-8"))
            response.headers["Content-Disposition"] = f"attachment; filename*=UTF-8''{encoded_filename}"

        return response

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"下载文件失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"下载失败: {e}")


# =============================================================================
# === 知识库查询分组 ===
# =============================================================================


@knowledge.post("/databases/{kb_id}/query")
async def query_knowledge_base(
    kb_id: str,
    query: str = Body(...),
    meta: dict = Body(...),
    current_user: User = Depends(require_knowledge_base_read),
):
    """查询知识库"""
    logger.debug(f"Query knowledge base {kb_id}: {query}")
    try:
        result = await knowledge_base.aquery(query, kb_id=kb_id, **meta)
        return {"result": result, "status": "success"}
    except Exception as e:
        logger.error(f"知识库查询失败 {e}, {traceback.format_exc()}")
        return {"message": f"知识库查询失败: {e}", "status": "failed"}


@knowledge.post("/databases/{kb_id}/query-test")
async def query_test(
    kb_id: str,
    query: str = Body(...),
    meta: dict = Body(...),
    current_user: User = Depends(require_knowledge_base_read),
):
    """测试查询知识库"""
    logger.debug(f"Query test in {kb_id}: {query}")
    try:
        result = await knowledge_base.aquery(query, kb_id=kb_id, **meta)
        return result
    except Exception as e:
        logger.error(f"测试查询失败 {e}, {traceback.format_exc()}")
        return {"message": f"测试查询失败: {e}", "status": "failed"}


@knowledge.get("/databases/{kb_id}/query-params")
async def get_knowledge_base_query_params(kb_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取知识库类型特定的查询参数"""
    try:
        params = await knowledge_base.get_kb_query_params_config(kb_id)
        return {"params": params, "message": "success"}

    except Exception as e:
        logger.error(f"获取知识库查询参数失败 {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=str(e))


# =============================================================================
# === AI生成示例问题 ===
# =============================================================================


@knowledge.post("/databases/{kb_id}/sample-questions")
async def generate_sample_questions(
    kb_id: str,
    request_body: dict = Body(...),
    current_user: User = Depends(require_knowledge_base_manage),
):
    """AI生成针对知识库的测试问题。"""
    try:
        count = request_body.get("count", 10)
        return await generate_database_sample_questions(kb_id, count=count)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"生成知识库问题失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"生成问题失败: {str(e)}")


@knowledge.get("/databases/{kb_id}/sample-questions")
async def get_sample_questions(kb_id: str, current_user: User = Depends(require_knowledge_base_read)):
    """获取知识库的测试问题。"""
    try:
        return await get_database_sample_questions(kb_id)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取知识库问题失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"获取问题失败: {str(e)}")


# =============================================================================
# === 文件管理分组 ===
# =============================================================================


@knowledge.get("/files/supported-types")
async def get_supported_file_types(current_user: User = Depends(get_admin_user)):
    """获取当前支持的文件类型"""
    return {"message": "success", "file_types": sorted(SUPPORTED_FILE_EXTENSIONS)}


@knowledge.get("/types")
async def get_knowledge_base_types(current_user: User = Depends(get_admin_user)):
    """获取支持的知识库类型"""
    try:
        kb_types = knowledge_base.get_supported_kb_types()
        return {"kb_types": kb_types, "message": "success"}
    except Exception as e:
        logger.error(f"获取知识库类型失败 {e}, {traceback.format_exc()}")
        return {"message": f"获取知识库类型失败 {e}", "kb_types": {}}


@knowledge.get("/chunk-presets")
async def get_knowledge_chunk_presets(current_user: User = Depends(get_admin_user)):
    """获取支持的知识库分块策略"""
    return {"chunk_presets": get_chunk_preset_options(), "message": "success"}


@knowledge.get("/stats")
async def get_knowledge_base_statistics(current_user: User = Depends(get_admin_user)):
    """获取知识库统计信息"""
    try:
        stats = await knowledge_base.get_statistics()
        return {"stats": stats, "message": "success"}
    except Exception as e:
        logger.error(f"获取知识库统计失败 {e}, {traceback.format_exc()}")
        return {"message": f"获取知识库统计失败 {e}", "stats": {}}


# =============================================================================
# === 知识库 AI 辅助功能分组 ===
# =============================================================================


@knowledge.post("/generate-description")
async def generate_description(
    name: str = Body(..., description="知识库名称"),
    current_description: str = Body("", description="当前描述（可选，用于优化）"),
    file_list: list[str] | None = Body(None, description="文件列表"),
    current_user: User = Depends(get_admin_user),
):
    """使用 LLM 生成或优化知识库描述

    根据知识库名称和现有描述，使用 LLM 生成适合作为智能体工具描述的内容。
    """
    from yuxi.models import select_model

    file_list = file_list or []
    logger.debug(f"Generating description for knowledge base: {name}, files: {len(file_list)}")

    # 构建文件列表文本
    if file_list:
        # 限制文件数量，避免 prompt 过长
        display_files = file_list[:50]
        files_str = "\n".join([f"- {f}" for f in display_files])
        more_text = f"\n... (还有 {len(file_list) - 50} 个文件)" if len(file_list) > 50 else ""
        current_description += f"\n\n知识库包含的文件:\n{files_str}{more_text}"

    current_description = current_description or "暂无描述"

    # 构建提示词
    prompt = textwrap.dedent(f"""
        请帮我优化以下知识库的描述。

        知识库名称: {name}
        当前描述: {current_description}

        要求:
        1. 这个描述将作为智能体工具的描述使用
        2. 智能体会根据知识库的标题和描述来选择合适的工具
        3. 所以描述需要清晰、具体，说明该知识库包含什么内容、适合解答什么类型的问题
        4. 描述应该简洁有力，通常 2-4 句话即可
        5. 不要使用 Markdown 格式
        {"6. 请参考提供的文件列表来准确概括知识库内容" if file_list else ""}

        请直接输出优化后的描述，不要有任何前缀说明。
    """).strip()

    try:
        model = select_model(model_spec=config.default_model)
        response = await model.call(prompt)
        description = response.content.strip()
        logger.debug(f"Generated description: {description}")
        return {"description": description, "status": "success"}
    except Exception as e:
        logger.error(f"生成描述失败: {e}, {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"生成描述失败: {e}")
