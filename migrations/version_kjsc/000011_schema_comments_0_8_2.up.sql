-- Migration: 000011_schema_comments_0_8_2
-- Description: 补齐目录注释（表注释 / 列注释），全部为中文。不含结构变更；幂等，可重复执行。
--              覆盖三类对象：
--                1) 上游 0.8.2 同步（versioned 000081 ~ 000114）新建表的表注释与列注释：
--                   chunk_images、fork_snapshot_leases、mcp_endpoints、message_artifacts、
--                   model_catalog_configs；
--                2) 0.8.2 给既有表新增或改写的列注释：chunks、knowledges、knowledge_bases、
--                   messages、sessions、im_channels、tenant_sandbox_configs、tenant_skills、
--                   tenant_skill_snapshots、tenant_user_env_vars；
--                3) 历史遗留缺口：knowledge_base_mindmaps 未注释的 5 个列，以及库里残留英文
--                   注释的对象（audit_logs、embed_channels、im_channel_sessions、
--                   knowledge_processing_spans、mcp_oauth_clients、mcp_oauth_tokens、messages、
--                   sessions、sync_logs、tenant_invitations、wiki_pages）。
--              英文注释统一覆盖为中文，与 000001、000008 的口径保持一致。
--              文案长度遵循 AGENTS.md：表注释不超过 10 个字，列注释不超过 20 个字。
--              通过 pg_temp 辅助函数跳过不存在的表/列，避免目录漂移导致迁移失败。
--              SQLite 不在此迁移范围内。
--
-- 回退：见 000011_schema_comments_0_8_2.down.sql。本迁移只写 pg_description（表/列注释），
--       不产生结构或数据变更，down 会把上述对象还原为执行前的状态（英文原文或注释缺失）。

DO $$ BEGIN RAISE NOTICE '[Migration 000011] Applying 0.8.2 schema catalog comments...'; END $$;

-- 守卫：跳过不存在的表/列，避免目录漂移导致迁移失败。
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

-- ========== model_catalog_configs ==========
SELECT pg_temp.weknora_comment_table('model_catalog_configs', '模型目录覆盖配置');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'id', '主键，单行表（id=1）');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'version', '乐观锁版本号，写入时递增');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'overlay', '目录覆盖配置（JSONB）');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'history', '历史覆盖快照（JSONB）');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'updated_by', '最近写入的操作者 ID');
SELECT pg_temp.weknora_comment_column('model_catalog_configs', 'updated_at', '最近更新时间');

-- ========== message_artifacts ==========
SELECT pg_temp.weknora_comment_table('message_artifacts', '消息产出文件表');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'id', '主键 ID（UUID）');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'session_id', '所属会话 ID');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'message_id', '所属消息 ID');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'position', '消息内文件序号，从 0 开始');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'url', '存储地址，不下发客户端');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'file_name', '沙箱内原始文件名');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'file_type', '文件扩展名，如 .pptx');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'file_size', '文件字节数');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'content_hash', '内容 SHA-256，用于变更比对');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'source_path', '沙箱内绝对路径');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'mod_time', '沙箱文件修改时间（纳秒）');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'deleted_at', '删除时间；保留行防重挂');

-- ========== mcp_endpoints ==========
SELECT pg_temp.weknora_comment_table('mcp_endpoints', 'MCP 服务端点表');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'id', '主键 ID（UUID）');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'name', '端点名称');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'description', '端点说明');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'enabled', '是否启用；关闭后拒绝接入');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'token_hash', '令牌 SHA-256 摘要，不存明文');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'token_hint', '令牌前缀片段，仅用于展示');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'knowledge_base_ids', '可访问知识库白名单（JSONB）');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'tools', '允许调用的工具名（JSONB）');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'default_agent_id', '未指定时默认使用的智能体');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'rate_limit_per_minute', '每分钟调用次数上限');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'last_used_at', '最近一次调用时间');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'deleted_at', '软删除时间；非空已删除');

-- ========== fork_snapshot_leases ==========
SELECT pg_temp.weknora_comment_table('fork_snapshot_leases', '分叉快照租约表');
SELECT pg_temp.weknora_comment_column('fork_snapshot_leases', 'snapshot_id', '沙箱快照 ID（主键）');
SELECT pg_temp.weknora_comment_column('fork_snapshot_leases', 'tenant_id', '快照所属工作空间（租户）');
SELECT pg_temp.weknora_comment_column('fork_snapshot_leases', 'sandbox_config_id', '创建快照的沙箱配置 ID');
SELECT pg_temp.weknora_comment_column('fork_snapshot_leases', 'created_at', '租约登记时间');

