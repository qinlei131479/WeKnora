-- 接在 000007_user_account 之后。
-- 同一次迁移完成三件事：把仍在使用的 h_ 运行表复制到 amp_，按复制结果回填用量，再删除旧 h_ 表。
-- 复制、回填、删除在同一个事务里。先锁旧表，避免删除前还有新行写进 h_。
-- 执行前停掉仍读写 h_ 表的旧进程。

DO $$
DECLARE
    old_name text;
BEGIN
    FOREACH old_name IN ARRAY ARRAY[
        'h_agent_envs', 'h_agent_run_requests', 'h_agent_runs', 'h_agents',
        'h_config_options', 'h_conversation_stats', 'h_conversations', 'h_mcp_servers',
        'h_message_feedbacks', 'h_messages', 'h_operation_logs', 'h_skills',
        'h_subagent_threads', 'h_tasks', 'h_tool_calls', 'h_user_config'
    ]
    LOOP
        IF to_regclass('public.' || old_name) IS NOT NULL THEN
            EXECUTE format('LOCK TABLE %I IN ACCESS EXCLUSIVE MODE', old_name);
        END IF;
    END LOOP;
END $$;

CREATE TABLE IF NOT EXISTS amp_agents (LIKE h_agents INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_sessions (LIKE h_conversations INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_subagent_threads (LIKE h_subagent_threads INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_agent_runs (LIKE h_agent_runs INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_messages (LIKE h_messages INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_tool_calls (LIKE h_tool_calls INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_agent_run_requests (LIKE h_agent_run_requests INCLUDING ALL);
CREATE TABLE IF NOT EXISTS amp_audit_logs (LIKE h_operation_logs INCLUDING ALL);

-- LIKE INCLUDING ALL 会复制旧表索引；这里保留主键索引，其余索引交给下方命名索引统一创建。
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN
        SELECT i.schemaname, i.indexname
        FROM pg_indexes AS i
        JOIN pg_class AS c ON c.relname = i.indexname
        JOIN pg_namespace AS n ON n.oid = c.relnamespace
        WHERE i.schemaname = n.nspname
          AND i.tablename IN (
              'amp_agents', 'amp_sessions', 'amp_subagent_threads', 'amp_agent_runs',
              'amp_messages', 'amp_tool_calls', 'amp_agent_run_requests', 'amp_audit_logs'
          )
          AND NOT EXISTS (
              SELECT 1
              FROM pg_constraint AS pc
              WHERE pc.conindid = c.oid
                AND pc.contype = 'p'
          )
    LOOP
        EXECUTE format('DROP INDEX IF EXISTS %I.%I', r.schemaname, r.indexname);
    END LOOP;
END $$;

CREATE SEQUENCE IF NOT EXISTS amp_agents_id_seq AS integer OWNED BY amp_agents.id;
CREATE SEQUENCE IF NOT EXISTS amp_sessions_id_seq AS integer OWNED BY amp_sessions.id;
CREATE SEQUENCE IF NOT EXISTS amp_subagent_threads_id_seq AS integer OWNED BY amp_subagent_threads.id;
CREATE SEQUENCE IF NOT EXISTS amp_messages_id_seq AS integer OWNED BY amp_messages.id;
CREATE SEQUENCE IF NOT EXISTS amp_tool_calls_id_seq AS integer OWNED BY amp_tool_calls.id;
CREATE SEQUENCE IF NOT EXISTS amp_agent_run_requests_id_seq AS integer OWNED BY amp_agent_run_requests.id;
CREATE SEQUENCE IF NOT EXISTS amp_audit_logs_id_seq AS integer OWNED BY amp_audit_logs.id;

ALTER TABLE amp_agents ALTER COLUMN id SET DEFAULT nextval('amp_agents_id_seq');
ALTER TABLE amp_sessions ALTER COLUMN id SET DEFAULT nextval('amp_sessions_id_seq');
ALTER TABLE amp_subagent_threads ALTER COLUMN id SET DEFAULT nextval('amp_subagent_threads_id_seq');
ALTER TABLE amp_messages ALTER COLUMN id SET DEFAULT nextval('amp_messages_id_seq');
ALTER TABLE amp_messages ALTER COLUMN delivery_status SET DEFAULT 'complete';
ALTER TABLE amp_tool_calls ALTER COLUMN id SET DEFAULT nextval('amp_tool_calls_id_seq');
ALTER TABLE amp_agent_run_requests ALTER COLUMN id SET DEFAULT nextval('amp_agent_run_requests_id_seq');
ALTER TABLE amp_audit_logs ALTER COLUMN id SET DEFAULT nextval('amp_audit_logs_id_seq');

INSERT INTO amp_agents (
    id, slug, backend_id, name, description, icon, pics, config_json,
    share_config, is_default, is_subagent, created_by, updated_by,
    tenant_id, created_at, updated_at
)
SELECT
    id, slug, backend_id, name, description, icon, pics, config_json,
    share_config, is_default, is_subagent, created_by, updated_by,
    tenant_id, created_at, updated_at
FROM h_agents
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_sessions (
    id, thread_id, uid, tenant_id, agent_id, title, status, is_pinned,
    created_at, updated_at, extra_metadata
)
SELECT
    id, thread_id, uid, tenant_id, agent_id, title, status, is_pinned,
    created_at, updated_at, extra_metadata
FROM h_conversations
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_subagent_threads (
    id, uid, tenant_id, parent_conversation_id, child_conversation_id,
    child_thread_id, subagent_slug, created_by_run_id, created_at, updated_at
)
SELECT
    id, uid, tenant_id, parent_conversation_id, child_conversation_id,
    child_thread_id, subagent_slug, created_by_run_id, created_at, updated_at
FROM h_subagent_threads
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_agent_runs (
    id, conversation_thread_id, agent_slug, uid, tenant_id, status,
    request_id, source, channel, external_id, origin_metadata,
    conversation_id, created_by_run_id, subagent_thread_relation_id,
    run_type, input_message_id, output_message_id, last_event_id,
    input_payload, error_type, error_message, started_at, finished_at,
    created_at, updated_at
)
SELECT
    id, conversation_thread_id, agent_slug, uid, tenant_id, status,
    request_id, source, channel, external_id, origin_metadata,
    conversation_id, created_by_run_id, subagent_thread_relation_id,
    run_type, input_message_id, output_message_id, last_event_id,
    input_payload, error_type, error_message, started_at, finished_at,
    created_at, updated_at
FROM h_agent_runs
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_messages (
    id, conversation_id, role, content, message_type, created_at,
    token_count, extra_metadata, image_content, run_id, request_id,
    delivery_status
)
SELECT
    id, conversation_id, role, content, message_type, created_at,
    token_count, extra_metadata, image_content, run_id, request_id,
    delivery_status
FROM h_messages
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_tool_calls (
    id, message_id, langgraph_tool_call_id, tool_name, tool_input,
    tool_output, status, error_message, created_at
)
SELECT
    id, message_id, langgraph_tool_call_id, tool_name, tool_input,
    tool_output, status, error_message, created_at
FROM h_tool_calls
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_agent_run_requests (
    id, request_id, uid, tenant_id, agent_slug, conversation_thread_id,
    source, channel, external_id, origin_metadata, queue_policy, status,
    input_message_id, dispatched_run_id, input_payload, error_message,
    created_at, dispatched_at, updated_at
)
SELECT
    id, request_id, uid, tenant_id, agent_slug, conversation_thread_id,
    source, channel, external_id, origin_metadata, queue_policy, status,
    input_message_id, dispatched_run_id, input_payload, error_message,
    created_at, dispatched_at, updated_at
FROM h_agent_run_requests
ON CONFLICT (id) DO NOTHING;

INSERT INTO amp_audit_logs (
    id, user_id, operation, details, ip_address, timestamp
)
SELECT
    id, user_id, operation, details, ip_address, timestamp
FROM h_operation_logs
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_subagent_threads_parent_session_fk'
    ) THEN
        ALTER TABLE amp_subagent_threads ADD CONSTRAINT amp_subagent_threads_parent_session_fk
            FOREIGN KEY (parent_conversation_id) REFERENCES amp_sessions(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_subagent_threads_child_session_fk'
    ) THEN
        ALTER TABLE amp_subagent_threads ADD CONSTRAINT amp_subagent_threads_child_session_fk
            FOREIGN KEY (child_conversation_id) REFERENCES amp_sessions(id) ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_agent_runs_session_fk'
    ) THEN
        ALTER TABLE amp_agent_runs ADD CONSTRAINT amp_agent_runs_session_fk
            FOREIGN KEY (conversation_id) REFERENCES amp_sessions(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_agent_runs_subagent_thread_fk'
    ) THEN
        ALTER TABLE amp_agent_runs ADD CONSTRAINT amp_agent_runs_subagent_thread_fk
            FOREIGN KEY (subagent_thread_relation_id) REFERENCES amp_subagent_threads(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_messages_session_fk'
    ) THEN
        ALTER TABLE amp_messages ADD CONSTRAINT amp_messages_session_fk
            FOREIGN KEY (conversation_id) REFERENCES amp_sessions(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_messages_run_fk'
    ) THEN
        ALTER TABLE amp_messages ADD CONSTRAINT amp_messages_run_fk
            FOREIGN KEY (run_id) REFERENCES amp_agent_runs(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_tool_calls_message_fk'
    ) THEN
        ALTER TABLE amp_tool_calls ADD CONSTRAINT amp_tool_calls_message_fk
            FOREIGN KEY (message_id) REFERENCES amp_messages(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_agent_run_requests_message_fk'
    ) THEN
        ALTER TABLE amp_agent_run_requests ADD CONSTRAINT amp_agent_run_requests_message_fk
            FOREIGN KEY (input_message_id) REFERENCES amp_messages(id);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'amp_agent_run_requests_run_fk'
    ) THEN
        ALTER TABLE amp_agent_run_requests ADD CONSTRAINT amp_agent_run_requests_run_fk
            FOREIGN KEY (dispatched_run_id) REFERENCES amp_agent_runs(id);
    END IF;
END $$;

SELECT setval(pg_get_serial_sequence('amp_agents', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_agents;
SELECT setval(pg_get_serial_sequence('amp_sessions', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_sessions;
SELECT setval(pg_get_serial_sequence('amp_subagent_threads', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_subagent_threads;
SELECT setval(pg_get_serial_sequence('amp_messages', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_messages;
SELECT setval(pg_get_serial_sequence('amp_tool_calls', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_tool_calls;
SELECT setval(pg_get_serial_sequence('amp_agent_run_requests', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_agent_run_requests;
SELECT setval(pg_get_serial_sequence('amp_audit_logs', 'id'), COALESCE(MAX(id), 0) + 1, false) FROM amp_audit_logs;

CREATE INDEX IF NOT EXISTS ix_amp_agents_slug ON amp_agents(slug);
CREATE INDEX IF NOT EXISTS ix_amp_agents_backend_id ON amp_agents(backend_id);
CREATE INDEX IF NOT EXISTS ix_amp_agents_is_default ON amp_agents(is_default);
CREATE INDEX IF NOT EXISTS ix_amp_agents_is_subagent ON amp_agents(is_subagent);
CREATE INDEX IF NOT EXISTS ix_amp_agents_created_by ON amp_agents(created_by);
CREATE INDEX IF NOT EXISTS ix_amp_agents_tenant_id ON amp_agents(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_default ON amp_agents(is_default) WHERE is_default IS TRUE;
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_slug_tenant ON amp_agents(tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_slug_catalog ON amp_agents(slug) WHERE tenant_id IS NULL;

CREATE INDEX IF NOT EXISTS ix_amp_sessions_is_pinned ON amp_sessions(is_pinned);
CREATE INDEX IF NOT EXISTS ix_amp_sessions_uid ON amp_sessions(uid);
CREATE INDEX IF NOT EXISTS ix_amp_sessions_agent_id ON amp_sessions(agent_id);
CREATE INDEX IF NOT EXISTS ix_amp_sessions_tenant_id ON amp_sessions(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_sessions_thread_id ON amp_sessions(thread_id);

CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_uid ON amp_subagent_threads(uid);
CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_parent_conversation_id ON amp_subagent_threads(parent_conversation_id);
CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_subagent_slug ON amp_subagent_threads(subagent_slug);
CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_created_by_run_id ON amp_subagent_threads(created_by_run_id);
CREATE INDEX IF NOT EXISTS ix_amp_subagent_threads_tenant_id ON amp_subagent_threads(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_subagent_threads_child_conversation_id ON amp_subagent_threads(child_conversation_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_subagent_threads_child_thread_id ON amp_subagent_threads(child_thread_id);

CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_conversation_thread_id ON amp_agent_runs(conversation_thread_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_status ON amp_agent_runs(status);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_conversation_id ON amp_agent_runs(conversation_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_agent_slug ON amp_agent_runs(agent_slug);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_created_by_run_id ON amp_agent_runs(created_by_run_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_uid ON amp_agent_runs(uid);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_external_id ON amp_agent_runs(external_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_subagent_thread_relation_id ON amp_agent_runs(subagent_thread_relation_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_runs_tenant_id ON amp_agent_runs(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_agent_runs_request_id ON amp_agent_runs(request_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agent_runs_one_active_per_thread
    ON amp_agent_runs(uid, agent_slug, conversation_thread_id)
    WHERE status NOT IN ('completed', 'failed', 'cancelled', 'interrupted');

CREATE INDEX IF NOT EXISTS ix_amp_messages_conversation_id ON amp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS ix_amp_messages_run_id ON amp_messages(run_id);
CREATE INDEX IF NOT EXISTS ix_amp_messages_request_id ON amp_messages(request_id);

CREATE INDEX IF NOT EXISTS ix_amp_tool_calls_message_id ON amp_tool_calls(message_id);
CREATE INDEX IF NOT EXISTS ix_amp_tool_calls_langgraph_tool_call_id ON amp_tool_calls(langgraph_tool_call_id);

CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_external_id ON amp_agent_run_requests(external_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_tenant_id ON amp_agent_run_requests(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_agent_run_requests_request_id ON amp_agent_run_requests(request_id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_queue
    ON amp_agent_run_requests(uid, agent_slug, conversation_thread_id, status, created_at, id);
CREATE INDEX IF NOT EXISTS ix_amp_agent_run_requests_queue_tenant
    ON amp_agent_run_requests(tenant_id, uid, agent_slug, conversation_thread_id, status, created_at, id);
CREATE INDEX IF NOT EXISTS idx_amp_agent_runs_tenant_thread
    ON amp_agent_runs(tenant_id, uid, agent_slug, conversation_thread_id);

COMMENT ON INDEX ix_amp_agents_slug IS '按智能体 slug 加速目录查询';
COMMENT ON INDEX ix_amp_agents_backend_id IS '按执行后端筛选智能体';
COMMENT ON INDEX ix_amp_agents_is_default IS '按默认智能体标记查询';
COMMENT ON INDEX ix_amp_agents_is_subagent IS '区分主智能体和子智能体';
COMMENT ON INDEX ix_amp_agents_created_by IS '按创建人查询智能体';
COMMENT ON INDEX ix_amp_agents_tenant_id IS '按工作空间隔离智能体';
COMMENT ON INDEX uq_amp_agents_default IS '保证全目录最多一个默认智能体';
COMMENT ON INDEX uq_amp_agents_slug_tenant IS '同一工作空间内智能体 slug 唯一';
COMMENT ON INDEX uq_amp_agents_slug_catalog IS '平台目录内智能体 slug 唯一';

COMMENT ON INDEX ix_amp_sessions_is_pinned IS '加速置顶会话筛选';
COMMENT ON INDEX ix_amp_sessions_uid IS '按用户查询会话';
COMMENT ON INDEX ix_amp_sessions_agent_id IS '按智能体查询会话';
COMMENT ON INDEX ix_amp_sessions_tenant_id IS '按工作空间隔离会话';
COMMENT ON INDEX ix_amp_sessions_thread_id IS '保证运行线程 ID 唯一并加速定位';

COMMENT ON INDEX ix_amp_subagent_threads_uid IS '按用户查询子智能体线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_parent_conversation_id IS '按父会话查询子智能体线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_subagent_slug IS '按子智能体筛选线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_created_by_run_id IS '按创建运行追溯子智能体线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_tenant_id IS '按工作空间隔离子智能体线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_child_conversation_id IS '保证一个子会话只属于一条线程关系';
COMMENT ON INDEX ix_amp_subagent_threads_child_thread_id IS '保证子线程 ID 唯一并加速定位';

COMMENT ON INDEX ix_amp_agent_runs_conversation_thread_id IS '按会话线程查询运行记录';
COMMENT ON INDEX ix_amp_agent_runs_status IS '按运行状态筛选和监控';
COMMENT ON INDEX ix_amp_agent_runs_conversation_id IS '按会话 ID 查询运行记录';
COMMENT ON INDEX ix_amp_agent_runs_agent_slug IS '按智能体统计和查询运行记录';
COMMENT ON INDEX ix_amp_agent_runs_created_by_run_id IS '追溯父运行创建的子运行';
COMMENT ON INDEX ix_amp_agent_runs_uid IS '按用户查询运行记录';
COMMENT ON INDEX ix_amp_agent_runs_external_id IS '按来源外部 ID 定位运行记录';
COMMENT ON INDEX ix_amp_agent_runs_subagent_thread_relation_id IS '按子智能体线程关系查询运行记录';
COMMENT ON INDEX ix_amp_agent_runs_tenant_id IS '按工作空间隔离运行记录';
COMMENT ON INDEX ix_amp_agent_runs_request_id IS '保证运行幂等请求 ID 唯一并加速定位';
COMMENT ON INDEX uq_amp_agent_runs_one_active_per_thread IS '保证同一会话线程同一智能体只有一个活跃运行';

COMMENT ON INDEX ix_amp_messages_conversation_id IS '按会话加载消息列表';
COMMENT ON INDEX ix_amp_messages_run_id IS '按运行追溯消息';
COMMENT ON INDEX ix_amp_messages_request_id IS '按幂等请求定位消息';

COMMENT ON INDEX ix_amp_tool_calls_message_id IS '按消息加载工具调用明细';
COMMENT ON INDEX ix_amp_tool_calls_langgraph_tool_call_id IS '按 LangGraph 工具调用 ID 对齐结果';

COMMENT ON INDEX ix_amp_agent_run_requests_external_id IS '按来源外部 ID 定位排队请求';
COMMENT ON INDEX ix_amp_agent_run_requests_tenant_id IS '按工作空间隔离排队请求';
COMMENT ON INDEX ix_amp_agent_run_requests_request_id IS '保证排队请求幂等 ID 唯一';
COMMENT ON INDEX ix_amp_agent_run_requests_queue IS '按队列维度加载待派发请求';
COMMENT ON INDEX ix_amp_agent_run_requests_queue_tenant IS '在租户隔离下加载待派发请求';
COMMENT ON INDEX idx_amp_agent_runs_tenant_thread IS '在租户隔离下按线程和智能体分析运行';

COMMENT ON TABLE amp_agents IS 'Harness 智能体主表：保存智能体配置、共享状态和运行标识';
COMMENT ON COLUMN amp_agents.id IS '智能体自增主键';
COMMENT ON COLUMN amp_agents.slug IS '智能体稳定标识，历史数据与接口引用使用该值';
COMMENT ON COLUMN amp_agents.backend_id IS '执行后端标识';
COMMENT ON COLUMN amp_agents.name IS '智能体展示名称';
COMMENT ON COLUMN amp_agents.description IS '智能体描述';
COMMENT ON COLUMN amp_agents.icon IS '智能体图标地址';
COMMENT ON COLUMN amp_agents.pics IS '智能体配图地址列表';
COMMENT ON COLUMN amp_agents.config_json IS '智能体运行配置';
COMMENT ON COLUMN amp_agents.share_config IS '智能体共享与授权配置';
COMMENT ON COLUMN amp_agents.is_default IS '是否默认智能体';
COMMENT ON COLUMN amp_agents.is_subagent IS '是否子智能体';
COMMENT ON COLUMN amp_agents.created_by IS '创建人用户标识';
COMMENT ON COLUMN amp_agents.updated_by IS '最近更新人用户标识';
COMMENT ON COLUMN amp_agents.tenant_id IS '所属工作空间 ID；空值表示平台目录';
COMMENT ON COLUMN amp_agents.created_at IS '创建时间';
COMMENT ON COLUMN amp_agents.updated_at IS '最后更新时间';

COMMENT ON TABLE amp_sessions IS 'Harness 运行时会话主表，对应原 conversations 数据';
COMMENT ON COLUMN amp_sessions.id IS '会话自增主键';
COMMENT ON COLUMN amp_sessions.thread_id IS '运行时线程 ID';
COMMENT ON COLUMN amp_sessions.uid IS '所属用户标识';
COMMENT ON COLUMN amp_sessions.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_sessions.agent_id IS '会话绑定的智能体 slug；字段名保留历史协议';
COMMENT ON COLUMN amp_sessions.title IS '会话标题';
COMMENT ON COLUMN amp_sessions.status IS '会话状态：active/archived/deleted';
COMMENT ON COLUMN amp_sessions.is_pinned IS '是否置顶';
COMMENT ON COLUMN amp_sessions.created_at IS '创建时间';
COMMENT ON COLUMN amp_sessions.updated_at IS '最后更新时间';
COMMENT ON COLUMN amp_sessions.extra_metadata IS '会话扩展元数据';

COMMENT ON TABLE amp_subagent_threads IS '子智能体线程与会话归属关系表';
COMMENT ON COLUMN amp_subagent_threads.id IS '子智能体线程关系自增主键';
COMMENT ON COLUMN amp_subagent_threads.uid IS '所属用户标识';
COMMENT ON COLUMN amp_subagent_threads.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_subagent_threads.parent_conversation_id IS '父会话 ID';
COMMENT ON COLUMN amp_subagent_threads.child_conversation_id IS '子会话 ID';
COMMENT ON COLUMN amp_subagent_threads.child_thread_id IS '子线程 ID';
COMMENT ON COLUMN amp_subagent_threads.subagent_slug IS '子智能体 slug';
COMMENT ON COLUMN amp_subagent_threads.created_by_run_id IS '创建该关系的运行 ID';
COMMENT ON COLUMN amp_subagent_threads.created_at IS '创建时间';
COMMENT ON COLUMN amp_subagent_threads.updated_at IS '最后更新时间';

COMMENT ON TABLE amp_agent_runs IS '智能体运行生命周期主表';
COMMENT ON COLUMN amp_agent_runs.id IS '运行 UUID 主键';
COMMENT ON COLUMN amp_agent_runs.conversation_thread_id IS '会话线程 ID 快照';
COMMENT ON COLUMN amp_agent_runs.agent_slug IS '执行智能体 slug';
COMMENT ON COLUMN amp_agent_runs.uid IS '发起用户标识';
COMMENT ON COLUMN amp_agent_runs.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_agent_runs.status IS '运行状态：pending/running/completed/failed/cancel_requested/cancelled/interrupted';
COMMENT ON COLUMN amp_agent_runs.request_id IS '幂等请求 ID';
COMMENT ON COLUMN amp_agent_runs.source IS '请求来源快照';
COMMENT ON COLUMN amp_agent_runs.channel IS '请求通道快照';
COMMENT ON COLUMN amp_agent_runs.external_id IS '来源侧外部消息或调用 ID';
COMMENT ON COLUMN amp_agent_runs.origin_metadata IS '不可变来源元数据';
COMMENT ON COLUMN amp_agent_runs.conversation_id IS '会话 ID';
COMMENT ON COLUMN amp_agent_runs.created_by_run_id IS '父运行 ID；普通运行为空';
COMMENT ON COLUMN amp_agent_runs.subagent_thread_relation_id IS '子智能体线程关系 ID';
COMMENT ON COLUMN amp_agent_runs.run_type IS '运行类型：chat/resume/subagent';
COMMENT ON COLUMN amp_agent_runs.input_message_id IS '输入消息 ID';
COMMENT ON COLUMN amp_agent_runs.output_message_id IS '输出消息 ID';
COMMENT ON COLUMN amp_agent_runs.last_event_id IS '最后的 Redis Stream 事件 ID';
COMMENT ON COLUMN amp_agent_runs.input_payload IS '原始输入载荷';
COMMENT ON COLUMN amp_agent_runs.error_type IS '错误类型';
COMMENT ON COLUMN amp_agent_runs.error_message IS '错误信息';
COMMENT ON COLUMN amp_agent_runs.started_at IS '开始时间';
COMMENT ON COLUMN amp_agent_runs.finished_at IS '结束时间';
COMMENT ON COLUMN amp_agent_runs.created_at IS '创建时间';
COMMENT ON COLUMN amp_agent_runs.updated_at IS '最后更新时间';

COMMENT ON TABLE amp_messages IS 'Harness 运行时消息主表';
COMMENT ON COLUMN amp_messages.id IS '消息自增主键';
COMMENT ON COLUMN amp_messages.conversation_id IS '所属会话 ID';
COMMENT ON COLUMN amp_messages.role IS '消息角色：user/assistant/system/tool';
COMMENT ON COLUMN amp_messages.content IS '消息内容';
COMMENT ON COLUMN amp_messages.message_type IS '消息类型：text/tool_call/tool_result';
COMMENT ON COLUMN amp_messages.created_at IS '创建时间';
COMMENT ON COLUMN amp_messages.token_count IS '消息粗粒度 token 数；精确消耗以遥测表为准';
COMMENT ON COLUMN amp_messages.extra_metadata IS '消息完整扩展元数据';
COMMENT ON COLUMN amp_messages.image_content IS '多模态图片内容';
COMMENT ON COLUMN amp_messages.run_id IS '关联运行 ID';
COMMENT ON COLUMN amp_messages.request_id IS '幂等请求 ID';
COMMENT ON COLUMN amp_messages.delivery_status IS '消息投递状态';

COMMENT ON TABLE amp_tool_calls IS '会话内工具调用过程明细表';
COMMENT ON COLUMN amp_tool_calls.id IS '工具调用自增主键';
COMMENT ON COLUMN amp_tool_calls.message_id IS '所属消息 ID';
COMMENT ON COLUMN amp_tool_calls.langgraph_tool_call_id IS 'LangGraph 工具调用 ID';
COMMENT ON COLUMN amp_tool_calls.tool_name IS '工具名称';
COMMENT ON COLUMN amp_tool_calls.tool_input IS '工具输入参数';
COMMENT ON COLUMN amp_tool_calls.tool_output IS '工具执行结果';
COMMENT ON COLUMN amp_tool_calls.status IS '执行状态：pending/success/error';
COMMENT ON COLUMN amp_tool_calls.error_message IS '失败信息';
COMMENT ON COLUMN amp_tool_calls.created_at IS '创建时间';

COMMENT ON TABLE amp_agent_run_requests IS '智能体请求排队、幂等和取消链路表';
COMMENT ON COLUMN amp_agent_run_requests.id IS '请求自增主键，用于 FIFO 排序';
COMMENT ON COLUMN amp_agent_run_requests.request_id IS '幂等请求 ID';
COMMENT ON COLUMN amp_agent_run_requests.uid IS '发起用户标识';
COMMENT ON COLUMN amp_agent_run_requests.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_agent_run_requests.agent_slug IS '目标智能体 slug';
COMMENT ON COLUMN amp_agent_run_requests.conversation_thread_id IS '目标会话线程 ID';
COMMENT ON COLUMN amp_agent_run_requests.source IS '请求来源：chat/agent_call/eval';
COMMENT ON COLUMN amp_agent_run_requests.channel IS '请求通道：web/api/im/internal';
COMMENT ON COLUMN amp_agent_run_requests.external_id IS '来源侧消息或调用 ID';
COMMENT ON COLUMN amp_agent_run_requests.origin_metadata IS '来源元数据快照';
COMMENT ON COLUMN amp_agent_run_requests.queue_policy IS '排队策略：enqueue/reject/steer';
COMMENT ON COLUMN amp_agent_run_requests.status IS '请求状态：queued/dispatched/cancelled/rejected/failed';
COMMENT ON COLUMN amp_agent_run_requests.input_message_id IS '输入消息 ID';
COMMENT ON COLUMN amp_agent_run_requests.dispatched_run_id IS '派发运行 ID';
COMMENT ON COLUMN amp_agent_run_requests.input_payload IS '原始输入载荷快照';
COMMENT ON COLUMN amp_agent_run_requests.error_message IS '拒绝或失败原因';
COMMENT ON COLUMN amp_agent_run_requests.created_at IS '创建时间';
COMMENT ON COLUMN amp_agent_run_requests.dispatched_at IS '派发时间';
COMMENT ON COLUMN amp_agent_run_requests.updated_at IS '最后更新时间';

COMMENT ON TABLE amp_audit_logs IS 'Harness 审计日志表';
COMMENT ON COLUMN amp_audit_logs.id IS '审计日志自增主键';
COMMENT ON COLUMN amp_audit_logs.user_id IS '操作用户标识；系统操作可为空';
COMMENT ON COLUMN amp_audit_logs.operation IS '操作类型';
COMMENT ON COLUMN amp_audit_logs.details IS '操作详情';
COMMENT ON COLUMN amp_audit_logs.ip_address IS '操作来源 IP';
COMMENT ON COLUMN amp_audit_logs.timestamp IS '操作时间';

CREATE TABLE IF NOT EXISTS amp_agent_usage_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    tenant_id BIGINT,
    uid VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    run_id VARCHAR(64),
    session_id INTEGER,
    event_type VARCHAR(32) NOT NULL,
    run_type VARCHAR(32) NOT NULL DEFAULT 'chat',
    is_subagent BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(32) NOT NULL,
    duration_ms BIGINT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_type VARCHAR(64),
    error_message TEXT,
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agent_usage_events_event_id ON amp_agent_usage_events(event_id);
CREATE INDEX IF NOT EXISTS idx_amp_agent_usage_events_dimensions
    ON amp_agent_usage_events(tenant_id, agent_id, occurred_at);
CREATE INDEX IF NOT EXISTS idx_amp_agent_usage_events_run ON amp_agent_usage_events(run_id);
COMMENT ON INDEX uq_amp_agent_usage_events_event_id IS '保证运行事件幂等';
COMMENT ON INDEX idx_amp_agent_usage_events_dimensions IS '按租户、智能体和时间聚合运行事件';
COMMENT ON INDEX idx_amp_agent_usage_events_run IS '按运行 ID 关联事件';
COMMENT ON TABLE amp_agent_usage_events IS '智能体运行遥测事实表：只追加运行生命周期事件';
COMMENT ON COLUMN amp_agent_usage_events.id IS '运行事件自增主键';
COMMENT ON COLUMN amp_agent_usage_events.event_id IS '事件唯一 ID';
COMMENT ON COLUMN amp_agent_usage_events.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_agent_usage_events.uid IS '用户标识';
COMMENT ON COLUMN amp_agent_usage_events.agent_id IS '智能体 slug';
COMMENT ON COLUMN amp_agent_usage_events.run_id IS '运行 ID';
COMMENT ON COLUMN amp_agent_usage_events.session_id IS '会话 ID';
COMMENT ON COLUMN amp_agent_usage_events.event_type IS '事件类型：start/succeed/fail/cancel';
COMMENT ON COLUMN amp_agent_usage_events.run_type IS '运行类型：chat/resume/subagent';
COMMENT ON COLUMN amp_agent_usage_events.is_subagent IS '是否子智能体运行';
COMMENT ON COLUMN amp_agent_usage_events.status IS '事件状态';
COMMENT ON COLUMN amp_agent_usage_events.duration_ms IS '运行耗时毫秒数';
COMMENT ON COLUMN amp_agent_usage_events.retry_count IS '重试次数';
COMMENT ON COLUMN amp_agent_usage_events.error_type IS '错误类型';
COMMENT ON COLUMN amp_agent_usage_events.error_message IS '错误信息';
COMMENT ON COLUMN amp_agent_usage_events.event_metadata IS '事件扩展元数据';
COMMENT ON COLUMN amp_agent_usage_events.occurred_at IS '业务发生时间';
COMMENT ON COLUMN amp_agent_usage_events.created_at IS '入库时间';

CREATE TABLE IF NOT EXISTS amp_tool_usage_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    tenant_id BIGINT,
    uid VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    run_id VARCHAR(64),
    session_id INTEGER,
    message_id INTEGER,
    tool_call_id INTEGER,
    capability_type VARCHAR(32) NOT NULL DEFAULT 'builtin',
    tool_name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL,
    duration_ms BIGINT,
    error_type VARCHAR(64),
    error_code VARCHAR(64),
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_tool_usage_events_event_id ON amp_tool_usage_events(event_id);
CREATE INDEX IF NOT EXISTS idx_amp_tool_usage_events_dimensions
    ON amp_tool_usage_events(tenant_id, agent_id, tool_name, occurred_at);
CREATE INDEX IF NOT EXISTS idx_amp_tool_usage_events_run ON amp_tool_usage_events(run_id);
COMMENT ON INDEX uq_amp_tool_usage_events_event_id IS '保证工具事件幂等';
COMMENT ON INDEX idx_amp_tool_usage_events_dimensions IS '按租户、智能体、工具和时间聚合工具事件';
COMMENT ON INDEX idx_amp_tool_usage_events_run IS '按运行 ID 关联工具事件';
COMMENT ON TABLE amp_tool_usage_events IS '工具使用遥测事实表：覆盖内置工具、MCP 和 Skill 工具';
COMMENT ON COLUMN amp_tool_usage_events.id IS '工具事件自增主键';
COMMENT ON COLUMN amp_tool_usage_events.event_id IS '事件唯一 ID';
COMMENT ON COLUMN amp_tool_usage_events.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_tool_usage_events.uid IS '用户标识';
COMMENT ON COLUMN amp_tool_usage_events.agent_id IS '智能体 slug';
COMMENT ON COLUMN amp_tool_usage_events.run_id IS '运行 ID';
COMMENT ON COLUMN amp_tool_usage_events.session_id IS '会话 ID';
COMMENT ON COLUMN amp_tool_usage_events.message_id IS '消息 ID';
COMMENT ON COLUMN amp_tool_usage_events.tool_call_id IS '工具调用明细 ID';
COMMENT ON COLUMN amp_tool_usage_events.capability_type IS '能力类型：builtin/mcp/skill';
COMMENT ON COLUMN amp_tool_usage_events.tool_name IS '工具名称';
COMMENT ON COLUMN amp_tool_usage_events.status IS '执行状态：success/error/cancelled';
COMMENT ON COLUMN amp_tool_usage_events.duration_ms IS '执行耗时毫秒数';
COMMENT ON COLUMN amp_tool_usage_events.error_type IS '错误类型';
COMMENT ON COLUMN amp_tool_usage_events.error_code IS '错误码';
COMMENT ON COLUMN amp_tool_usage_events.event_metadata IS '事件扩展元数据';
COMMENT ON COLUMN amp_tool_usage_events.occurred_at IS '业务发生时间';
COMMENT ON COLUMN amp_tool_usage_events.created_at IS '入库时间';

CREATE TABLE IF NOT EXISTS amp_token_usage_events (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(64) NOT NULL,
    tenant_id BIGINT,
    uid VARCHAR(64) NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    run_id VARCHAR(64),
    session_id INTEGER,
    message_id INTEGER,
    model VARCHAR(128) NOT NULL,
    prompt_tokens BIGINT NOT NULL DEFAULT 0,
    completion_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    event_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_token_usage_events_event_id ON amp_token_usage_events(event_id);
CREATE INDEX IF NOT EXISTS idx_amp_token_usage_events_dimensions
    ON amp_token_usage_events(tenant_id, agent_id, model, occurred_at);
CREATE INDEX IF NOT EXISTS idx_amp_token_usage_events_run ON amp_token_usage_events(run_id);
COMMENT ON INDEX uq_amp_token_usage_events_event_id IS '保证 token 事件幂等';
COMMENT ON INDEX idx_amp_token_usage_events_dimensions IS '按租户、智能体、模型和时间聚合 token 消耗';
COMMENT ON INDEX idx_amp_token_usage_events_run IS '按运行 ID 关联 token 事件';
COMMENT ON TABLE amp_token_usage_events IS '模型 token 遥测事实表：保存每次模型调用的精确消耗';
COMMENT ON COLUMN amp_token_usage_events.id IS 'token 事件自增主键';
COMMENT ON COLUMN amp_token_usage_events.event_id IS '事件唯一 ID';
COMMENT ON COLUMN amp_token_usage_events.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_token_usage_events.uid IS '用户标识';
COMMENT ON COLUMN amp_token_usage_events.agent_id IS '智能体 slug';
COMMENT ON COLUMN amp_token_usage_events.run_id IS '运行 ID';
COMMENT ON COLUMN amp_token_usage_events.session_id IS '会话 ID';
COMMENT ON COLUMN amp_token_usage_events.message_id IS '消息 ID';
COMMENT ON COLUMN amp_token_usage_events.model IS '模型名称';
COMMENT ON COLUMN amp_token_usage_events.prompt_tokens IS '输入 token 数';
COMMENT ON COLUMN amp_token_usage_events.completion_tokens IS '输出 token 数';
COMMENT ON COLUMN amp_token_usage_events.total_tokens IS '总 token 数';
COMMENT ON COLUMN amp_token_usage_events.event_metadata IS '事件扩展元数据';
COMMENT ON COLUMN amp_token_usage_events.occurred_at IS '业务发生时间';
COMMENT ON COLUMN amp_token_usage_events.created_at IS '入库时间';

CREATE TABLE IF NOT EXISTS amp_agent_usage_daily (
    id BIGSERIAL PRIMARY KEY,
    stat_date DATE NOT NULL,
    tenant_id BIGINT NOT NULL,
    agent_id VARCHAR(64) NOT NULL,
    session_count BIGINT NOT NULL DEFAULT 0,
    message_count BIGINT NOT NULL DEFAULT 0,
    run_count BIGINT NOT NULL DEFAULT 0,
    success_count BIGINT NOT NULL DEFAULT 0,
    failure_count BIGINT NOT NULL DEFAULT 0,
    cancelled_count BIGINT NOT NULL DEFAULT 0,
    tool_call_count BIGINT NOT NULL DEFAULT 0,
    tool_success_count BIGINT NOT NULL DEFAULT 0,
    total_duration_ms BIGINT NOT NULL DEFAULT 0,
    max_duration_ms BIGINT NOT NULL DEFAULT 0,
    prompt_tokens BIGINT NOT NULL DEFAULT 0,
    completion_tokens BIGINT NOT NULL DEFAULT 0,
    total_tokens BIGINT NOT NULL DEFAULT 0,
    score NUMERIC(12, 4) NOT NULL DEFAULT 0,
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agent_usage_daily_dimensions
    ON amp_agent_usage_daily(stat_date, tenant_id, agent_id);
COMMENT ON INDEX uq_amp_agent_usage_daily_dimensions IS '保证每日每租户每智能体只有一条聚合记录';
COMMENT ON TABLE amp_agent_usage_daily IS '智能体按天聚合表：服务数据总览和最佳智能体 TOP 5';
COMMENT ON COLUMN amp_agent_usage_daily.id IS '聚合记录自增主键';
COMMENT ON COLUMN amp_agent_usage_daily.stat_date IS '统计日期';
COMMENT ON COLUMN amp_agent_usage_daily.tenant_id IS '所属工作空间 ID';
COMMENT ON COLUMN amp_agent_usage_daily.agent_id IS '智能体 slug';
COMMENT ON COLUMN amp_agent_usage_daily.session_count IS '活跃会话数';
COMMENT ON COLUMN amp_agent_usage_daily.message_count IS '消息数';
COMMENT ON COLUMN amp_agent_usage_daily.run_count IS '运行数';
COMMENT ON COLUMN amp_agent_usage_daily.success_count IS '成功运行数';
COMMENT ON COLUMN amp_agent_usage_daily.failure_count IS '失败运行数';
COMMENT ON COLUMN amp_agent_usage_daily.cancelled_count IS '取消运行数';
COMMENT ON COLUMN amp_agent_usage_daily.tool_call_count IS '工具调用数';
COMMENT ON COLUMN amp_agent_usage_daily.tool_success_count IS '工具成功数';
COMMENT ON COLUMN amp_agent_usage_daily.total_duration_ms IS '运行总耗时毫秒数';
COMMENT ON COLUMN amp_agent_usage_daily.max_duration_ms IS '运行最大耗时毫秒数';
COMMENT ON COLUMN amp_agent_usage_daily.prompt_tokens IS '输入 token 总数';
COMMENT ON COLUMN amp_agent_usage_daily.completion_tokens IS '输出 token 总数';
COMMENT ON COLUMN amp_agent_usage_daily.total_tokens IS '总 token 数';
COMMENT ON COLUMN amp_agent_usage_daily.score IS '综合评分，用于最佳智能体排序';
COMMENT ON COLUMN amp_agent_usage_daily.computed_at IS '聚合计算时间';

CREATE TABLE IF NOT EXISTS amp_builtin_tools (
    id BIGSERIAL PRIMARY KEY,
    tool_slug VARCHAR(128) NOT NULL,
    capability_key VARCHAR(191) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category VARCHAR(64) NOT NULL DEFAULT 'general',
    input_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    source VARCHAR(32) NOT NULL DEFAULT 'work',
    version VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_builtin_tools_slug_source
    ON amp_builtin_tools(tool_slug, source);
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_builtin_tools_capability ON amp_builtin_tools(capability_key);
COMMENT ON INDEX uq_amp_builtin_tools_slug_source IS '同一工具标识可按 chat/work 各保留一份目录';
COMMENT ON INDEX uq_amp_builtin_tools_capability IS '保证统一能力标识唯一';
COMMENT ON TABLE amp_builtin_tools IS 'Harness 内置工具只读目录，用于统一预览、依赖解析和统计';
COMMENT ON COLUMN amp_builtin_tools.id IS '内置工具目录自增主键';
COMMENT ON COLUMN amp_builtin_tools.tool_slug IS '工具稳定标识';
COMMENT ON COLUMN amp_builtin_tools.capability_key IS '统一能力标识';
COMMENT ON COLUMN amp_builtin_tools.name IS '工具展示名称';
COMMENT ON COLUMN amp_builtin_tools.description IS '工具描述';
COMMENT ON COLUMN amp_builtin_tools.category IS '工具分类';
COMMENT ON COLUMN amp_builtin_tools.input_schema IS '工具输入 JSON Schema';
COMMENT ON COLUMN amp_builtin_tools.enabled IS '是否启用';
COMMENT ON COLUMN amp_builtin_tools.source IS '目录来源；chat 为平台侧，work 为 Harness 侧';
COMMENT ON COLUMN amp_builtin_tools.capability_key IS '来源前缀 + 工具标识的能力键';
COMMENT ON COLUMN amp_builtin_tools.version IS '工具版本';
COMMENT ON COLUMN amp_builtin_tools.created_at IS '创建时间';
COMMENT ON COLUMN amp_builtin_tools.updated_at IS '最后更新时间';

COMMENT ON INDEX amp_agents_pkey IS '智能体主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_sessions_pkey IS '会话主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_subagent_threads_pkey IS '子智能体线程主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_agent_runs_pkey IS '智能体运行主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_messages_pkey IS '消息主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_tool_calls_pkey IS '工具调用主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_agent_run_requests_pkey IS '运行请求主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_audit_logs_pkey IS '审计日志主键索引，按 ID 精确定位记录';
COMMENT ON INDEX amp_agent_usage_events_pkey IS '智能体遥测事件主键索引，保证事件 ID 定位';
COMMENT ON INDEX amp_tool_usage_events_pkey IS '工具遥测事件主键索引，保证事件 ID 定位';
COMMENT ON INDEX amp_token_usage_events_pkey IS 'Token 遥测事件主键索引，保证事件 ID 定位';
COMMENT ON INDEX amp_agent_usage_daily_pkey IS '智能体日聚合主键索引，保证统计维度唯一';
COMMENT ON INDEX amp_builtin_tools_pkey IS '内置工具目录主键索引，按 ID 精确定位记录';
-- 补充 0.8.0 新增对象和 amp 统一表的注释。

COMMENT ON COLUMN messages.artifacts IS '消息产物';
COMMENT ON COLUMN messages.used_memories IS '引用记忆';
COMMENT ON COLUMN messages.usage IS 'Token 用量';
COMMENT ON COLUMN tenants.memory_config IS '记忆配置';

COMMENT ON TABLE tenant_sandbox_configs IS '租户沙箱配置';
COMMENT ON COLUMN tenant_sandbox_configs.id IS '主键';
COMMENT ON COLUMN tenant_sandbox_configs.tenant_id IS '租户 ID';
COMMENT ON COLUMN tenant_sandbox_configs.name IS '配置名称';
COMMENT ON COLUMN tenant_sandbox_configs.description IS '配置描述';
COMMENT ON COLUMN tenant_sandbox_configs.sandbox_type IS '沙箱类型';
COMMENT ON COLUMN tenant_sandbox_configs.created_at IS '创建时间';
COMMENT ON COLUMN tenant_sandbox_configs.updated_at IS '更新时间';
COMMENT ON COLUMN tenant_sandbox_configs.deleted_at IS '删除时间';

COMMENT ON TABLE tenant_skills IS '租户技能安装';
COMMENT ON COLUMN tenant_skills.id IS '主键';
COMMENT ON COLUMN tenant_skills.tenant_id IS '租户 ID';
COMMENT ON COLUMN tenant_skills.sandbox_config_id IS '沙箱配置 ID';
COMMENT ON COLUMN tenant_skills.version IS '技能版本';
COMMENT ON COLUMN tenant_skills.description IS '技能描述';
COMMENT ON COLUMN tenant_skills.instructions IS '技能指令';
COMMENT ON COLUMN tenant_skills.bundle_ref IS '技能包引用';
COMMENT ON COLUMN tenant_skills.bundle_sha256 IS '技能包哈希';
COMMENT ON COLUMN tenant_skills.installed_snapshot_id IS '安装快照 ID';
COMMENT ON COLUMN tenant_skills.status IS '安装状态';
COMMENT ON COLUMN tenant_skills.error IS '安装错误';
COMMENT ON COLUMN tenant_skills.installing_since IS '安装开始时间';
COMMENT ON COLUMN tenant_skills.created_at IS '创建时间';
COMMENT ON COLUMN tenant_skills.updated_at IS '更新时间';
COMMENT ON COLUMN tenant_skills.deleted_at IS '删除时间';
COMMENT ON COLUMN tenant_skills.catalog_id IS '技能目录 ID';

COMMENT ON COLUMN tenant_skill_snapshots.id IS '主键';
COMMENT ON COLUMN tenant_skill_snapshots.tenant_id IS '租户 ID';
COMMENT ON COLUMN tenant_skill_snapshots.sandbox_config_id IS '沙箱配置 ID';
COMMENT ON COLUMN tenant_skill_snapshots.skill_id IS '技能 ID';
COMMENT ON COLUMN tenant_skill_snapshots.snapshot_id IS '快照 ID';
COMMENT ON COLUMN tenant_skill_snapshots.parent_snapshot_id IS '父快照 ID';
COMMENT ON COLUMN tenant_skill_snapshots.generation IS '快照代数';
COMMENT ON COLUMN tenant_skill_snapshots.trigger IS '触发方式';
COMMENT ON COLUMN tenant_skill_snapshots.state IS '快照状态';
COMMENT ON COLUMN tenant_skill_snapshots.superseded_at IS '替换时间';
COMMENT ON COLUMN tenant_skill_snapshots.created_at IS '创建时间';
COMMENT ON COLUMN tenant_skill_snapshots.updated_at IS '更新时间';

COMMENT ON COLUMN tenant_skill_catalog.id IS '主键';
COMMENT ON COLUMN tenant_skill_catalog.tenant_id IS '租户 ID';
COMMENT ON COLUMN tenant_skill_catalog.name IS '技能名称';
COMMENT ON COLUMN tenant_skill_catalog.version IS '技能版本';
COMMENT ON COLUMN tenant_skill_catalog.description IS '技能描述';
COMMENT ON COLUMN tenant_skill_catalog.instructions IS '技能指令';
COMMENT ON COLUMN tenant_skill_catalog.bundle_ref IS '技能包引用';
COMMENT ON COLUMN tenant_skill_catalog.bundle_sha256 IS '技能包哈希';
COMMENT ON COLUMN tenant_skill_catalog.created_at IS '创建时间';
COMMENT ON COLUMN tenant_skill_catalog.updated_at IS '更新时间';
COMMENT ON COLUMN tenant_skill_catalog.deleted_at IS '删除时间';

COMMENT ON COLUMN tenant_user_env_vars.id IS '主键';
COMMENT ON COLUMN tenant_user_env_vars.tenant_id IS '租户 ID';
COMMENT ON COLUMN tenant_user_env_vars.principal_type IS '主体类型';
COMMENT ON COLUMN tenant_user_env_vars.principal_id IS '主体 ID';
COMMENT ON COLUMN tenant_user_env_vars.sandbox_config_id IS '沙箱配置 ID';
COMMENT ON COLUMN tenant_user_env_vars.skill_id IS '技能 ID';
COMMENT ON COLUMN tenant_user_env_vars.name IS '变量名称';
COMMENT ON COLUMN tenant_user_env_vars.created_at IS '创建时间';
COMMENT ON COLUMN tenant_user_env_vars.updated_at IS '更新时间';

COMMENT ON COLUMN mcp_services.usage_instructions IS '使用说明';
COMMENT ON COLUMN mcp_tool_approvals.enabled IS '是否启用审批';
COMMENT ON TABLE mcp_metadata IS 'MCP 工具同步元数据';
COMMENT ON COLUMN mcp_metadata.tenant_id IS '租户 ID';
COMMENT ON COLUMN mcp_metadata.service_id IS 'MCP 服务 ID';
COMMENT ON COLUMN mcp_metadata.principal IS '访问主体';
COMMENT ON COLUMN mcp_metadata.config_fingerprint IS '配置指纹';
COMMENT ON COLUMN mcp_metadata.tools IS '工具清单';
COMMENT ON COLUMN mcp_metadata.instructions IS '使用说明';
COMMENT ON COLUMN mcp_metadata.server_name IS '服务名称';
COMMENT ON COLUMN mcp_metadata.server_version IS '服务版本';
COMMENT ON COLUMN mcp_metadata.server_description IS '服务描述';
COMMENT ON COLUMN mcp_metadata.synced_at IS '同步时间';

COMMENT ON TABLE browser_devices IS '浏览器设备授权';
COMMENT ON COLUMN browser_devices.scope_key IS '作用域键';
COMMENT ON COLUMN browser_devices.id IS '设备 ID';
COMMENT ON COLUMN browser_devices.tenant IS '租户 ID';
COMMENT ON COLUMN browser_devices."user" IS '用户 ID';
COMMENT ON COLUMN browser_devices.label IS '设备名称';
COMMENT ON COLUMN browser_devices.token_hash IS '令牌哈希';
COMMENT ON COLUMN browser_devices.previous_hash IS '前一令牌哈希';
COMMENT ON COLUMN browser_devices.previous_until IS '前一令牌有效期';
COMMENT ON COLUMN browser_devices.expires_at IS '过期时间';
COMMENT ON COLUMN browser_devices.renew_after IS '可续期时间';
COMMENT ON COLUMN browser_devices.created_at IS '创建时间';
COMMENT ON COLUMN browser_devices.last_seen_at IS '最近使用时间';
COMMENT ON COLUMN browser_devices.revoked_at IS '撤销时间';
COMMENT ON COLUMN browser_devices.owner IS '归属进程';
COMMENT ON COLUMN browser_devices.owner_url IS '进程地址';
COMMENT ON COLUMN browser_devices.lease_key IS '租约键';
COMMENT ON COLUMN browser_devices.lease_until IS '租约有效期';

COMMENT ON TABLE browser_pairings IS '浏览器配对记录';
COMMENT ON COLUMN browser_pairings.scope_key IS '作用域键';
COMMENT ON COLUMN browser_pairings.token_hash IS '令牌哈希';
COMMENT ON COLUMN browser_pairings.tenant IS '租户 ID';
COMMENT ON COLUMN browser_pairings."user" IS '用户 ID';
COMMENT ON COLUMN browser_pairings.expires_at IS '过期时间';

COMMENT ON TABLE browser_task_interruptions IS '浏览器任务中断';
COMMENT ON COLUMN browser_task_interruptions.scope_key IS '作用域键';
COMMENT ON COLUMN browser_task_interruptions.session IS '会话 ID';

COMMENT ON TABLE memory_subjects IS '记忆主体';
COMMENT ON COLUMN memory_subjects.id IS '主键';
COMMENT ON COLUMN memory_subjects.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_subjects.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_subjects.enabled IS '是否启用';
COMMENT ON COLUMN memory_subjects.block_text IS '记忆文本';
COMMENT ON COLUMN memory_subjects.block_updated_at IS '记忆更新时间';
COMMENT ON COLUMN memory_subjects.item_count IS '条目数量';
COMMENT ON COLUMN memory_subjects.last_extracted_at IS '最近抽取时间';
COMMENT ON COLUMN memory_subjects.extract_cursor IS '抽取游标';
COMMENT ON COLUMN memory_subjects.pending_sessions IS '待抽取会话';
COMMENT ON COLUMN memory_subjects.extract_scheduled_at IS '计划抽取时间';
COMMENT ON COLUMN memory_subjects.created_at IS '创建时间';
COMMENT ON COLUMN memory_subjects.updated_at IS '更新时间';
COMMENT ON COLUMN memory_subjects.consolidated_at IS '归并时间';
COMMENT ON COLUMN memory_subjects.forced_consolidated_at IS '手动归并时间';
COMMENT ON COLUMN memory_subjects.extraction_state IS '抽取状态';

COMMENT ON TABLE memory_items IS '记忆条目';
COMMENT ON COLUMN memory_items.id IS '主键';
COMMENT ON COLUMN memory_items.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_items.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_items.kind IS '记忆类型';
COMMENT ON COLUMN memory_items.content IS '记忆内容';
COMMENT ON COLUMN memory_items.topic IS '记忆主题';
COMMENT ON COLUMN memory_items.normalized_key IS '主题键';
COMMENT ON COLUMN memory_items.importance IS '重要程度';
COMMENT ON COLUMN memory_items.origin IS '记忆来源';
COMMENT ON COLUMN memory_items.status IS '状态';
COMMENT ON COLUMN memory_items.source_session_id IS '来源会话 ID';
COMMENT ON COLUMN memory_items.source_message_id IS '来源消息 ID';
COMMENT ON COLUMN memory_items.valid_from IS '生效时间';
COMMENT ON COLUMN memory_items.invalid_at IS '失效时间';
COMMENT ON COLUMN memory_items.expires_at IS '过期时间';
COMMENT ON COLUMN memory_items.superseded_by IS '替换记录 ID';
COMMENT ON COLUMN memory_items.last_used_at IS '最近使用时间';
COMMENT ON COLUMN memory_items.use_count IS '使用次数';
COMMENT ON COLUMN memory_items.created_at IS '创建时间';
COMMENT ON COLUMN memory_items.updated_at IS '更新时间';
COMMENT ON COLUMN memory_items.replaces_id IS '被替换记录 ID';

COMMENT ON TABLE memory_tombstones IS '记忆删除记录';
COMMENT ON COLUMN memory_tombstones.id IS '主键';
COMMENT ON COLUMN memory_tombstones.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_tombstones.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_tombstones.topic IS '记忆主题';
COMMENT ON COLUMN memory_tombstones.fingerprint IS '内容指纹';
COMMENT ON COLUMN memory_tombstones.source_message_id IS '来源消息 ID';
COMMENT ON COLUMN memory_tombstones.created_at IS '创建时间';

COMMENT ON TABLE memory_topic_stats IS '记忆主题统计';
COMMENT ON COLUMN memory_topic_stats.id IS '主键';
COMMENT ON COLUMN memory_topic_stats.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_topic_stats.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_topic_stats.normalized_key IS '主题键';
COMMENT ON COLUMN memory_topic_stats.topic IS '记忆主题';
COMMENT ON COLUMN memory_topic_stats.hits IS '出现次数';
COMMENT ON COLUMN memory_topic_stats.last_seen_at IS '最近出现时间';
COMMENT ON COLUMN memory_topic_stats.promoted_at IS '提升时间';
COMMENT ON COLUMN memory_topic_stats.created_at IS '创建时间';
COMMENT ON COLUMN memory_topic_stats.updated_at IS '更新时间';
COMMENT ON COLUMN memory_topic_stats.aliases IS '主题别名';

COMMENT ON TABLE memory_doc_affinity IS '文档使用偏好';
COMMENT ON COLUMN memory_doc_affinity.id IS '主键';
COMMENT ON COLUMN memory_doc_affinity.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_doc_affinity.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_doc_affinity.knowledge_id IS '知识 ID';
COMMENT ON COLUMN memory_doc_affinity.knowledge_base_id IS '知识库 ID';
COMMENT ON COLUMN memory_doc_affinity.title IS '文档标题';
COMMENT ON COLUMN memory_doc_affinity.hits IS '使用次数';
COMMENT ON COLUMN memory_doc_affinity.last_used_at IS '最近使用时间';
COMMENT ON COLUMN memory_doc_affinity.created_at IS '创建时间';
COMMENT ON COLUMN memory_doc_affinity.updated_at IS '更新时间';

COMMENT ON TABLE memory_item_embeddings IS '记忆向量';
COMMENT ON COLUMN memory_item_embeddings.item_id IS '记忆条目 ID';
COMMENT ON COLUMN memory_item_embeddings.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_item_embeddings.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_item_embeddings.model_id IS '模型 ID';
COMMENT ON COLUMN memory_item_embeddings.dims IS '向量维度';
COMMENT ON COLUMN memory_item_embeddings.vector IS '向量数据';
COMMENT ON COLUMN memory_item_embeddings.created_at IS '创建时间';
COMMENT ON COLUMN memory_item_embeddings.updated_at IS '更新时间';
COMMENT ON COLUMN memory_item_embeddings.embedding IS '向量索引';

COMMENT ON TABLE memory_extraction_sessions IS '记忆抽取进度';
COMMENT ON COLUMN memory_extraction_sessions.tenant_id IS '租户 ID';
COMMENT ON COLUMN memory_extraction_sessions.subject_id IS '主体 ID';
COMMENT ON COLUMN memory_extraction_sessions.session_id IS '会话 ID';
COMMENT ON COLUMN memory_extraction_sessions.revision IS '修订号';
COMMENT ON COLUMN memory_extraction_sessions.cursor_at IS '游标时间';
COMMENT ON COLUMN memory_extraction_sessions.cursor_id IS '游标 ID';
COMMENT ON COLUMN memory_extraction_sessions.pending IS '是否待处理';
COMMENT ON COLUMN memory_extraction_sessions.failure_count IS '失败次数';
COMMENT ON COLUMN memory_extraction_sessions.failure_code IS '失败编码';
COMMENT ON COLUMN memory_extraction_sessions.failed_from_at IS '失败段开始时间';
COMMENT ON COLUMN memory_extraction_sessions.failed_from_id IS '失败段开始 ID';
COMMENT ON COLUMN memory_extraction_sessions.failed_to_at IS '失败段结束时间';
COMMENT ON COLUMN memory_extraction_sessions.failed_to_id IS '失败段结束 ID';
COMMENT ON COLUMN memory_extraction_sessions.failed_at IS '失败时间';
COMMENT ON COLUMN memory_extraction_sessions.updated_at IS '更新时间';

COMMENT ON COLUMN amp_agents.id IS '主键';
COMMENT ON COLUMN amp_agents.slug IS '智能体标识';
COMMENT ON COLUMN amp_agents.backend_id IS '后端 ID';
COMMENT ON COLUMN amp_agents.name IS '智能体名称';
COMMENT ON COLUMN amp_agents.description IS '智能体描述';
COMMENT ON COLUMN amp_agents.icon IS '图标';
COMMENT ON COLUMN amp_agents.pics IS '图片配置';
COMMENT ON COLUMN amp_agents.config_json IS '运行配置';
COMMENT ON COLUMN amp_agents.share_config IS '共享配置';
COMMENT ON COLUMN amp_agents.is_default IS '是否默认';
COMMENT ON COLUMN amp_agents.is_subagent IS '是否子智能体';
COMMENT ON COLUMN amp_agents.created_by IS '创建人';
COMMENT ON COLUMN amp_agents.updated_by IS '更新人';
COMMENT ON COLUMN amp_agents.tenant_id IS '租户 ID';
COMMENT ON COLUMN amp_agents.created_at IS '创建时间';
COMMENT ON COLUMN amp_agents.updated_at IS '更新时间';

COMMENT ON COLUMN amp_subagent_threads.tenant_id IS '租户 ID';
COMMENT ON COLUMN amp_agent_runs.tenant_id IS '租户 ID';
COMMENT ON COLUMN amp_agent_run_requests.tenant_id IS '租户 ID';

COMMENT ON COLUMN amp_audit_logs.id IS '主键';
COMMENT ON COLUMN amp_audit_logs.user_id IS '用户 ID';
COMMENT ON COLUMN amp_audit_logs.operation IS '操作名称';
COMMENT ON COLUMN amp_audit_logs.details IS '操作详情';
COMMENT ON COLUMN amp_audit_logs.ip_address IS 'IP 地址';
COMMENT ON COLUMN amp_audit_logs."timestamp" IS '操作时间';

COMMENT ON COLUMN amp_model_provider.id IS '主键';
COMMENT ON COLUMN amp_model_provider.created_at IS '创建时间';
COMMENT ON COLUMN amp_model_provider.updated_at IS '更新时间';
-- 统一表注释为短名，最长 10 个字符并以“表”结尾。

COMMENT ON TABLE agent_shares IS '智能体共享表';
COMMENT ON TABLE amp_agent_run_requests IS '请求队列表';
COMMENT ON TABLE amp_agent_runs IS '智能体运行表';
COMMENT ON TABLE amp_agent_usage_daily IS '智能体日报表';
COMMENT ON TABLE amp_agent_usage_events IS '智能体事件表';
COMMENT ON TABLE amp_agents IS '运行智能体表';
COMMENT ON TABLE amp_audit_logs IS '运行审计表';
COMMENT ON TABLE amp_builtin_tools IS '内置工具表';
COMMENT ON TABLE amp_messages IS '运行消息表';
COMMENT ON TABLE amp_model_provider IS '模型厂商配置表';
COMMENT ON TABLE amp_sessions IS '运行会话表';
COMMENT ON TABLE amp_subagent_threads IS '子智能体表';
COMMENT ON TABLE amp_token_usage_events IS 'Token事件表';
COMMENT ON TABLE amp_tool_calls IS '工具调用表';
COMMENT ON TABLE amp_tool_usage_events IS '工具事件表';
COMMENT ON TABLE amp_web_search_provider_types IS '搜索源类型表';
COMMENT ON TABLE audit_logs IS '平台审计表';
COMMENT ON TABLE auth_tokens IS '认证令牌表';
COMMENT ON TABLE browser_devices IS '浏览器设备表';
COMMENT ON TABLE browser_pairings IS '浏览器配对表';
COMMENT ON TABLE browser_task_interruptions IS '任务中断表';
COMMENT ON TABLE chunk_revisions IS '分块修订表';
COMMENT ON TABLE chunks IS '知识分块表';
COMMENT ON TABLE custom_agents IS '平台智能体表';
COMMENT ON TABLE data_sources IS '数据源表';
COMMENT ON TABLE embed_channels IS '嵌入渠道表';
COMMENT ON TABLE embeddings IS '向量嵌入表';
COMMENT ON TABLE im_channel_sessions IS '渠道会话表';
COMMENT ON TABLE im_channels IS 'IM渠道表';
COMMENT ON TABLE kb_shares IS '知识库共享表';
COMMENT ON TABLE knowledge_base_mindmaps IS '知识库脑图表';
COMMENT ON TABLE knowledge_bases IS '知识库表';
COMMENT ON TABLE knowledge_processing_spans IS '解析追踪表';
COMMENT ON TABLE knowledge_tag_relations IS '标签关系表';
COMMENT ON TABLE knowledge_tags IS '知识标签表';
COMMENT ON TABLE knowledges IS '知识条目表';
COMMENT ON TABLE mcp_metadata IS 'MCP元数据表';
COMMENT ON TABLE mcp_oauth_clients IS 'OAuth客户端表';
COMMENT ON TABLE mcp_oauth_tokens IS 'OAuth令牌表';
COMMENT ON TABLE mcp_services IS 'MCP服务表';
COMMENT ON TABLE mcp_tool_approvals IS '工具审批表';
COMMENT ON TABLE memory_doc_affinity IS '文档偏好表';
COMMENT ON TABLE memory_extraction_sessions IS '记忆抽取表';
COMMENT ON TABLE memory_item_embeddings IS '记忆向量表';
COMMENT ON TABLE memory_items IS '记忆条目表';
COMMENT ON TABLE memory_subjects IS '记忆主体表';
COMMENT ON TABLE memory_tombstones IS '记忆删除表';
COMMENT ON TABLE memory_topic_stats IS '记忆主题表';
COMMENT ON TABLE message_suggestion_events IS '追问事件表';
COMMENT ON TABLE message_suggestion_sets IS '追问集合表';
COMMENT ON TABLE messages IS '平台消息表';
COMMENT ON TABLE models IS '模型配置表';
COMMENT ON TABLE organization_join_requests IS '组织申请表';
COMMENT ON TABLE organization_members_pre_plan3 IS '历史成员表';
COMMENT ON TABLE organization_tenant_members IS '组织成员表';
COMMENT ON TABLE organizations IS '组织表';
COMMENT ON TABLE resource_access_grants IS '资源授权表';
COMMENT ON TABLE resource_bindings IS '资源绑定表';
COMMENT ON TABLE resources IS '资源表';
COMMENT ON TABLE sessions IS '平台会话表';
COMMENT ON TABLE storage_backends IS '存储后端表';
COMMENT ON TABLE sync_logs IS '同步日志表';
COMMENT ON TABLE system_settings IS '系统配置表';
COMMENT ON TABLE task_dead_letters IS '死信队列表';
COMMENT ON TABLE task_pending_ops IS '任务队列表';
COMMENT ON TABLE temporary_documents IS '临时文档表';
COMMENT ON TABLE tenant_api_keys IS '租户密钥表';
COMMENT ON TABLE tenant_disabled_shared_agents IS '共享屏蔽表';
COMMENT ON TABLE tenant_invitations IS '租户邀请表';
COMMENT ON TABLE tenant_members IS '租户成员表';
COMMENT ON TABLE tenant_sandbox_configs IS '沙箱配置表';
COMMENT ON TABLE tenant_skill_catalog IS '技能目录表';
COMMENT ON TABLE tenant_skill_snapshots IS '技能快照表';
COMMENT ON TABLE tenant_skills IS '租户技能表';
COMMENT ON TABLE tenant_user_env_vars IS '用户变量表';
COMMENT ON TABLE tenants IS '租户表';
COMMENT ON TABLE user_kb_pins IS '知识置顶表';
COMMENT ON TABLE user_resource_favorites IS '资源收藏表';
COMMENT ON TABLE users IS '用户表';
COMMENT ON TABLE vector_stores IS '向量库表';
COMMENT ON TABLE web_search_providers IS '搜索源配置表';
COMMENT ON TABLE wiki_folders IS 'Wiki目录表';
COMMENT ON TABLE wiki_page_issues IS '页面问题表';
COMMENT ON TABLE wiki_page_revisions IS '页面版本表';
COMMENT ON TABLE wiki_pages IS 'Wiki页面表';

UPDATE amp_builtin_tools
SET capability_key = 'work:' || tool_slug
WHERE source = 'builtin';

UPDATE amp_builtin_tools
SET source = 'work'
WHERE source = 'builtin';

ALTER TABLE amp_builtin_tools
    DROP CONSTRAINT IF EXISTS ck_amp_builtin_tools_source;
ALTER TABLE amp_builtin_tools
    ADD CONSTRAINT ck_amp_builtin_tools_source
    CHECK (source IN ('chat', 'work'));

-- 技能扩展直接写在 tenant_skill_catalog。已有 amp_skill_runtime 时先把数据拷过来再删表。
ALTER TABLE tenant_skill_catalog
    ADD COLUMN IF NOT EXISTS source_type VARCHAR(16) NOT NULL DEFAULT 'chat',
    ADD COLUMN IF NOT EXISTS tool_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS mcp_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS skill_dependencies JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS share_config JSONB NOT NULL DEFAULT '{"version":2,"read_scope":{"access_level":"global","department_ids":[],"user_uids":[]},"manage_scope":null}'::jsonb,
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS created_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS source_mtime TIMESTAMPTZ;

DO $$
BEGIN
    IF to_regclass('public.amp_skill_runtime') IS NOT NULL THEN
        UPDATE tenant_skill_catalog AS catalog
        SET tenant_id = CASE WHEN runtime.source_type = 'builtin' THEN 0 ELSE catalog.tenant_id END,
            source_type = CASE WHEN runtime.source_type = 'builtin' THEN 'work' ELSE 'chat' END,
            tool_dependencies = COALESCE(runtime.tool_dependencies, '[]'::jsonb),
            mcp_dependencies = COALESCE(runtime.mcp_dependencies, '[]'::jsonb),
            skill_dependencies = COALESCE(runtime.skill_dependencies, '[]'::jsonb),
            share_config = CASE
                WHEN runtime.share_config IS NULL OR runtime.share_config = '{}'::jsonb
                    THEN catalog.share_config
                ELSE runtime.share_config
            END,
            enabled = COALESCE(runtime.enabled, TRUE),
            created_by = runtime.created_by,
            updated_by = runtime.updated_by
        FROM amp_skill_runtime AS runtime
        WHERE runtime.app_core_skill_id = catalog.id;
    END IF;
END
$$;

ALTER TABLE tenant_skill_catalog
    DROP CONSTRAINT IF EXISTS ck_tenant_skill_catalog_source_type;
ALTER TABLE tenant_skill_catalog
    ADD CONSTRAINT ck_tenant_skill_catalog_source_type
    CHECK (source_type IN ('chat', 'work', 'common'));

COMMENT ON COLUMN tenant_skill_catalog.source_type IS '使用侧：chat 对话、work 工作、common 通用';
COMMENT ON COLUMN tenant_skill_catalog.tool_dependencies IS '绑定的工具';
COMMENT ON COLUMN tenant_skill_catalog.mcp_dependencies IS '绑定的 MCP';
COMMENT ON COLUMN tenant_skill_catalog.skill_dependencies IS '绑定的其他技能';
COMMENT ON COLUMN tenant_skill_catalog.share_config IS '共享范围';
COMMENT ON COLUMN tenant_skill_catalog.enabled IS '是否启用';
COMMENT ON COLUMN tenant_skill_catalog.created_by IS '创建人';
COMMENT ON COLUMN tenant_skill_catalog.updated_by IS '最近更新人';
COMMENT ON COLUMN tenant_skill_catalog.source_mtime IS '内置技能源目录最后修改时间';

DROP TABLE IF EXISTS amp_skill_runtime CASCADE;

-- 内置图表 MCP。主键沿用原工作模式标识，技能依赖和历史绑定不用改。
-- 已手工插入过同一 id 的环境会跳过，避免重复。
INSERT INTO mcp_services (
    id,
    tenant_id,
    name,
    description,
    enabled,
    transport_type,
    headers,
    stdio_config,
    env_vars,
    is_builtin,
    usage_instructions,
    created_at,
    updated_at
)
SELECT
    'mcp-server-chart',
    0,
    'Mcp Server Chart',
    '图表生成工具，支持生成各类图表（柱状图、折线图、饼图等）',
    TRUE,
    'stdio',
    '{}'::jsonb,
    '{"command":"npx","args":["-y","@antv/mcp-server-chart"]}'::jsonb,
    '{}'::jsonb,
    TRUE,
    '',
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM mcp_services WHERE id = 'mcp-server-chart'
);

-- 用量回填只读上面复制出的 amp_ 表，不读 h_。事件带 source=historical_backfill，主键冲突则跳过。

-- 把切换前的会话、消息、工具调用和运行记录回填到遥测事实表与日聚合。
-- 来源是 amp_sessions、amp_messages、amp_tool_calls、amp_agent_runs。
-- 事件 ID 与运行时写入一致，重复执行不会插出第二份。
-- 时间按 UTC 解释，和运行时 utc_now 的无时区写法一致。

INSERT INTO amp_agent_usage_events (
    event_id, tenant_id, uid, agent_id, run_id, session_id,
    event_type, run_type, is_subagent, status, duration_ms, retry_count,
    error_type, error_message, event_metadata, occurred_at, created_at
)
SELECT
    LEFT('agent:' || run.id || ':start', 64),
    COALESCE(run.tenant_id, 0),
    run.uid,
    LEFT(run.agent_slug, 64),
    run.id,
    run.conversation_id,
    'start',
    COALESCE(NULLIF(run.run_type, ''), 'chat'),
    COALESCE(run.run_type, '') = 'subagent',
    'running',
    NULL,
    0,
    NULL,
    NULL,
    '{"source":"historical_backfill"}'::jsonb,
    COALESCE(run.started_at, run.created_at) AT TIME ZONE 'UTC',
    NOW()
FROM amp_agent_runs AS run
WHERE run.uid IS NOT NULL
  AND run.uid <> ''
  AND run.agent_slug IS NOT NULL
  AND run.agent_slug <> ''
  AND COALESCE(run.started_at, run.created_at) IS NOT NULL
  AND (
      run.started_at IS NOT NULL
      OR run.status IN ('running', 'completed', 'failed', 'cancelled', 'interrupted', 'cancel_requested')
  )
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO amp_agent_usage_events (
    event_id, tenant_id, uid, agent_id, run_id, session_id,
    event_type, run_type, is_subagent, status, duration_ms, retry_count,
    error_type, error_message, event_metadata, occurred_at, created_at
)
SELECT
    LEFT('agent:' || run.id || ':' || mapped.event_type, 64),
    COALESCE(run.tenant_id, 0),
    run.uid,
    LEFT(run.agent_slug, 64),
    run.id,
    run.conversation_id,
    mapped.event_type,
    COALESCE(NULLIF(run.run_type, ''), 'chat'),
    COALESCE(run.run_type, '') = 'subagent',
    run.status,
    CASE
        WHEN run.started_at IS NOT NULL
         AND run.finished_at IS NOT NULL
         AND run.finished_at >= run.started_at
            THEN (EXTRACT(EPOCH FROM (run.finished_at - run.started_at)) * 1000)::bigint
        ELSE NULL
    END,
    0,
    run.error_type,
    run.error_message,
    '{"source":"historical_backfill"}'::jsonb,
    COALESCE(run.finished_at, run.updated_at, run.created_at) AT TIME ZONE 'UTC',
    NOW()
FROM amp_agent_runs AS run
JOIN (
    VALUES
        ('completed', 'succeed'),
        ('failed', 'fail'),
        ('cancelled', 'cancel'),
        ('interrupted', 'fail')
) AS mapped(status, event_type) ON mapped.status = run.status
WHERE run.uid IS NOT NULL
  AND run.uid <> ''
  AND run.agent_slug IS NOT NULL
  AND run.agent_slug <> ''
  AND COALESCE(run.finished_at, run.updated_at, run.created_at) IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO amp_tool_usage_events (
    event_id, tenant_id, uid, agent_id, run_id, session_id, message_id, tool_call_id,
    capability_type, tool_name, status, duration_ms, error_type, error_code,
    event_metadata, occurred_at, created_at
)
SELECT
    LEFT('tool:' || tool_call.id::text || ':' || COALESCE(NULLIF(tool_call.status, ''), 'pending'), 64),
    COALESCE(session.tenant_id, 0),
    session.uid,
    LEFT(session.agent_id, 64),
    message.run_id,
    session.id,
    message.id,
    tool_call.id,
    CASE
        WHEN tool_call.tool_name LIKE 'mcp__%' THEN 'mcp'
        WHEN tool_call.tool_name LIKE 'skill__%' OR tool_call.tool_name LIKE 'skill:%' THEN 'skill'
        ELSE 'builtin'
    END,
    LEFT(tool_call.tool_name, 255),
    COALESCE(NULLIF(tool_call.status, ''), 'pending'),
    NULL,
    CASE WHEN tool_call.status = 'error' THEN 'tool_error' ELSE NULL END,
    NULL,
    jsonb_build_object('source', 'historical_backfill', 'original_status', tool_call.status),
    COALESCE(tool_call.created_at, message.created_at) AT TIME ZONE 'UTC',
    NOW()
FROM amp_tool_calls AS tool_call
JOIN amp_messages AS message ON message.id = tool_call.message_id
JOIN amp_sessions AS session ON session.id = message.conversation_id
WHERE session.uid IS NOT NULL
  AND session.uid <> ''
  AND session.agent_id IS NOT NULL
  AND session.agent_id <> ''
  AND tool_call.tool_name IS NOT NULL
  AND tool_call.tool_name <> ''
  AND COALESCE(tool_call.created_at, message.created_at) IS NOT NULL
ON CONFLICT (event_id) DO NOTHING;

DELETE FROM amp_token_usage_events
WHERE event_metadata ->> 'source' = 'historical_backfill';

WITH scoped_messages AS (
    SELECT message.*
    FROM amp_messages AS message
    JOIN amp_sessions AS session ON session.id = message.conversation_id
    WHERE session.uid IS NOT NULL
      AND session.uid <> ''
      AND session.agent_id IS NOT NULL
      AND session.agent_id <> ''
      AND message.role = 'assistant'
      AND message.created_at IS NOT NULL
),
parsed AS (
    SELECT
        message.*,
        CASE
            WHEN message.extra_metadata IS NULL THEN NULL
            WHEN jsonb_typeof(message.extra_metadata::jsonb) = 'object' THEN message.extra_metadata::jsonb
            ELSE NULL
        END AS metadata
    FROM scoped_messages AS message
),
estimated AS (
    SELECT
        parsed.*,
        COALESCE((
            SELECT SUM(4 + char_length(COALESCE(prior.content, '')) / 4)
            FROM amp_messages AS prior
            WHERE prior.conversation_id = parsed.conversation_id
              AND prior.id < parsed.id
        ), 0)::bigint AS estimated_prompt,
        CASE
            WHEN char_length(COALESCE(parsed.content, ''))
                 + char_length(COALESCE(parsed.extra_metadata::jsonb #>> '{tool_calls}', '')) = 0
                THEN 0
            ELSE 4 + (
                char_length(COALESCE(parsed.content, ''))
                + char_length(COALESCE(parsed.extra_metadata::jsonb #>> '{tool_calls}', ''))
            ) / 4
        END::bigint AS estimated_completion
    FROM parsed
),
usage AS (
    SELECT
        estimated.*,
        COALESCE(
            NULLIF(LEFT(metadata #>> '{response_metadata,model_name}', 128), ''),
            NULLIF(LEFT(metadata #>> '{response_metadata,model}', 128), ''),
            NULLIF(LEFT(metadata #>> '{response_metadata,model_id}', 128), ''),
            NULLIF(LEFT(metadata #>> '{usage_metadata,model}', 128), ''),
            NULLIF(LEFT(metadata #>> '{model_name}', 128), ''),
            NULLIF(LEFT(metadata #>> '{model}', 128), ''),
            'unknown'
        ) AS model_name,
        CASE
            WHEN metadata #>> '{usage_metadata,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN COALESCE(
                    NULLIF(metadata #>> '{usage_metadata,input_tokens}', ''),
                    NULLIF(metadata #>> '{usage_metadata,prompt_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,token_usage,prompt_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,token_usage,input_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,usage,prompt_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,usage,input_tokens}', ''),
                    NULLIF(metadata #>> '{usage,prompt_tokens}', ''),
                    NULLIF(metadata #>> '{usage,input_tokens}', '')
                )::numeric::bigint
            WHEN metadata #>> '{usage_metadata,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN 0
            WHEN COALESCE(token_count, 0) > 0
                THEN GREATEST(COALESCE(token_count, 0) - estimated_completion, 0)::bigint
            ELSE estimated_prompt
        END AS prompt_tokens,
        CASE
            WHEN metadata #>> '{usage_metadata,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,completion_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN COALESCE(
                    NULLIF(metadata #>> '{usage_metadata,output_tokens}', ''),
                    NULLIF(metadata #>> '{usage_metadata,completion_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,token_usage,completion_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,token_usage,output_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,usage,completion_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,usage,output_tokens}', ''),
                    NULLIF(metadata #>> '{usage,completion_tokens}', ''),
                    NULLIF(metadata #>> '{usage,output_tokens}', '')
                )::numeric::bigint
            WHEN metadata #>> '{usage_metadata,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,prompt_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN 0
            WHEN COALESCE(token_count, 0) > 0
                THEN LEAST(estimated_completion, COALESCE(token_count, 0))::bigint
            ELSE estimated_completion
        END AS completion_tokens,
        CASE
            WHEN metadata #>> '{usage_metadata,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN COALESCE(
                    NULLIF(metadata #>> '{usage_metadata,total_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,token_usage,total_tokens}', ''),
                    NULLIF(metadata #>> '{response_metadata,usage,total_tokens}', ''),
                    NULLIF(metadata #>> '{usage,total_tokens}', '')
                )::numeric::bigint
            WHEN COALESCE(token_count, 0) > 0 THEN COALESCE(token_count, 0)::bigint
            ELSE estimated_prompt + estimated_completion
        END AS total_tokens,
        CASE
            WHEN metadata #>> '{usage_metadata,input_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,output_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{usage_metadata,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                OR metadata #>> '{response_metadata,token_usage,total_tokens}' ~ '^[0-9]+(\.[0-9]+)?$'
                THEN 'provider'
            WHEN COALESCE(token_count, 0) > 0 THEN 'stored_count'
            ELSE 'estimated'
        END AS token_source
    FROM estimated
)
INSERT INTO amp_token_usage_events (
    event_id, tenant_id, uid, agent_id, run_id, session_id, message_id, model,
    prompt_tokens, completion_tokens, total_tokens, event_metadata, occurred_at, created_at
)
SELECT
    LEFT('token:' || usage.id::text || ':' || usage.model_name, 64),
    COALESCE(session.tenant_id, 0),
    session.uid,
    LEFT(session.agent_id, 64),
    usage.run_id,
    session.id,
    usage.id,
    usage.model_name,
    usage.prompt_tokens,
    usage.completion_tokens,
    usage.total_tokens,
    jsonb_build_object('source', 'historical_backfill', 'token_source', usage.token_source),
    usage.created_at AT TIME ZONE 'UTC',
    NOW()
FROM usage
JOIN amp_sessions AS session ON session.id = usage.conversation_id
WHERE usage.prompt_tokens > 0 OR usage.completion_tokens > 0 OR usage.total_tokens > 0
ON CONFLICT (event_id) DO NOTHING;

-- 日聚合按业务表和事实表重算。会话数、消息数用原表行数，避免只统计有运行记录的会话。
INSERT INTO amp_agent_usage_daily (
    stat_date, tenant_id, agent_id,
    session_count, message_count, run_count,
    success_count, failure_count, cancelled_count,
    tool_call_count, tool_success_count,
    total_duration_ms, max_duration_ms,
    prompt_tokens, completion_tokens, total_tokens,
    score, computed_at
)
SELECT
    keys.stat_date,
    keys.tenant_id,
    keys.agent_id,
    COALESCE(sessions.session_count, 0),
    COALESCE(messages.message_count, 0),
    COALESCE(runs.success_count, 0) + COALESCE(runs.failure_count, 0) + COALESCE(runs.cancelled_count, 0),
    COALESCE(runs.success_count, 0),
    COALESCE(runs.failure_count, 0),
    COALESCE(runs.cancelled_count, 0),
    COALESCE(tools.tool_call_count, 0),
    COALESCE(tools.tool_success_count, 0),
    COALESCE(runs.total_duration_ms, 0),
    COALESCE(runs.max_duration_ms, 0),
    COALESCE(tokens.prompt_tokens, 0),
    COALESCE(tokens.completion_tokens, 0),
    COALESCE(tokens.total_tokens, 0),
    ROUND(CAST((
        0.35 * CASE
            WHEN (COALESCE(runs.success_count, 0) + COALESCE(runs.failure_count, 0) + COALESCE(runs.cancelled_count, 0)) > 0
                THEN runs.success_count::numeric
                   / (runs.success_count + runs.failure_count + runs.cancelled_count)
            ELSE 0
        END
        + 0.20 * LEAST(
            1,
            LN(1 + GREATEST(
                COALESCE(runs.success_count, 0) + COALESCE(runs.failure_count, 0) + COALESCE(runs.cancelled_count, 0),
                COALESCE(sessions.session_count, 0)
            )) / LN(51)
        )
        + 0.20 * CASE
            WHEN COALESCE(tools.tool_call_count, 0) > 0
                THEN tools.tool_success_count::numeric / tools.tool_call_count
            ELSE 1
        END
        + 0.15 * CASE
            WHEN COALESCE(runs.success_count, 0) > 0
                THEN 1.0 / (1.0 + (COALESCE(tokens.total_tokens, 0)::numeric / runs.success_count) / 1000.0)
            WHEN COALESCE(tokens.total_tokens, 0) > 0
                THEN 1.0 / (1.0 + COALESCE(tokens.total_tokens, 0)::numeric / 1000.0)
            ELSE 0.5
        END
        + 0.10 * CASE
            WHEN COALESCE(runs.max_duration_ms, 0) > 0
             AND (COALESCE(runs.success_count, 0) + COALESCE(runs.failure_count, 0) + COALESCE(runs.cancelled_count, 0)) > 0
                THEN 1 - LEAST(
                    1,
                    ABS(
                        runs.max_duration_ms
                        - runs.total_duration_ms::numeric
                          / (runs.success_count + runs.failure_count + runs.cancelled_count)
                    ) / runs.max_duration_ms
                )
            ELSE 1
        END
    ) AS numeric) * 100, 4),
    NOW()
FROM (
    SELECT stat_date, tenant_id, agent_id FROM (
        SELECT (created_at AT TIME ZONE 'UTC')::date AS stat_date,
               COALESCE(tenant_id, 0) AS tenant_id,
               LEFT(agent_id, 64) AS agent_id
        FROM amp_sessions
        WHERE agent_id IS NOT NULL AND agent_id <> '' AND created_at IS NOT NULL
        UNION
        SELECT (message.created_at AT TIME ZONE 'UTC')::date,
               COALESCE(session.tenant_id, 0),
               LEFT(session.agent_id, 64)
        FROM amp_messages AS message
        JOIN amp_sessions AS session ON session.id = message.conversation_id
        WHERE session.agent_id IS NOT NULL AND session.agent_id <> '' AND message.created_at IS NOT NULL
        UNION
        SELECT (occurred_at AT TIME ZONE 'UTC')::date, COALESCE(tenant_id, 0), agent_id
        FROM amp_agent_usage_events
        WHERE agent_id IS NOT NULL AND agent_id <> ''
        UNION
        SELECT (occurred_at AT TIME ZONE 'UTC')::date, COALESCE(tenant_id, 0), agent_id
        FROM amp_tool_usage_events
        WHERE agent_id IS NOT NULL AND agent_id <> ''
        UNION
        SELECT (occurred_at AT TIME ZONE 'UTC')::date, COALESCE(tenant_id, 0), agent_id
        FROM amp_token_usage_events
        WHERE agent_id IS NOT NULL AND agent_id <> ''
    ) AS dimensions
) AS keys
LEFT JOIN (
    SELECT (created_at AT TIME ZONE 'UTC')::date AS stat_date,
           COALESCE(tenant_id, 0) AS tenant_id,
           LEFT(agent_id, 64) AS agent_id,
           COUNT(*) AS session_count
    FROM amp_sessions
    WHERE agent_id IS NOT NULL AND agent_id <> '' AND created_at IS NOT NULL
    GROUP BY 1, 2, 3
) AS sessions
    ON sessions.stat_date = keys.stat_date
   AND sessions.tenant_id = keys.tenant_id
   AND sessions.agent_id = keys.agent_id
LEFT JOIN (
    SELECT (message.created_at AT TIME ZONE 'UTC')::date AS stat_date,
           COALESCE(session.tenant_id, 0) AS tenant_id,
           LEFT(session.agent_id, 64) AS agent_id,
           COUNT(*) AS message_count
    FROM amp_messages AS message
    JOIN amp_sessions AS session ON session.id = message.conversation_id
    WHERE session.agent_id IS NOT NULL AND session.agent_id <> '' AND message.created_at IS NOT NULL
    GROUP BY 1, 2, 3
) AS messages
    ON messages.stat_date = keys.stat_date
   AND messages.tenant_id = keys.tenant_id
   AND messages.agent_id = keys.agent_id
LEFT JOIN (
    SELECT (occurred_at AT TIME ZONE 'UTC')::date AS stat_date,
           COALESCE(tenant_id, 0) AS tenant_id,
           agent_id,
           COUNT(*) FILTER (WHERE event_type = 'succeed') AS success_count,
           COUNT(*) FILTER (WHERE event_type = 'fail') AS failure_count,
           COUNT(*) FILTER (WHERE event_type = 'cancel') AS cancelled_count,
           COALESCE(SUM(duration_ms) FILTER (WHERE event_type IN ('succeed', 'fail', 'cancel')), 0) AS total_duration_ms,
           COALESCE(MAX(duration_ms) FILTER (WHERE event_type IN ('succeed', 'fail', 'cancel')), 0) AS max_duration_ms
    FROM amp_agent_usage_events
    GROUP BY 1, 2, 3
) AS runs
    ON runs.stat_date = keys.stat_date
   AND runs.tenant_id = keys.tenant_id
   AND runs.agent_id = keys.agent_id
LEFT JOIN (
    SELECT (occurred_at AT TIME ZONE 'UTC')::date AS stat_date,
           COALESCE(tenant_id, 0) AS tenant_id,
           agent_id,
           COUNT(*) AS tool_call_count,
           COUNT(*) FILTER (WHERE status = 'success') AS tool_success_count
    FROM amp_tool_usage_events
    GROUP BY 1, 2, 3
) AS tools
    ON tools.stat_date = keys.stat_date
   AND tools.tenant_id = keys.tenant_id
   AND tools.agent_id = keys.agent_id
LEFT JOIN (
    SELECT (occurred_at AT TIME ZONE 'UTC')::date AS stat_date,
           COALESCE(tenant_id, 0) AS tenant_id,
           agent_id,
           COALESCE(SUM(prompt_tokens), 0) AS prompt_tokens,
           COALESCE(SUM(completion_tokens), 0) AS completion_tokens,
           COALESCE(SUM(total_tokens), 0) AS total_tokens
    FROM amp_token_usage_events
    GROUP BY 1, 2, 3
) AS tokens
    ON tokens.stat_date = keys.stat_date
   AND tokens.tenant_id = keys.tenant_id
   AND tokens.agent_id = keys.agent_id
ON CONFLICT (stat_date, tenant_id, agent_id) DO UPDATE
SET session_count = EXCLUDED.session_count,
    message_count = EXCLUDED.message_count,
    run_count = EXCLUDED.run_count,
    success_count = EXCLUDED.success_count,
    failure_count = EXCLUDED.failure_count,
    cancelled_count = EXCLUDED.cancelled_count,
    tool_call_count = EXCLUDED.tool_call_count,
    tool_success_count = EXCLUDED.tool_success_count,
    total_duration_ms = EXCLUDED.total_duration_ms,
    max_duration_ms = EXCLUDED.max_duration_ms,
    prompt_tokens = EXCLUDED.prompt_tokens,
    completion_tokens = EXCLUDED.completion_tokens,
    total_tokens = EXCLUDED.total_tokens,
    score = EXCLUDED.score,
    computed_at = EXCLUDED.computed_at;


-- 复制和回填已经写入 amp_ 表。下面删除旧 h_ 表，以及曾经改名留下的 amp_retired_h_*。
-- 这些表不是 amp_ 业务表。CASCADE 只去掉仍指向旧表的外键和依赖对象，不删除 amp_ 复制表。

DROP TABLE IF EXISTS
    amp_retired_h_agent_envs,
    amp_retired_h_agent_run_requests,
    amp_retired_h_agent_runs,
    amp_retired_h_agents,
    amp_retired_h_config_options,
    amp_retired_h_conversation_stats,
    amp_retired_h_conversations,
    amp_retired_h_mcp_servers,
    amp_retired_h_message_feedbacks,
    amp_retired_h_messages,
    amp_retired_h_operation_logs,
    amp_retired_h_skills,
    amp_retired_h_subagent_threads,
    amp_retired_h_tasks,
    amp_retired_h_tool_calls,
    amp_retired_h_user_config,
    h_agent_envs,
    h_agent_run_requests,
    h_agent_runs,
    h_agents,
    h_config_options,
    h_conversation_stats,
    h_conversations,
    h_mcp_servers,
    h_message_feedbacks,
    h_messages,
    h_operation_logs,
    h_skills,
    h_subagent_threads,
    h_tasks,
    h_tool_calls,
    h_user_config
CASCADE;
