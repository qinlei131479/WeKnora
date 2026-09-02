#!/bin/bash
# KJSC 本地启动：app-core / apps/frontend / 一次性 init。
# 基础设施请用官方 make dev-start（scripts/dev.sh）。

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

log_info() {
    printf "%b\n" "${BLUE}[INFO]${NC} $1"
}

log_success() {
    printf "%b\n" "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    printf "%b\n" "${RED}[ERROR]${NC} $1"
}

log_warning() {
    printf "%b\n" "${YELLOW}[WARNING]${NC} $1"
}

show_help() {
    printf "%b\n" "${GREEN}WeKnora KJSC 开发脚本${NC}"
    echo "用法: $0 [init|infra|app|frontend|harness|sandbox|help]"
    echo ""
    echo "  init       补齐 .env 中 harness 键，并按需拉取构建镜像"
    echo "  infra      启动 postgres/redis/docreader/minio（dev.sh --minio）+ sandbox-provisioner"
    echo "  app        启动后端（cmd/app-core）"
    echo "  frontend   启动前端（apps/frontend）"
    echo "  harness    启动 harness api + worker"
    echo "  sandbox    单独启动 sandbox-provisioner"
    echo ""
    echo "整套顺序: init → infra → migrate-kjsc → app / frontend → harness"
    echo "Makefile:     make dev-kjsc-init / dev-kjsc-infra / ..."
    echo "编排文件:     COMPOSE_FILE=docker-compose-kjsc.yml $0 harness"
}

kjsc_ldflags() {
    ./scripts/get_version.sh ldflags | sed 's|internal/handler|apps/app-core/handler|g'
}

# 读取时去掉行尾 \r，兼容 Windows 风格(CRLF)换行符。
_source_env_file() {
    local src="$1"
    local tmp
    tmp="$(mktemp)" || return 1
    sed -e 's/\r$//' "$src" > "$tmp"
    set -a
    # shellcheck source=/dev/null
    source "$tmp"
    set +a
    rm -f "$tmp"
}

load_env_files() {
    if [ -f ".env" ]; then
        _source_env_file .env || return 1
    else
        return 1
    fi

    if [ -f ".env.local" ]; then
        log_info "加载 .env.local 覆盖配置..."
        _source_env_file .env.local || return 1
    fi
    return 0
}

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

ensure_env_key() {
    local name="$1"
    local value="$2"
    if env_has_value "$name"; then
        return
    fi
    set_env_value "$name" "$value"
    log_info "写入 $name"
}

# 经 DaoCloud 镜像拉取 Docker Hub 镜像并 retag（原 scripts/pull_image.sh）。
pull_from_mirror() {
    local image_tag="$1"
    local slash_count
    local mirror_url
    slash_count=$(echo "$image_tag" | tr -cd '/' | wc -c | tr -d ' ')
    if [ "$slash_count" -eq 0 ]; then
        mirror_url="m.daocloud.io/docker.io/library"
    elif [ "$slash_count" -eq 1 ]; then
        mirror_url="m.daocloud.io/docker.io"
    else
        mirror_url="m.daocloud.io"
    fi
    log_info "拉取 $mirror_url/$image_tag"
    docker pull "$mirror_url/$image_tag" || return 1
    docker tag "$mirror_url/$image_tag" "$image_tag" || return 1
    docker rmi "$mirror_url/$image_tag" >/dev/null 2>&1 || true
}

