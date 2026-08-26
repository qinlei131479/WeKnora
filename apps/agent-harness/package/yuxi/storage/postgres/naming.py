"""Harness table names when sharing WeKnora's Postgres database.

Yuxi tables are prefixed so they never collide with WeKnora's
``users`` / ``messages`` / ``knowledge_bases`` (and similar). Prefixing is
applied at import time for ORM models and at execute time for raw SQL.
"""

from __future__ import annotations

import os
import re

TABLE_PREFIX = os.getenv("HARNESS_TABLE_PREFIX", "h_")

# LangGraph AsyncPostgresSaver tables. Names are hardcoded in the library
# (langgraph-checkpoint-postgres) and must stay unprefixed. WeKnora has no
# colliding tables. Do not add these to HARNESS_TABLES / prefix_sql.
LANGGRAPH_CHECKPOINT_TABLES: tuple[str, ...] = (
    "checkpoint_migrations",
    "checkpoints",
    "checkpoint_blobs",
    "checkpoint_writes",
)

# Longest names first so prefix_sql does not partially rewrite shorter tokens.
HARNESS_TABLES: tuple[str, ...] = (
    "knowledge_graph_entity_mentions",
    "knowledge_graph_triple_mentions",
    "knowledge_graph_entities",
    "knowledge_graph_triples",
    "evaluation_dataset_items",
    "evaluation_run_items",
    "evaluation_datasets",
    "evaluation_runs",
    "knowledge_chunks",
    "knowledge_files",
    "knowledge_bases",
    "conversation_stats",
    "message_feedbacks",
    "cli_auth_sessions",
    "agent_run_requests",
    "subagent_threads",
    "model_providers",
    "config_options",
    "operation_logs",
    "conversations",
    "departments",
    "agent_envs",
    "user_config",
    "mcp_servers",
    "agent_runs",
    "tool_calls",
    "messages",
    "api_keys",
    "agents",
    "skills",
    "tasks",
    "users",
)

_TABLE_PATTERN = re.compile(
    r"(?<![\w])(" + "|".join(re.escape(name) for name in HARNESS_TABLES) + r")(?![\w])"
)


def ht(name: str) -> str:
    """Return the physical table (or constraint) name with the harness prefix."""
    if not name:
        return name
    if name.startswith(TABLE_PREFIX):
        return name
    return f"{TABLE_PREFIX}{name}"


def prefix_sql(sql: str) -> str:
    """Rewrite unprefixed harness table identifiers in a SQL statement.

    Already-prefixed names (``h_users``) are left unchanged because the
    character before ``users`` is ``_`` (word-like) and does not match.
    """
    if not sql:
        return sql
    return _TABLE_PATTERN.sub(lambda match: ht(match.group(1)), sql)
