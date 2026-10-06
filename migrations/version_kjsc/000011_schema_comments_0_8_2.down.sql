-- Migration: 000011_schema_comments_0_8_2 (down)
-- Description: 撤销 000011 写入的中文目录注释，把相关表/列的注释还原到执行 000011 之前的状态。
--              000011 只写 pg_description（表/列注释），不产生任何结构或数据变更，
--              因此本文件可以完整回退，无不可逆部分：
--                * 执行前已带英文注释的对象（上游迁移自带的 COMMENT，共 2 张表 +
--                  41 个列）还原为原英文文案；
--                * 执行前无注释的对象（3 张表 +
--                  57 个列）还原为注释缺失（IS NULL）。
--              还原文案不做人工转写：上游迁移里自带的 COMMENT 取自 migrations/versioned/*.up.sql，
--              库里残留的历史英文注释取自执行 000011 之前的实库（legacy_comments.json）。
--              与 up 一致，通过 pg_temp 辅助函数跳过不存在的表/列，避免目录漂移导致回退失败。
--              SQLite 不在此迁移范围内。
--
-- 人工核对（执行回退前）：
--   1. 本文件会无条件覆盖目标对象的当前注释。若 000011 之后有人手工改过这些注释，
--      先人工确认，再执行回退。
--   2. 回退后核对：下面查询应返回 0 行（即目标对象上不再残留中文注释）：
--
--       SELECT c.relname, a.attname, col_description(c.oid, a.attnum)
--       FROM pg_class c
--       JOIN pg_namespace n ON n.oid = c.relnamespace
--       JOIN pg_attribute a ON a.attrelid = c.oid
--       WHERE n.nspname = 'public' AND c.relkind = 'r' AND a.attnum > 0 AND NOT a.attisdropped
--         AND (c.relname, a.attname) IN (
    --         ('model_catalog_configs','id'),('model_catalog_configs','version'),('model_catalog_configs','overlay'),('model_catalog_configs','history'),
    --         ('model_catalog_configs','updated_by'),('model_catalog_configs','updated_at'),('message_artifacts','id'),('message_artifacts','session_id'),
    --         ('message_artifacts','message_id'),('message_artifacts','position'),('message_artifacts','url'),('message_artifacts','file_name'),
    --         ('message_artifacts','file_type'),('message_artifacts','file_size'),('message_artifacts','content_hash'),('message_artifacts','source_path'),
    --         ('message_artifacts','mod_time'),('message_artifacts','created_at'),('message_artifacts','deleted_at'),('mcp_endpoints','id'),
    --         ('mcp_endpoints','tenant_id'),('mcp_endpoints','name'),('mcp_endpoints','description'),('mcp_endpoints','enabled'),
    --         ('mcp_endpoints','token_hash'),('mcp_endpoints','token_hint'),('mcp_endpoints','knowledge_base_ids'),('mcp_endpoints','tools'),
    --         ('mcp_endpoints','default_agent_id'),('mcp_endpoints','rate_limit_per_minute'),('mcp_endpoints','last_used_at'),('mcp_endpoints','created_at'),
    --         ('mcp_endpoints','updated_at'),('mcp_endpoints','deleted_at'),('fork_snapshot_leases','snapshot_id'),('fork_snapshot_leases','tenant_id'),
    --         ('fork_snapshot_leases','sandbox_config_id'),('fork_snapshot_leases','created_at'),('chunk_images','chunk_id'),('chunk_images','image_index'),
    --         ('chunk_images','tenant_id'),('chunk_images','knowledge_base_id'),('chunk_images','knowledge_id'),('chunk_images','chunk_type'),
    --         ('chunk_images','image_key'),('chunk_images','url'),('chunk_images','original_url'),('chunk_images','caption'),
    --         ('chunk_images','ocr_text'),('chunk_images','attrs'),('chunk_images','is_enabled'),('chunk_images','status'),
    --         ('chunk_images','created_at'),('chunk_images','updated_at'),('chunks','source_locators'),('knowledges','profile'),
    --         ('knowledge_bases','profile_config'),('knowledge_bases','generated_profile'),('messages','sandbox_checkpoint'),('messages','context_checkpoint'),
    --         ('messages','agent_tenant_id'),('messages','model_id'),('messages','execution_context'),('sessions','parent_session_id'),
    --         ('sessions','forked_from_message_id'),('sessions','fork_bootstrap'),('sessions','sandbox_config_id'),('sessions','sandbox_config_tenant_id'),
    --         ('sessions','host_workspace_dir'),('sessions','is_pinned'),('sessions','pinned_at'),('im_channels','locale'),
    --         ('tenant_sandbox_configs','config'),('tenant_sandbox_configs','cordoned_at'),('tenant_skills','name'),('tenant_skills','enabled'),
    --         ('tenant_skills','install_session_id'),('tenant_skills','install_message_id'),('tenant_skills','envs'),('tenant_skills','served'),
    --         ('tenant_skill_snapshots','planned_name'),('tenant_user_env_vars','value'),('knowledge_base_mindmaps','knowledge_base_id'),('knowledge_base_mindmaps','mindmap'),
    --         ('knowledge_base_mindmaps','mindmap_file_ids'),('knowledge_base_mindmaps','mindmap_metadata'),('knowledge_base_mindmaps','updated_at'),('audit_logs','scope_id'),
    --         ('embed_channels','allow_memory'),('im_channel_sessions','chat_id'),('knowledge_processing_spans','span_id'),('mcp_oauth_clients','client_id'),
    --         ('mcp_oauth_tokens','principal_id'),('mcp_oauth_tokens','refresh_lease_until'),('sync_logs','status'),('tenant_invitations','status'),
    --         ('tenant_invitations','accepted_count'),('wiki_pages','status')
--         )
--         AND col_description(c.oid, a.attnum) ~ '[一-鿿]';
--
--   3. 补偿步骤：若第 2 步仍有残留，说明存在本文件清单之外的中文注释。
--      对残留对象补执行 COMMENT ON COLUMN <表>.<列> IS NULL 即可；
--      注释只影响 pg_description，不会造成结构或数据不一致。

DO $$ BEGIN RAISE NOTICE '[Migration 000011 down] Reverting schema catalog comments...'; END $$;

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

-- 清除注释专用：显式写 IS NULL，不依赖 %L 对 NULL 的隐式行为。
CREATE OR REPLACE FUNCTION pg_temp.weknora_uncomment_table(p_table text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(format('%I', p_table)) IS NULL THEN
    RAISE NOTICE 'skip COMMENT ON TABLE % IS NULL (missing)', p_table;
    RETURN;
  END IF;
  EXECUTE format('COMMENT ON TABLE %I IS NULL', p_table);
END;
$$;

CREATE OR REPLACE FUNCTION pg_temp.weknora_uncomment_column(p_table text, p_column text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(format('%I', p_table)) IS NULL THEN
    RAISE NOTICE 'skip COMMENT ON COLUMN %.% IS NULL (table missing)', p_table, p_column;
    RETURN;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = current_schema() AND table_name = p_table AND column_name = p_column
  ) THEN
    RAISE NOTICE 'skip COMMENT ON COLUMN %.% IS NULL (column missing)', p_table, p_column;
    RETURN;
  END IF;
  EXECUTE format('COMMENT ON COLUMN %I.%I IS NULL', p_table, p_column);
END;
$$;

-- ========== model_catalog_configs ==========
SELECT pg_temp.weknora_uncomment_table('model_catalog_configs');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'id');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'version');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'overlay');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'history');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'updated_by');
SELECT pg_temp.weknora_uncomment_column('model_catalog_configs', 'updated_at');

-- ========== message_artifacts ==========
SELECT pg_temp.weknora_comment_table('message_artifacts', 'Files a skill script produced during an assistant turn, one row per file');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'id');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'session_id');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'message_id');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'position', 'Zero-based position within the owning message; the download API addresses files by it');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'url', 'Storage or resource:// URL; never returned to clients');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'file_name');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'file_type');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'file_size');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'content_hash');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'source_path', 'Absolute path inside the sandbox; repeated paths in a session are versions of one file');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'mod_time', 'Sandbox mtime as RFC 3339 text; kept at nanosecond precision because the collector matches files on it');
SELECT pg_temp.weknora_uncomment_column('message_artifacts', 'created_at');
SELECT pg_temp.weknora_comment_column('message_artifacts', 'deleted_at', 'Set when the user deleted the file; the row survives to keep position stable and to stop the collector re-attaching it');

-- ========== mcp_endpoints ==========
SELECT pg_temp.weknora_comment_table('mcp_endpoints', 'Workspace-published MCP server endpoints consumed by external MCP clients');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'id');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'tenant_id');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'name');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'description');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'enabled');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'token_hash', 'SHA-256 hex of the bearer token (mcp_ prefix); plaintext is shown once and never stored');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'token_hint', 'Leading characters of the token for display only');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'knowledge_base_ids', 'Knowledge-base allowlist; empty array means every workspace knowledge base');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'tools', 'Allowlisted MCP tool names from the endpoint tool catalog');
SELECT pg_temp.weknora_comment_column('mcp_endpoints', 'default_agent_id', 'Agent used by the ask tool when the caller does not name one');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'rate_limit_per_minute');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'last_used_at');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'created_at');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'updated_at');
SELECT pg_temp.weknora_uncomment_column('mcp_endpoints', 'deleted_at');

-- ========== fork_snapshot_leases ==========
SELECT pg_temp.weknora_uncomment_table('fork_snapshot_leases');
SELECT pg_temp.weknora_uncomment_column('fork_snapshot_leases', 'snapshot_id');
SELECT pg_temp.weknora_uncomment_column('fork_snapshot_leases', 'tenant_id');
SELECT pg_temp.weknora_uncomment_column('fork_snapshot_leases', 'sandbox_config_id');
SELECT pg_temp.weknora_uncomment_column('fork_snapshot_leases', 'created_at');

-- ========== chunk_images ==========
SELECT pg_temp.weknora_uncomment_table('chunk_images');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'chunk_id');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'image_index');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'tenant_id');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'knowledge_base_id');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'knowledge_id');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'chunk_type');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'image_key');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'url');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'original_url');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'caption');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'ocr_text');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'attrs');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'is_enabled');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'status');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'created_at');
SELECT pg_temp.weknora_uncomment_column('chunk_images', 'updated_at');

-- ========== chunks（0.8.2 新增列） ==========
SELECT pg_temp.weknora_uncomment_column('chunks', 'source_locators');

-- ========== knowledges / knowledge_bases（0.8.2 新增列） ==========
SELECT pg_temp.weknora_uncomment_column('knowledges', 'profile');
SELECT pg_temp.weknora_uncomment_column('knowledge_bases', 'profile_config');
SELECT pg_temp.weknora_uncomment_column('knowledge_bases', 'generated_profile');

-- ========== messages（0.8.2 新增列 + 历史英文注释中文化） ==========
SELECT pg_temp.weknora_uncomment_column('messages', 'sandbox_checkpoint');
SELECT pg_temp.weknora_comment_column('messages', 'context_checkpoint', 'Agent compaction summary covering this turn and every turn before it');
SELECT pg_temp.weknora_comment_column('messages', 'agent_tenant_id', 'agent tenant id');
SELECT pg_temp.weknora_comment_column('messages', 'model_id', 'model id');
SELECT pg_temp.weknora_comment_column('messages', 'execution_context', 'execution context');

-- ========== sessions（0.8.2 新增列 + 历史英文注释中文化） ==========
SELECT pg_temp.weknora_uncomment_column('sessions', 'parent_session_id');
SELECT pg_temp.weknora_uncomment_column('sessions', 'forked_from_message_id');
SELECT pg_temp.weknora_uncomment_column('sessions', 'fork_bootstrap');
SELECT pg_temp.weknora_comment_column('sessions', 'sandbox_config_id', 'Sandbox config the session current live sandbox was created on; NULL = no live sandbox, ''-'' = deployment default');
SELECT pg_temp.weknora_comment_column('sessions', 'sandbox_config_tenant_id', 'Workspace owning sandbox_config_id; 0 = the session own tenant (never borrowed)');
SELECT pg_temp.weknora_comment_column('sessions', 'host_workspace_dir', 'Lite host sandbox project directory; NULL/empty = auto session workspace; immutable after create');
SELECT pg_temp.weknora_comment_column('sessions', 'is_pinned', 'is pinned');
SELECT pg_temp.weknora_comment_column('sessions', 'pinned_at', 'pinned at');

-- ========== im_channels（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('im_channels', 'locale', 'Fixed locale for responses on this IM channel; empty uses the deployment default');

-- ========== tenant_sandbox_configs（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'config', 'Sandbox backend config (endpoints, encrypted API keys, env vars, volume mount); shape matches types.TenantSandboxConfig');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'cordoned_at', 'Short lease taken while identity fields (provider/URL/API key) are being changed; sandbox resolution is refused while it is fresh');

-- ========== tenant_skills / tenant_skill_snapshots（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_skills', 'name', 'Also the directory name inside the image: /opt/weknora/tenant/skills/<name>');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'enabled', 'Visibility to the agent only; files stay in the image until the skill is removed');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'install_session_id', 'Maintenance session of the most recent install; overwritten on re-install');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'install_message_id', 'Assistant message the installer transcript was streamed into');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'envs', 'Installer-agent declaration [{name,description,required,value}]. value is the workspace-wide admin value and is AES-GCM encrypted; the rest is plaintext so the UI can render it without a key.');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'served', 'Version still in the image while a newer install is pending or failed: {version,description,instructions,bundle_sha256,bundle_ref,snapshot_id}. NULL when the row itself is what is served.');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'planned_name', 'Name passed to CreateSnapshot, written before the provider call so an abandoned build stays identifiable');

-- ========== tenant_user_env_vars（0.8.2 新增列） ==========
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'value', 'AES-GCM encrypted. Never returned by any endpoint.');

-- ========== knowledge_base_mindmaps（历史遗留：列注释缺失） ==========
SELECT pg_temp.weknora_uncomment_column('knowledge_base_mindmaps', 'knowledge_base_id');
SELECT pg_temp.weknora_uncomment_column('knowledge_base_mindmaps', 'mindmap');
SELECT pg_temp.weknora_uncomment_column('knowledge_base_mindmaps', 'mindmap_file_ids');
SELECT pg_temp.weknora_uncomment_column('knowledge_base_mindmaps', 'mindmap_metadata');
SELECT pg_temp.weknora_uncomment_column('knowledge_base_mindmaps', 'updated_at');

-- ========== 历史遗留：英文注释中文化 ==========
SELECT pg_temp.weknora_comment_column('audit_logs', 'scope_id', 'scope id');
SELECT pg_temp.weknora_comment_column('embed_channels', 'allow_memory', 'When true, embed chat may use agent memory; client cannot override when false');
SELECT pg_temp.weknora_comment_column('im_channel_sessions', 'chat_id', 'Platform-specific chat/group identifier, empty for direct messages');
SELECT pg_temp.weknora_comment_column('knowledge_processing_spans', 'span_id', 'Span ID');
SELECT pg_temp.weknora_comment_column('mcp_oauth_clients', 'client_id', 'OAuth client_id');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'principal_id', 'principal id');
SELECT pg_temp.weknora_comment_column('mcp_oauth_tokens', 'refresh_lease_until', 'refresh lease until');
SELECT pg_temp.weknora_comment_column('sync_logs', 'status', 'running/success/partial/failed/canceled');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'status', 'pending/accepted/declined/revoked/expired');
SELECT pg_temp.weknora_comment_column('tenant_invitations', 'accepted_count', 'accepted count');
SELECT pg_temp.weknora_comment_column('wiki_pages', 'status', 'draft/published/archived');
DO $$ BEGIN RAISE NOTICE '[Migration 000011 down] Schema catalog comments reverted.'; END $$;