-- ========== chunk_images ==========
SELECT pg_temp.weknora_comment_table('chunk_images', '分块图片投影表');
SELECT pg_temp.weknora_comment_column('chunk_images', 'chunk_id', '所属分块 ID');
SELECT pg_temp.weknora_comment_column('chunk_images', 'image_index', '图片下标，与分块 ID 组主键');
SELECT pg_temp.weknora_comment_column('chunk_images', 'tenant_id', '所属工作空间（租户）ID');
SELECT pg_temp.weknora_comment_column('chunk_images', 'knowledge_base_id', '所属知识库 ID');
SELECT pg_temp.weknora_comment_column('chunk_images', 'knowledge_id', '所属知识条目（文档）ID');
SELECT pg_temp.weknora_comment_column('chunk_images', 'chunk_type', '分块类型，如 image_ocr');
SELECT pg_temp.weknora_comment_column('chunk_images', 'image_key', '去重键：url 优先，其次原地址');
SELECT pg_temp.weknora_comment_column('chunk_images', 'url', '图片存储地址');
SELECT pg_temp.weknora_comment_column('chunk_images', 'original_url', '图片原始地址');
SELECT pg_temp.weknora_comment_column('chunk_images', 'caption', '图片描述文案');
SELECT pg_temp.weknora_comment_column('chunk_images', 'ocr_text', '图片 OCR 文本');
SELECT pg_temp.weknora_comment_column('chunk_images', 'attrs', '图片观测属性（JSONB）');
SELECT pg_temp.weknora_comment_column('chunk_images', 'is_enabled', '所属分块是否启用');
SELECT pg_temp.weknora_comment_column('chunk_images', 'status', '所属分块的处理状态');
SELECT pg_temp.weknora_comment_column('chunk_images', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('chunk_images', 'updated_at', '最后更新时间');

-- ========== chunks（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('chunks', 'source_locators', '原文定位：页码/行/时间点');

-- ========== knowledges / knowledge_bases（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('knowledges', 'profile', '文档结构化画像（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'profile_config', '画像生成配置（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_bases', 'generated_profile', '自动生成的画像（JSONB）');

-- ========== messages（0.8.2 新增列 + 历史英文注释中文化） ==========
SELECT pg_temp.weknora_comment_column('messages', 'sandbox_checkpoint', '回合结束时的沙箱检查点');
SELECT pg_temp.weknora_comment_column('messages', 'context_checkpoint', '上下文压缩摘要');
SELECT pg_temp.weknora_comment_column('messages', 'agent_tenant_id', '智能体所属租户 ID');
SELECT pg_temp.weknora_comment_column('messages', 'model_id', '生成该消息的模型 ID');
SELECT pg_temp.weknora_comment_column('messages', 'execution_context', '本回合执行上下文（JSONB）');

-- ========== sessions（0.8.2 新增列 + 历史英文注释中文化） ==========
SELECT pg_temp.weknora_comment_column('sessions', 'parent_session_id', '分叉来源会话 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'forked_from_message_id', '分叉边界消息 ID');
SELECT pg_temp.weknora_comment_column('sessions', 'fork_bootstrap', '分叉引导信息（JSONB）');
SELECT pg_temp.weknora_comment_column('sessions', 'sandbox_config_id', '活跃沙箱配置 ID；- 为默认');
SELECT pg_temp.weknora_comment_column('sessions', 'sandbox_config_tenant_id', '配置所属租户 ID；0 为本租户');
SELECT pg_temp.weknora_comment_column('sessions', 'host_workspace_dir', '宿主沙箱项目目录，创建后不变');
SELECT pg_temp.weknora_comment_column('sessions', 'is_pinned', '是否置顶');
SELECT pg_temp.weknora_comment_column('sessions', 'pinned_at', '置顶时间');

-- ========== im_channels（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('im_channels', 'locale', '固定回复语言；空用默认');

-- ========== tenant_sandbox_configs（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'config', '沙箱后端配置（JSONB）');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'cordoned_at', '改身份字段期间短租约');

-- ========== tenant_skills / tenant_skill_snapshots（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_skills', 'name', '技能名，兼作镜像内目录名');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'enabled', '是否对智能体可见');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'install_session_id', '最近一次安装的运维会话');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'install_message_id', '安装日志流入的助手消息');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'envs', '安装器声明的环境变量（JSONB）');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'served', '镜像内在服务的版本信息');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'planned_name', '创建快照时传入的技能名');

-- ========== tenant_user_env_vars（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'value', '取值，AES-GCM 加密不返回');

-- ========== knowledge_base_mindmaps（历史遗留：列注释缺失） ==========
SELECT pg_temp.weknora_comment_column('knowledge_base_mindmaps', 'knowledge_base_id', '所属知识库 ID');
SELECT pg_temp.weknora_comment_column('knowledge_base_mindmaps', 'mindmap', '脑图结构（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_base_mindmaps', 'mindmap_file_ids', '脑图引用的文件 ID（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_base_mindmaps', 'mindmap_metadata', '脑图元信息（JSONB）');
SELECT pg_temp.weknora_comment_column('knowledge_base_mindmaps', 'updated_at', '最后更新时间');

-- ========== 历史遗留：英文注释中文化 ==========
SELECT pg_temp.weknora_comment_column('audit_logs', 'scope_id', '操作对象的作用域 ID');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allow_memory', '是否允许使用智能体记忆');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'chat_id', '渠道侧会话/群 ID；私聊空');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'span_id', '处理跨度 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'client_id', 'OAuth 客户端 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'principal_id', '授权主体 ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'refresh_lease_until', '刷新租约到期时间');
SELECT pg_temp.weknora_comment_column('sync_logs', 'status', '同步状态：成功/失败/取消');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'status', '邀请状态：待接受/已接受/撤销');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'accepted_count', '已接受次数');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'status', '页面状态：草稿/发布/归档');

DO $$ BEGIN RAISE NOTICE '[Migration 000011] Schema catalog comments applied.'; END $$;
