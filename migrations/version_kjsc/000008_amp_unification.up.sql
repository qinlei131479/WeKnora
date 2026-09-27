-- 接在 000007_user_account 之后。
-- 同一次迁移完成三件事：把仍在使用的 h_ 运行表复制到 amp_，按复制结果回填用量，再删除旧 h_ 表。
-- 复制、回填、删除在同一个事务里。先锁旧表，避免删除前还有新行写进 h_。
-- 执行前停掉仍读写 h_ 表的旧进程。
-- 注释、重复活跃运行和技能来源值都做了容错：对象缺失或历史脏数据不能把整段事务回滚。

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

-- 历史行里悬空的可空外键先清空，避免补外键时整段迁移回滚。
UPDATE amp_messages AS message
SET run_id = NULL
WHERE message.run_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM amp_agent_runs AS run WHERE run.id = message.run_id);

UPDATE amp_agent_runs AS run
SET conversation_id = NULL
WHERE run.conversation_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM amp_sessions AS session WHERE session.id = run.conversation_id);

UPDATE amp_agent_runs AS run
SET subagent_thread_relation_id = NULL
WHERE run.subagent_thread_relation_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM amp_subagent_threads AS thread
      WHERE thread.id = run.subagent_thread_relation_id
  );

UPDATE amp_agent_run_requests AS request
SET dispatched_run_id = NULL
WHERE request.dispatched_run_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM amp_agent_runs AS run WHERE run.id = request.dispatched_run_id);

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

-- 目录里相同 slug 只保留默认或最小 id 的一条。其余改名，会话仍按原 slug 命中保留行。
WITH ranked_catalog_agents AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY slug
            ORDER BY is_default DESC, id ASC
        ) AS slug_rank
    FROM amp_agents
    WHERE tenant_id IS NULL
)
UPDATE amp_agents AS agent
SET slug = LEFT(agent.slug, 60) || '-dup-' || agent.id::text,
    is_default = FALSE,
    updated_at = NOW()
FROM ranked_catalog_agents AS ranked
WHERE agent.id = ranked.id
  AND ranked.slug_rank > 1;

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

-- 同一线程上重复的活跃运行只保留最新一条，避免唯一索引把整段迁移回滚。
WITH duplicated_active_runs AS (
    SELECT
        id,
        ROW_NUMBER() OVER (
            PARTITION BY uid, agent_slug, conversation_thread_id
            ORDER BY created_at DESC NULLS LAST, id DESC
        ) AS active_rank
    FROM amp_agent_runs
    WHERE status NOT IN ('completed', 'failed', 'cancelled', 'interrupted')
      AND uid IS NOT NULL
      AND agent_slug IS NOT NULL
      AND conversation_thread_id IS NOT NULL
)
UPDATE amp_agent_runs AS run
SET status = 'failed',
    error_type = COALESCE(run.error_type, 'active_run_migration_conflict'),
    error_message = COALESCE(
        run.error_message,
        '旧库存在同一用户、智能体和线程的重复活跃运行，迁移时已保留最新一条并终结本记录。'
    ),
    finished_at = COALESCE(run.finished_at, NOW()),
    updated_at = NOW()
FROM duplicated_active_runs AS duplicated
WHERE run.id = duplicated.id
  AND duplicated.active_rank > 1;

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

-- 目录里没有的表、列、索引只跳过，不让注释失败把复制和删表一起回滚。
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

CREATE OR REPLACE FUNCTION pg_temp.weknora_comment_index(p_index text, p_comment text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF to_regclass(format('%I', p_index)) IS NULL THEN
    RAISE NOTICE 'skip COMMENT ON INDEX % (missing)', p_index;
    RETURN;
  END IF;
  EXECUTE format('COMMENT ON INDEX %I IS %L', p_index, p_comment);
END;
$$;

SELECT pg_temp.weknora_comment_index('ix_amp_agents_slug', '按智能体 slug 加速目录查询');
SELECT pg_temp.weknora_comment_index('ix_amp_agents_backend_id', '按执行后端筛选智能体');
SELECT pg_temp.weknora_comment_index('ix_amp_agents_is_default', '按默认智能体标记查询');
SELECT pg_temp.weknora_comment_index('ix_amp_agents_is_subagent', '区分主智能体和子智能体');
SELECT pg_temp.weknora_comment_index('ix_amp_agents_created_by', '按创建人查询智能体');
SELECT pg_temp.weknora_comment_index('ix_amp_agents_tenant_id', '按工作空间隔离智能体');
SELECT pg_temp.weknora_comment_index('uq_amp_agents_default', '保证全目录最多一个默认智能体');
SELECT pg_temp.weknora_comment_index('uq_amp_agents_slug_tenant', '同一工作空间内智能体 slug 唯一');
SELECT pg_temp.weknora_comment_index('uq_amp_agents_slug_catalog', '平台目录内智能体 slug 唯一');

SELECT pg_temp.weknora_comment_index('ix_amp_sessions_is_pinned', '加速置顶会话筛选');
SELECT pg_temp.weknora_comment_index('ix_amp_sessions_uid', '按用户查询会话');
SELECT pg_temp.weknora_comment_index('ix_amp_sessions_agent_id', '按智能体查询会话');
SELECT pg_temp.weknora_comment_index('ix_amp_sessions_tenant_id', '按工作空间隔离会话');
SELECT pg_temp.weknora_comment_index('ix_amp_sessions_thread_id', '保证运行线程 ID 唯一并加速定位');

SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_uid', '按用户查询子智能体线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_parent_conversation_id', '按父会话查询子智能体线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_subagent_slug', '按子智能体筛选线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_created_by_run_id', '按创建运行追溯子智能体线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_tenant_id', '按工作空间隔离子智能体线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_child_conversation_id', '保证一个子会话只属于一条线程关系');
SELECT pg_temp.weknora_comment_index('ix_amp_subagent_threads_child_thread_id', '保证子线程 ID 唯一并加速定位');

SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_conversation_thread_id', '按会话线程查询运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_status', '按运行状态筛选和监控');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_conversation_id', '按会话 ID 查询运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_agent_slug', '按智能体统计和查询运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_created_by_run_id', '追溯父运行创建的子运行');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_uid', '按用户查询运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_external_id', '按来源外部 ID 定位运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_subagent_thread_relation_id', '按子智能体线程关系查询运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_tenant_id', '按工作空间隔离运行记录');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_runs_request_id', '保证运行幂等请求 ID 唯一并加速定位');
SELECT pg_temp.weknora_comment_index('uq_amp_agent_runs_one_active_per_thread', '保证同一会话线程同一智能体只有一个活跃运行');

