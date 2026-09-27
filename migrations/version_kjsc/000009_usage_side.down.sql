-- 回退对话侧用量同步。会删除 usage_side=chat 的事实和日聚合，工作侧记录保留。
DROP INDEX IF EXISTS idx_messages_usage_sync_cursor;

DELETE FROM amp_agent_usage_daily WHERE usage_side = 'chat';
DELETE FROM amp_agent_usage_events WHERE usage_side = 'chat';
DELETE FROM amp_tool_usage_events WHERE usage_side = 'chat';
DELETE FROM amp_token_usage_events WHERE usage_side = 'chat';

DROP TABLE IF EXISTS amp_usage_sync_state;

DROP INDEX IF EXISTS idx_amp_agent_usage_events_side;
DROP INDEX IF EXISTS idx_amp_tool_usage_events_side;
DROP INDEX IF EXISTS idx_amp_token_usage_events_side;

ALTER TABLE amp_agent_usage_events DROP CONSTRAINT IF EXISTS ck_amp_agent_usage_events_usage_side;
ALTER TABLE amp_tool_usage_events DROP CONSTRAINT IF EXISTS ck_amp_tool_usage_events_usage_side;
ALTER TABLE amp_token_usage_events DROP CONSTRAINT IF EXISTS ck_amp_token_usage_events_usage_side;
ALTER TABLE amp_agent_usage_daily DROP CONSTRAINT IF EXISTS ck_amp_agent_usage_daily_usage_side;

DROP INDEX IF EXISTS uq_amp_agent_usage_daily_dimensions;

ALTER TABLE amp_agent_usage_events
    DROP COLUMN IF EXISTS external_session_id,
    DROP COLUMN IF EXISTS channel,
    DROP COLUMN IF EXISTS usage_side;
ALTER TABLE amp_tool_usage_events
    DROP COLUMN IF EXISTS external_session_id,
    DROP COLUMN IF EXISTS channel,
    DROP COLUMN IF EXISTS usage_side;
ALTER TABLE amp_token_usage_events
    DROP COLUMN IF EXISTS external_session_id,
    DROP COLUMN IF EXISTS channel,
    DROP COLUMN IF EXISTS usage_side;
ALTER TABLE amp_agent_usage_daily
    DROP COLUMN IF EXISTS usage_side;

CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agent_usage_daily_dimensions
    ON amp_agent_usage_daily(stat_date, tenant_id, agent_id);
