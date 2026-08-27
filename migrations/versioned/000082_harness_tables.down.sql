-- Migration: 000082_harness_tables (down)
-- Drop only h_* harness tables. Never drop WeKnora tables.

DROP TABLE IF EXISTS "h_tool_calls" CASCADE;
DROP TABLE IF EXISTS "h_message_feedbacks" CASCADE;
DROP TABLE IF EXISTS "h_agent_run_requests" CASCADE;
DROP TABLE IF EXISTS "h_messages" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_graph_triple_mentions" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_graph_entity_mentions" CASCADE;
DROP TABLE IF EXISTS "h_evaluation_run_items" CASCADE;
DROP TABLE IF EXISTS "h_cli_auth_sessions" CASCADE;
DROP TABLE IF EXISTS "h_user_config" CASCADE;
DROP TABLE IF EXISTS "h_operation_logs" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_graph_triples" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_chunks" CASCADE;
DROP TABLE IF EXISTS "h_evaluation_runs" CASCADE;
DROP TABLE IF EXISTS "h_evaluation_dataset_items" CASCADE;
DROP TABLE IF EXISTS "h_api_keys" CASCADE;
DROP TABLE IF EXISTS "h_agent_runs" CASCADE;
DROP TABLE IF EXISTS "h_agent_envs" CASCADE;
DROP TABLE IF EXISTS "h_users" CASCADE;
DROP TABLE IF EXISTS "h_subagent_threads" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_graph_entities" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_files" CASCADE;
DROP TABLE IF EXISTS "h_evaluation_datasets" CASCADE;
DROP TABLE IF EXISTS "h_conversation_stats" CASCADE;
DROP TABLE IF EXISTS "h_tasks" CASCADE;
DROP TABLE IF EXISTS "h_skills" CASCADE;
DROP TABLE IF EXISTS "h_model_providers" CASCADE;
DROP TABLE IF EXISTS "h_mcp_servers" CASCADE;
DROP TABLE IF EXISTS "h_knowledge_bases" CASCADE;
DROP TABLE IF EXISTS "h_departments" CASCADE;
DROP TABLE IF EXISTS "h_conversations" CASCADE;
DROP TABLE IF EXISTS "h_config_options" CASCADE;
DROP TABLE IF EXISTS "h_agents" CASCADE;

DROP TABLE IF EXISTS checkpoint_writes;
DROP TABLE IF EXISTS checkpoint_blobs;
DROP TABLE IF EXISTS checkpoints;
DROP TABLE IF EXISTS checkpoint_migrations;

