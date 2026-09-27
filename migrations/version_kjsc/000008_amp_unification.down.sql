-- 回退 000008 的可逆部分。
-- 不可逆：up 在复制并回填之后删除了旧 h_ 表，本脚本不能重建这些表或其中的行。
-- 补偿：从执行本迁移之前的整库备份还原。人工核对备份中的 h_conversations、h_messages、h_tool_calls、h_agent_runs
-- 与现库 amp_sessions、amp_messages、amp_tool_calls、amp_agent_runs 的行数。
-- 已复制的 amp_ 业务表是唯一运行副本，文末不删除它们。


DELETE FROM mcp_services
WHERE id = 'mcp-server-chart'
  AND tenant_id = 0
  AND is_builtin = TRUE;

ALTER TABLE tenant_skill_catalog DROP CONSTRAINT IF EXISTS ck_tenant_skill_catalog_source_type;
ALTER TABLE tenant_skill_catalog
    DROP COLUMN IF EXISTS source_mtime,
    DROP COLUMN IF EXISTS updated_by,
    DROP COLUMN IF EXISTS created_by,
    DROP COLUMN IF EXISTS enabled,
    DROP COLUMN IF EXISTS share_config,
    DROP COLUMN IF EXISTS skill_dependencies,
    DROP COLUMN IF EXISTS mcp_dependencies,
    DROP COLUMN IF EXISTS tool_dependencies,
    DROP COLUMN IF EXISTS source_type;

-- 回退到清理前的表注释。本批新建的 amp 表在文末直接删除，不再先改回旧字段。

