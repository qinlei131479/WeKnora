-- Migration: 000081_schema_comments
-- Description: PostgreSQL 目录注释全量补充（COMMENT ON TABLE/COLUMN）。
--              不含任何结构变更；幂等，可重复执行以覆盖文案。
--              列清单按 versioned 迁移最终态生成（已扣减 DROP COLUMN）。
--              通过 pg_temp 辅助函数跳过不存在的表/列，避免目录漂移导致迁移失败。
--              SQLite 不在此迁移范围内。

DO $$ BEGIN RAISE NOTICE '[Migration 000081] Applying schema catalog comments...'; END $$;

-- Guard: skip missing relations/columns so catalog drift does not fail the migration.
CREATE OR REPLACE FUNCTION pg_temp.weknora_comment_table(p_table text, p_comment text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(format('%I', p_table)) IS NULL THEN
    RAISE NOTICE 'skip COMMENT ON TABLE % (missing)', p_table;
    RETURN;
  END IF;
  EXECUTE format('COMMENT ON TABLE %I IS %L', p_table, p_comment);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.weknora_comment_column(p_table text, p_column text, p_comment text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(format('%I', p_table)) IS NULL THEN
    RAISE NOTICE 'skip COMMENT ON COLUMN %.% (table missing)', p_table, p_column;
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = p_table AND column_name = p_column
  ) THEN
    RAISE NOTICE 'skip COMMENT ON COLUMN %.% (column missing)', p_table, p_column;
    RETURN;
  END IF;
  EXECUTE format('COMMENT ON COLUMN %I.%I IS %L', p_table, p_column, p_comment);
END;
$$;

-- ========== tenants ==========
SELECT pg_temp.weknora_comment_table('tenants', '工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置');
SELECT pg_temp.weknora_comment_column('tenants', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('tenants', 'name', '工作空间名称');
SELECT pg_temp.weknora_comment_column('tenants', 'description', '工作空间描述');
SELECT pg_temp.weknora_comment_column('tenants', 'retriever_engines', '检索引擎配置列表（JSONB）');
SELECT pg_temp.weknora_comment_column('tenants', 'status', '工作空间状态（如 active）');
SELECT pg_temp.weknora_comment_column('tenants', 'business', '业务标识');
SELECT pg_temp.weknora_comment_column('tenants', 'storage_quota', '存储配额（字节）');
SELECT pg_temp.weknora_comment_column('tenants', 'storage_used', '已用存储（字节）');
SELECT pg_temp.weknora_comment_column('tenants', 'agent_config', '智能体相关配置或会话最近请求状态（历史列名复用）');
SELECT pg_temp.weknora_comment_column('tenants', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenants', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('tenants', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('tenants', 'context_config', '全局上下文管理配置（会话默认）');
SELECT pg_temp.weknora_comment_column('tenants', 'conversation_config', '全局对话配置（普通模式会话默认）');
SELECT pg_temp.weknora_comment_column('tenants', 'web_search_config', '全局联网搜索配置');
SELECT pg_temp.weknora_comment_column('tenants', 'parser_engine_config', '解析引擎覆盖配置（如 MinerU），覆盖环境变量');
SELECT pg_temp.weknora_comment_column('tenants', 'storage_engine_config', '存储引擎配置（Local/MinIO/COS 等）');
SELECT pg_temp.weknora_comment_column('tenants', 'chat_history_config', '会话历史写入知识库并向量检索的配置');
SELECT pg_temp.weknora_comment_column('tenants', 'retrieval_config', '全局检索参数（知识检索与消息检索共用）');
SELECT pg_temp.weknora_comment_column('tenants', 'credentials', '凭证配置（JSON，通常加密）');
SELECT pg_temp.weknora_comment_column('tenants', 'api_principal_config', 'X-API-Key 映射到终端主体的策略配置');
SELECT pg_temp.weknora_comment_column('tenants', 'default_storage_backend_id', '工作空间默认存储后端 ID');

-- ========== models ==========
SELECT pg_temp.weknora_comment_table('models', '模型实例表：嵌入/对话/重排/VLM/ASR 等，按租户隔离；内置模型对全租户可见');
SELECT pg_temp.weknora_comment_column('models', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('models', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('models', 'name', '模型名称（运行时调用标识）');
SELECT pg_temp.weknora_comment_column('models', 'display_name', '展示名称（运行时调用仍用 name）');
SELECT pg_temp.weknora_comment_column('models', 'type', '模型类型（KnowledgeQA/Embedding/Rerank/VLM/ASR 等）');
SELECT pg_temp.weknora_comment_column('models', 'source', '模型来源（本地/云厂商等）');
SELECT pg_temp.weknora_comment_column('models', 'description', '模型说明');
SELECT pg_temp.weknora_comment_column('models', 'parameters', '参数（JSON，敏感字段可能加密）');
SELECT pg_temp.weknora_comment_column('models', 'is_default', '是否为默认项');
SELECT pg_temp.weknora_comment_column('models', 'status', '状态：active/downloading/download_failed 等');
SELECT pg_temp.weknora_comment_column('models', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('models', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('models', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('models', 'is_builtin', '是否内置（全局可见或系统预置）');
SELECT pg_temp.weknora_comment_column('models', 'managed_by', '生命周期管理者；空=手工，yaml=内置清单');

-- ========== knowledge_bases ==========
SELECT pg_temp.weknora_comment_table('knowledge_bases', '知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'name', '知识库名称');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'description', '知识库描述');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'chunking_config', '分块配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'image_processing_config', '图片处理配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'embedding_model_id', '嵌入模型 ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'summary_model_id', '摘要模型 ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'cos_config', '遗留存储配置列（JSON）；兼容旧数据，新逻辑优先 storage_backend_id');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'vlm_config', '视觉语言模型配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'extract_config', '信息抽取配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'is_temporary', '是否临时知识库（UI 通常隐藏）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'type', '知识库类型（document/faq/wiki 等）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'faq_config', 'FAQ 专用配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'question_generation_config', '问题生成配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'storage_provider_config', '知识库存储提供商选择；凭证来自租户 StorageEngineConfig');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'is_pinned', '是否置顶');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'pinned_at', '置顶时间；未置顶时为空');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'asr_config', '语音识别（ASR）配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'vector_store_id', '绑定的向量库实例 ID（创建后通常不可改）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'wiki_config', 'Wiki 类型知识库配置');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'indexing_strategy', '索引管线开关（向量/关键词/Wiki/知识图谱等）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'creator_id', '创建者用户 ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'storage_backend_id', '绑定的存储后端实例 ID');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'auto_tag_config', '解析后异步关联已有标签的配置');

-- ========== knowledges ==========
SELECT pg_temp.weknora_comment_table('knowledges', '知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径');
SELECT pg_temp.weknora_comment_column('knowledges', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('knowledges', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('knowledges', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('knowledges', 'type', '知识类型（document/faq/manual/url 等）');
SELECT pg_temp.weknora_comment_column('knowledges', 'title', '知识标题');
SELECT pg_temp.weknora_comment_column('knowledges', 'description', '知识描述');
SELECT pg_temp.weknora_comment_column('knowledges', 'source', '知识来源（URL 或 manual 等）');
SELECT pg_temp.weknora_comment_column('knowledges', 'parse_status', '解析状态（pending/processing/finalizing/completed/failed/cancelled 等）');
SELECT pg_temp.weknora_comment_column('knowledges', 'enable_status', '启用状态');
SELECT pg_temp.weknora_comment_column('knowledges', 'embedding_model_id', '嵌入模型 ID');
SELECT pg_temp.weknora_comment_column('knowledges', 'file_name', '文件名（不含目录；目录见 folder_path）');
SELECT pg_temp.weknora_comment_column('knowledges', 'file_type', '文件类型');
SELECT pg_temp.weknora_comment_column('knowledges', 'file_size', '文件大小（字节）');
SELECT pg_temp.weknora_comment_column('knowledges', 'file_path', '文件存储路径');
SELECT pg_temp.weknora_comment_column('knowledges', 'file_hash', '文件内容哈希');
SELECT pg_temp.weknora_comment_column('knowledges', 'storage_size', '占用存储大小（字节）');
SELECT pg_temp.weknora_comment_column('knowledges', 'metadata', '元数据（JSON）');
SELECT pg_temp.weknora_comment_column('knowledges', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('knowledges', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('knowledges', 'processed_at', '处理完成时间');
SELECT pg_temp.weknora_comment_column('knowledges', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('knowledges', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('knowledges', 'summary_status', '摘要异步任务状态');
SELECT pg_temp.weknora_comment_column('knowledges', 'last_faq_import_result', '最近一次 FAQ 导入结果');
SELECT pg_temp.weknora_comment_column('knowledges', 'channel', '来源渠道（web/api/im 等）');
SELECT pg_temp.weknora_comment_column('knowledges', 'pending_subtasks_count', '富化子任务未完成计数（finalizing 时有意义）');
SELECT pg_temp.weknora_comment_column('knowledges', 'custom_metadata', '用户可读的自定义元数据（与内部 metadata 分离）');
SELECT pg_temp.weknora_comment_column('knowledges', 'folder_path', '知识库内相对目录路径；空表示根目录（仅导航，非物理路径）');

-- ========== sessions ==========
SELECT pg_temp.weknora_comment_table('sessions', '对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）');
SELECT pg_temp.weknora_comment_column('sessions', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('sessions', 'title', '会话标题');
SELECT pg_temp.weknora_comment_column('sessions', 'description', '会话描述');
SELECT pg_temp.weknora_comment_column('sessions', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'max_rounds', '会话最大轮次限制');
SELECT pg_temp.weknora_comment_column('sessions', 'enable_rewrite', '是否启用查询改写');
SELECT pg_temp.weknora_comment_column('sessions', 'fallback_strategy', '无命中时的兜底策略');
SELECT pg_temp.weknora_comment_column('sessions', 'fallback_response', '兜底回复文案');
SELECT pg_temp.weknora_comment_column('sessions', 'keyword_threshold', '关键词检索分数阈值');
SELECT pg_temp.weknora_comment_column('sessions', 'vector_threshold', '向量检索分数阈值');
SELECT pg_temp.weknora_comment_column('sessions', 'rerank_model_id', '重排模型 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'embedding_top_k', '向量检索返回条数 TopK');
SELECT pg_temp.weknora_comment_column('sessions', 'rerank_top_k', '重排后保留条数 TopK');
SELECT pg_temp.weknora_comment_column('sessions', 'rerank_threshold', '重排分数阈值');
SELECT pg_temp.weknora_comment_column('sessions', 'summary_model_id', '摘要模型 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'summary_parameters', '摘要相关参数（JSON）');
SELECT pg_temp.weknora_comment_column('sessions', 'agent_config', '最近一次提问栏状态（选用的智能体/模型/知识范围/联网/MCP 等）；历史列名');
SELECT pg_temp.weknora_comment_column('sessions', 'context_config', '全局上下文管理配置（会话默认）');
SELECT pg_temp.weknora_comment_column('sessions', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('sessions', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('sessions', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('sessions', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'user_id', '会话归属主体（WeKnora 用户 UUID、API 外部用户或嵌入访客等）');
SELECT pg_temp.weknora_comment_column('sessions', 'is_pinned', 'is pinned');
SELECT pg_temp.weknora_comment_column('sessions', 'pinned_at', 'pinned at');

-- ========== messages ==========
SELECT pg_temp.weknora_comment_table('messages', '会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文');
SELECT pg_temp.weknora_comment_column('messages', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('messages', 'request_id', '请求追踪 ID');
SELECT pg_temp.weknora_comment_column('messages', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('messages', 'role', '消息角色：user/assistant/system');
SELECT pg_temp.weknora_comment_column('messages', 'content', '正文内容');
SELECT pg_temp.weknora_comment_column('messages', 'knowledge_references', '回答引用的知识分块');
SELECT pg_temp.weknora_comment_column('messages', 'agent_steps', 'Agent 执行步骤（仅展示，不进 LLM 上下文）');
SELECT pg_temp.weknora_comment_column('messages', 'is_completed', '是否已完成生成');
SELECT pg_temp.weknora_comment_column('messages', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('messages', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('messages', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('messages', 'mentioned_items', '用户 @ 提及的知识库/文件');
SELECT pg_temp.weknora_comment_column('messages', 'is_fallback', '是否为无知识命中时的兜底回复');
SELECT pg_temp.weknora_comment_column('messages', 'agent_duration_ms', 'Agent 执行耗时（毫秒）');
SELECT pg_temp.weknora_comment_column('messages', 'knowledge_id', '知识条目 ID');
SELECT pg_temp.weknora_comment_column('messages', 'images', '用户消息附带图片及 OCR/描述');
SELECT pg_temp.weknora_comment_column('messages', 'channel', '来源渠道（web/api/im 等）');
SELECT pg_temp.weknora_comment_column('messages', 'rendered_content', '送入 LLM 的完整 RAG 增强用户消息');
SELECT pg_temp.weknora_comment_column('messages', 'attachments', '用户消息附件');
SELECT pg_temp.weknora_comment_column('messages', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('messages', 'agent_tenant_id', 'agent tenant id');
SELECT pg_temp.weknora_comment_column('messages', 'model_id', 'model id');
SELECT pg_temp.weknora_comment_column('messages', 'execution_context', 'execution context');

-- ========== chunks ==========
SELECT pg_temp.weknora_comment_table('chunks', '知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头');
SELECT pg_temp.weknora_comment_column('chunks', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'tenant_id', '租户 ID（多租户隔离）');
SELECT pg_temp.weknora_comment_column('chunks', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'knowledge_id', '知识条目 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'content', '正文内容');
SELECT pg_temp.weknora_comment_column('chunks', 'chunk_index', '在原文档中的分块序号');
SELECT pg_temp.weknora_comment_column('chunks', 'is_enabled', '该版本/条目是否启用');
SELECT pg_temp.weknora_comment_column('chunks', 'start_at', '原文起始字符位置');
SELECT pg_temp.weknora_comment_column('chunks', 'end_at', '原文结束字符位置');
SELECT pg_temp.weknora_comment_column('chunks', 'pre_chunk_id', '上一分块 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'next_chunk_id', '下一分块 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'chunk_type', '分块类型');
SELECT pg_temp.weknora_comment_column('chunks', 'parent_chunk_id', '父分块 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'image_info', '图片信息（JSON）');
SELECT pg_temp.weknora_comment_column('chunks', 'relation_chunks', '关联分块 ID 集合');
SELECT pg_temp.weknora_comment_column('chunks', 'indirect_relation_chunks', '间接关联分块 ID 集合');
SELECT pg_temp.weknora_comment_column('chunks', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('chunks', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('chunks', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('chunks', 'metadata', '元数据（JSON）');
SELECT pg_temp.weknora_comment_column('chunks', 'tag_id', '标签 ID');
SELECT pg_temp.weknora_comment_column('chunks', 'status', '分块业务状态');
SELECT pg_temp.weknora_comment_column('chunks', 'content_hash', '内容哈希');
SELECT pg_temp.weknora_comment_column('chunks', 'flags', '位标志集合（如推荐状态）；默认含推荐位');
SELECT pg_temp.weknora_comment_column('chunks', 'seq_id', '对外自增序号（API 友好）');
SELECT pg_temp.weknora_comment_column('chunks', 'video_info', '视频信息（JSON）');
SELECT pg_temp.weknora_comment_column('chunks', 'source_content', '解析器原始输出（不可变）；旧数据可能在首次编辑时回填');
SELECT pg_temp.weknora_comment_column('chunks', 'content_revision', '用户编辑/回滚导致的内容修订号');
SELECT pg_temp.weknora_comment_column('chunks', 'index_status', '检索索引同步状态（ready/processing/failed）');
SELECT pg_temp.weknora_comment_column('chunks', 'last_editor_id', '当前版本编辑者；流水线可为空');
SELECT pg_temp.weknora_comment_column('chunks', 'context_header', '索引时前置的 Markdown 标题面包屑');

-- ========== users ==========
SELECT pg_temp.weknora_comment_table('users', '用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好');
SELECT pg_temp.weknora_comment_column('users', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('users', 'username', '用户名');
SELECT pg_temp.weknora_comment_column('users', 'email', '登录邮箱');
SELECT pg_temp.weknora_comment_column('users', 'password_hash', '密码哈希');
SELECT pg_temp.weknora_comment_column('users', 'avatar', '头像/图标');
SELECT pg_temp.weknora_comment_column('users', 'tenant_id', '用户默认/归属工作空间 ID');
SELECT pg_temp.weknora_comment_column('users', 'is_active', '是否激活');
SELECT pg_temp.weknora_comment_column('users', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('users', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('users', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('users', 'can_access_all_tenants', '是否可访问全部工作空间');
SELECT pg_temp.weknora_comment_column('users', 'preferences', '用户偏好（JSONB，如记忆开关等）');
SELECT pg_temp.weknora_comment_column('users', 'is_system_admin', '是否系统管理员（独立于租户角色）');

-- ========== auth_tokens ==========
SELECT pg_temp.weknora_comment_table('auth_tokens', '用户认证令牌（access/refresh），支持吊销与过期');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'token', '令牌原文（JWT 等）');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'token_type', '令牌类型（access_token/refresh_token）');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'is_revoked', '是否已吊销');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('auth_tokens', 'updated_at', '最后更新时间');

-- ========== knowledge_tags ==========
SELECT pg_temp.weknora_comment_table('knowledge_tags', '知识库内标签定义（名称/颜色/排序），FAQ 等分类用');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'name', '标签名称（知识库内唯一）');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'color', '展示颜色');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'sort_order', '同级排序权重');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('knowledge_tags', 'seq_id', '对外自增序号（API 友好）');

-- ========== mcp_services ==========
SELECT pg_temp.weknora_comment_table('mcp_services', 'MCP 服务配置：传输方式、鉴权、stdio/HTTP 等连接参数');
SELECT pg_temp.weknora_comment_column('mcp_services', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('mcp_services', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('mcp_services', 'name', 'MCP 服务名称（租户内唯一）');
SELECT pg_temp.weknora_comment_column('mcp_services', 'description', 'MCP 服务说明');
SELECT pg_temp.weknora_comment_column('mcp_services', 'enabled', '是否启用该 MCP 服务');
SELECT pg_temp.weknora_comment_column('mcp_services', 'transport_type', '传输类型');
SELECT pg_temp.weknora_comment_column('mcp_services', 'url', 'URL 地址');
SELECT pg_temp.weknora_comment_column('mcp_services', 'headers', 'HTTP 请求头（JSON）');
SELECT pg_temp.weknora_comment_column('mcp_services', 'auth_config', '鉴权配置（JSON）');
SELECT pg_temp.weknora_comment_column('mcp_services', 'advanced_config', '高级配置（JSON）');
SELECT pg_temp.weknora_comment_column('mcp_services', 'stdio_config', 'stdio 传输配置');
SELECT pg_temp.weknora_comment_column('mcp_services', 'env_vars', 'stdio 环境变量');
SELECT pg_temp.weknora_comment_column('mcp_services', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('mcp_services', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('mcp_services', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('mcp_services', 'is_builtin', '是否内置（全局可见或系统预置）');

-- ========== embeddings ==========
SELECT pg_temp.weknora_comment_table('embeddings', 'Postgres 侧向量嵌入存储（仅当检索驱动包含 postgres 时使用）');
SELECT pg_temp.weknora_comment_column('embeddings', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('embeddings', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('embeddings', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('embeddings', 'source_id', '嵌入来源对象 ID（如 chunk）');
SELECT pg_temp.weknora_comment_column('embeddings', 'source_type', '嵌入来源类型');
SELECT pg_temp.weknora_comment_column('embeddings', 'chunk_id', '所属分块');
SELECT pg_temp.weknora_comment_column('embeddings', 'knowledge_id', '所属知识条目');
SELECT pg_temp.weknora_comment_column('embeddings', 'knowledge_base_id', '所属知识库');
SELECT pg_temp.weknora_comment_column('embeddings', 'content', '正文内容');
SELECT pg_temp.weknora_comment_column('embeddings', 'dimension', '向量维度');
SELECT pg_temp.weknora_comment_column('embeddings', 'embedding', '向量数据');
SELECT pg_temp.weknora_comment_column('embeddings', 'is_enabled', '该版本/条目是否启用');
SELECT pg_temp.weknora_comment_column('embeddings', 'tag_id', '标签 ID');

-- ========== custom_agents ==========
SELECT pg_temp.weknora_comment_table('custom_agents', '自定义/内置智能体配置（与租户组成复合主键）');
SELECT pg_temp.weknora_comment_column('custom_agents', 'id', '智能体 ID；内置为 builtin-*，自定义为 UUID');
SELECT pg_temp.weknora_comment_column('custom_agents', 'name', '智能体名称');
SELECT pg_temp.weknora_comment_column('custom_agents', 'description', '智能体说明');
SELECT pg_temp.weknora_comment_column('custom_agents', 'avatar', '头像/图标');
SELECT pg_temp.weknora_comment_column('custom_agents', 'is_builtin', '是否内置（全局可见或系统预置）');
SELECT pg_temp.weknora_comment_column('custom_agents', 'tenant_id', '与 id 组成复合主键的租户 ID');
SELECT pg_temp.weknora_comment_column('custom_agents', 'created_by', '创建者用户 ID');
SELECT pg_temp.weknora_comment_column('custom_agents', 'config', '智能体完整配置（JSONB）');
SELECT pg_temp.weknora_comment_column('custom_agents', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('custom_agents', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('custom_agents', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('custom_agents', 'runnable_by_viewer', '只读共享权限下是否允许运行该智能体');

-- ========== organizations ==========
SELECT pg_temp.weknora_comment_table('organizations', '组织（空间联盟）：邀请码、审批、成员上限与可搜索性');
SELECT pg_temp.weknora_comment_column('organizations', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('organizations', 'name', '组织名称');
SELECT pg_temp.weknora_comment_column('organizations', 'description', '组织描述');
SELECT pg_temp.weknora_comment_column('organizations', 'owner_id', '所有者用户 ID');
SELECT pg_temp.weknora_comment_column('organizations', 'invite_code', '加入组织的邀请码');
SELECT pg_temp.weknora_comment_column('organizations', 'require_approval', '加入是否需要审批');
SELECT pg_temp.weknora_comment_column('organizations', 'invite_code_expires_at', '当前邀请码过期时间；空表示不过期');
SELECT pg_temp.weknora_comment_column('organizations', 'invite_code_validity_days', '邀请链接有效天数：0=永久，或 1/7/30');
SELECT pg_temp.weknora_comment_column('organizations', 'avatar', '头像/图标');
SELECT pg_temp.weknora_comment_column('organizations', 'searchable', '是否可被搜索发现');
SELECT pg_temp.weknora_comment_column('organizations', 'member_limit', '成员上限；0 表示不限制');
SELECT pg_temp.weknora_comment_column('organizations', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('organizations', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('organizations', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('organizations', 'owner_tenant_id', '创建时所有者所属租户；该租户成员关系不可删');

-- ========== kb_shares ==========
SELECT pg_temp.weknora_comment_table('kb_shares', '知识库共享到组织的授权记录（权限与来源租户）');
SELECT pg_temp.weknora_comment_column('kb_shares', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('kb_shares', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('kb_shares', 'organization_id', '组织 ID');
SELECT pg_temp.weknora_comment_column('kb_shares', 'shared_by_user_id', '分享操作者用户 ID');
SELECT pg_temp.weknora_comment_column('kb_shares', 'source_tenant_id', '资源来源工作空间 ID（跨租户共享场景）');
SELECT pg_temp.weknora_comment_column('kb_shares', 'permission', '共享权限：admin/editor/viewer');
SELECT pg_temp.weknora_comment_column('kb_shares', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('kb_shares', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('kb_shares', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== organization_join_requests ==========
SELECT pg_temp.weknora_comment_table('organization_join_requests', '组织加入/升权申请及审批结果');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'organization_id', '组织 ID');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'status', '申请状态（pending/approved/rejected 等）');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'requested_role', '申请的角色');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'request_type', '申请类型（join/upgrade 等）');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'prev_role', '变更前角色');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'message', '备注/留言');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'reviewed_by', '审核人用户 ID');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'reviewed_at', '审核时间');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'review_message', '审核意见');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('organization_join_requests', 'updated_at', '最后更新时间');

-- ========== agent_shares ==========
SELECT pg_temp.weknora_comment_table('agent_shares', '智能体共享到组织的授权记录');
SELECT pg_temp.weknora_comment_column('agent_shares', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('agent_shares', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('agent_shares', 'organization_id', '组织 ID');
SELECT pg_temp.weknora_comment_column('agent_shares', 'shared_by_user_id', '分享操作者用户 ID');
SELECT pg_temp.weknora_comment_column('agent_shares', 'source_tenant_id', '资源来源工作空间 ID（跨租户共享场景）');
SELECT pg_temp.weknora_comment_column('agent_shares', 'permission', '共享权限：admin/editor/viewer');
SELECT pg_temp.weknora_comment_column('agent_shares', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('agent_shares', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('agent_shares', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== tenant_disabled_shared_agents ==========
SELECT pg_temp.weknora_comment_table('tenant_disabled_shared_agents', '租户侧隐藏已共享智能体的本地开关');
SELECT pg_temp.weknora_comment_column('tenant_disabled_shared_agents', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('tenant_disabled_shared_agents', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('tenant_disabled_shared_agents', 'source_tenant_id', '资源来源工作空间 ID（跨租户共享场景）');
SELECT pg_temp.weknora_comment_column('tenant_disabled_shared_agents', 'created_at', '创建时间');

-- ========== im_channel_sessions ==========
SELECT pg_temp.weknora_comment_table('im_channel_sessions', 'IM 渠道与 WeKnora 会话的映射（线程/用户维度）');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'platform', '平台标识');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'chat_id', 'Platform-specific chat/group identifier, empty for direct messages');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'status', 'IM 会话映射状态');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'metadata', '元数据（JSON）');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'im_channel_id', 'IM 渠道 ID');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'thread_id', 'IM 线程/话题 ID');

-- ========== im_channels ==========
SELECT pg_temp.weknora_comment_table('im_channels', 'IM 渠道：平台凭证、绑定智能体、会话模式与输出模式');
SELECT pg_temp.weknora_comment_column('im_channels', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('im_channels', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('im_channels', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('im_channels', 'platform', '平台标识');
SELECT pg_temp.weknora_comment_column('im_channels', 'name', 'IM 渠道展示名称');
SELECT pg_temp.weknora_comment_column('im_channels', 'enabled', '是否启用该 IM 渠道');
SELECT pg_temp.weknora_comment_column('im_channels', 'mode', '连接/工作模式');
SELECT pg_temp.weknora_comment_column('im_channels', 'output_mode', '输出模式（如 stream）');
SELECT pg_temp.weknora_comment_column('im_channels', 'credentials', '凭证配置（JSON，通常加密）');
SELECT pg_temp.weknora_comment_column('im_channels', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('im_channels', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('im_channels', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('im_channels', 'knowledge_base_id', '可选绑定的知识库');
SELECT pg_temp.weknora_comment_column('im_channels', 'bot_identity', '机器人身份标识（非空时唯一）');
SELECT pg_temp.weknora_comment_column('im_channels', 'session_mode', '会话模式（如按用户）');

-- ========== data_sources ==========
SELECT pg_temp.weknora_comment_table('data_sources', '外部数据源连接器配置与同步策略（飞书/Notion 等）');
SELECT pg_temp.weknora_comment_column('data_sources', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('data_sources', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('data_sources', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('data_sources', 'name', '数据源显示名称');
SELECT pg_temp.weknora_comment_column('data_sources', 'type', '连接器类型（feishu/notion 等）');
SELECT pg_temp.weknora_comment_column('data_sources', 'config', '加密后的连接配置（凭证等）');
SELECT pg_temp.weknora_comment_column('data_sources', 'sync_schedule', '同步 Cron 表达式');
SELECT pg_temp.weknora_comment_column('data_sources', 'sync_mode', '同步模式（incremental/full）');
SELECT pg_temp.weknora_comment_column('data_sources', 'status', '数据源状态：active/paused/error');
SELECT pg_temp.weknora_comment_column('data_sources', 'conflict_strategy', '冲突策略（overwrite/skip）');
SELECT pg_temp.weknora_comment_column('data_sources', 'sync_deletions', '是否同步源端删除');
SELECT pg_temp.weknora_comment_column('data_sources', 'last_sync_at', '最后同步时间');
SELECT pg_temp.weknora_comment_column('data_sources', 'last_sync_cursor', '增量同步游标/状态');
SELECT pg_temp.weknora_comment_column('data_sources', 'last_sync_result', '最近一次同步结果摘要');
SELECT pg_temp.weknora_comment_column('data_sources', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('data_sources', 'sync_log_retention_days', '同步日志保留天数');
SELECT pg_temp.weknora_comment_column('data_sources', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('data_sources', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('data_sources', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== sync_logs ==========
SELECT pg_temp.weknora_comment_table('sync_logs', '数据源同步任务日志与条目统计');
SELECT pg_temp.weknora_comment_column('sync_logs', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('sync_logs', 'data_source_id', '数据源 ID');
SELECT pg_temp.weknora_comment_column('sync_logs', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('sync_logs', 'status', 'running/success/partial/failed/canceled');
SELECT pg_temp.weknora_comment_column('sync_logs', 'started_at', '开始时间');
SELECT pg_temp.weknora_comment_column('sync_logs', 'finished_at', '结束时间');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_total', '拉取条目总数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_created', '新建条目数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_updated', '更新条目数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_deleted', '删除条目数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_skipped', '跳过条目数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'items_failed', '失败条目数');
SELECT pg_temp.weknora_comment_column('sync_logs', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('sync_logs', 'result', '结果详情（JSON）');
SELECT pg_temp.weknora_comment_column('sync_logs', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('sync_logs', 'updated_at', '最后更新时间');

-- ========== web_search_providers ==========
SELECT pg_temp.weknora_comment_table('web_search_providers', '租户级网络搜索提供商配置（密钥加密存储）');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'name', '搜索提供商配置名称');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'provider', '提供商：bing/google/duckduckgo/tavily 等');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'description', '搜索提供商说明');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'parameters', '参数（JSON，敏感字段可能加密）');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'is_default', '是否为默认项');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('web_search_providers', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== vector_stores ==========
SELECT pg_temp.weknora_comment_table('vector_stores', '向量库连接实例：引擎类型、连接与索引配置');
SELECT pg_temp.weknora_comment_column('vector_stores', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('vector_stores', 'name', '展示名，如 elasticsearch-hot');
SELECT pg_temp.weknora_comment_column('vector_stores', 'engine_type', '引擎类型');
SELECT pg_temp.weknora_comment_column('vector_stores', 'connection_config', '连接配置（敏感字段加密）');
SELECT pg_temp.weknora_comment_column('vector_stores', 'index_config', '索引/集合配置');
SELECT pg_temp.weknora_comment_column('vector_stores', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('vector_stores', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('vector_stores', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('vector_stores', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== wiki_pages ==========
SELECT pg_temp.weknora_comment_table('wiki_pages', 'Wiki 页面：内容、目录、链接图、版本与编辑来源');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'slug', 'URL 友好标识（同库内唯一）');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'title', 'Wiki 页面标题');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'page_type', '页面类型');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'status', 'draft/published/archived');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'content', '正文内容');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'summary', 'Wiki 页面一句话摘要（索引列表用）');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'parent_slug', '语义父页面 slug');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'folder_id', '所属文件夹 ID；空为根');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'category_path', '目录面包屑缓存');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'wiki_path', '规范化可排序路径');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'depth', '层级深度');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'sort_order', '同级排序权重');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'source_refs', '来源知识引用');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'chunk_refs', '引用的分块 UUID');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'in_links', '指向本页的反向链接 slug 列表');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'out_links', '本页链出的 slug 列表');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'page_metadata', '页面扩展元数据');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'aliases', '别名列表');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'version', '页面内容版本号（用户可见变更时递增）');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'last_edit_source', '当前版本编辑来源');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'last_editor_id', '当前版本编辑者；流水线可为空');

-- ========== wiki_folders ==========
SELECT pg_temp.weknora_comment_table('wiki_folders', 'Wiki 文件夹树（path/depth/排序）');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'parent_id', '父节点 ID；空表示根');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'name', '文件夹名称');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'path', '由名称链物化的路径，用于展示/排序');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'depth', '层级深度');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'sort_order', '同级排序权重');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('wiki_folders', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== wiki_page_issues ==========
SELECT pg_temp.weknora_comment_table('wiki_page_issues', 'Wiki 页面质检/问题单（流水线或人工报告）');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'slug', 'URL 友好标识（同库内唯一）');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'issue_type', '问题类型');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'description', '问题描述');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'suspected_knowledge_ids', '疑似相关知识 ID 列表');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'status', '问题状态（默认 pending）');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'reported_by', '问题报告方（用户或系统）');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('wiki_page_issues', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== task_pending_ops ==========
SELECT pg_temp.weknora_comment_table('task_pending_ops', '持久化待处理任务队列（按 task_type/scope 去重与认领）');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'task_type', '任务类型，如 wiki:ingest，宜与 asynq 类型一致');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'scope', '作用域类型');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'scope_id', '作用域对象 ID');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'op', '操作内容/操作码');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'dedup_key', '批内去重键；空表示不去重');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'payload', '任务/事件载荷（JSON 或原始字节）');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'fail_count', '失败/重试计数');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'enqueued_at', '入队时间');
SELECT pg_temp.weknora_comment_column('task_pending_ops', 'claimed_at', '认领时间（队列并发控制）');

-- ========== task_dead_letters ==========
SELECT pg_temp.weknora_comment_table('task_dead_letters', '重试耗尽后的任务死信归档，便于人工重放');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'task_type', '失败任务类型');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'scope', '作用域类型');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'scope_id', '作用域对象 ID');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'related_id', '关联业务 ID（如 knowledge_id）');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'payload', '任务/事件载荷（JSON 或原始字节）');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'last_error', '最后一次错误信息');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'fail_count', '失败/重试计数');
SELECT pg_temp.weknora_comment_column('task_dead_letters', 'failed_at', '最终失败时间');

-- ========== mcp_tool_approvals ==========
SELECT pg_temp.weknora_comment_table('mcp_tool_approvals', 'MCP 工具调用人工审批门禁记录');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'id', '审批记录主键');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'service_id', '关联 MCP 服务 ID');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'tool_name', '待审批的 MCP 工具名');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'require_approval', '加入是否需要审批');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'updated_at', '最后更新时间');

-- ========== tenant_members ==========
SELECT pg_temp.weknora_comment_table('tenant_members', '用户在租户内的成员关系与角色（RBAC）');
SELECT pg_temp.weknora_comment_column('tenant_members', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('tenant_members', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('tenant_members', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('tenant_members', 'role', '租户内角色（owner/admin/contributor 等）');
SELECT pg_temp.weknora_comment_column('tenant_members', 'status', '成员状态：active/invited/suspended');
SELECT pg_temp.weknora_comment_column('tenant_members', 'invited_by', '邀请人用户 ID');
SELECT pg_temp.weknora_comment_column('tenant_members', 'joined_at', '加入时间');
SELECT pg_temp.weknora_comment_column('tenant_members', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_members', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('tenant_members', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== audit_logs ==========
SELECT pg_temp.weknora_comment_table('audit_logs', '审计日志：操作者、动作、作用域与请求元数据');
SELECT pg_temp.weknora_comment_column('audit_logs', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('audit_logs', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('audit_logs', 'actor_user_id', '操作者用户 ID');
SELECT pg_temp.weknora_comment_column('audit_logs', 'actor_role', '操作者角色');
SELECT pg_temp.weknora_comment_column('audit_logs', 'action', '审计动作名（点分命名空间）');
SELECT pg_temp.weknora_comment_column('audit_logs', 'target_type', '目标对象类型');
SELECT pg_temp.weknora_comment_column('audit_logs', 'target_id', '目标对象 ID');
SELECT pg_temp.weknora_comment_column('audit_logs', 'target_user_id', '目标用户 ID');
SELECT pg_temp.weknora_comment_column('audit_logs', 'request_path', 'HTTP 请求路径');
SELECT pg_temp.weknora_comment_column('audit_logs', 'request_method', 'HTTP 方法');
SELECT pg_temp.weknora_comment_column('audit_logs', 'outcome', '结果（success/failure 等）');
SELECT pg_temp.weknora_comment_column('audit_logs', 'details', '详情（JSONB）');
SELECT pg_temp.weknora_comment_column('audit_logs', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('audit_logs', 'scope_type', 'Key 作用域类型（tenant/platform）');
SELECT pg_temp.weknora_comment_column('audit_logs', 'scope_id', 'scope id');

-- ========== organization_tenant_members ==========
SELECT pg_temp.weknora_comment_table('organization_tenant_members', '组织成员（以租户为单位入会）及组织内角色');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'organization_id', '组织 ID');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'role', '组织内租户角色：admin/editor/viewer');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'representative_user_id', '首次将该租户带入组织的用户（展示/审计）');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'joined_at', '加入时间');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('organization_tenant_members', 'updated_at', '最后更新时间');

-- ========== organization_members_pre_plan3 ==========
SELECT pg_temp.weknora_comment_table('organization_members_pre_plan3', '历史用户级组织成员表（Plan3 迁移后归档保留，勿写入新业务）');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'id', '归档表主键（Plan3 前用户级组织成员）');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'organization_id', '组织 ID');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'role', '归档：用户在组织内的历史角色');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('organization_members_pre_plan3', 'updated_at', '最后更新时间');

-- ========== user_resource_favorites ==========
SELECT pg_temp.weknora_comment_table('user_resource_favorites', '用户在租户内对知识库/智能体等资源的收藏');
SELECT pg_temp.weknora_comment_column('user_resource_favorites', 'user_id', '收藏用户');
SELECT pg_temp.weknora_comment_column('user_resource_favorites', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('user_resource_favorites', 'resource_type', '收藏的资源类型（kb/agent 等）');
SELECT pg_temp.weknora_comment_column('user_resource_favorites', 'resource_id', '收藏的资源 ID');
SELECT pg_temp.weknora_comment_column('user_resource_favorites', 'created_at', '创建时间');

-- ========== tenant_invitations ==========
SELECT pg_temp.weknora_comment_table('tenant_invitations', '租户邀请（按人/分享链接）及接受状态');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'invitee_user_id', '被邀请用户 ID；分享链接类可为空');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'invited_by', '邀请人用户 ID');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'role', '接受邀请后获得的租户角色');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'status', 'pending/accepted/declined/revoked/expired');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'message', '备注/留言');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'responded_at', '响应时间');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'deleted_at', '软删除时间；非空表示已删除');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'token', '分享链接类邀请的明文注册令牌；按人邀请可为空');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'accepted_count', 'accepted count');

-- ========== user_kb_pins ==========
SELECT pg_temp.weknora_comment_table('user_kb_pins', '用户个人置顶的知识库');
SELECT pg_temp.weknora_comment_column('user_kb_pins', 'tenant_id', '置顶发生的工作空间');
SELECT pg_temp.weknora_comment_column('user_kb_pins', 'user_id', '置顶操作的用户');
SELECT pg_temp.weknora_comment_column('user_kb_pins', 'kb_id', '被置顶的知识库 ID');
SELECT pg_temp.weknora_comment_column('user_kb_pins', 'pinned_at', '置顶时间；未置顶时为空');

-- ========== system_settings ==========
SELECT pg_temp.weknora_comment_table('system_settings', '系统级可配置项（三层解析：DB/ENV/默认），含类型与分类');
SELECT pg_temp.weknora_comment_column('system_settings', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('system_settings', 'key', '设置键（全局唯一）');
SELECT pg_temp.weknora_comment_column('system_settings', 'value', '设置值（JSONB，可为标量或列表）');
SELECT pg_temp.weknora_comment_column('system_settings', 'value_type', '值类型（int/string/bool/string_list 等）');
SELECT pg_temp.weknora_comment_column('system_settings', 'category', '配置分类（管理端分组）');
SELECT pg_temp.weknora_comment_column('system_settings', 'description', '设置项说明（管理端展示）');
SELECT pg_temp.weknora_comment_column('system_settings', 'is_secret', '是否敏感配置（UI 需掩码）');
SELECT pg_temp.weknora_comment_column('system_settings', 'requires_restart', '修改后是否需要重启生效');
SELECT pg_temp.weknora_comment_column('system_settings', 'last_modified_by', '最后修改人用户 UUID');
SELECT pg_temp.weknora_comment_column('system_settings', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('system_settings', 'updated_at', '最后更新时间');

-- ========== knowledge_processing_spans ==========
SELECT pg_temp.weknora_comment_table('knowledge_processing_spans', '知识解析/富化过程的 Span 追踪树（可观测）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'knowledge_id', '知识条目 ID');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'attempt', '尝试次数');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'span_id', 'Span ID');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'parent_span_id', '父 Span ID');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'name', 'Span 名称');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'kind', '资源种类（默认 file）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'status', 'Span 状态');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'input', '输入（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'output', '输出（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'metadata', '元数据（JSON）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'error_code', 'Span 错误码');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'error_detail', '错误详情');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'started_at', '开始时间');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'finished_at', '结束时间');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'duration_ms', '耗时（毫秒）');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'updated_at', '最后更新时间');

-- ========== embed_channels ==========
SELECT pg_temp.weknora_comment_table('embed_channels', 'Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置');
SELECT pg_temp.weknora_comment_column('embed_channels', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('embed_channels', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('embed_channels', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('embed_channels', 'name', '嵌入渠道名称');
SELECT pg_temp.weknora_comment_column('embed_channels', 'enabled', '是否启用该嵌入渠道');
SELECT pg_temp.weknora_comment_column('embed_channels', 'publish_token', '嵌入发布令牌（机密）');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allowed_origins', '允许的来源 Origin 列表/模式');
SELECT pg_temp.weknora_comment_column('embed_channels', 'welcome_message', '嵌入页欢迎语');
SELECT pg_temp.weknora_comment_column('embed_channels', 'rate_limit_per_minute', '每分钟速率限制');
SELECT pg_temp.weknora_comment_column('embed_channels', 'rate_limit_per_day', '每日速率限制');
SELECT pg_temp.weknora_comment_column('embed_channels', 'primary_color', '主题主色');
SELECT pg_temp.weknora_comment_column('embed_channels', 'page_title', '页面标题');
SELECT pg_temp.weknora_comment_column('embed_channels', 'header_title_mode', '页头标题展示模式');
SELECT pg_temp.weknora_comment_column('embed_channels', 'show_suggested_questions', '是否展示建议问题');
SELECT pg_temp.weknora_comment_column('embed_channels', 'widget_position', '嵌入挂件位置');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allow_web_search', '是否允许联网搜索');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allow_memory', 'When true, embed chat may use agent memory; client cannot override when false');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allow_file_upload', '是否允许上传文件');
SELECT pg_temp.weknora_comment_column('embed_channels', 'default_locale', '默认语言区域');
SELECT pg_temp.weknora_comment_column('embed_channels', 'webhook_url', 'Webhook 回调地址');
SELECT pg_temp.weknora_comment_column('embed_channels', 'webhook_secret', 'Webhook 签名密钥');
SELECT pg_temp.weknora_comment_column('embed_channels', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('embed_channels', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('embed_channels', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== mcp_oauth_clients ==========
SELECT pg_temp.weknora_comment_table('mcp_oauth_clients', 'MCP OAuth 客户端凭证（按租户+服务）');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'tenant_id', '所属工作空间');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'service_id', '关联 MCP 服务 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'client_id', 'OAuth client_id');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'client_secret', 'OAuth client_secret（加密存储）');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'redirect_uri', 'OAuth 回调 redirect_uri');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'updated_at', '最后更新时间');

-- ========== mcp_oauth_tokens ==========
SELECT pg_temp.weknora_comment_table('mcp_oauth_tokens', 'MCP OAuth 访问/刷新令牌及轮换租约');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'service_id', '关联 MCP 服务 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'access_token', '访问令牌（加密）');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'refresh_token', '刷新令牌（加密）');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'token_type', '令牌类型（access_token/refresh_token）');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'expires_at', '访问令牌过期时间');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'principal_type', '主体类型');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'principal_id', 'principal id');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'refresh_lease_id', '刷新令牌轮换租约 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'refresh_lease_until', 'refresh lease until');

-- ========== knowledge_tag_relations ==========
SELECT pg_temp.weknora_comment_table('knowledge_tag_relations', '知识条目与标签的多对多关联');
SELECT pg_temp.weknora_comment_column('knowledge_tag_relations', 'knowledge_id', '知识条目 ID');
SELECT pg_temp.weknora_comment_column('knowledge_tag_relations', 'tag_id', '标签 ID');
SELECT pg_temp.weknora_comment_column('knowledge_tag_relations', 'created_at', '创建时间');

-- ========== tenant_api_keys ==========
SELECT pg_temp.weknora_comment_table('tenant_api_keys', '租户/平台 API Key（哈希鉴权、能力范围与吊销）');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'tenant_id', '租户 Key 所属租户；平台 Key 可为空');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'name', 'API Key 名称（便于识别）');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'key_hash', 'API Key 哈希（鉴权查找）');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'api_key', 'API Key 密文或历史明文列（视加密配置）');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'full_access', '是否拥有全量 API 能力');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'knowledge_base_ids', 'API Key 可访问的知识库 ID 列表');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'capabilities', '非全量 Key 的能力授权列表');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'last_used_at', '最后使用时间');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'revoked_at', '吊销时间');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('tenant_api_keys', 'scope_type', 'Key 作用域类型（tenant/platform）');