SELECT pg_temp.weknora_comment_index('ix_amp_messages_conversation_id', '按会话加载消息列表');
SELECT pg_temp.weknora_comment_index('ix_amp_messages_run_id', '按运行追溯消息');
SELECT pg_temp.weknora_comment_index('ix_amp_messages_request_id', '按幂等请求定位消息');

SELECT pg_temp.weknora_comment_index('ix_amp_tool_calls_message_id', '按消息加载工具调用明细');
SELECT pg_temp.weknora_comment_index('ix_amp_tool_calls_langgraph_tool_call_id', '按 LangGraph 工具调用 ID 对齐结果');

SELECT pg_temp.weknora_comment_index('ix_amp_agent_run_requests_external_id', '按来源外部 ID 定位排队请求');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_run_requests_tenant_id', '按工作空间隔离排队请求');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_run_requests_request_id', '保证排队请求幂等 ID 唯一');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_run_requests_queue', '按队列维度加载待派发请求');
SELECT pg_temp.weknora_comment_index('ix_amp_agent_run_requests_queue_tenant', '在租户隔离下加载待派发请求');
SELECT pg_temp.weknora_comment_index('idx_amp_agent_runs_tenant_thread', '在租户隔离下按线程和智能体分析运行');

SELECT pg_temp.weknora_comment_table('amp_agents', 'Harness 智能体主表：保存智能体配置、共享状态和运行标识');
SELECT pg_temp.weknora_comment_column('amp_agents', 'id', '智能体自增主键');
SELECT pg_temp.weknora_comment_column('amp_agents', 'slug', '智能体稳定标识，历史数据与接口引用使用该值');
SELECT pg_temp.weknora_comment_column('amp_agents', 'backend_id', '执行后端标识');
SELECT pg_temp.weknora_comment_column('amp_agents', 'name', '智能体展示名称');
SELECT pg_temp.weknora_comment_column('amp_agents', 'description', '智能体描述');
SELECT pg_temp.weknora_comment_column('amp_agents', 'icon', '智能体图标地址');
SELECT pg_temp.weknora_comment_column('amp_agents', 'pics', '智能体配图地址列表');
SELECT pg_temp.weknora_comment_column('amp_agents', 'config_json', '智能体运行配置');
SELECT pg_temp.weknora_comment_column('amp_agents', 'share_config', '智能体共享与授权配置');
SELECT pg_temp.weknora_comment_column('amp_agents', 'is_default', '是否默认智能体');
SELECT pg_temp.weknora_comment_column('amp_agents', 'is_subagent', '是否子智能体');
SELECT pg_temp.weknora_comment_column('amp_agents', 'created_by', '创建人用户标识');
SELECT pg_temp.weknora_comment_column('amp_agents', 'updated_by', '最近更新人用户标识');
SELECT pg_temp.weknora_comment_column('amp_agents', 'tenant_id', '所属工作空间 ID；空值表示平台目录');
SELECT pg_temp.weknora_comment_column('amp_agents', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_agents', 'updated_at', '最后更新时间');

SELECT pg_temp.weknora_comment_table('amp_sessions', 'Harness 运行时会话主表，对应原 conversations 数据');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'id', '会话自增主键');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'thread_id', '运行时线程 ID');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'uid', '所属用户标识');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'agent_id', '会话绑定的智能体 slug；字段名保留历史协议');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'title', '会话标题');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'status', '会话状态：active/archived/deleted');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'is_pinned', '是否置顶');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'updated_at', '最后更新时间');
SELECT pg_temp.weknora_comment_column('amp_sessions', 'extra_metadata', '会话扩展元数据');

SELECT pg_temp.weknora_comment_table('amp_subagent_threads', '子智能体线程与会话归属关系表');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'id', '子智能体线程关系自增主键');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'uid', '所属用户标识');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'parent_conversation_id', '父会话 ID');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'child_conversation_id', '子会话 ID');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'child_thread_id', '子线程 ID');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'subagent_slug', '子智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'created_by_run_id', '创建该关系的运行 ID');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'updated_at', '最后更新时间');