COMMENT ON TABLE agent_shares IS '智能体共享到组织的授权记录';
COMMENT ON TABLE amp_agent_run_requests IS '智能体请求排队、幂等和取消链路表';
COMMENT ON TABLE amp_agent_runs IS '智能体运行生命周期主表';
COMMENT ON TABLE amp_agent_usage_daily IS '智能体按天聚合表：服务数据总览和最佳智能体 TOP 5';
COMMENT ON TABLE amp_agent_usage_events IS '智能体运行遥测事实表：只追加运行生命周期事件';
COMMENT ON TABLE amp_agents IS 'Harness 智能体主表：保存智能体配置、共享状态和运行标识';
COMMENT ON TABLE amp_audit_logs IS 'Harness 审计日志表';
COMMENT ON TABLE amp_builtin_tools IS 'Harness 内置工具只读目录，用于统一预览、依赖解析和统计';
COMMENT ON TABLE amp_messages IS 'Harness 运行时消息主表';
COMMENT ON TABLE amp_model_provider IS '模型厂商配置表';
COMMENT ON TABLE amp_sessions IS 'Harness 运行时会话主表，对应原 conversations 数据';
COMMENT ON TABLE amp_subagent_threads IS '子智能体线程与会话归属关系表';
COMMENT ON TABLE amp_token_usage_events IS '模型 token 遥测事实表：保存每次模型调用的精确消耗';
COMMENT ON TABLE amp_tool_calls IS '会话内工具调用过程明细表';
COMMENT ON TABLE amp_tool_usage_events IS '工具使用遥测事实表：覆盖内置工具、MCP 和 Skill 工具';
COMMENT ON TABLE amp_web_search_provider_types IS '网络搜索提供商类型元数据表';
COMMENT ON TABLE audit_logs IS '审计日志：操作者、动作、作用域与请求元数据';
COMMENT ON TABLE auth_tokens IS '用户认证令牌（access/refresh），支持吊销与过期';
COMMENT ON TABLE browser_devices IS '浏览器设备授权';
COMMENT ON TABLE browser_pairings IS '浏览器配对记录';
COMMENT ON TABLE browser_task_interruptions IS '浏览器任务中断';
COMMENT ON TABLE chunk_revisions IS '分块内容历史修订快照（支持回滚）';
COMMENT ON TABLE chunks IS '知识分块：正文、索引状态、FAQ/图文关系、修订与上下文章节头';
COMMENT ON TABLE custom_agents IS '自定义/内置智能体配置（与租户组成复合主键）';
COMMENT ON TABLE data_sources IS '外部数据源连接器配置与同步策略（飞书/Notion 等）';
COMMENT ON TABLE embed_channels IS 'Web 嵌入渠道：发布令牌、来源白名单、限流与 UI 配置';
COMMENT ON TABLE embeddings IS 'Postgres 侧向量嵌入存储（仅当检索驱动包含 postgres 时使用）';
COMMENT ON TABLE im_channel_sessions IS 'IM 渠道与 WeKnora 会话的映射（线程/用户维度）';
COMMENT ON TABLE im_channels IS 'IM 渠道：平台凭证、绑定智能体、会话模式与输出模式';
COMMENT ON TABLE kb_shares IS '知识库共享到组织的授权记录（权限与来源租户）';
COMMENT ON TABLE knowledge_base_mindmaps IS NULL;
COMMENT ON TABLE knowledge_bases IS '知识库主表：分块、向量库绑定、Wiki/FAQ/自动打标等配置';
COMMENT ON TABLE knowledge_processing_spans IS '知识解析/富化过程的 Span 追踪树（可观测）';
COMMENT ON TABLE knowledge_tag_relations IS '知识条目与标签的多对多关联';
COMMENT ON TABLE knowledge_tags IS '知识库内标签定义（名称/颜色/排序），FAQ 等分类用';
COMMENT ON TABLE knowledges IS '知识条目（文档/FAQ/URL/手工等）：解析状态、文件元数据、目录路径';
COMMENT ON TABLE mcp_metadata IS 'MCP 工具同步元数据';
COMMENT ON TABLE mcp_oauth_clients IS 'MCP OAuth 客户端凭证（按租户+服务）';
COMMENT ON TABLE mcp_oauth_tokens IS 'MCP OAuth 访问/刷新令牌及轮换租约';
COMMENT ON TABLE mcp_services IS 'MCP 服务配置：传输方式、鉴权、stdio/HTTP 等连接参数';
COMMENT ON TABLE mcp_tool_approvals IS 'MCP 工具调用人工审批门禁记录';
COMMENT ON TABLE memory_doc_affinity IS '文档使用偏好';
COMMENT ON TABLE memory_extraction_sessions IS '记忆抽取进度';
COMMENT ON TABLE memory_item_embeddings IS '记忆向量';
COMMENT ON TABLE memory_items IS '记忆条目';
COMMENT ON TABLE memory_subjects IS '记忆主体';
COMMENT ON TABLE memory_tombstones IS '记忆删除记录';
COMMENT ON TABLE memory_topic_stats IS '记忆主题统计';
COMMENT ON TABLE message_suggestion_events IS '建议点击/展示等分析事件';
COMMENT ON TABLE message_suggestion_sets IS '消息后续追问建议集合（生成结果与上下文）';
COMMENT ON TABLE messages IS '会话消息：角色内容、知识引用、Agent 步骤、附件与执行上下文';
COMMENT ON TABLE models IS '模型实例表：嵌入/对话/重排/VLM/ASR 等，按租户隔离；内置模型对全租户可见';
COMMENT ON TABLE organization_join_requests IS '组织加入/升权申请及审批结果';
COMMENT ON TABLE organization_members_pre_plan3 IS '历史用户级组织成员表（Plan3 迁移后归档保留，勿写入新业务）';
COMMENT ON TABLE organization_tenant_members IS '组织成员（以租户为单位入会）及组织内角色';
COMMENT ON TABLE organizations IS '组织（空间联盟）：邀请码、审批、成员上限与可搜索性';
COMMENT ON TABLE resource_access_grants IS '短时可读能力令牌（哈希存储，可吊销）';
COMMENT ON TABLE resource_bindings IS '资源与业务所有者（知识/消息等）的绑定关系';
COMMENT ON TABLE resources IS '统一资源登记：物理路径、生命周期与内容哈希';
COMMENT ON TABLE sessions IS '对话会话：归属用户、置顶、最近一次提问栏状态（agent_config 列）';
COMMENT ON TABLE storage_backends IS '具体对象/文件存储后端实例（可多实例同 provider）';
COMMENT ON TABLE sync_logs IS '数据源同步任务日志与条目统计';
COMMENT ON TABLE system_settings IS '系统级可配置项（三层解析：DB/ENV/默认），含类型与分类';
COMMENT ON TABLE task_dead_letters IS '重试耗尽后的任务死信归档，便于人工重放';
COMMENT ON TABLE task_pending_ops IS '持久化待处理任务队列（按 task_type/scope 去重与认领）';
COMMENT ON TABLE temporary_documents IS '会话级临时文档及解析产物（可过期）';
COMMENT ON TABLE tenant_api_keys IS '租户/平台 API Key（哈希鉴权、能力范围与吊销）';
COMMENT ON TABLE tenant_disabled_shared_agents IS '租户侧隐藏已共享智能体的本地开关';
COMMENT ON TABLE tenant_invitations IS '租户邀请（按人/分享链接）及接受状态';
COMMENT ON TABLE tenant_members IS '用户在租户内的成员关系与角色（RBAC）';
COMMENT ON TABLE tenant_sandbox_configs IS '租户沙箱配置';
COMMENT ON TABLE tenant_skill_catalog IS 'Workspace skill definition. Installations onto sandbox configs live in tenant_skills.';
COMMENT ON TABLE tenant_skill_snapshots IS 'Image chain ledger. Old snapshots are kept (state=superseded), never deleted on switch, so the recorded IDs stay resolvable.';
COMMENT ON TABLE tenant_skills IS '租户技能安装';
COMMENT ON TABLE tenant_user_env_vars IS 'One principal''s own environment variable. An empty skill_id applies to every execution on the sandbox config; a skill_id scopes it to that skill''s declaration. Keyed by principal, not user_id: the IM path stores a synthetic tenant account in the user ID, which would make every IM user of a workspace share one value.';
COMMENT ON TABLE tenants IS '工作空间（租户）主表：配额、检索引擎、存储/解析/对话等全局配置';
COMMENT ON TABLE user_kb_pins IS '用户个人置顶的知识库';
COMMENT ON TABLE user_resource_favorites IS '用户在租户内对知识库/智能体等资源的收藏';
COMMENT ON TABLE users IS '用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好';
COMMENT ON TABLE vector_stores IS '向量库连接实例：引擎类型、连接与索引配置';
COMMENT ON TABLE web_search_providers IS '租户级网络搜索提供商配置（密钥加密存储）';
COMMENT ON TABLE wiki_folders IS 'Wiki 文件夹树（path/depth/排序）';
COMMENT ON TABLE wiki_page_issues IS 'Wiki 页面质检/问题单（流水线或人工报告）';
COMMENT ON TABLE wiki_page_revisions IS 'Wiki 页面历史版本快照';
COMMENT ON TABLE wiki_pages IS 'Wiki 页面：内容、目录、链接图、版本与编辑来源';