-- ========== message_suggestion_sets ==========
SELECT pg_temp.weknora_comment_table('message_suggestion_sets', '消息后续追问建议集合（生成结果与上下文）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'id', '建议集合主键');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'assistant_message_id', '关联的助手消息 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'agent_id', '智能体 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'agent_tenant_id', '解析共享智能体时使用的来源租户');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'placement', '建议展示位置/场景');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'config_hash', '生成所用配置哈希（用于缓存/失效）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'locale', '建议文案语言区域');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'status', '生成状态（pending/ready/failed 等）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'allow_regenerate', '是否允许重新生成建议');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'suppression_reason', '抑制展示的原因（若有）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'questions', '建议问题列表（JSON）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'model_id', '模型 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'prompt_tokens', '生成消耗的 prompt tokens');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'completion_tokens', '生成消耗的 completion tokens');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'latency_ms', '生成耗时（毫秒）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'error_code', '生成失败错误码');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'lease_until', '生成租约截止时间（防并发重复生成）');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'generated_at', '建议生成完成时间');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('message_suggestion_sets', 'updated_at', '最后更新时间');

-- ========== message_suggestion_events ==========
SELECT pg_temp.weknora_comment_table('message_suggestion_events', '建议点击/展示等分析事件');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'id', '建议事件主键');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'suggestion_set_id', '所属建议集合 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'question_id', '被操作的建议问题 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'event_type', '事件类型（展示/点击等）');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'actor_id', '事件触发主体 ID');
SELECT pg_temp.weknora_comment_column('message_suggestion_events', 'created_at', '创建时间');