SELECT pg_temp.weknora_comment_table('amp_agent_runs', '智能体运行生命周期主表');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'id', '运行 UUID 主键');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'conversation_thread_id', '会话线程 ID 快照');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'agent_slug', '执行智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'uid', '发起用户标识');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'status', '运行状态：pending/running/completed/failed/cancel_requested/cancelled/interrupted');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'request_id', '幂等请求 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'source', '请求来源快照');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'channel', '请求通道快照');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'external_id', '来源侧外部消息或调用 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'origin_metadata', '不可变来源元数据');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'conversation_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'created_by_run_id', '父运行 ID；普通运行为空');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'subagent_thread_relation_id', '子智能体线程关系 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'run_type', '运行类型：chat/resume/subagent');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'input_message_id', '输入消息 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'output_message_id', '输出消息 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'last_event_id', '最后的 Redis Stream 事件 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'input_payload', '原始输入载荷');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'error_type', '错误类型');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'started_at', '开始时间');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'finished_at', '结束时间');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'updated_at', '最后更新时间');

SELECT pg_temp.weknora_comment_table('amp_messages', 'Harness 运行时消息主表');
SELECT pg_temp.weknora_comment_column('amp_messages', 'id', '消息自增主键');
SELECT pg_temp.weknora_comment_column('amp_messages', 'conversation_id', '所属会话 ID');
SELECT pg_temp.weknora_comment_column('amp_messages', 'role', '消息角色：user/assistant/system/tool');
SELECT pg_temp.weknora_comment_column('amp_messages', 'content', '消息内容');
SELECT pg_temp.weknora_comment_column('amp_messages', 'message_type', '消息类型：text/tool_call/tool_result');
SELECT pg_temp.weknora_comment_column('amp_messages', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_messages', 'token_count', '消息粗粒度 token 数；精确消耗以遥测表为准');
SELECT pg_temp.weknora_comment_column('amp_messages', 'extra_metadata', '消息完整扩展元数据');
SELECT pg_temp.weknora_comment_column('amp_messages', 'image_content', '多模态图片内容');
SELECT pg_temp.weknora_comment_column('amp_messages', 'run_id', '关联运行 ID');
SELECT pg_temp.weknora_comment_column('amp_messages', 'request_id', '幂等请求 ID');
SELECT pg_temp.weknora_comment_column('amp_messages', 'delivery_status', '消息投递状态');

SELECT pg_temp.weknora_comment_table('amp_tool_calls', '会话内工具调用过程明细表');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'id', '工具调用自增主键');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'message_id', '所属消息 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'langgraph_tool_call_id', 'LangGraph 工具调用 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'tool_name', '工具名称');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'tool_input', '工具输入参数');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'tool_output', '工具执行结果');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'status', '执行状态：pending/success/error');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'error_message', '失败信息');
SELECT pg_temp.weknora_comment_column('amp_tool_calls', 'created_at', '创建时间');

SELECT pg_temp.weknora_comment_table('amp_agent_run_requests', '智能体请求排队、幂等和取消链路表');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'id', '请求自增主键，用于 FIFO 排序');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'request_id', '幂等请求 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'uid', '发起用户标识');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'agent_slug', '目标智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'conversation_thread_id', '目标会话线程 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'source', '请求来源：chat/agent_call/eval');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'channel', '请求通道：web/api/im/internal');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'external_id', '来源侧消息或调用 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'origin_metadata', '来源元数据快照');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'queue_policy', '排队策略：enqueue/reject/steer');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'status', '请求状态：queued/dispatched/cancelled/rejected/failed');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'input_message_id', '输入消息 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'dispatched_run_id', '派发运行 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'input_payload', '原始输入载荷快照');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'error_message', '拒绝或失败原因');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'dispatched_at', '派发时间');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'updated_at', '最后更新时间');