-- 回退注释迁移；只清空本批补充的注释。

COMMENT ON COLUMN messages.artifacts IS NULL;
COMMENT ON COLUMN messages.used_memories IS NULL;
COMMENT ON COLUMN messages.usage IS NULL;
COMMENT ON COLUMN tenants.memory_config IS NULL;

COMMENT ON TABLE tenant_sandbox_configs IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.id IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.tenant_id IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.name IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.description IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.sandbox_type IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.created_at IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.updated_at IS NULL;
COMMENT ON COLUMN tenant_sandbox_configs.deleted_at IS NULL;

COMMENT ON TABLE tenant_skills IS NULL;
COMMENT ON COLUMN tenant_skills.id IS NULL;
COMMENT ON COLUMN tenant_skills.tenant_id IS NULL;
COMMENT ON COLUMN tenant_skills.sandbox_config_id IS NULL;
COMMENT ON COLUMN tenant_skills.version IS NULL;
COMMENT ON COLUMN tenant_skills.description IS NULL;
COMMENT ON COLUMN tenant_skills.instructions IS NULL;
COMMENT ON COLUMN tenant_skills.bundle_ref IS NULL;
COMMENT ON COLUMN tenant_skills.bundle_sha256 IS NULL;
COMMENT ON COLUMN tenant_skills.installed_snapshot_id IS NULL;
COMMENT ON COLUMN tenant_skills.status IS NULL;
COMMENT ON COLUMN tenant_skills.error IS NULL;
COMMENT ON COLUMN tenant_skills.installing_since IS NULL;
COMMENT ON COLUMN tenant_skills.created_at IS NULL;
COMMENT ON COLUMN tenant_skills.updated_at IS NULL;
COMMENT ON COLUMN tenant_skills.deleted_at IS NULL;
COMMENT ON COLUMN tenant_skills.catalog_id IS NULL;