-- ========== storage_backends ==========
SELECT pg_temp.weknora_comment_table('storage_backends', '具体对象/文件存储后端实例（可多实例同 provider）');
SELECT pg_temp.weknora_comment_column('storage_backends', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('storage_backends', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('storage_backends', 'name', '存储后端实例名称');
SELECT pg_temp.weknora_comment_column('storage_backends', 'provider', '提供商类型');
SELECT pg_temp.weknora_comment_column('storage_backends', 'config', '配置（JSON）');
SELECT pg_temp.weknora_comment_column('storage_backends', 'source', '来源：user（控制台）或 env（环境迁移）');
SELECT pg_temp.weknora_comment_column('storage_backends', 'status', '状态：active/disabled');
SELECT pg_temp.weknora_comment_column('storage_backends', 'legacy_alias', '是否为兼容旧路径的别名后端');
SELECT pg_temp.weknora_comment_column('storage_backends', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('storage_backends', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('storage_backends', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== resources ==========
SELECT pg_temp.weknora_comment_table('resources', '统一资源登记：物理路径、生命周期与内容哈希');
SELECT pg_temp.weknora_comment_column('resources', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('resources', 'handle', '对外 resource:// 句柄');
SELECT pg_temp.weknora_comment_column('resources', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('resources', 'storage_backend_id', '绑定的存储后端实例 ID');
SELECT pg_temp.weknora_comment_column('resources', 'provider', '提供商类型');
SELECT pg_temp.weknora_comment_column('resources', 'physical_path', '内部物理存储路径（不对 API 暴露）');
SELECT pg_temp.weknora_comment_column('resources', 'location_hash', '位置哈希');
SELECT pg_temp.weknora_comment_column('resources', 'kind', '资源种类（默认 file）');
SELECT pg_temp.weknora_comment_column('resources', 'mime_type', 'MIME 类型');
SELECT pg_temp.weknora_comment_column('resources', 'original_name', '原始文件名');
SELECT pg_temp.weknora_comment_column('resources', 'size', '大小（字节）');
SELECT pg_temp.weknora_comment_column('resources', 'content_hash', '内容哈希');
SELECT pg_temp.weknora_comment_column('resources', 'lifecycle', '生命周期（persistent/temporary）');
SELECT pg_temp.weknora_comment_column('resources', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('resources', 'state', '状态（active/deleted 等）');
SELECT pg_temp.weknora_comment_column('resources', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('resources', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('resources', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== resource_bindings ==========
SELECT pg_temp.weknora_comment_table('resource_bindings', '资源与业务所有者（知识/消息等）的绑定关系');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'resource_id', '收藏的资源 ID');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'owner_type', '所有者类型');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'owner_id', '所有者用户 ID');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'relation', '资源与所有者的关系类型');
SELECT pg_temp.weknora_comment_column('resource_bindings', 'created_at', '创建时间');

-- ========== resource_access_grants ==========
SELECT pg_temp.weknora_comment_table('resource_access_grants', '短时可读能力令牌（哈希存储，可吊销）');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'token_hash', '能力令牌哈希');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'resource_id', '收藏的资源 ID');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'access_scope', '授权访问范围');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'revoked_at', '吊销时间');
SELECT pg_temp.weknora_comment_column('resource_access_grants', 'created_at', '创建时间');

-- ========== temporary_documents ==========
SELECT pg_temp.weknora_comment_table('temporary_documents', '会话级临时文档及解析产物（可过期）');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'resource_ref', '内部资源引用');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'file_name', '临时文档原始文件名');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'file_type', '文件类型');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'mime_type', 'MIME 类型');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'file_size', '文件大小（字节）');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'status', '状态：uploaded/processing/ready/failed');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'content', '正文内容');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'chunks', '解析后的分块产物');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'image_refs', '图片资源引用');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'metadata', '元数据（JSON）');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'processing_options', '处理选项');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'token_count', 'Token 计数');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'chunk_count', '分块数量');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'started_at', '开始时间');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'ready_at', '就绪时间');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('temporary_documents', 'deleted_at', '软删除时间；非空表示已删除');