SELECT pg_temp.weknora_comment_table('amp_audit_logs', 'Harness 审计日志表');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'id', '审计日志自增主键');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'user_id', '操作用户标识；系统操作可为空');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'operation', '操作类型');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'details', '操作详情');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'ip_address', '操作来源 IP');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'timestamp', '操作时间');

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
SELECT pg_temp.weknora_comment_index('uq_amp_agent_usage_events_event_id', '保证运行事件幂等');
SELECT pg_temp.weknora_comment_index('idx_amp_agent_usage_events_dimensions', '按租户、智能体和时间聚合运行事件');
SELECT pg_temp.weknora_comment_index('idx_amp_agent_usage_events_run', '按运行 ID 关联事件');
SELECT pg_temp.weknora_comment_table('amp_agent_usage_events', '智能体运行遥测事实表：只追加运行生命周期事件');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'id', '运行事件自增主键');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'event_id', '事件唯一 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'uid', '用户标识');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'agent_id', '智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'run_id', '运行 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'event_type', '事件类型：start/succeed/fail/cancel');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'run_type', '运行类型：chat/resume/subagent');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'is_subagent', '是否子智能体运行');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'status', '事件状态');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'duration_ms', '运行耗时毫秒数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'retry_count', '重试次数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'error_type', '错误类型');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'error_message', '错误信息');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'event_metadata', '事件扩展元数据');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'occurred_at', '业务发生时间');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_events', 'created_at', '入库时间');

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
SELECT pg_temp.weknora_comment_index('uq_amp_tool_usage_events_event_id', '保证工具事件幂等');
SELECT pg_temp.weknora_comment_index('idx_amp_tool_usage_events_dimensions', '按租户、智能体、工具和时间聚合工具事件');
SELECT pg_temp.weknora_comment_index('idx_amp_tool_usage_events_run', '按运行 ID 关联工具事件');
SELECT pg_temp.weknora_comment_table('amp_tool_usage_events', '工具使用遥测事实表：覆盖内置工具、MCP 和 Skill 工具');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'id', '工具事件自增主键');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'event_id', '事件唯一 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'uid', '用户标识');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'agent_id', '智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'run_id', '运行 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'message_id', '消息 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'tool_call_id', '工具调用明细 ID');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'capability_type', '能力类型：builtin/mcp/skill');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'tool_name', '工具名称');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'status', '执行状态：success/error/cancelled');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'duration_ms', '执行耗时毫秒数');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'error_type', '错误类型');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'error_code', '错误码');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'event_metadata', '事件扩展元数据');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'occurred_at', '业务发生时间');
SELECT pg_temp.weknora_comment_column('amp_tool_usage_events', 'created_at', '入库时间');

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
SELECT pg_temp.weknora_comment_index('uq_amp_token_usage_events_event_id', '保证 token 事件幂等');
SELECT pg_temp.weknora_comment_index('idx_amp_token_usage_events_dimensions', '按租户、智能体、模型和时间聚合 token 消耗');
SELECT pg_temp.weknora_comment_index('idx_amp_token_usage_events_run', '按运行 ID 关联 token 事件');
SELECT pg_temp.weknora_comment_table('amp_token_usage_events', '模型 token 遥测事实表：保存每次模型调用的精确消耗');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'id', 'token 事件自增主键');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'event_id', '事件唯一 ID');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'uid', '用户标识');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'agent_id', '智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'run_id', '运行 ID');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'message_id', '消息 ID');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'model', '模型名称');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'prompt_tokens', '输入 token 数');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'completion_tokens', '输出 token 数');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'total_tokens', '总 token 数');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'event_metadata', '事件扩展元数据');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'occurred_at', '业务发生时间');
SELECT pg_temp.weknora_comment_column('amp_token_usage_events', 'created_at', '入库时间');

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
SELECT pg_temp.weknora_comment_index('uq_amp_agent_usage_daily_dimensions', '保证每日每租户每智能体只有一条聚合记录');
SELECT pg_temp.weknora_comment_table('amp_agent_usage_daily', '智能体按天聚合表：服务数据总览和最佳智能体 TOP 5');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'id', '聚合记录自增主键');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'stat_date', '统计日期');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'tenant_id', '所属工作空间 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'agent_id', '智能体 slug');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'session_count', '活跃会话数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'message_count', '消息数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'run_count', '运行数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'success_count', '成功运行数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'failure_count', '失败运行数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'cancelled_count', '取消运行数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'tool_call_count', '工具调用数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'tool_success_count', '工具成功数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'total_duration_ms', '运行总耗时毫秒数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'max_duration_ms', '运行最大耗时毫秒数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'prompt_tokens', '输入 token 总数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'completion_tokens', '输出 token 总数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'total_tokens', '总 token 数');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'score', '综合评分，用于最佳智能体排序');
SELECT pg_temp.weknora_comment_column('amp_agent_usage_daily', 'computed_at', '聚合计算时间');

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
SELECT pg_temp.weknora_comment_index('uq_amp_builtin_tools_slug_source', '同一工具标识可按 chat/work 各保留一份目录');
SELECT pg_temp.weknora_comment_index('uq_amp_builtin_tools_capability', '保证统一能力标识唯一');
SELECT pg_temp.weknora_comment_table('amp_builtin_tools', 'Harness 内置工具只读目录，用于统一预览、依赖解析和统计');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'id', '内置工具目录自增主键');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'tool_slug', '工具稳定标识');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'capability_key', '统一能力标识');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'name', '工具展示名称');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'description', '工具描述');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'category', '工具分类');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'input_schema', '工具输入 JSON Schema');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'enabled', '是否启用');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'source', '目录来源；chat 为平台侧，work 为 Harness 侧');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'capability_key', '来源前缀 + 工具标识的能力键');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'version', '工具版本');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_builtin_tools', 'updated_at', '最后更新时间');

SELECT pg_temp.weknora_comment_index('amp_agents_pkey', '智能体主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_sessions_pkey', '会话主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_subagent_threads_pkey', '子智能体线程主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_agent_runs_pkey', '智能体运行主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_messages_pkey', '消息主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_tool_calls_pkey', '工具调用主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_agent_run_requests_pkey', '运行请求主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_audit_logs_pkey', '审计日志主键索引，按 ID 精确定位记录');
SELECT pg_temp.weknora_comment_index('amp_agent_usage_events_pkey', '智能体遥测事件主键索引，保证事件 ID 定位');
SELECT pg_temp.weknora_comment_index('amp_tool_usage_events_pkey', '工具遥测事件主键索引，保证事件 ID 定位');
SELECT pg_temp.weknora_comment_index('amp_token_usage_events_pkey', 'Token 遥测事件主键索引，保证事件 ID 定位');
SELECT pg_temp.weknora_comment_index('amp_agent_usage_daily_pkey', '智能体日聚合主键索引，保证统计维度唯一');
SELECT pg_temp.weknora_comment_index('amp_builtin_tools_pkey', '内置工具目录主键索引，按 ID 精确定位记录');
-- 补充 0.8.0 新增对象和 amp 统一表的注释。