COMMENT ON COLUMN tenant_skill_snapshots.id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.tenant_id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.sandbox_config_id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.skill_id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.snapshot_id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.parent_snapshot_id IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.generation IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.trigger IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.state IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.superseded_at IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.created_at IS NULL;
COMMENT ON COLUMN tenant_skill_snapshots.updated_at IS NULL;

COMMENT ON COLUMN tenant_skill_catalog.id IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.tenant_id IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.name IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.version IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.description IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.instructions IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.bundle_ref IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.bundle_sha256 IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.created_at IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.updated_at IS NULL;
COMMENT ON COLUMN tenant_skill_catalog.deleted_at IS NULL;

COMMENT ON COLUMN tenant_user_env_vars.id IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.tenant_id IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.principal_type IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.principal_id IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.sandbox_config_id IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.skill_id IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.name IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.created_at IS NULL;
COMMENT ON COLUMN tenant_user_env_vars.updated_at IS NULL;

COMMENT ON COLUMN mcp_services.usage_instructions IS NULL;
COMMENT ON COLUMN mcp_tool_approvals.enabled IS NULL;
COMMENT ON TABLE mcp_metadata IS NULL;
COMMENT ON COLUMN mcp_metadata.tenant_id IS NULL;
COMMENT ON COLUMN mcp_metadata.service_id IS NULL;
COMMENT ON COLUMN mcp_metadata.principal IS NULL;
COMMENT ON COLUMN mcp_metadata.config_fingerprint IS NULL;
COMMENT ON COLUMN mcp_metadata.tools IS NULL;
COMMENT ON COLUMN mcp_metadata.instructions IS NULL;
COMMENT ON COLUMN mcp_metadata.server_name IS NULL;
COMMENT ON COLUMN mcp_metadata.server_version IS NULL;
COMMENT ON COLUMN mcp_metadata.server_description IS NULL;
COMMENT ON COLUMN mcp_metadata.synced_at IS NULL;

COMMENT ON TABLE browser_devices IS NULL;
COMMENT ON COLUMN browser_devices.scope_key IS NULL;
COMMENT ON COLUMN browser_devices.id IS NULL;
COMMENT ON COLUMN browser_devices.tenant IS NULL;
COMMENT ON COLUMN browser_devices."user" IS NULL;
COMMENT ON COLUMN browser_devices.label IS NULL;
COMMENT ON COLUMN browser_devices.token_hash IS NULL;
COMMENT ON COLUMN browser_devices.previous_hash IS NULL;
COMMENT ON COLUMN browser_devices.previous_until IS NULL;
COMMENT ON COLUMN browser_devices.expires_at IS NULL;
COMMENT ON COLUMN browser_devices.renew_after IS NULL;
COMMENT ON COLUMN browser_devices.created_at IS NULL;
COMMENT ON COLUMN browser_devices.last_seen_at IS NULL;
COMMENT ON COLUMN browser_devices.revoked_at IS NULL;
COMMENT ON COLUMN browser_devices.owner IS NULL;
COMMENT ON COLUMN browser_devices.owner_url IS NULL;
COMMENT ON COLUMN browser_devices.lease_key IS NULL;
COMMENT ON COLUMN browser_devices.lease_until IS NULL;

COMMENT ON TABLE browser_pairings IS NULL;
COMMENT ON COLUMN browser_pairings.scope_key IS NULL;
COMMENT ON COLUMN browser_pairings.token_hash IS NULL;
COMMENT ON COLUMN browser_pairings.tenant IS NULL;
COMMENT ON COLUMN browser_pairings."user" IS NULL;
COMMENT ON COLUMN browser_pairings.expires_at IS NULL;

COMMENT ON TABLE browser_task_interruptions IS NULL;
COMMENT ON COLUMN browser_task_interruptions.scope_key IS NULL;
COMMENT ON COLUMN browser_task_interruptions.session IS NULL;