init_kjsc() {
    cd "$PROJECT_ROOT"

    if [ -f ".env" ]; then
        log_info ".env 已存在，仅补齐缺失的 harness 键"
    elif [ -f ".env.kjsc.example" ]; then
        cp .env.kjsc.example .env
        log_success "已从 .env.kjsc.example 创建 .env"
    elif [ -f ".env.example" ]; then
        cp .env.example .env
        log_success "已从 .env.example 创建 .env"
    else
        log_error "未找到 .env / .env.kjsc.example / .env.example"
        return 1
    fi

    if [ -n "${SILICONFLOW_API_KEY:-}" ] && ! env_has_value SILICONFLOW_API_KEY; then
        set_env_value "SILICONFLOW_API_KEY" "$SILICONFLOW_API_KEY"
        log_info "写入 SILICONFLOW_API_KEY（来自环境变量）"
    elif ! env_has_value SILICONFLOW_API_KEY; then
        log_warning "SILICONFLOW_API_KEY 未设置（harness 对话需要时可自行写入 .env）"
    fi

    ensure_env_key "JWT_SECRET_KEY" "$(generate_hex 32)"
    ensure_env_key "YUXI_INSTANCE_ID" "instance-$(generate_hex 8)"
    ensure_env_key "SANDBOX_PROVISIONER_TOKEN" "$(generate_hex 32)"
    ensure_env_key "AGENT_HARNESS_DB_NAME" "agent_harness"
    if ! grep -Eq '^AGENT_HARNESS_REDIS_DB=' .env; then
        set_env_value "AGENT_HARNESS_REDIS_DB" "2"
        log_info "写入 AGENT_HARNESS_REDIS_DB=2"
    fi

    local ver="0.7.2"
    if [ -f VERSION ]; then
        ver=$(tr -d '\n\r' < VERSION)
    fi
    set_env_value "AGENT_HARNESS_VERSION" "$ver"
    log_info "AGENT_HARNESS_VERSION=$ver"

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
    if [ "$changed" = true ]; then
        set_env_value "YUXI_CORS_ORIGINS" "$current"
        log_info "已更新 YUXI_CORS_ORIGINS"
    fi

    if ! command -v docker >/dev/null 2>&1; then
        log_warning "未安装 Docker，跳过镜像拉取"
        log_success "init 完成。接下来: make dev-kjsc-harness / make dev-kjsc-sandbox"
        return 0
    fi

    log_info "拉取 harness 构建镜像（已存在则跳过）..."
    local image
    for image in \
        "python:3.13-slim" \
        "node:24-slim" \
        "node:24-alpine" \
        "ghcr.io/astral-sh/uv:0.11.26"; do
        if docker image inspect "$image" >/dev/null 2>&1; then
            log_info "已有 $image，跳过"
            continue
        fi
        if ! pull_from_mirror "$image"; then
            log_error "拉取失败: $image"
            return 1
        fi
        log_success "已拉取 $image"
    done

    local sandbox_image="enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest"
    if docker image inspect "$sandbox_image" >/dev/null 2>&1; then
        log_info "已有 sandbox 镜像，跳过"
    else
        log_info "拉取 $sandbox_image"
        docker pull "$sandbox_image" || return 1
        log_success "已拉取 sandbox 镜像"
    fi

    log_success "init 完成。接下来: make dev-kjsc-harness / make dev-kjsc-sandbox"
}

check_remote_dev_connectivity() {
    local host="${DEV_REMOTE_HOST:-}"
    if [ -z "$host" ]; then
        return 0
    fi

    local db_port="${DB_PORT:-5432}"
    local redis_port
    redis_port="${REDIS_ADDR#*:}"
    if [ "$redis_port" = "$REDIS_ADDR" ]; then
        redis_port=6379
    fi
    local docreader_port="${DOCREADER_PORT:-50051}"

    log_info "检查远程基础设施连通性 (${host})..."
    local failed=0
    for spec in "PostgreSQL:${host}:${db_port}" "Redis:${host}:${redis_port}" "DocReader:${host}:${docreader_port}"; do
        local name="${spec%%:*}"
        local rest="${spec#*:}"
        local h="${rest%%:*}"
        local p="${rest##*:}"
        if command -v nc &> /dev/null; then
            if nc -z -w 3 "$h" "$p" 2>/dev/null; then
                log_success "${name} ${h}:${p} 可达"
            else
                log_error "${name} ${h}:${p} 不可达 (no route / connection refused)"
                failed=1
            fi
        else
            log_warning "未安装 nc，跳过 ${name} 连通性检查"
        fi
    done

    if [ "$failed" -ne 0 ]; then
        echo ""
        log_error "无法连接远程开发环境 ${host}"
        log_info "排查建议:"
        echo "  1. 确认远程机器 Docker 容器在运行 (postgres/redis/docreader)"
        echo "  2. 确认本机与 ${host} 在同一局域网 (本机: $(ipconfig getifaddr en0 2>/dev/null || echo '未知'))"
        echo "  3. 在远程检查端口映射: docker ps --format 'table {{.Names}}\t{{.Ports}}'"
        echo "  4. 检查远程防火墙是否放行 5432/6379/50051"
        return 1
    fi
    return 0
}