SELECT pg_temp.weknora_comment_column('messages', 'artifacts', '消息产物');
SELECT pg_temp.weknora_comment_column('messages', 'used_memories', '引用记忆');
SELECT pg_temp.weknora_comment_column('messages', 'usage', 'Token 用量');
SELECT pg_temp.weknora_comment_column('tenants', 'memory_config', '记忆配置');

SELECT pg_temp.weknora_comment_table('tenant_sandbox_configs', '租户沙箱配置');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'id', '主键');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'name', '配置名称');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'description', '配置描述');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'sandbox_type', '沙箱类型');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('tenant_sandbox_configs', 'deleted_at', '删除时间');

SELECT pg_temp.weknora_comment_table('tenant_skills', '租户技能安装');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'id', '主键');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'sandbox_config_id', '沙箱配置 ID');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'version', '技能版本');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'description', '技能描述');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'instructions', '技能指令');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'bundle_ref', '技能包引用');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'bundle_sha256', '技能包哈希');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'installed_snapshot_id', '安装快照 ID');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'status', '安装状态');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'error', '安装错误');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'installing_since', '安装开始时间');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'deleted_at', '删除时间');
SELECT pg_temp.weknora_comment_column('tenant_skills', 'catalog_id', '技能目录 ID');

SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'id', '主键');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'sandbox_config_id', '沙箱配置 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'skill_id', '技能 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'snapshot_id', '快照 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'parent_snapshot_id', '父快照 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'generation', '快照代数');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'trigger', '触发方式');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'state', '快照状态');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'superseded_at', '替换时间');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_skill_snapshots', 'updated_at', '更新时间');

SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'id', '主键');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'name', '技能名称');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'version', '技能版本');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'description', '技能描述');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'instructions', '技能指令');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'bundle_ref', '技能包引用');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'bundle_sha256', '技能包哈希');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'deleted_at', '删除时间');

SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'id', '主键');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'principal_type', '主体类型');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'principal_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'sandbox_config_id', '沙箱配置 ID');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'skill_id', '技能 ID');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'name', '变量名称');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('tenant_user_env_vars', 'updated_at', '更新时间');

SELECT pg_temp.weknora_comment_column('mcp_services', 'usage_instructions', '使用说明');
SELECT pg_temp.weknora_comment_column('mcp_tool_approvals', 'enabled', '是否启用审批');
SELECT pg_temp.weknora_comment_table('mcp_metadata', 'MCP 工具同步元数据');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'service_id', 'MCP 服务 ID');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'principal', '访问主体');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'config_fingerprint', '配置指纹');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'tools', '工具清单');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'instructions', '使用说明');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'server_name', '服务名称');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'server_version', '服务版本');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'server_description', '服务描述');
SELECT pg_temp.weknora_comment_column('mcp_metadata', 'synced_at', '同步时间');

SELECT pg_temp.weknora_comment_table('browser_devices', '浏览器设备授权');
SELECT pg_temp.weknora_comment_column('browser_devices', 'scope_key', '作用域键');
SELECT pg_temp.weknora_comment_column('browser_devices', 'id', '设备 ID');
SELECT pg_temp.weknora_comment_column('browser_devices', 'tenant', '租户 ID');
SELECT pg_temp.weknora_comment_column('browser_devices', 'user', '用户 ID');
SELECT pg_temp.weknora_comment_column('browser_devices', 'label', '设备名称');
SELECT pg_temp.weknora_comment_column('browser_devices', 'token_hash', '令牌哈希');
SELECT pg_temp.weknora_comment_column('browser_devices', 'previous_hash', '前一令牌哈希');
SELECT pg_temp.weknora_comment_column('browser_devices', 'previous_until', '前一令牌有效期');
SELECT pg_temp.weknora_comment_column('browser_devices', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('browser_devices', 'renew_after', '可续期时间');
SELECT pg_temp.weknora_comment_column('browser_devices', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('browser_devices', 'last_seen_at', '最近使用时间');
SELECT pg_temp.weknora_comment_column('browser_devices', 'revoked_at', '撤销时间');
SELECT pg_temp.weknora_comment_column('browser_devices', 'owner', '归属进程');
SELECT pg_temp.weknora_comment_column('browser_devices', 'owner_url', '进程地址');
SELECT pg_temp.weknora_comment_column('browser_devices', 'lease_key', '租约键');
SELECT pg_temp.weknora_comment_column('browser_devices', 'lease_until', '租约有效期');

SELECT pg_temp.weknora_comment_table('browser_pairings', '浏览器配对记录');
SELECT pg_temp.weknora_comment_column('browser_pairings', 'scope_key', '作用域键');
SELECT pg_temp.weknora_comment_column('browser_pairings', 'token_hash', '令牌哈希');
SELECT pg_temp.weknora_comment_column('browser_pairings', 'tenant', '租户 ID');
SELECT pg_temp.weknora_comment_column('browser_pairings', 'user', '用户 ID');
SELECT pg_temp.weknora_comment_column('browser_pairings', 'expires_at', '过期时间');

SELECT pg_temp.weknora_comment_table('browser_task_interruptions', '浏览器任务中断');
SELECT pg_temp.weknora_comment_column('browser_task_interruptions', 'scope_key', '作用域键');
SELECT pg_temp.weknora_comment_column('browser_task_interruptions', 'session', '会话 ID');

SELECT pg_temp.weknora_comment_table('memory_subjects', '记忆主体');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'id', '主键');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'enabled', '是否启用');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'block_text', '记忆文本');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'block_updated_at', '记忆更新时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'item_count', '条目数量');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'last_extracted_at', '最近抽取时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'extract_cursor', '抽取游标');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'pending_sessions', '待抽取会话');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'extract_scheduled_at', '计划抽取时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'consolidated_at', '归并时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'forced_consolidated_at', '手动归并时间');
SELECT pg_temp.weknora_comment_column('memory_subjects', 'extraction_state', '抽取状态');