-- ========== wiki_page_revisions ==========
SELECT pg_temp.weknora_comment_table('wiki_page_revisions', 'Wiki 页面历史版本快照');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'page_id', 'Wiki 页面 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'slug', 'URL 友好标识（同库内唯一）');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'version', '对应页面版本号');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'title', '该版本页面标题');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'page_type', '页面类型');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'status', '该版本页面状态');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'content', '该版本 Markdown 正文');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'summary', '该版本摘要');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'aliases', '别名列表');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'edit_source', '编辑来源（pipeline/agent/user/revert 等）');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'editor_id', '编辑者用户 ID');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'edited_at', '编辑时间');
SELECT pg_temp.weknora_comment_column('wiki_page_revisions', 'created_at', '创建时间');

-- ========== chunk_revisions ==========
SELECT pg_temp.weknora_comment_table('chunk_revisions', '分块内容历史修订快照（支持回滚）');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'id', '主键 ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'knowledge_id', '知识条目 ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'chunk_id', '分块 ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'revision', '被快照的修订号（不可变历史）');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'content', '该修订时的正文');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'is_enabled', '该版本/条目是否启用');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'editor_id', '编辑者用户 ID');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'edit_source', '编辑来源（pipeline/agent/user/revert 等）');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'edited_at', '编辑时间');
SELECT pg_temp.weknora_comment_column('chunk_revisions', 'created_at', '创建时间');

DO $$ BEGIN RAISE NOTICE '[Migration 000081] Schema catalog comments applied'; END $$;