start_app() {
    log_info "启动后端应用（app-core，cmd/app-core）..."

    cd "$PROJECT_ROOT"

    if ! command -v go &> /dev/null; then
        log_error "Go 未安装"
        return 1
    fi

    log_info "加载环境配置..."
    if ! load_env_files; then
        log_error ".env 文件不存在，请先运行: ./scripts/dev_kjsc.sh init"
        return 1
    fi

    if [ -n "${DEV_REMOTE_HOST:-}" ]; then
        log_info "远程开发模式: 基础设施 → ${DEV_REMOTE_HOST}"
        export DB_HOST="${DB_HOST:-$DEV_REMOTE_HOST}"
        export REDIS_ADDR="${REDIS_ADDR:-$DEV_REMOTE_HOST:6379}"
        export DOCREADER_ADDR="${DOCREADER_ADDR:-$DEV_REMOTE_HOST:50051}"
        export MINIO_ENDPOINT="${MINIO_ENDPOINT:-$DEV_REMOTE_HOST:9000}"
        export MILVUS_ADDRESS="${MILVUS_ADDRESS:-$DEV_REMOTE_HOST:19530}"
        export NEO4J_URI="${NEO4J_URI:-bolt://$DEV_REMOTE_HOST:7687}"
        export QDRANT_HOST="${QDRANT_HOST:-$DEV_REMOTE_HOST}"
        if [ -z "${LANGFUSE_HOST:-}" ] || [ "$LANGFUSE_HOST" = "http://langfuse-web:3000" ]; then
            export LANGFUSE_HOST="http://${DEV_REMOTE_HOST}:3000"
        fi
    else
        export DB_HOST=localhost
        export DOCREADER_ADDR=localhost:50051
        export MINIO_ENDPOINT=localhost:9000
        export REDIS_ADDR=localhost:6379
        export MILVUS_ADDRESS=localhost:19530
        export NEO4J_URI=bolt://localhost:7687
        export QDRANT_HOST=localhost
    fi
    export DOCREADER_TRANSPORT="${DOCREADER_TRANSPORT:-grpc}"

    if ! check_remote_dev_connectivity; then
        return 1
    fi

    if [ -z "${LOCAL_STORAGE_BASE_DIR:-}" ] || [ "$LOCAL_STORAGE_BASE_DIR" = "/data/files" ]; then
        export LOCAL_STORAGE_BASE_DIR="$PROJECT_ROOT/.local-data/files"
    fi
    mkdir -p "$LOCAL_STORAGE_BASE_DIR"

    if [ -z "$DB_DRIVER" ]; then
        log_error "DB_DRIVER 环境变量未设置，请检查 .env 文件"
        return 1
    fi

    export APP_PORT="${APP_PORT:-9980}"

    log_info "环境变量已设置，启动应用..."
    log_info "数据库地址: $DB_HOST:${DB_PORT:-5432}"
    log_info "本机 app 监听: http://localhost:${APP_PORT}"

    export CGO_CFLAGS="-Wno-deprecated-declarations -Wno-gnu-folding-constant"
    if [[ "$(uname)" == "Darwin" ]]; then
      export CGO_LDFLAGS="-Wl,-no_warn_duplicate_libraries"
    fi

    if command -v air &> /dev/null; then
        log_success "检测到 Air，使用热重载模式启动..."
        log_info "修改 Go 代码后将自动重新编译和重启"
        air -c .air.appcore.toml
    else
        log_info "未检测到 Air，使用普通模式启动"
        log_warning "提示: 安装 Air 可以实现代码修改后自动重启"
        log_info "安装命令: go install github.com/air-verse/air@latest"
        LDFLAGS="$(kjsc_ldflags) -X 'google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn'"
        go run -ldflags="$LDFLAGS" ./cmd/app-core
    fi
}

