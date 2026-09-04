-- 测试环境反向 remap（仅 000006 之前可用）。不删除 h_user_identity_map。
-- 98e324c7-8d86-4550-a4c2-cfca9e0d42b6 → admin
-- P7 代码已上线后不要跑本脚本，回滚用 dump。

BEGIN;

UPDATE h_conversations SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_agent_runs SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_agent_run_requests SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_subagent_threads SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_message_feedbacks SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_agent_envs SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_user_config SET uid = 'admin' WHERE uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';

UPDATE h_agents SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_agents SET updated_by = 'admin' WHERE updated_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_skills SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_skills SET updated_by = 'admin' WHERE updated_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_knowledge_bases SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_knowledge_files SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_knowledge_files SET updated_by = 'admin' WHERE updated_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_evaluation_datasets SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_evaluation_runs SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_mcp_servers SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_mcp_servers SET updated_by = 'admin' WHERE updated_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_config_options SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_config_options SET updated_by = 'admin' WHERE updated_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';
UPDATE h_api_keys SET created_by = 'admin' WHERE created_by = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';

UPDATE h_agents SET share_config = replace(share_config::text, '"98e324c7-8d86-4550-a4c2-cfca9e0d42b6"', '"admin"')::jsonb
 WHERE share_config::text LIKE '%98e324c7-8d86-4550-a4c2-cfca9e0d42b6%';
UPDATE h_skills SET share_config = replace(share_config::text, '"98e324c7-8d86-4550-a4c2-cfca9e0d42b6"', '"admin"')::jsonb
 WHERE share_config::text LIKE '%98e324c7-8d86-4550-a4c2-cfca9e0d42b6%';
UPDATE h_knowledge_bases SET share_config = replace(share_config::text, '"98e324c7-8d86-4550-a4c2-cfca9e0d42b6"', '"admin"')::jsonb
 WHERE share_config IS NOT NULL AND share_config::text LIKE '%98e324c7-8d86-4550-a4c2-cfca9e0d42b6%';

UPDATE h_users SET uid = 'admin' WHERE id = 1 AND uid = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6';

COMMIT;
