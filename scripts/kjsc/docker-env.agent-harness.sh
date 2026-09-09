#!/bin/sh
# Fill Agent-Harness connection URLs from WeKnora credentials, then exec CMD.
set -eu

urlencode() {
    # Match urllib.parse.quote_plus: space -> +, other unsafe -> %XX.
    printf '%s' "$1" | awk '
    BEGIN {
        for (i = 0; i <= 255; i++) hex[sprintf("%c", i)] = sprintf("%%%02X", i)
    }
    {
        n = length($0)
        for (i = 1; i <= n; i++) {
            c = substr($0, i, 1)
            if (c ~ /[A-Za-z0-9_.~-]/) printf "%s", c
            else if (c == " ") printf "+"
            else printf "%s", hex[c]
        }
    }'
}

is_blank() {
    [ -z "$(printf '%s' "${1:-}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')" ]
}

if [ "$#" -lt 1 ]; then
    echo "usage: docker-env.sh <command> [args...]" >&2
    exit 1
fi

if is_blank "${JWT_SECRET:-}"; then
    echo "JWT_SECRET is required and must be non-empty" >&2
    exit 1
fi

if is_blank "${POSTGRES_URL:-}"; then
    db_user="${DB_USER:-postgres}"
    db_password="${DB_PASSWORD:-postgres}"
    db_host="${DB_HOST:-postgres}"
    db_port="${DB_PORT:-5432}"
    db_name="${DB_NAME:-agent-middle}"
    POSTGRES_URL="postgresql+asyncpg://$(urlencode "$db_user"):$(urlencode "$db_password")@${db_host}:${db_port}/${db_name}"
    export POSTGRES_URL
fi

if is_blank "${REDIS_URL:-}"; then
    redis_addr="${REDIS_ADDR:-redis:6379}"
    redis_host="${redis_addr%%:*}"
    redis_port="${redis_addr##*:}"
    if [ "$redis_port" = "$redis_addr" ]; then
        redis_port=6379
    fi
    redis_db="${AGENT_HARNESS_REDIS_DB:-2}"
    if [ -n "${REDIS_PASSWORD:-}" ]; then
        REDIS_URL="redis://:$(urlencode "$REDIS_PASSWORD")@${redis_host}:${redis_port}/${redis_db}"
    else
        REDIS_URL="redis://${redis_host}:${redis_port}/${redis_db}"
    fi
    export REDIS_URL
fi

if [ -z "${MINIO_ACCESS_KEY:-}" ] && [ -n "${MINIO_ACCESS_KEY_ID:-}" ]; then
    MINIO_ACCESS_KEY="$MINIO_ACCESS_KEY_ID"
    export MINIO_ACCESS_KEY
fi
if [ -z "${MINIO_SECRET_KEY:-}" ] && [ -n "${MINIO_SECRET_ACCESS_KEY:-}" ]; then
    MINIO_SECRET_KEY="$MINIO_SECRET_ACCESS_KEY"
    export MINIO_SECRET_KEY
fi

exec "$@"
