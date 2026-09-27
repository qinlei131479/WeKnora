-- 用量事实区分对话侧与工作侧，并记录对话消息同步水位。
-- 已有工作侧记录默认 usage_side=work。对话侧由 Harness 定时任务补入。

ALTER TABLE amp_agent_usage_events
    ADD COLUMN IF NOT EXISTS usage_side VARCHAR(16) NOT NULL DEFAULT 'work',
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS external_session_id VARCHAR(64);

ALTER TABLE amp_tool_usage_events
    ADD COLUMN IF NOT EXISTS usage_side VARCHAR(16) NOT NULL DEFAULT 'work',
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS external_session_id VARCHAR(64);

ALTER TABLE amp_token_usage_events
    ADD COLUMN IF NOT EXISTS usage_side VARCHAR(16) NOT NULL DEFAULT 'work',
    ADD COLUMN IF NOT EXISTS channel VARCHAR(50) NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS external_session_id VARCHAR(64);

ALTER TABLE amp_agent_usage_daily
    ADD COLUMN IF NOT EXISTS usage_side VARCHAR(16) NOT NULL DEFAULT 'work';

ALTER TABLE amp_agent_usage_events DROP CONSTRAINT IF EXISTS ck_amp_agent_usage_events_usage_side;
ALTER TABLE amp_agent_usage_events
    ADD CONSTRAINT ck_amp_agent_usage_events_usage_side CHECK (usage_side IN ('chat', 'work'));

ALTER TABLE amp_tool_usage_events DROP CONSTRAINT IF EXISTS ck_amp_tool_usage_events_usage_side;
ALTER TABLE amp_tool_usage_events
    ADD CONSTRAINT ck_amp_tool_usage_events_usage_side CHECK (usage_side IN ('chat', 'work'));

ALTER TABLE amp_token_usage_events DROP CONSTRAINT IF EXISTS ck_amp_token_usage_events_usage_side;
ALTER TABLE amp_token_usage_events
    ADD CONSTRAINT ck_amp_token_usage_events_usage_side CHECK (usage_side IN ('chat', 'work'));

ALTER TABLE amp_agent_usage_daily DROP CONSTRAINT IF EXISTS ck_amp_agent_usage_daily_usage_side;
ALTER TABLE amp_agent_usage_daily
    ADD CONSTRAINT ck_amp_agent_usage_daily_usage_side CHECK (usage_side IN ('chat', 'work'));

DROP INDEX IF EXISTS uq_amp_agent_usage_daily_dimensions;
CREATE UNIQUE INDEX uq_amp_agent_usage_daily_dimensions
    ON amp_agent_usage_daily(stat_date, tenant_id, agent_id, usage_side);

CREATE INDEX IF NOT EXISTS idx_amp_agent_usage_events_side
    ON amp_agent_usage_events(tenant_id, usage_side, occurred_at);
CREATE INDEX IF NOT EXISTS idx_amp_tool_usage_events_side
    ON amp_tool_usage_events(tenant_id, usage_side, occurred_at);
CREATE INDEX IF NOT EXISTS idx_amp_token_usage_events_side
    ON amp_token_usage_events(tenant_id, usage_side, occurred_at);

CREATE TABLE IF NOT EXISTS amp_usage_sync_state (
    sync_key VARCHAR(64) PRIMARY KEY,
    cursor_updated_at TIMESTAMPTZ,
    cursor_id VARCHAR(64),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 删除过滤只用于避免继续扫描已删除源消息；已落账的用量事实不回删。
DO $$
BEGIN
    IF to_regclass('messages') IS NOT NULL THEN
        CREATE INDEX IF NOT EXISTS idx_messages_usage_sync_cursor
        ON messages(updated_at, id)
        WHERE deleted_at IS NULL
          AND role = 'assistant'
          AND is_completed IS TRUE;
    END IF;
END
$$;

COMMENT ON COLUMN amp_agent_usage_events.usage_side IS '用量来源：chat 对话侧，work 工作侧';
COMMENT ON COLUMN amp_agent_usage_events.channel IS '来源渠道，如 web、im、api，供后续分类统计';
COMMENT ON COLUMN amp_agent_usage_events.external_session_id IS '对话侧会话 ID。工作侧整数会话仍用 session_id';
COMMENT ON COLUMN amp_tool_usage_events.usage_side IS '用量来源：chat 对话侧，work 工作侧';
COMMENT ON COLUMN amp_tool_usage_events.channel IS '来源渠道，如 web、im、api，供后续分类统计';
COMMENT ON COLUMN amp_tool_usage_events.external_session_id IS '对话侧会话 ID。工作侧整数会话仍用 session_id';
COMMENT ON COLUMN amp_token_usage_events.usage_side IS '用量来源：chat 对话侧，work 工作侧';
COMMENT ON COLUMN amp_token_usage_events.channel IS '来源渠道，如 web、im、api，供后续分类统计';
COMMENT ON COLUMN amp_token_usage_events.external_session_id IS '对话侧会话 ID。工作侧整数会话仍用 session_id';
COMMENT ON COLUMN amp_agent_usage_daily.usage_side IS '用量来源：chat 对话侧，work 工作侧';
COMMENT ON TABLE amp_usage_sync_state IS '对话侧用量同步水位';
COMMENT ON COLUMN amp_usage_sync_state.sync_key IS '同步任务键';
COMMENT ON COLUMN amp_usage_sync_state.cursor_updated_at IS '已处理消息的更新时间';
COMMENT ON COLUMN amp_usage_sync_state.cursor_id IS '同一更新时间下已处理到的消息 ID';
COMMENT ON COLUMN amp_usage_sync_state.updated_at IS '水位更新时间';
