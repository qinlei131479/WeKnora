-- Migration: 000083_harness_tenant_scope
-- Description: P2 影子 tenant_id、回填映射表、slug 按空间唯一。可空，不改部门表。
-- 本机 schema_migrations.version 可能已是 83（临时迁移删除后残留）。
-- 该情况下 golang-migrate 不会再执行本文件，由 harness ensure_business_schema 幂等补齐。

ALTER TABLE IF EXISTS h_conversations ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_conversations_tenant_id ON h_conversations (tenant_id);

ALTER TABLE IF EXISTS h_agents ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_agents_tenant_id ON h_agents (tenant_id);

ALTER TABLE IF EXISTS h_skills ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_skills_tenant_id ON h_skills (tenant_id);

ALTER TABLE IF EXISTS h_mcp_servers ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_mcp_servers_tenant_id ON h_mcp_servers (tenant_id);

ALTER TABLE IF EXISTS h_agent_runs ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_agent_runs_tenant_id ON h_agent_runs (tenant_id);

ALTER TABLE IF EXISTS h_agent_run_requests ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_agent_run_requests_tenant_id ON h_agent_run_requests (tenant_id);

ALTER TABLE IF EXISTS h_subagent_threads ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_subagent_threads_tenant_id ON h_subagent_threads (tenant_id);

ALTER TABLE IF EXISTS h_message_feedbacks ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_message_feedbacks_tenant_id ON h_message_feedbacks (tenant_id);

ALTER TABLE IF EXISTS h_agent_envs ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_agent_envs_tenant_id ON h_agent_envs (tenant_id);

ALTER TABLE IF EXISTS h_user_config ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_user_config_tenant_id ON h_user_config (tenant_id);

ALTER TABLE IF EXISTS h_knowledge_bases ADD COLUMN IF NOT EXISTS tenant_id BIGINT;
CREATE INDEX IF NOT EXISTS ix_h_knowledge_bases_tenant_id ON h_knowledge_bases (tenant_id);

CREATE TABLE IF NOT EXISTS h_tenant_backfill_map (
	id SERIAL PRIMARY KEY,
	table_name VARCHAR(64) NOT NULL,
	row_pk VARCHAR(64) NOT NULL,
	tenant_id BIGINT,
	source VARCHAR(64) NOT NULL,
	batch_id VARCHAR(64),
	created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_h_tenant_backfill_map_table_name ON h_tenant_backfill_map (table_name);

CREATE INDEX IF NOT EXISTS ix_agent_run_requests_queue_tenant
	ON h_agent_run_requests (tenant_id, uid, agent_slug, conversation_thread_id, status, created_at, id);

CREATE INDEX IF NOT EXISTS idx_agent_runs_tenant_thread
	ON h_agent_runs (tenant_id, uid, agent_slug, conversation_thread_id);

-- slug：当前空间唯一 + 目录（tenant_id IS NULL）全局唯一
ALTER TABLE IF EXISTS h_agents DROP CONSTRAINT IF EXISTS h_agents_slug_key;
ALTER TABLE IF EXISTS h_agents DROP CONSTRAINT IF EXISTS agents_slug_key;
DROP INDEX IF EXISTS ix_agents_slug;

ALTER TABLE IF EXISTS h_skills DROP CONSTRAINT IF EXISTS h_skills_slug_key;
ALTER TABLE IF EXISTS h_skills DROP CONSTRAINT IF EXISTS skills_slug_key;
DROP INDEX IF EXISTS ix_skills_slug;

ALTER TABLE IF EXISTS h_mcp_servers DROP CONSTRAINT IF EXISTS h_mcp_servers_slug_key;
ALTER TABLE IF EXISTS h_mcp_servers DROP CONSTRAINT IF EXISTS mcp_servers_slug_key;
DROP INDEX IF EXISTS ix_mcp_servers_slug;

CREATE UNIQUE INDEX IF NOT EXISTS uq_agents_slug_tenant
	ON h_agents (tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_agents_slug_catalog
	ON h_agents (slug) WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_skills_slug_tenant
	ON h_skills (tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_skills_slug_catalog
	ON h_skills (slug) WHERE tenant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_mcp_servers_slug_tenant
	ON h_mcp_servers (tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_mcp_servers_slug_catalog
	ON h_mcp_servers (slug) WHERE tenant_id IS NULL;
