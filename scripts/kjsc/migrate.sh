#!/bin/bash
# Company migrations: migrations/version_kjsc + schema_migrations_kjsc
# There is no "down" command. 000002 must never drop h_* tables.
# 000008 在同一事务里复制 h_、回填用量，再删除已退役的旧 h_ 表。上线只执行 up。
set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "Loading .env file from $PROJECT_ROOT/.env"
    set -a
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env"
    set +a
fi

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-postgres}
DB_PASSWORD=${DB_PASSWORD:-postgres}
DB_NAME=${DB_NAME:-WeKnora}
MIGRATIONS_DIR="${PROJECT_ROOT}/migrations/version_kjsc"

if ! command -v migrate &> /dev/null; then
    echo "Error: migrate tool is not installed"
    echo "Install it with: go install -tags 'postgres' github.com/golang-migrate/migrate/v4/cmd/migrate@latest"
    exit 1
fi

if [ -n "$DB_URL" ]; then
    if [[ "$DB_URL" != *"sslmode="* ]]; then
        if [[ "$DB_URL" == *"?"* ]]; then
            DB_URL="${DB_URL}&sslmode=disable"
        else
            DB_URL="${DB_URL}?sslmode=disable"
        fi
    elif [[ "$DB_URL" == *"sslmode=require"* ]] || [[ "$DB_URL" == *"sslmode=prefer"* ]]; then
        DB_URL="${DB_URL//sslmode=require/sslmode=disable}"
        DB_URL="${DB_URL//sslmode=prefer/sslmode=disable}"
    fi
else
    if command -v python3 &> /dev/null; then
        ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DB_PASSWORD', safe=''))")
    else
        ENCODED_PASSWORD="$DB_PASSWORD"
    fi
    DB_URL="postgres://${DB_USER}:${ENCODED_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=disable"
fi

if [[ "$DB_URL" != *"x-migrations-table="* ]]; then
    if [[ "$DB_URL" == *"?"* ]]; then
        DB_URL="${DB_URL}&x-migrations-table=schema_migrations_kjsc"
    else
        DB_URL="${DB_URL}?x-migrations-table=schema_migrations_kjsc"
    fi
fi

case "$1" in
    up)
        echo "Running kjsc migrations up..."
        echo "MIGRATIONS_DIR: ${MIGRATIONS_DIR}"
        migrate -path "${MIGRATIONS_DIR}" -database "${DB_URL}" up
        ;;
    version)
        echo "Checking kjsc migration version..."
        migrate -path "${MIGRATIONS_DIR}" -database "${DB_URL}" version
        ;;
    force)
        if [ -z "$2" ]; then
            echo "Error: Version number is required"
            echo "Usage: $0 force <version>"
            exit 1
        fi
        echo "Forcing kjsc migration version to $2..."
        env migrate -path "${MIGRATIONS_DIR}" -database "${DB_URL}" force -- "$2"
        ;;
    create)
        if [ -z "$2" ]; then
            echo "Error: Migration name is required"
            echo "Usage: $0 create <migration_name>"
            exit 1
        fi
        echo "Creating kjsc migration files for $2..."
        migrate create -ext sql -dir "${MIGRATIONS_DIR}" -seq "$2"
        ;;
    down)
        echo "Error: kjsc migrations do not support down (000002 must never drop h_* tables)."
        exit 1
        ;;
    *)
        echo "Usage: $0 {up|version|force <version>|create <migration_name>}"
        exit 1
        ;;
esac

echo "kjsc migration command completed successfully"
