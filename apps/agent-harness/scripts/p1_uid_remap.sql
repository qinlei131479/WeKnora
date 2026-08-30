-- P1.8 单用户正向 remap。保留 h_users.id。先改子表再改 h_users.uid。
-- 旧 uid=admin → 7b4f08b5-9cbe-417e-8736-f864b0e60448

BEGIN;

CREATE TABLE IF NOT EXISTS h_user_identity_map (
    id SERIAL PRIMARY KEY,
    h_user_id INTEGER NOT NULL,
    old_uid VARCHAR(64) NOT NULL,
    new_uid VARCHAR(64) NOT NULL,
    weknora_user_id VARCHAR(36) NOT NULL,
    confirmed_by VARCHAR(64),
    confirmed_at TIMESTAMPTZ,
    batch_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_user_identity_map_weknora_user_id
    ON h_user_identity_map (weknora_user_id);
CREATE INDEX IF NOT EXISTS ix_user_identity_map_h_user_id
    ON h_user_identity_map (h_user_id);

INSERT INTO h_user_identity_map (
    h_user_id, old_uid, new_uid, weknora_user_id,
    confirmed_by, confirmed_at, batch_id
)
SELECT 1, 'admin', '7b4f08b5-9cbe-417e-8736-f864b0e60448',
       '7b4f08b5-9cbe-417e-8736-f864b0e60448',
       'operator-confirm', NOW(), 'p1-20260830'
WHERE NOT EXISTS (
    SELECT 1 FROM h_user_identity_map
    WHERE weknora_user_id = '7b4f08b5-9cbe-417e-8736-f864b0e60448'
);

-- A 组（不含 h_users）
UPDATE h_conversations SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_agent_runs SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_agent_run_requests SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_subagent_threads SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_message_feedbacks SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_agent_envs SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';
UPDATE h_user_config SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE uid = 'admin';

-- B 组
UPDATE h_agents SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_agents SET updated_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE updated_by = 'admin';
UPDATE h_skills SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_skills SET updated_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE updated_by = 'admin';
UPDATE h_knowledge_bases SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_knowledge_files SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_knowledge_files SET updated_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE updated_by = 'admin';
UPDATE h_evaluation_datasets SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_evaluation_runs SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_mcp_servers SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_mcp_servers SET updated_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE updated_by = 'admin';
UPDATE h_config_options SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';
UPDATE h_config_options SET updated_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE updated_by = 'admin';
UPDATE h_api_keys SET created_by = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE created_by = 'admin';

-- E 组
UPDATE h_agents SET share_config = replace(share_config::text, '"admin"', '"7b4f08b5-9cbe-417e-8736-f864b0e60448"')::jsonb
 WHERE share_config::text LIKE '%"admin"%';
UPDATE h_skills SET share_config = replace(share_config::text, '"admin"', '"7b4f08b5-9cbe-417e-8736-f864b0e60448"')::jsonb
 WHERE share_config::text LIKE '%"admin"%';
UPDATE h_knowledge_bases SET share_config = replace(share_config::text, '"admin"', '"7b4f08b5-9cbe-417e-8736-f864b0e60448"')::jsonb
 WHERE share_config IS NOT NULL AND share_config::text LIKE '%"admin"%';

-- 最后改父表
UPDATE h_users SET uid = '7b4f08b5-9cbe-417e-8736-f864b0e60448' WHERE id = 1 AND uid = 'admin';

ANALYZE h_conversations;
ANALYZE h_agent_runs;
ANALYZE h_agent_run_requests;
ANALYZE h_users;

COMMIT;