COMMENT ON TABLE memory_subjects IS NULL;
COMMENT ON COLUMN memory_subjects.id IS NULL;
COMMENT ON COLUMN memory_subjects.tenant_id IS NULL;
COMMENT ON COLUMN memory_subjects.subject_id IS NULL;
COMMENT ON COLUMN memory_subjects.enabled IS NULL;
COMMENT ON COLUMN memory_subjects.block_text IS NULL;
COMMENT ON COLUMN memory_subjects.block_updated_at IS NULL;
COMMENT ON COLUMN memory_subjects.item_count IS NULL;
COMMENT ON COLUMN memory_subjects.last_extracted_at IS NULL;
COMMENT ON COLUMN memory_subjects.extract_cursor IS NULL;
COMMENT ON COLUMN memory_subjects.pending_sessions IS NULL;
COMMENT ON COLUMN memory_subjects.extract_scheduled_at IS NULL;
COMMENT ON COLUMN memory_subjects.created_at IS NULL;
COMMENT ON COLUMN memory_subjects.updated_at IS NULL;
COMMENT ON COLUMN memory_subjects.consolidated_at IS NULL;
COMMENT ON COLUMN memory_subjects.forced_consolidated_at IS NULL;
COMMENT ON COLUMN memory_subjects.extraction_state IS NULL;

COMMENT ON TABLE memory_items IS NULL;
COMMENT ON COLUMN memory_items.id IS NULL;
COMMENT ON COLUMN memory_items.tenant_id IS NULL;
COMMENT ON COLUMN memory_items.subject_id IS NULL;
COMMENT ON COLUMN memory_items.kind IS NULL;
COMMENT ON COLUMN memory_items.content IS NULL;
COMMENT ON COLUMN memory_items.topic IS NULL;
COMMENT ON COLUMN memory_items.normalized_key IS NULL;
COMMENT ON COLUMN memory_items.importance IS NULL;
COMMENT ON COLUMN memory_items.origin IS NULL;
COMMENT ON COLUMN memory_items.status IS NULL;
COMMENT ON COLUMN memory_items.source_session_id IS NULL;
COMMENT ON COLUMN memory_items.source_message_id IS NULL;
COMMENT ON COLUMN memory_items.valid_from IS NULL;
COMMENT ON COLUMN memory_items.invalid_at IS NULL;
COMMENT ON COLUMN memory_items.expires_at IS NULL;
COMMENT ON COLUMN memory_items.superseded_by IS NULL;
COMMENT ON COLUMN memory_items.last_used_at IS NULL;
COMMENT ON COLUMN memory_items.use_count IS NULL;
COMMENT ON COLUMN memory_items.created_at IS NULL;
COMMENT ON COLUMN memory_items.updated_at IS NULL;
COMMENT ON COLUMN memory_items.replaces_id IS NULL;

COMMENT ON TABLE memory_tombstones IS NULL;
COMMENT ON COLUMN memory_tombstones.id IS NULL;
COMMENT ON COLUMN memory_tombstones.tenant_id IS NULL;
COMMENT ON COLUMN memory_tombstones.subject_id IS NULL;
COMMENT ON COLUMN memory_tombstones.topic IS NULL;
COMMENT ON COLUMN memory_tombstones.fingerprint IS NULL;
COMMENT ON COLUMN memory_tombstones.source_message_id IS NULL;
COMMENT ON COLUMN memory_tombstones.created_at IS NULL;

COMMENT ON TABLE memory_topic_stats IS NULL;
COMMENT ON COLUMN memory_topic_stats.id IS NULL;
COMMENT ON COLUMN memory_topic_stats.tenant_id IS NULL;
COMMENT ON COLUMN memory_topic_stats.subject_id IS NULL;
COMMENT ON COLUMN memory_topic_stats.normalized_key IS NULL;
COMMENT ON COLUMN memory_topic_stats.topic IS NULL;
COMMENT ON COLUMN memory_topic_stats.hits IS NULL;
COMMENT ON COLUMN memory_topic_stats.last_seen_at IS NULL;
COMMENT ON COLUMN memory_topic_stats.promoted_at IS NULL;
COMMENT ON COLUMN memory_topic_stats.created_at IS NULL;
COMMENT ON COLUMN memory_topic_stats.updated_at IS NULL;
COMMENT ON COLUMN memory_topic_stats.aliases IS NULL;

COMMENT ON TABLE memory_doc_affinity IS NULL;
COMMENT ON COLUMN memory_doc_affinity.id IS NULL;
COMMENT ON COLUMN memory_doc_affinity.tenant_id IS NULL;
COMMENT ON COLUMN memory_doc_affinity.subject_id IS NULL;
COMMENT ON COLUMN memory_doc_affinity.knowledge_id IS NULL;
COMMENT ON COLUMN memory_doc_affinity.knowledge_base_id IS NULL;
COMMENT ON COLUMN memory_doc_affinity.title IS NULL;
COMMENT ON COLUMN memory_doc_affinity.hits IS NULL;
COMMENT ON COLUMN memory_doc_affinity.last_used_at IS NULL;
COMMENT ON COLUMN memory_doc_affinity.created_at IS NULL;
COMMENT ON COLUMN memory_doc_affinity.updated_at IS NULL;

