-- P7：删除 harness 重复能力表。只 DROP 未列入核心清单的表。
-- 禁止 migrate down。核心表（h_agents/h_skills/h_conversations 等）与 LangGraph checkpoint 不动。

-- 先去掉仍指向 h_users 的外键，避免 DROP 失败。
DO $$
DECLARE
    r record;
BEGIN
    IF to_regclass('public.h_users') IS NULL THEN
        RETURN;
    END IF;
    FOR r IN
        SELECT conrelid::regclass AS tbl, conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid = 'public.h_users'::regclass
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.conname);
    END LOOP;
END $$;

DO $$
DECLARE
    r record;
BEGIN
    IF to_regclass('public.h_departments') IS NULL THEN
        RETURN;
    END IF;
    FOR r IN
        SELECT conrelid::regclass AS tbl, conname
        FROM pg_constraint
        WHERE contype = 'f'
          AND confrelid = 'public.h_departments'::regclass
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT IF EXISTS %I', r.tbl, r.conname);
    END LOOP;
END $$;

ALTER TABLE IF EXISTS h_operation_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE IF EXISTS h_operation_logs
    ALTER COLUMN user_id TYPE VARCHAR(36) USING user_id::text;

DROP TABLE IF EXISTS h_cli_auth_sessions CASCADE;
DROP TABLE IF EXISTS h_api_keys CASCADE;
DROP TABLE IF EXISTS h_evaluation_run_items CASCADE;
DROP TABLE IF EXISTS h_evaluation_runs CASCADE;
DROP TABLE IF EXISTS h_evaluation_dataset_items CASCADE;
DROP TABLE IF EXISTS h_evaluation_datasets CASCADE;
DROP TABLE IF EXISTS h_knowledge_graph_entity_mentions CASCADE;
DROP TABLE IF EXISTS h_knowledge_graph_triple_mentions CASCADE;
DROP TABLE IF EXISTS h_knowledge_graph_triples CASCADE;
DROP TABLE IF EXISTS h_knowledge_graph_entities CASCADE;
DROP TABLE IF EXISTS h_knowledge_chunks CASCADE;
DROP TABLE IF EXISTS h_knowledge_files CASCADE;
DROP TABLE IF EXISTS h_knowledge_bases CASCADE;
DROP TABLE IF EXISTS h_model_providers CASCADE;
DROP TABLE IF EXISTS h_user_identity_map CASCADE;
DROP TABLE IF EXISTS h_departments CASCADE;
DROP TABLE IF EXISTS h_users CASCADE;
