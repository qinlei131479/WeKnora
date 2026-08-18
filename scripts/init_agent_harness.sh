#!/bin/bash
# Agent-Harness 环境初始化（改编自 Bubble-Weave/scripts/init_kjsc.sh）。
# 复用仓库根 .env，不覆盖 WeKnora 已有配置；不拉取 postgres/redis/minio 等公共服务镜像
# （版本以 docker-compose-mac.yml / docker-compose-kjsc.yml 为准）。

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

generate_hex() {
    local length="$1"
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex "$length"
    else
        od -An -N "$length" -tx1 /dev/urandom | tr -d ' \n'
    fi
}

set_env_value() {
    local name="$1"
    local value="$2"

    if grep -Eq "^${name}=" .env; then
        ENV_VALUE="$value" awk -v name="$name" '
            $0 ~ "^" name "=" {
                if (!updated) {
                    print name "=" ENVIRON["ENV_VALUE"]
                    updated = 1
                }
                next
            }
            { print }
        ' .env > .env.tmp
        mv .env.tmp .env
    else
        printf '\n%s=%s\n' "$name" "$value" >> .env
    fi
}

env_has_value() {
    grep -Eq "^${1}=.+" .env
}

ensure_required_api_env() {
    if env_has_value SILICONFLOW_API_KEY; then
        return
    fi

    if [ -n "${SILICONFLOW_API_KEY:-}" ]; then
        set_env_value "SILICONFLOW_API_KEY" "$SILICONFLOW_API_KEY"
        return
    fi
    if [ ! -t 0 ]; then
        echo "❌ SILICONFLOW_API_KEY 未配置；非交互环境请通过环境变量传入。"
        exit 1
    fi

    echo "SILICONFLOW_API_KEY is missing in .env (harness 默认对话/Embedding 供应商)。"
    while true; do
        read -s -p "Please enter your SILICONFLOW_API_KEY: " SILICONFLOW_API_KEY
        echo ""
        if [ -n "$SILICONFLOW_API_KEY" ]; then
            break
        fi
        echo "API Key cannot be empty. Please try again."
    done
    set_env_value "SILICONFLOW_API_KEY" "$SILICONFLOW_API_KEY"
}

ensure_jwt_env() {
    if ! env_has_value JWT_SECRET_KEY; then
        JWT_SECRET_KEY="${JWT_SECRET_KEY:-}"
        if [ -t 0 ]; then
            echo "JWT_SECRET_KEY is missing in .env (harness 独立于 WeKnora JWT_SECRET)。"
            read -s -p "Please enter JWT_SECRET_KEY (press Enter to auto-generate): " JWT_SECRET_KEY
            echo ""
        fi
        if [ -z "$JWT_SECRET_KEY" ]; then
            JWT_SECRET_KEY=$(generate_hex 32)
            echo "Generated JWT_SECRET_KEY and saved it to .env."
        fi
        set_env_value "JWT_SECRET_KEY" "$JWT_SECRET_KEY"
    fi

    if ! env_has_value YUXI_INSTANCE_ID; then
        YUXI_INSTANCE_ID="${YUXI_INSTANCE_ID:-}"
        if [ -t 0 ]; then
            echo "YUXI_INSTANCE_ID is missing in .env."
            read -p "Please enter YUXI_INSTANCE_ID (press Enter to auto-generate): " YUXI_INSTANCE_ID
        fi
        if [ -z "$YUXI_INSTANCE_ID" ]; then
            YUXI_INSTANCE_ID="instance-$(generate_hex 8)"
            echo "Generated YUXI_INSTANCE_ID and saved it to .env."
        fi
        set_env_value "YUXI_INSTANCE_ID" "$YUXI_INSTANCE_ID"
    fi
}

