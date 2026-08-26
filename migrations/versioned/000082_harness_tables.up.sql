-- Migration: 000082_harness_tables
-- Description: Add Yuxi/harness tables with h_ prefix. Additive only.
-- Does not ALTER/DROP existing WeKnora tables. Leaves the old agent_harness DB untouched.

CREATE TABLE IF NOT EXISTS h_agents (
	id SERIAL NOT NULL, 
	slug VARCHAR(80) NOT NULL, 
	backend_id VARCHAR(64) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT, 
	icon VARCHAR(255), 
	pics JSON NOT NULL, 
	config_json JSON NOT NULL, 
	share_config JSONB NOT NULL, 
	is_default BOOLEAN NOT NULL, 
	is_subagent BOOLEAN NOT NULL, 
	created_by VARCHAR(64), 
	updated_by VARCHAR(64), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_h_agents_is_default ON h_agents (is_default);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_agents_slug ON h_agents (slug);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agents_default ON h_agents (is_default) WHERE is_default IS true;

CREATE INDEX IF NOT EXISTS ix_h_agents_created_by ON h_agents (created_by);

CREATE INDEX IF NOT EXISTS ix_h_agents_is_subagent ON h_agents (is_subagent);

CREATE INDEX IF NOT EXISTS ix_h_agents_backend_id ON h_agents (backend_id);

CREATE TABLE IF NOT EXISTS h_config_options (
	id SERIAL NOT NULL, 
	key VARCHAR(100) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	params JSON NOT NULL, 
	value JSON NOT NULL, 
	created_by VARCHAR(100), 
	updated_by VARCHAR(100), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_config_options_key ON h_config_options (key);

CREATE TABLE IF NOT EXISTS h_conversations (
	id SERIAL NOT NULL, 
	thread_id VARCHAR(64) NOT NULL, 
	uid VARCHAR(64) NOT NULL, 
	agent_id VARCHAR(64) NOT NULL, 
	title VARCHAR(255), 
	status VARCHAR(20), 
	is_pinned BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	extra_metadata JSON, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_h_conversations_is_pinned ON h_conversations (is_pinned);

CREATE INDEX IF NOT EXISTS ix_h_conversations_uid ON h_conversations (uid);

CREATE INDEX IF NOT EXISTS ix_h_conversations_agent_id ON h_conversations (agent_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_conversations_thread_id ON h_conversations (thread_id);

CREATE TABLE IF NOT EXISTS h_departments (
	id SERIAL NOT NULL, 
	name VARCHAR(50) NOT NULL, 
	description VARCHAR(255), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_departments_name ON h_departments (name);

CREATE TABLE IF NOT EXISTS h_knowledge_bases (
	id SERIAL NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	kb_type VARCHAR(32) NOT NULL, 
	embedding_model_spec VARCHAR(512), 
	llm_model_spec VARCHAR(512), 
	query_params JSONB, 
	additional_params JSONB, 
	share_config JSONB, 
	mindmap JSONB, 
	mindmap_file_ids JSONB, 
	mindmap_metadata JSONB, 
	sample_questions JSONB, 
	created_by VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_bases_kb_id UNIQUE (kb_id)
);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_bases_kb_type ON h_knowledge_bases (kb_type);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_knowledge_bases_kb_id ON h_knowledge_bases (kb_id);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_bases_name ON h_knowledge_bases (name);

CREATE TABLE IF NOT EXISTS h_mcp_servers (
	id SERIAL NOT NULL, 
	slug VARCHAR(100) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	description VARCHAR(500), 
	transport VARCHAR(20) NOT NULL, 
	url VARCHAR(500), 
	command VARCHAR(500), 
	args JSON, 
	env JSON, 
	headers JSON, 
	timeout INTEGER, 
	sse_read_timeout INTEGER, 
	tags JSON, 
	icon VARCHAR(50), 
	enabled INTEGER NOT NULL, 
	disabled_tools JSON, 
	created_by VARCHAR(100) NOT NULL, 
	updated_by VARCHAR(100) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_mcp_servers_slug ON h_mcp_servers (slug);

CREATE TABLE IF NOT EXISTS h_model_providers (
	id SERIAL NOT NULL, 
	provider_id VARCHAR(100) NOT NULL, 
	display_name VARCHAR(100) NOT NULL, 
	provider_type VARCHAR(32) NOT NULL, 
	default_protocol VARCHAR(64), 
	base_url VARCHAR(500) NOT NULL, 
	embedding_base_url VARCHAR(500), 
	rerank_base_url VARCHAR(500), 
	models_endpoint VARCHAR(200), 
	embedding_models_endpoint VARCHAR(200), 
	rerank_models_endpoint VARCHAR(200), 
	api_key_env VARCHAR(128), 
	api_key VARCHAR(500), 
	capabilities JSON NOT NULL, 
	enabled_models JSON NOT NULL, 
	headers_json JSON, 
	extra_json JSON, 
	is_enabled BOOLEAN NOT NULL, 
	is_builtin BOOLEAN NOT NULL, 
	created_by VARCHAR(100), 
	updated_by VARCHAR(100), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_model_providers_provider_id ON h_model_providers (provider_id);

CREATE INDEX IF NOT EXISTS ix_h_model_providers_is_enabled ON h_model_providers (is_enabled);

CREATE TABLE IF NOT EXISTS h_skills (
	id SERIAL NOT NULL, 
	slug VARCHAR(128) NOT NULL, 
	name VARCHAR(128) NOT NULL, 
	description TEXT NOT NULL, 
	source_type VARCHAR(32) NOT NULL, 
	tool_dependencies JSON NOT NULL, 
	mcp_dependencies JSON NOT NULL, 
	skill_dependencies JSON NOT NULL, 
	dir_path VARCHAR(512) NOT NULL, 
	version VARCHAR(64), 
	content_hash VARCHAR(128), 
	share_config JSONB NOT NULL, 
	enabled BOOLEAN NOT NULL, 
	created_by VARCHAR(64), 
	updated_by VARCHAR(64), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_skills_slug ON h_skills (slug);

CREATE INDEX IF NOT EXISTS ix_h_skills_source_type ON h_skills (source_type);

CREATE TABLE IF NOT EXISTS h_tasks (
	id VARCHAR(32) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	type VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	progress FLOAT NOT NULL, 
	message TEXT NOT NULL, 
	payload JSON, 
	result JSON, 
	error TEXT, 
	cancel_requested INTEGER NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	started_at TIMESTAMP WITHOUT TIME ZONE, 
	completed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS ix_h_tasks_status ON h_tasks (status);

CREATE INDEX IF NOT EXISTS ix_h_tasks_created_at ON h_tasks (created_at);

CREATE INDEX IF NOT EXISTS ix_h_tasks_type ON h_tasks (type);

CREATE TABLE IF NOT EXISTS h_conversation_stats (
	id SERIAL NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	message_count INTEGER, 
	total_tokens INTEGER, 
	model_used VARCHAR(100), 
	user_feedback JSON, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	UNIQUE (conversation_id), 
	FOREIGN KEY(conversation_id) REFERENCES h_conversations (id)
);

CREATE TABLE IF NOT EXISTS h_evaluation_datasets (
	id SERIAL NOT NULL, 
	dataset_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	description TEXT, 
	item_count INTEGER, 
	has_gold_chunks BOOLEAN, 
	has_gold_answers BOOLEAN, 
	build_metadata JSONB, 
	created_by VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_evaluation_datasets_dataset_id UNIQUE (dataset_id), 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_evaluation_datasets_dataset_id ON h_evaluation_datasets (dataset_id);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_datasets_kb_id ON h_evaluation_datasets (kb_id);

CREATE TABLE IF NOT EXISTS h_knowledge_files (
	id SERIAL NOT NULL, 
	file_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	parent_id VARCHAR(64), 
	filename VARCHAR(512) NOT NULL, 
	original_filename VARCHAR(512), 
	file_type VARCHAR(64), 
	path VARCHAR(1024), 
	minio_url VARCHAR(1024), 
	markdown_file VARCHAR(1024), 
	status VARCHAR(32), 
	content_hash VARCHAR(128), 
	file_size BIGINT, 
	chunk_count INTEGER, 
	token_count BIGINT, 
	content_type VARCHAR(64), 
	processing_params JSONB, 
	is_folder BOOLEAN, 
	error_message TEXT, 
	created_by VARCHAR(64), 
	updated_by VARCHAR(64), 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_files_file_id UNIQUE (file_id), 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE, 
	FOREIGN KEY(parent_id) REFERENCES h_knowledge_files (file_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_files_parent_id ON h_knowledge_files (parent_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_knowledge_files_file_id ON h_knowledge_files (file_id);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_files_status ON h_knowledge_files (status);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_files_kb_id ON h_knowledge_files (kb_id);

CREATE INDEX IF NOT EXISTS ix_h_knowledge_files_content_hash ON h_knowledge_files (content_hash);

CREATE TABLE IF NOT EXISTS h_knowledge_graph_entities (
	id SERIAL NOT NULL, 
	entity_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	normalized_name VARCHAR(512) NOT NULL, 
	label VARCHAR(128) NOT NULL, 
	name VARCHAR(512) NOT NULL, 
	attributes JSONB, 
	vector_status VARCHAR(16) NOT NULL, 
	vector_attempt_count INTEGER NOT NULL, 
	vector_last_error TEXT, 
	vector_next_retry_at TIMESTAMP WITH TIME ZONE, 
	vector_locked_until TIMESTAMP WITH TIME ZONE, 
	vector_lock_token VARCHAR(32), 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_graph_entities_entity_id UNIQUE (entity_id), 
	CONSTRAINT uq_knowledge_graph_entities_identity UNIQUE (kb_id, normalized_name, label), 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_entities_kb_id ON h_knowledge_graph_entities (kb_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_entities_vector_pending ON h_knowledge_graph_entities (kb_id, vector_status, vector_next_retry_at);

CREATE TABLE IF NOT EXISTS h_subagent_threads (
	id SERIAL NOT NULL, 
	uid VARCHAR(64) NOT NULL, 
	parent_conversation_id INTEGER NOT NULL, 
	child_conversation_id INTEGER NOT NULL, 
	child_thread_id VARCHAR(64) NOT NULL, 
	subagent_slug VARCHAR(64) NOT NULL, 
	created_by_run_id VARCHAR(64) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(parent_conversation_id) REFERENCES h_conversations (id), 
	FOREIGN KEY(child_conversation_id) REFERENCES h_conversations (id)
);

CREATE INDEX IF NOT EXISTS ix_h_subagent_threads_parent_conversation_id ON h_subagent_threads (parent_conversation_id);

CREATE INDEX IF NOT EXISTS ix_h_subagent_threads_subagent_slug ON h_subagent_threads (subagent_slug);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_subagent_threads_child_conversation_id ON h_subagent_threads (child_conversation_id);

CREATE INDEX IF NOT EXISTS ix_h_subagent_threads_created_by_run_id ON h_subagent_threads (created_by_run_id);

CREATE INDEX IF NOT EXISTS ix_h_subagent_threads_uid ON h_subagent_threads (uid);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_subagent_threads_child_thread_id ON h_subagent_threads (child_thread_id);

CREATE TABLE IF NOT EXISTS h_users (
	id SERIAL NOT NULL, 
	username VARCHAR NOT NULL, 
	uid VARCHAR NOT NULL, 
	phone_number VARCHAR, 
	avatar VARCHAR, 
	password_hash VARCHAR NOT NULL, 
	role VARCHAR NOT NULL, 
	department_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	last_login TIMESTAMP WITHOUT TIME ZONE, 
	login_failed_count INTEGER NOT NULL, 
	last_failed_login TIMESTAMP WITHOUT TIME ZONE, 
	login_locked_until TIMESTAMP WITHOUT TIME ZONE, 
	is_deleted INTEGER NOT NULL, 
	deleted_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(department_id) REFERENCES h_departments (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_users_phone_number ON h_users (phone_number);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_users_username ON h_users (username);

CREATE INDEX IF NOT EXISTS ix_h_users_is_deleted ON h_users (is_deleted);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_users_uid ON h_users (uid);

CREATE TABLE IF NOT EXISTS h_agent_envs (
	id SERIAL NOT NULL, 
	uid VARCHAR NOT NULL, 
	env JSON NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(uid) REFERENCES h_users (uid)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_agent_envs_uid ON h_agent_envs (uid);

CREATE TABLE IF NOT EXISTS h_agent_runs (
	id VARCHAR(64) NOT NULL, 
	conversation_thread_id VARCHAR(64) NOT NULL, 
	agent_slug VARCHAR(64) NOT NULL, 
	uid VARCHAR(64) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	request_id VARCHAR(64) NOT NULL, 
	source VARCHAR(32) NOT NULL, 
	channel VARCHAR(32) NOT NULL, 
	external_id VARCHAR(128), 
	origin_metadata JSON NOT NULL, 
	conversation_id INTEGER, 
	created_by_run_id VARCHAR(64), 
	subagent_thread_relation_id INTEGER, 
	run_type VARCHAR(32) NOT NULL, 
	input_message_id INTEGER, 
	output_message_id INTEGER, 
	last_event_id VARCHAR(64), 
	input_payload JSON NOT NULL, 
	error_type VARCHAR(64), 
	error_message TEXT, 
	started_at TIMESTAMP WITHOUT TIME ZONE, 
	finished_at TIMESTAMP WITHOUT TIME ZONE, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES h_conversations (id), 
	FOREIGN KEY(subagent_thread_relation_id) REFERENCES h_subagent_threads (id)
);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_conversation_thread_id ON h_agent_runs (conversation_thread_id);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_status ON h_agent_runs (status);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_conversation_id ON h_agent_runs (conversation_id);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_agent_slug ON h_agent_runs (agent_slug);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_agent_runs_request_id ON h_agent_runs (request_id);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_created_by_run_id ON h_agent_runs (created_by_run_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_agent_runs_one_active_per_thread ON h_agent_runs (uid, agent_slug, conversation_thread_id) WHERE (status NOT IN ('completed', 'failed', 'cancelled', 'interrupted'));

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_uid ON h_agent_runs (uid);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_external_id ON h_agent_runs (external_id);

CREATE INDEX IF NOT EXISTS ix_h_agent_runs_subagent_thread_relation_id ON h_agent_runs (subagent_thread_relation_id);

CREATE TABLE IF NOT EXISTS h_api_keys (
	id SERIAL NOT NULL, 
	key_hash VARCHAR(64) NOT NULL, 
	key_prefix VARCHAR(16) NOT NULL, 
	name VARCHAR(100) NOT NULL, 
	user_id INTEGER NOT NULL, 
	department_id INTEGER, 
	expires_at TIMESTAMP WITHOUT TIME ZONE, 
	is_enabled BOOLEAN NOT NULL, 
	last_used_at TIMESTAMP WITHOUT TIME ZONE, 
	created_by VARCHAR(64) NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES h_users (id), 
	FOREIGN KEY(department_id) REFERENCES h_departments (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_api_keys_key_hash ON h_api_keys (key_hash);

CREATE INDEX IF NOT EXISTS ix_h_api_keys_user_id ON h_api_keys (user_id);

CREATE INDEX IF NOT EXISTS ix_h_api_keys_department_id ON h_api_keys (department_id);

CREATE TABLE IF NOT EXISTS h_evaluation_dataset_items (
	id SERIAL NOT NULL, 
	item_id VARCHAR(64) NOT NULL, 
	dataset_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	item_index INTEGER NOT NULL, 
	query_text TEXT NOT NULL, 
	gold_chunk_ids JSONB, 
	gold_answer TEXT, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_evaluation_dataset_items_item_id UNIQUE (item_id), 
	CONSTRAINT uq_evaluation_dataset_items_dataset_index UNIQUE (dataset_id, item_index), 
	FOREIGN KEY(dataset_id) REFERENCES h_evaluation_datasets (dataset_id) ON DELETE CASCADE, 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_dataset_items_dataset_id ON h_evaluation_dataset_items (dataset_id);

CREATE INDEX IF NOT EXISTS ix_evaluation_dataset_items_dataset_index ON h_evaluation_dataset_items (dataset_id, item_index);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_dataset_items_kb_id ON h_evaluation_dataset_items (kb_id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_evaluation_dataset_items_item_id ON h_evaluation_dataset_items (item_id);

CREATE TABLE IF NOT EXISTS h_evaluation_runs (
	id SERIAL NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	name VARCHAR(255) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	dataset_id VARCHAR(64), 
	status VARCHAR(32), 
	retrieval_config JSONB, 
	metrics JSONB, 
	overall_score FLOAT, 
	total_items INTEGER, 
	completed_items INTEGER, 
	started_at TIMESTAMP WITH TIME ZONE, 
	completed_at TIMESTAMP WITH TIME ZONE, 
	created_by VARCHAR(64), 
	PRIMARY KEY (id), 
	CONSTRAINT uq_evaluation_runs_run_id UNIQUE (run_id), 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_id) REFERENCES h_evaluation_datasets (dataset_id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_evaluation_runs_run_id ON h_evaluation_runs (run_id);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_runs_status ON h_evaluation_runs (status);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_runs_kb_id ON h_evaluation_runs (kb_id);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_runs_started_at ON h_evaluation_runs (started_at);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_runs_dataset_id ON h_evaluation_runs (dataset_id);

CREATE TABLE IF NOT EXISTS h_knowledge_chunks (
	id SERIAL NOT NULL, 
	chunk_id VARCHAR(128) NOT NULL, 
	file_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	chunk_index INTEGER NOT NULL, 
	content TEXT NOT NULL, 
	start_char_pos INTEGER, 
	end_char_pos INTEGER, 
	start_token_pos INTEGER, 
	end_token_pos INTEGER, 
	graph_structure_indexed BOOLEAN NOT NULL, 
	graph_indexed BOOLEAN, 
	graph_extraction_details JSONB NOT NULL, 
	ent_ids JSONB, 
	tags JSONB, 
	extraction_result JSONB, 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_chunks_chunk_id UNIQUE (chunk_id), 
	FOREIGN KEY(file_id) REFERENCES h_knowledge_files (file_id) ON DELETE CASCADE, 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_knowledge_chunks_graph_indexed ON h_knowledge_chunks (graph_indexed);

CREATE INDEX IF NOT EXISTS ix_knowledge_chunks_file_id ON h_knowledge_chunks (file_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_chunks_graph_structure_indexed ON h_knowledge_chunks (graph_structure_indexed);

CREATE INDEX IF NOT EXISTS ix_knowledge_chunks_kb_id ON h_knowledge_chunks (kb_id);

CREATE TABLE IF NOT EXISTS h_knowledge_graph_triples (
	id SERIAL NOT NULL, 
	triple_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	source_entity_id VARCHAR(64) NOT NULL, 
	target_entity_id VARCHAR(64) NOT NULL, 
	relation_type VARCHAR(256) NOT NULL, 
	content TEXT NOT NULL, 
	vector_status VARCHAR(16) NOT NULL, 
	vector_attempt_count INTEGER NOT NULL, 
	vector_last_error TEXT, 
	vector_next_retry_at TIMESTAMP WITH TIME ZONE, 
	vector_locked_until TIMESTAMP WITH TIME ZONE, 
	vector_lock_token VARCHAR(32), 
	created_at TIMESTAMP WITH TIME ZONE, 
	updated_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_graph_triples_triple_id UNIQUE (triple_id), 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE, 
	FOREIGN KEY(source_entity_id) REFERENCES h_knowledge_graph_entities (entity_id) ON DELETE CASCADE, 
	FOREIGN KEY(target_entity_id) REFERENCES h_knowledge_graph_entities (entity_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_triples_kb_id ON h_knowledge_graph_triples (kb_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_triples_vector_pending ON h_knowledge_graph_triples (kb_id, vector_status, vector_next_retry_at);

CREATE TABLE IF NOT EXISTS h_operation_logs (
	id SERIAL NOT NULL, 
	user_id INTEGER NOT NULL, 
	operation VARCHAR NOT NULL, 
	details TEXT, 
	ip_address VARCHAR, 
	timestamp TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES h_users (id)
);

CREATE TABLE IF NOT EXISTS h_user_config (
	id SERIAL NOT NULL, 
	uid VARCHAR NOT NULL, 
	enable_memory BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(uid) REFERENCES h_users (uid)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_user_config_uid ON h_user_config (uid);

CREATE TABLE IF NOT EXISTS h_cli_auth_sessions (
	id SERIAL NOT NULL, 
	device_code_hash VARCHAR(64) NOT NULL, 
	user_code VARCHAR(16) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	key_name VARCHAR(100) NOT NULL, 
	approved_user_id INTEGER, 
	api_key_id INTEGER, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	expires_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	approved_at TIMESTAMP WITHOUT TIME ZONE, 
	consumed_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(approved_user_id) REFERENCES h_users (id), 
	FOREIGN KEY(api_key_id) REFERENCES h_api_keys (id)
);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_cli_auth_sessions_user_code ON h_cli_auth_sessions (user_code);

CREATE INDEX IF NOT EXISTS ix_h_cli_auth_sessions_api_key_id ON h_cli_auth_sessions (api_key_id);

CREATE INDEX IF NOT EXISTS ix_h_cli_auth_sessions_status ON h_cli_auth_sessions (status);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_cli_auth_sessions_device_code_hash ON h_cli_auth_sessions (device_code_hash);

CREATE INDEX IF NOT EXISTS ix_h_cli_auth_sessions_approved_user_id ON h_cli_auth_sessions (approved_user_id);

CREATE TABLE IF NOT EXISTS h_evaluation_run_items (
	id SERIAL NOT NULL, 
	run_id VARCHAR(64) NOT NULL, 
	dataset_item_id VARCHAR(64), 
	item_index INTEGER NOT NULL, 
	query_text TEXT NOT NULL, 
	gold_chunk_ids JSONB, 
	gold_answer TEXT, 
	generated_answer TEXT, 
	retrieved_chunks JSONB, 
	metrics JSONB, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_evaluation_run_items_run_index UNIQUE (run_id, item_index), 
	FOREIGN KEY(run_id) REFERENCES h_evaluation_runs (run_id) ON DELETE CASCADE, 
	FOREIGN KEY(dataset_item_id) REFERENCES h_evaluation_dataset_items (item_id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_run_items_dataset_item_id ON h_evaluation_run_items (dataset_item_id);

CREATE INDEX IF NOT EXISTS ix_evaluation_run_items_run_index ON h_evaluation_run_items (run_id, item_index);

CREATE INDEX IF NOT EXISTS ix_h_evaluation_run_items_run_id ON h_evaluation_run_items (run_id);

CREATE TABLE IF NOT EXISTS h_knowledge_graph_entity_mentions (
	id SERIAL NOT NULL, 
	entity_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	file_id VARCHAR(64) NOT NULL, 
	chunk_id VARCHAR(128) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_graph_entity_mentions_entity_chunk UNIQUE (entity_id, chunk_id), 
	FOREIGN KEY(entity_id) REFERENCES h_knowledge_graph_entities (entity_id) ON DELETE CASCADE, 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE, 
	FOREIGN KEY(file_id) REFERENCES h_knowledge_files (file_id) ON DELETE CASCADE, 
	FOREIGN KEY(chunk_id) REFERENCES h_knowledge_chunks (chunk_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_entity_mentions_chunk_id ON h_knowledge_graph_entity_mentions (chunk_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_entity_mentions_kb_id ON h_knowledge_graph_entity_mentions (kb_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_entity_mentions_file_id ON h_knowledge_graph_entity_mentions (file_id);

CREATE TABLE IF NOT EXISTS h_knowledge_graph_triple_mentions (
	id SERIAL NOT NULL, 
	triple_id VARCHAR(64) NOT NULL, 
	kb_id VARCHAR(80) NOT NULL, 
	file_id VARCHAR(64) NOT NULL, 
	chunk_id VARCHAR(128) NOT NULL, 
	text TEXT, 
	extractor_type VARCHAR(128), 
	created_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (id), 
	CONSTRAINT uq_knowledge_graph_triple_mentions_triple_chunk UNIQUE (triple_id, chunk_id), 
	FOREIGN KEY(triple_id) REFERENCES h_knowledge_graph_triples (triple_id) ON DELETE CASCADE, 
	FOREIGN KEY(kb_id) REFERENCES h_knowledge_bases (kb_id) ON DELETE CASCADE, 
	FOREIGN KEY(file_id) REFERENCES h_knowledge_files (file_id) ON DELETE CASCADE, 
	FOREIGN KEY(chunk_id) REFERENCES h_knowledge_chunks (chunk_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_triple_mentions_file_id ON h_knowledge_graph_triple_mentions (file_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_triple_mentions_chunk_id ON h_knowledge_graph_triple_mentions (chunk_id);

CREATE INDEX IF NOT EXISTS ix_knowledge_graph_triple_mentions_kb_id ON h_knowledge_graph_triple_mentions (kb_id);

CREATE TABLE IF NOT EXISTS h_messages (
	id SERIAL NOT NULL, 
	conversation_id INTEGER NOT NULL, 
	role VARCHAR(20) NOT NULL, 
	content TEXT NOT NULL, 
	message_type VARCHAR(30), 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	token_count INTEGER, 
	extra_metadata JSON, 
	image_content TEXT, 
	run_id VARCHAR(64), 
	request_id VARCHAR(64), 
	delivery_status VARCHAR(32) NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(conversation_id) REFERENCES h_conversations (id), 
	FOREIGN KEY(run_id) REFERENCES h_agent_runs (id)
);

CREATE INDEX IF NOT EXISTS ix_h_messages_conversation_id ON h_messages (conversation_id);

CREATE INDEX IF NOT EXISTS ix_h_messages_run_id ON h_messages (run_id);

CREATE INDEX IF NOT EXISTS ix_h_messages_request_id ON h_messages (request_id);

CREATE TABLE IF NOT EXISTS h_agent_run_requests (
	id SERIAL NOT NULL, 
	request_id VARCHAR(64) NOT NULL, 
	uid VARCHAR(64) NOT NULL, 
	agent_slug VARCHAR(64) NOT NULL, 
	conversation_thread_id VARCHAR(64) NOT NULL, 
	source VARCHAR(32) NOT NULL, 
	channel VARCHAR(32) NOT NULL, 
	external_id VARCHAR(128), 
	origin_metadata JSON NOT NULL, 
	queue_policy VARCHAR(16) NOT NULL, 
	status VARCHAR(32) NOT NULL, 
	input_message_id INTEGER NOT NULL, 
	dispatched_run_id VARCHAR(64), 
	input_payload JSON NOT NULL, 
	error_message TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	dispatched_at TIMESTAMP WITHOUT TIME ZONE, 
	updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(input_message_id) REFERENCES h_messages (id), 
	FOREIGN KEY(dispatched_run_id) REFERENCES h_agent_runs (id)
);

CREATE INDEX IF NOT EXISTS ix_h_agent_run_requests_external_id ON h_agent_run_requests (external_id);

CREATE INDEX IF NOT EXISTS ix_agent_run_requests_queue ON h_agent_run_requests (uid, agent_slug, conversation_thread_id, status, created_at, id);

CREATE UNIQUE INDEX IF NOT EXISTS ix_h_agent_run_requests_request_id ON h_agent_run_requests (request_id);

CREATE TABLE IF NOT EXISTS h_message_feedbacks (
	id SERIAL NOT NULL, 
	message_id INTEGER NOT NULL, 
	uid VARCHAR(64) NOT NULL, 
	rating VARCHAR(10) NOT NULL, 
	reason TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(message_id) REFERENCES h_messages (id)
);

CREATE INDEX IF NOT EXISTS ix_h_message_feedbacks_message_id ON h_message_feedbacks (message_id);

CREATE INDEX IF NOT EXISTS ix_h_message_feedbacks_uid ON h_message_feedbacks (uid);

CREATE TABLE IF NOT EXISTS h_tool_calls (
	id SERIAL NOT NULL, 
	message_id INTEGER NOT NULL, 
	langgraph_tool_call_id VARCHAR(100), 
	tool_name VARCHAR(100) NOT NULL, 
	tool_input JSON, 
	tool_output TEXT, 
	status VARCHAR(20), 
	error_message TEXT, 
	created_at TIMESTAMP WITHOUT TIME ZONE, 
	PRIMARY KEY (id), 
	FOREIGN KEY(message_id) REFERENCES h_messages (id)
);

CREATE INDEX IF NOT EXISTS ix_h_tool_calls_langgraph_tool_call_id ON h_tool_calls (langgraph_tool_call_id);

CREATE INDEX IF NOT EXISTS ix_h_tool_calls_message_id ON h_tool_calls (message_id);



CREATE TABLE IF NOT EXISTS checkpoint_migrations (
    v INTEGER PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS checkpoints (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    parent_checkpoint_id TEXT,
    type TEXT,
    checkpoint JSONB NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}',
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS checkpoint_blobs (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    channel TEXT NOT NULL,
    version TEXT NOT NULL,
    type TEXT NOT NULL,
    blob BYTEA,
    PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

CREATE TABLE IF NOT EXISTS checkpoint_writes (
    thread_id TEXT NOT NULL,
    checkpoint_ns TEXT NOT NULL DEFAULT '',
    checkpoint_id TEXT NOT NULL,
    task_id TEXT NOT NULL,
    idx INTEGER NOT NULL,
    channel TEXT NOT NULL,
    type TEXT,
    blob BYTEA NOT NULL,
    task_path TEXT NOT NULL DEFAULT '',
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

ALTER TABLE checkpoint_blobs ALTER COLUMN blob DROP NOT NULL;

CREATE INDEX IF NOT EXISTS checkpoints_thread_id_idx ON checkpoints (thread_id);
CREATE INDEX IF NOT EXISTS checkpoint_blobs_thread_id_idx ON checkpoint_blobs (thread_id);
CREATE INDEX IF NOT EXISTS checkpoint_writes_thread_id_idx ON checkpoint_writes (thread_id);

ALTER TABLE checkpoint_writes ADD COLUMN IF NOT EXISTS task_path TEXT NOT NULL DEFAULT '';

INSERT INTO checkpoint_migrations (v) VALUES
    (0), (1), (2), (3), (4), (5), (6), (7), (8), (9)
ON CONFLICT (v) DO NOTHING;