start_frontend() {
    log_info "启动前端开发服务器..."

    cd "$PROJECT_ROOT"
    if [ -f ".env" ] || [ -f ".env.local" ]; then
        load_env_files >/dev/null 2>&1 || true
    fi

    cd "$PROJECT_ROOT/apps/frontend"

    if ! command -v npm &> /dev/null; then
        log_error "npm 未安装"
        return 1
    fi

    if [ ! -d "node_modules" ]; then
        log_warning "node_modules 不存在，正在安装依赖..."
        npm install
    fi

    export APP_PORT="${APP_PORT:-9980}"
    export VITE_DEV_PORT="${VITE_DEV_PORT:-${FRONTEND_PORT:-9988}}"
    export VITE_DEV_PROXY_TARGET="${VITE_DEV_PROXY_TARGET:-${FRONTEND_BACKEND_URL:-http://localhost:${APP_PORT}}}"
    export VITE_HARNESS_PROXY_TARGET="${VITE_HARNESS_PROXY_TARGET:-http://127.0.0.1:${AGENT_HARNESS_PORT:-5050}}"

    log_info "启动 Vite 开发服务器..."
    log_info "前端将运行在 http://localhost:${VITE_DEV_PORT}"
    log_info "前端 API 代理目标: ${VITE_DEV_PROXY_TARGET}"
    log_info "Harness API 代理目标: ${VITE_HARNESS_PROXY_TARGET}"

    npm run dev
}

require_env_file() {
    cd "$PROJECT_ROOT"
    if [ ! -f ".env" ]; then
        log_error "缺少 .env，请先运行: ./scripts/dev_kjsc.sh init"
        return 1
    fi
}

harness_version() {
    if [ -f VERSION ]; then
        tr -d '\n\r' < VERSION
    else
        echo "unknown"
    fi
}

# COMPOSE_FILE 可覆盖，默认 docker-compose-mac.yml。--no-deps 不拉基础设施。
harness_compose() {
    local compose_file="${COMPOSE_FILE:-docker-compose-mac.yml}"
    AGENT_HARNESS_VERSION="$(harness_version)" docker compose -f "$compose_file" \
        --profile harness --profile minio --profile neo4j "$@"
}

start_harness() {
    require_env_file || return 1
    local ver
    ver="$(harness_version)"
    log_info "启动 harness api + worker（不拉 sandbox / 基础设施）..."
    if ! docker image inspect "kjsc/agent-middle-harness:${ver}" >/dev/null 2>&1; then
        log_info "本地无 kjsc/agent-middle-harness:${ver}，先 build api"
        harness_compose build api || return 1
    fi
    harness_compose up -d --no-deps api worker
}

start_sandbox() {
    require_env_file || return 1
    if ! grep -Eq '^SANDBOX_PROVISIONER_TOKEN=.+' .env; then
        log_error "SANDBOX_PROVISIONER_TOKEN 为空，请先运行: ./scripts/dev_kjsc.sh init"
        return 1
    fi
    log_info "启动 sandbox-provisioner..."
    harness_compose up -d --no-deps sandbox-provisioner
}

# postgres/redis/docreader/minio 走官方 docker-compose.dev.yml（端口与 app 的 localhost 映射一致）。
# sandbox-provisioner 走 compose-mac/kjsc。compose up -d 对已运行容器是空操作。
start_infra() {
    cd "$PROJECT_ROOT"
    log_info "启动官方开发基础设施（postgres/redis/docreader/minio）..."
    "$SCRIPT_DIR/dev.sh" start --minio || return 1
    log_info "启动 sandbox-provisioner（已运行则跳过）..."
    start_sandbox
}

CMD="${1:-help}"
case "$CMD" in
    init)
        init_kjsc
        ;;
    infra)
        start_infra
        ;;
    app)
        start_app
        ;;
    frontend)
        start_frontend
        ;;
    harness)
        start_harness
        ;;
    sandbox)
        start_sandbox
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "未知命令: $CMD"
        show_help
        exit 1
        ;;
esac

exit 0