COMMENT ON TABLE memory_item_embeddings IS NULL;
COMMENT ON COLUMN memory_item_embeddings.item_id IS NULL;
COMMENT ON COLUMN memory_item_embeddings.tenant_id IS NULL;
COMMENT ON COLUMN memory_item_embeddings.subject_id IS NULL;
COMMENT ON COLUMN memory_item_embeddings.model_id IS NULL;
COMMENT ON COLUMN memory_item_embeddings.dims IS NULL;
COMMENT ON COLUMN memory_item_embeddings.vector IS NULL;
COMMENT ON COLUMN memory_item_embeddings.created_at IS NULL;
COMMENT ON COLUMN memory_item_embeddings.updated_at IS NULL;
COMMENT ON COLUMN memory_item_embeddings.embedding IS NULL;

COMMENT ON TABLE memory_extraction_sessions IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.tenant_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.subject_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.session_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.revision IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.cursor_at IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.cursor_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.pending IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failure_count IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failure_code IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failed_from_at IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failed_from_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failed_to_at IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failed_to_id IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.failed_at IS NULL;
COMMENT ON COLUMN memory_extraction_sessions.updated_at IS NULL;

COMMENT ON COLUMN amp_agents.id IS NULL;
COMMENT ON COLUMN amp_agents.slug IS NULL;
COMMENT ON COLUMN amp_agents.backend_id IS NULL;
COMMENT ON COLUMN amp_agents.name IS NULL;
COMMENT ON COLUMN amp_agents.description IS NULL;
COMMENT ON COLUMN amp_agents.icon IS NULL;
COMMENT ON COLUMN amp_agents.pics IS NULL;
COMMENT ON COLUMN amp_agents.config_json IS NULL;
COMMENT ON COLUMN amp_agents.share_config IS NULL;
COMMENT ON COLUMN amp_agents.is_default IS NULL;
COMMENT ON COLUMN amp_agents.is_subagent IS NULL;
COMMENT ON COLUMN amp_agents.created_by IS NULL;
COMMENT ON COLUMN amp_agents.updated_by IS NULL;
COMMENT ON COLUMN amp_agents.tenant_id IS NULL;
COMMENT ON COLUMN amp_agents.created_at IS NULL;
COMMENT ON COLUMN amp_agents.updated_at IS NULL;

COMMENT ON COLUMN amp_subagent_threads.tenant_id IS NULL;
COMMENT ON COLUMN amp_agent_runs.tenant_id IS NULL;
COMMENT ON COLUMN amp_agent_run_requests.tenant_id IS NULL;

COMMENT ON COLUMN amp_audit_logs.id IS NULL;
COMMENT ON COLUMN amp_audit_logs.user_id IS NULL;
COMMENT ON COLUMN amp_audit_logs.operation IS NULL;
COMMENT ON COLUMN amp_audit_logs.details IS NULL;
COMMENT ON COLUMN amp_audit_logs.ip_address IS NULL;
COMMENT ON COLUMN amp_audit_logs."timestamp" IS NULL;

COMMENT ON COLUMN amp_model_provider.id IS NULL;
COMMENT ON COLUMN amp_model_provider.created_at IS NULL;
COMMENT ON COLUMN amp_model_provider.updated_at IS NULL;

-- 遥测表和内置工具目录可以随本回滚删除。下面这些业务表已经是唯一副本，禁止删除：
-- amp_agents、amp_sessions、amp_messages、amp_tool_calls、amp_agent_runs、
-- amp_agent_run_requests、amp_subagent_threads、amp_audit_logs。

DROP TABLE IF EXISTS amp_skill_runtime CASCADE;
DROP TABLE IF EXISTS amp_builtin_tools CASCADE;
DROP TABLE IF EXISTS amp_agent_usage_daily CASCADE;
DROP TABLE IF EXISTS amp_token_usage_events CASCADE;
DROP TABLE IF EXISTS amp_tool_usage_events CASCADE;
DROP TABLE IF EXISTS amp_agent_usage_events CASCADE;
