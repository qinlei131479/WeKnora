from yuxi.storage.postgres.naming import HARNESS_TABLES, LANGGRAPH_CHECKPOINT_TABLES, ht, prefix_sql


def test_ht_prefixes_logical_names():
    assert ht("agents") == "h_agents"
    assert ht("messages") == "h_messages"
    assert ht("h_agents") == "h_agents"


def test_prefix_sql_does_not_rewrite_weknora_users():
    sql = "SELECT id FROM users WHERE email = $1; SELECT env FROM agent_envs WHERE uid = $1"
    out = prefix_sql(sql)
    assert "FROM users " in out
    assert "h_users" not in out
    assert "h_agent_envs" in out


def test_prefix_sql_rewrites_harness_tokens_only():
    sql = "SELECT env FROM agent_envs WHERE uid = $1; REFERENCES messages(id)"
    out = prefix_sql(sql)
    assert "h_agent_envs" in out
    assert "h_messages" in out


def test_prefix_sql_does_not_double_prefix():
    sql = "SELECT * FROM h_messages JOIN h_conversations ON h_messages.conversation_id = h_conversations.id"
    assert prefix_sql(sql) == sql


def test_prefix_sql_does_not_rewrite_longer_names_as_shorter_tokens():
    sql = "SELECT * FROM agent_run_requests JOIN agent_runs ON agent_runs.id = agent_run_requests.dispatched_run_id"
    out = prefix_sql(sql)
    assert "h_agent_run_requests" in out
    assert "h_agent_runs" in out
    assert "h_h_agent_runs" not in out


def test_langgraph_checkpoint_tables_stay_unprefixed():
    assert LANGGRAPH_CHECKPOINT_TABLES == (
        "checkpoint_migrations",
        "checkpoints",
        "checkpoint_blobs",
        "checkpoint_writes",
    )
    overlap = set(LANGGRAPH_CHECKPOINT_TABLES) & set(HARNESS_TABLES)
    assert not overlap
    sql = (
        "SELECT * FROM checkpoints "
        "JOIN checkpoint_blobs ON checkpoint_blobs.thread_id = checkpoints.thread_id "
        "JOIN checkpoint_writes ON checkpoint_writes.checkpoint_id = checkpoints.checkpoint_id "
        "JOIN checkpoint_migrations ON true"
    )
    assert prefix_sql(sql) == sql
    assert "users" not in HARNESS_TABLES
    assert "api_keys" not in HARNESS_TABLES