ensure_sandbox_env() {
    if env_has_value SANDBOX_PROVISIONER_TOKEN; then
        return
    fi

    SANDBOX_PROVISIONER_TOKEN="${SANDBOX_PROVISIONER_TOKEN:-}"
    if [ -t 0 ]; then
        echo "SANDBOX_PROVISIONER_TOKEN is missing in .env."
        read -s -p "Please enter SANDBOX_PROVISIONER_TOKEN (press Enter to auto-generate): " SANDBOX_PROVISIONER_TOKEN
        echo ""
    fi
    if [ -z "$SANDBOX_PROVISIONER_TOKEN" ]; then
        SANDBOX_PROVISIONER_TOKEN=$(generate_hex 32)
        echo "Generated SANDBOX_PROVISIONER_TOKEN and saved it to .env."
    fi
    set_env_value "SANDBOX_PROVISIONER_TOKEN" "$SANDBOX_PROVISIONER_TOKEN"
}

ensure_version_env() {
    local ver
    if [ -f VERSION ]; then
        ver=$(tr -d '\n\r' < VERSION)
    else
        ver="0.7.2"
    fi
    set_env_value "AGENT_HARNESS_VERSION" "$ver"
    echo "Synced AGENT_HARNESS_VERSION=$ver from VERSION."
}

ensure_cors_env() {
    local current=""
    local origin
    local changed=false
    if grep -Eq '^YUXI_CORS_ORIGINS=' .env; then
        current=$(grep -E '^YUXI_CORS_ORIGINS=' .env | head -n 1 | cut -d= -f2-)
    fi
    for origin in \
        "http://localhost:5173" \
        "http://127.0.0.1:5173" \
        "http://localhost:5174" \
        "http://127.0.0.1:5174"; do
        case ",${current}," in
            *",${origin},"*) ;;
            *)
                current="${current:+${current},}${origin}"
                changed=true
                ;;
        esac
    done
    [ "$changed" = true ] || return
    set_env_value "YUXI_CORS_ORIGINS" "$current"
    echo "Updated YUXI_CORS_ORIGINS to include harness web :5174."
}

ensure_db_names() {
    if ! env_has_value AGENT_HARNESS_DB_NAME; then
        set_env_value "AGENT_HARNESS_DB_NAME" "agent_harness"
    fi
    if ! grep -Eq '^AGENT_HARNESS_REDIS_DB=' .env; then
        set_env_value "AGENT_HARNESS_REDIS_DB" "2"
    fi
}

skip_existing_image() {
    local image="$1"
    if ! docker image inspect "$image" >/dev/null 2>&1; then
        return 1
    fi
    echo "⏭️  ${image} already exists. Skipping pull."
    return 0
}

echo "Initializing Agent-Harness..."
echo "=================================="

if [ -f ".env" ]; then
    echo "✅ .env already exists. Filling missing harness keys only."
else
    if [ -f ".env.kjsc.example" ]; then
        cp .env.kjsc.example .env
        echo "📝 Created .env from .env.kjsc.example"
    elif [ -f ".env.example" ]; then
        cp .env.example .env
        echo "📝 Created .env from .env.example"
    else
        echo "❌ No .env, .env.kjsc.example, or .env.example found."
        exit 1
    fi
fi

ensure_required_api_env
ensure_jwt_env
ensure_sandbox_env
ensure_version_env
ensure_cors_env
ensure_db_names

echo ""
echo "📦 Pulling Agent-Harness build/runtime images (not WeKnora postgres/minio)..."
echo "========================="

images=(
    "python:3.13-slim"
    "node:24-slim"
    "node:24-alpine"
    "ghcr.io/astral-sh/uv:0.11.26"
)

for image in "${images[@]}"; do
    if skip_existing_image "$image"; then
        continue
    fi
    echo "🔄 Pulling ${image}..."
    if bash "$SCRIPT_DIR/pull_image.sh" "$image"; then
        echo "✅ Successfully pulled ${image}"
    else
        echo "❌ Failed to pull ${image}"
        exit 1
    fi
done

sandbox_image="enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest"
if ! skip_existing_image "$sandbox_image"; then
    echo "🔄 Pulling ${sandbox_image}..."
    docker pull "$sandbox_image"
    echo "✅ Successfully pulled ${sandbox_image}"
fi

echo ""
echo "Initialization complete."
echo "=========================="
echo "Next:"
echo "  make harness-up          # api + worker + web + sandbox-provisioner"
echo "  make harness-api         # or start one service"
echo "  make harness-seed        # after api is healthy"
echo "Frontend: http://localhost:5174"
