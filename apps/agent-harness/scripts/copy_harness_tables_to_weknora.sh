#!/usr/bin/env bash
# Copy Yuxi data from agent_harness into WeKnora (agent-middle).
#
# Runs inside postgres17 — does not need harness-api, uv, or URL passwords.
# Default is dry-run. Source DB is never modified. WeKnora tables are never written.
#
# From repo root:
#   ./apps/agent-harness/scripts/copy_harness_tables_to_weknora.sh
#   ./apps/agent-harness/scripts/copy_harness_tables_to_weknora.sh --execute
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-postgres17}"
SOURCE_DB="${HARNESS_COPY_SOURCE_DB:-agent_harness}"
EXECUTE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --execute) EXECUTE=1 ;;
    -h|--help)
      sed -n '2,14p' "$0"
      exit 0
      ;;
    *)
      echo "unknown argument: $1" >&2
      exit 2
      ;;
  esac
  shift
done

if ! docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null | grep -qx true; then
  echo "container ${CONTAINER} is not running" >&2
  exit 1
fi

pg() {
  local db="$1"
  local sql="$2"
  docker exec "$CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1 -tAc "$2"' _ "$db" "$sql" | tr -d '\r'
}

DEST_DB="$(docker exec "$CONTAINER" printenv POSTGRES_DB | tr -d '\r')"
if [[ -z "$DEST_DB" ]]; then
  echo "POSTGRES_DB is empty in ${CONTAINER}" >&2
  exit 1
fi

echo "source=${SOURCE_DB}  dest=${DEST_DB}  container=${CONTAINER}"

if [[ "$(pg postgres "SELECT 1 FROM pg_database WHERE datname='${SOURCE_DB}'")" != "1" ]]; then
  echo "source database ${SOURCE_DB} does not exist" >&2
  exit 1
fi

if [[ "$(pg "$DEST_DB" "SELECT to_regclass('public.h_users') IS NOT NULL")" != "t" ]]; then
  echo "dest is missing h_* tables; restart WeKnora app so migration 000082 runs first" >&2
  exit 1
fi

if [[ "$(pg "$DEST_DB" "SELECT to_regclass('public.checkpoints') IS NOT NULL")" != "t" ]]; then
  echo "dest is missing checkpoint_* tables; start harness once so setup() creates them, then re-run." >&2
  exit 1
fi

BUSINESS_TABLES=(
  departments users knowledge_bases conversations agents config_options
  mcp_servers model_providers skills tasks conversation_stats
  evaluation_datasets knowledge_files knowledge_graph_entities subagent_threads
  agent_envs agent_runs api_keys evaluation_dataset_items evaluation_runs
  knowledge_chunks knowledge_graph_triples operation_logs user_config
  cli_auth_sessions evaluation_run_items knowledge_graph_entity_mentions
  knowledge_graph_triple_mentions messages agent_run_requests
  message_feedbacks tool_calls
)

CHECKPOINT_TABLES=(
  checkpoint_migrations checkpoints checkpoint_blobs checkpoint_writes
)

copy_one() {
  local src_name="$1"
  local dst_name="$2"
  local missing_hint="$3"

  local src_exists dst_exists src_count dst_count cols
  src_exists="$(pg "$SOURCE_DB" "SELECT to_regclass('public.${src_name}') IS NOT NULL")"
  dst_exists="$(pg "$DEST_DB" "SELECT to_regclass('public.${dst_name}') IS NOT NULL")"
  if [[ "$src_exists" != "t" ]]; then
    echo "skip ${src_name}: missing in source"
    return 0
  fi
  if [[ "$dst_exists" != "t" ]]; then
    echo "skip ${dst_name}: missing in dest (${missing_hint})"
    return 0
  fi
  src_count="$(pg "$SOURCE_DB" "SELECT count(*) FROM \"${src_name}\"")"
  dst_count="$(pg "$DEST_DB" "SELECT count(*) FROM \"${dst_name}\"")"
  if [[ "${dst_count:-0}" -gt 0 ]]; then
    echo "skip ${src_name} -> ${dst_name}: dest already has ${dst_count} row(s)"
    return 0
  fi
  if [[ "$EXECUTE" -eq 0 ]]; then
    echo "dry-run ${src_name} -> ${dst_name} (${src_count} rows)"
    return 0
  fi

  cols="$(pg "$DEST_DB" "
    SELECT string_agg(quote_ident(a.attname), ', ' ORDER BY a.attnum)
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = '${dst_name}'
      AND a.attnum > 0
      AND NOT a.attisdropped
  ")"
  cols="$(printf '%s' "$cols" | tr -d '\n')"
  if [[ -z "$cols" ]]; then
    echo "skip ${dst_name}: no columns" >&2
    return 1
  fi

  echo "copy ${src_name} -> ${dst_name} (${src_count} rows)"
  docker exec "$CONTAINER" sh -c \
    'psql -U "$POSTGRES_USER" -d "$1" -v ON_ERROR_STOP=1 -c "$2" | psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -c "$3"' \
    _ "$SOURCE_DB" \
    "\\copy (SELECT ${cols} FROM \"${src_name}\") TO STDOUT" \
    "\\copy \"${dst_name}\" (${cols}) FROM STDIN"

  docker exec -i "$CONTAINER" sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1' <<SQL
DO \$\$
DECLARE rec record;
BEGIN
  FOR rec IN
    SELECT a.attname AS col,
           pg_get_serial_sequence(format('%I.%I', 'public', '${dst_name}'), a.attname) AS seq
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname = '${dst_name}'
      AND a.attnum > 0
      AND NOT a.attisdropped
  LOOP
    IF rec.seq IS NOT NULL THEN
      EXECUTE format(
        'SELECT setval(%L, COALESCE((SELECT MAX(%I) FROM %I), 1), true)',
        rec.seq, rec.col, '${dst_name}'
      );
    END IF;
  END LOOP;
END
\$\$;
SQL
}

echo "---- business h_* ----"
for logical in "${BUSINESS_TABLES[@]}"; do
  copy_one "$logical" "h_${logical}" "run WeKnora migration 000082 first"
done

echo "---- langgraph checkpoint (unprefixed) ----"
for name in "${CHECKPOINT_TABLES[@]}"; do
  copy_one "$name" "$name" "start harness once so setup() creates checkpoint tables"
done

if [[ "$EXECUTE" -eq 1 ]]; then
  echo "done. source ${SOURCE_DB} was not modified."
  echo "---- verify (source vs dest) ----"
  for logical in "${BUSINESS_TABLES[@]}"; do
    src_count="$(pg "$SOURCE_DB" "SELECT count(*) FROM \"${logical}\"" 2>/dev/null || echo missing)"
    dst_count="$(pg "$DEST_DB" "SELECT count(*) FROM \"h_${logical}\"" 2>/dev/null || echo missing)"
    printf '%-42s %s -> %s\n' "h_${logical}" "$src_count" "$dst_count"
  done
  for name in "${CHECKPOINT_TABLES[@]}"; do
    src_count="$(pg "$SOURCE_DB" "SELECT count(*) FROM \"${name}\"" 2>/dev/null || echo missing)"
    dst_count="$(pg "$DEST_DB" "SELECT count(*) FROM \"${name}\"" 2>/dev/null || echo missing)"
    printf '%-42s %s -> %s\n' "$name" "$src_count" "$dst_count"
  done
else
  echo "dry-run only. next: $0 --execute"
fi