SELECT pg_temp.weknora_comment_table('memory_items', '记忆条目');
SELECT pg_temp.weknora_comment_column('memory_items', 'id', '主键');
SELECT pg_temp.weknora_comment_column('memory_items', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_items', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_items', 'kind', '记忆类型');
SELECT pg_temp.weknora_comment_column('memory_items', 'content', '记忆内容');
SELECT pg_temp.weknora_comment_column('memory_items', 'topic', '记忆主题');
SELECT pg_temp.weknora_comment_column('memory_items', 'normalized_key', '主题键');
SELECT pg_temp.weknora_comment_column('memory_items', 'importance', '重要程度');
SELECT pg_temp.weknora_comment_column('memory_items', 'origin', '记忆来源');
SELECT pg_temp.weknora_comment_column('memory_items', 'status', '状态');
SELECT pg_temp.weknora_comment_column('memory_items', 'source_session_id', '来源会话 ID');
SELECT pg_temp.weknora_comment_column('memory_items', 'source_message_id', '来源消息 ID');
SELECT pg_temp.weknora_comment_column('memory_items', 'valid_from', '生效时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'invalid_at', '失效时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'expires_at', '过期时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'superseded_by', '替换记录 ID');
SELECT pg_temp.weknora_comment_column('memory_items', 'last_used_at', '最近使用时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'use_count', '使用次数');
SELECT pg_temp.weknora_comment_column('memory_items', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('memory_items', 'replaces_id', '被替换记录 ID');

SELECT pg_temp.weknora_comment_table('memory_tombstones', '记忆删除记录');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'id', '主键');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'topic', '记忆主题');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'fingerprint', '内容指纹');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'source_message_id', '来源消息 ID');
SELECT pg_temp.weknora_comment_column('memory_tombstones', 'created_at', '创建时间');

SELECT pg_temp.weknora_comment_table('memory_topic_stats', '记忆主题统计');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'id', '主键');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'normalized_key', '主题键');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'topic', '记忆主题');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'hits', '出现次数');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'last_seen_at', '最近出现时间');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'promoted_at', '提升时间');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('memory_topic_stats', 'aliases', '主题别名');

SELECT pg_temp.weknora_comment_table('memory_doc_affinity', '文档使用偏好');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'id', '主键');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'knowledge_id', '知识 ID');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'knowledge_base_id', '知识库 ID');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'title', '文档标题');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'hits', '使用次数');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'last_used_at', '最近使用时间');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('memory_doc_affinity', 'updated_at', '更新时间');

SELECT pg_temp.weknora_comment_table('memory_item_embeddings', '记忆向量');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'item_id', '记忆条目 ID');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'model_id', '模型 ID');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'dims', '向量维度');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'vector', '向量数据');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'updated_at', '更新时间');
SELECT pg_temp.weknora_comment_column('memory_item_embeddings', 'embedding', '向量索引');

SELECT pg_temp.weknora_comment_table('memory_extraction_sessions', '记忆抽取进度');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'subject_id', '主体 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'session_id', '会话 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'revision', '修订号');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'cursor_at', '游标时间');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'cursor_id', '游标 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'pending', '是否待处理');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failure_count', '失败次数');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failure_code', '失败编码');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failed_from_at', '失败段开始时间');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failed_from_id', '失败段开始 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failed_to_at', '失败段结束时间');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failed_to_id', '失败段结束 ID');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'failed_at', '失败时间');
SELECT pg_temp.weknora_comment_column('memory_extraction_sessions', 'updated_at', '更新时间');

SELECT pg_temp.weknora_comment_column('amp_agents', 'id', '主键');
SELECT pg_temp.weknora_comment_column('amp_agents', 'slug', '智能体标识');
SELECT pg_temp.weknora_comment_column('amp_agents', 'backend_id', '后端 ID');
SELECT pg_temp.weknora_comment_column('amp_agents', 'name', '智能体名称');
SELECT pg_temp.weknora_comment_column('amp_agents', 'description', '智能体描述');
SELECT pg_temp.weknora_comment_column('amp_agents', 'icon', '图标');
SELECT pg_temp.weknora_comment_column('amp_agents', 'pics', '图片配置');
SELECT pg_temp.weknora_comment_column('amp_agents', 'config_json', '运行配置');
SELECT pg_temp.weknora_comment_column('amp_agents', 'share_config', '共享配置');
SELECT pg_temp.weknora_comment_column('amp_agents', 'is_default', '是否默认');
SELECT pg_temp.weknora_comment_column('amp_agents', 'is_subagent', '是否子智能体');
SELECT pg_temp.weknora_comment_column('amp_agents', 'created_by', '创建人');
SELECT pg_temp.weknora_comment_column('amp_agents', 'updated_by', '更新人');
SELECT pg_temp.weknora_comment_column('amp_agents', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('amp_agents', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_agents', 'updated_at', '更新时间');

SELECT pg_temp.weknora_comment_column('amp_subagent_threads', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_runs', 'tenant_id', '租户 ID');
SELECT pg_temp.weknora_comment_column('amp_agent_run_requests', 'tenant_id', '租户 ID');

SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'id', '主键');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'user_id', '用户 ID');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'operation', '操作名称');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'details', '操作详情');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'ip_address', 'IP 地址');
SELECT pg_temp.weknora_comment_column('amp_audit_logs', 'timestamp', '操作时间');

SELECT pg_temp.weknora_comment_column('amp_model_provider', 'id', '主键');
SELECT pg_temp.weknora_comment_column('amp_model_provider', 'created_at', '创建时间');
SELECT pg_temp.weknora_comment_column('amp_model_provider', 'updated_at', '更新时间');
-- 统一表注释为短名，最长 10 个字符并以“表”结尾。

SELECT pg_temp.weknora_comment_table('agent_shares', '智能体共享表');
SELECT pg_temp.weknora_comment_table('amp_agent_run_requests', '请求队列表');
SELECT pg_temp.weknora_comment_table('amp_agent_runs', '智能体运行表');
SELECT pg_temp.weknora_comment_table('amp_agent_usage_daily', '智能体日报表');
SELECT pg_temp.weknora_comment_table('amp_agent_usage_events', '智能体事件表');
SELECT pg_temp.weknora_comment_table('amp_agents', '运行智能体表');
SELECT pg_temp.weknora_comment_table('amp_audit_logs', '运行审计表');
SELECT pg_temp.weknora_comment_table('amp_builtin_tools', '内置工具表');
SELECT pg_temp.weknora_comment_table('amp_messages', '运行消息表');
SELECT pg_temp.weknora_comment_table('amp_model_provider', '模型厂商配置表');
SELECT pg_temp.weknora_comment_table('amp_sessions', '运行会话表');
SELECT pg_temp.weknora_comment_table('amp_subagent_threads', '子智能体表');
SELECT pg_temp.weknora_comment_table('amp_token_usage_events', 'Token事件表');
SELECT pg_temp.weknora_comment_table('amp_tool_calls', '工具调用表');
SELECT pg_temp.weknora_comment_table('amp_tool_usage_events', '工具事件表');
SELECT pg_temp.weknora_comment_table('amp_web_search_provider_types', '搜索源类型表');
SELECT pg_temp.weknora_comment_table('audit_logs', '平台审计表');
SELECT pg_temp.weknora_comment_table('auth_tokens', '认证令牌表');
SELECT pg_temp.weknora_comment_table('browser_devices', '浏览器设备表');
SELECT pg_temp.weknora_comment_table('browser_pairings', '浏览器配对表');
SELECT pg_temp.weknora_comment_table('browser_task_interruptions', '任务中断表');
SELECT pg_temp.weknora_comment_table('chunk_revisions', '分块修订表');
SELECT pg_temp.weknora_comment_table('chunks', '知识分块表');
SELECT pg_temp.weknora_comment_table('custom_agents', '平台智能体表');
SELECT pg_temp.weknora_comment_table('data_sources', '数据源表');
SELECT pg_temp.weknora_comment_table('embed_channels', '嵌入渠道表');
SELECT pg_temp.weknora_comment_table('embeddings', '向量嵌入表');
SELECT pg_temp.weknora_comment_table('im_channel_sessions', '渠道会话表');
SELECT pg_temp.weknora_comment_table('im_channels', 'IM渠道表');
SELECT pg_temp.weknora_comment_table('kb_shares', '知识库共享表');
SELECT pg_temp.weknora_comment_table('knowledge_base_mindmaps', '知识库脑图表');
SELECT pg_temp.weknora_comment_table('knowledge_bases', '知识库表');
SELECT pg_temp.weknora_comment_table('knowledge_processing_spans', '解析追踪表');
SELECT pg_temp.weknora_comment_table('knowledge_tag_relations', '标签关系表');
SELECT pg_temp.weknora_comment_table('knowledge_tags', '知识标签表');
SELECT pg_temp.weknora_comment_table('knowledges', '知识条目表');
SELECT pg_temp.weknora_comment_table('mcp_metadata', 'MCP元数据表');
SELECT pg_temp.weknora_comment_table('mcp_oauth_clients', 'OAuth客户端表');
SELECT pg_temp.weknora_comment_table('mcp_oauth_tokens', 'OAuth令牌表');
SELECT pg_temp.weknora_comment_table('mcp_services', 'MCP服务表');
SELECT pg_temp.weknora_comment_table('mcp_tool_approvals', '工具审批表');
SELECT pg_temp.weknora_comment_table('memory_doc_affinity', '文档偏好表');
SELECT pg_temp.weknora_comment_table('memory_extraction_sessions', '记忆抽取表');
SELECT pg_temp.weknora_comment_table('memory_item_embeddings', '记忆向量表');
SELECT pg_temp.weknora_comment_table('memory_items', '记忆条目表');
SELECT pg_temp.weknora_comment_table('memory_subjects', '记忆主体表');
SELECT pg_temp.weknora_comment_table('memory_tombstones', '记忆删除表');
SELECT pg_temp.weknora_comment_table('memory_topic_stats', '记忆主题表');
SELECT pg_temp.weknora_comment_table('message_suggestion_events', '追问事件表');
SELECT pg_temp.weknora_comment_table('message_suggestion_sets', '追问集合表');
SELECT pg_temp.weknora_comment_table('messages', '平台消息表');
SELECT pg_temp.weknora_comment_table('models', '模型配置表');
SELECT pg_temp.weknora_comment_table('organization_join_requests', '组织申请表');
SELECT pg_temp.weknora_comment_table('organization_members_pre_plan3', '历史成员表');
SELECT pg_temp.weknora_comment_table('organization_tenant_members', '组织成员表');
SELECT pg_temp.weknora_comment_table('organizations', '组织表');
SELECT pg_temp.weknora_comment_table('resource_access_grants', '资源授权表');
SELECT pg_temp.weknora_comment_table('resource_bindings', '资源绑定表');
SELECT pg_temp.weknora_comment_table('resources', '资源表');
SELECT pg_temp.weknora_comment_table('sessions', '平台会话表');
SELECT pg_temp.weknora_comment_table('storage_backends', '存储后端表');
SELECT pg_temp.weknora_comment_table('sync_logs', '同步日志表');
SELECT pg_temp.weknora_comment_table('system_settings', '系统配置表');
SELECT pg_temp.weknora_comment_table('task_dead_letters', '死信队列表');
SELECT pg_temp.weknora_comment_table('task_pending_ops', '任务队列表');
SELECT pg_temp.weknora_comment_table('temporary_documents', '临时文档表');
SELECT pg_temp.weknora_comment_table('tenant_api_keys', '租户密钥表');
SELECT pg_temp.weknora_comment_table('tenant_disabled_shared_agents', '共享屏蔽表');
SELECT pg_temp.weknora_comment_table('tenant_invitations', '租户邀请表');
SELECT pg_temp.weknora_comment_table('tenant_members', '租户成员表');
SELECT pg_temp.weknora_comment_table('tenant_sandbox_configs', '沙箱配置表');
SELECT pg_temp.weknora_comment_table('tenant_skill_catalog', '技能目录表');
SELECT pg_temp.weknora_comment_table('tenant_skill_snapshots', '技能快照表');
SELECT pg_temp.weknora_comment_table('tenant_skills', '租户技能表');
SELECT pg_temp.weknora_comment_table('tenant_user_env_vars', '用户变量表');
SELECT pg_temp.weknora_comment_table('tenants', '租户表');
SELECT pg_temp.weknora_comment_table('user_kb_pins', '知识置顶表');
SELECT pg_temp.weknora_comment_table('user_resource_favorites', '资源收藏表');
SELECT pg_temp.weknora_comment_table('users', '用户表');
SELECT pg_temp.weknora_comment_table('vector_stores', '向量库表');
SELECT pg_temp.weknora_comment_table('web_search_providers', '搜索源配置表');
SELECT pg_temp.weknora_comment_table('wiki_folders', 'Wiki目录表');
SELECT pg_temp.weknora_comment_table('wiki_page_issues', '页面问题表');
SELECT pg_temp.weknora_comment_table('wiki_page_revisions', '页面版本表');
SELECT pg_temp.weknora_comment_table('wiki_pages', 'Wiki页面表');

UPDATE amp_builtin_tools
SET capability_key = 'work:' || tool_slug
WHERE source = 'builtin';

UPDATE amp_builtin_tools
SET source = 'work'
WHERE source = 'builtin';

UPDATE amp_builtin_tools
SET source = 'work'
WHERE source IS NULL OR source NOT IN ('chat', 'work');

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

-- 历史来源值收成使用侧，避免检查约束把整段迁移回滚。
UPDATE tenant_skill_catalog
SET source_type = CASE WHEN source_type = 'builtin' THEN 'work' ELSE 'chat' END
WHERE source_type IS NULL OR source_type NOT IN ('chat', 'work', 'common');

ALTER TABLE tenant_skill_catalog
    DROP CONSTRAINT IF EXISTS ck_tenant_skill_catalog_source_type;
ALTER TABLE tenant_skill_catalog
    ADD CONSTRAINT ck_tenant_skill_catalog_source_type
    CHECK (source_type IN ('chat', 'work', 'common'));

SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'source_type', '使用侧：chat 对话、work 工作、common 通用');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'tool_dependencies', '绑定的工具');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'mcp_dependencies', '绑定的 MCP');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'skill_dependencies', '绑定的其他技能');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'share_config', '共享范围');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'enabled', '是否启用');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'created_by', '创建人');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'updated_by', '最近更新人');
SELECT pg_temp.weknora_comment_column('tenant_skill_catalog', 'source_mtime', '内置技能源目录最后修改时间');

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
