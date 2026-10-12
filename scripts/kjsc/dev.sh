#!/bin/bash
# KJSC 本地启动：app-core / apps/frontend / 一次性 init。
# 基础设施请用官方 make dev-start（scripts/dev.sh）。

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

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
    echo "  init       补齐 .env 中 harness 必须键，并按需拉取构建镜像"
    echo "  infra      启动 postgres/redis/docreader/minio（dev.sh --minio）+ sandbox-provisioner"
    echo "  app        启动后端（cmd/app-core）"
    echo "  frontend   启动前端（apps/frontend）"
    echo "  harness    本机启动 harness api + worker（uvicorn / arq，不启 Docker）"
    echo "  sandbox    单独启动 sandbox-provisioner（Docker）"
    echo ""
    echo "整套顺序: init → infra → migrate → app / frontend → harness"
    echo "Makefile:     make -f Makefile.kjsc init / infra / migrate / ..."
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

    if ! env_has_value JWT_SECRET; then
        log_error "JWT_SECRET 为空，必须与 app-core 使用同一密钥，请写入 .env 后重试"
        return 1
    fi

    ensure_env_key "WEKNORA_BASE_URL" "http://app:8080/api/v1"
    ensure_env_key "HARNESS_MINIO_BUCKET_NAME" "agent-harness"
    ensure_env_key "SANDBOX_PROVISIONER_TOKEN" "$(generate_hex 32)"
    # 示例 SYSTEM_AES_KEY 不能给嵌入会话签名，缺省时生成独立密钥。
    ensure_env_key "SYSTEM_SIGNING_KEY" "$(generate_hex 32)"

    local missing=""
    for key in DB_HOST DB_NAME REDIS_ADDR MINIO_ENDPOINT MINIO_ACCESS_KEY_ID MINIO_SECRET_ACCESS_KEY; do
        if ! env_has_value "$key"; then
            missing="${missing:+${missing} }${key}"
        fi
    done
    if [ -n "$missing" ]; then
        log_error "缺少 B 段必须配置: $missing"
        return 1
    fi

    local current=""
    local origin
    local changed=false
    if grep -Eq '^YUXI_CORS_ORIGINS=' .env; then
        current=$(grep -E '^YUXI_CORS_ORIGINS=' .env | head -n 1 | cut -d= -f2-)
    fi
    for origin in \
        "http://localhost:5173"; do
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
        log_success "init 完成。接下来: make -f Makefile.kjsc harness / sandbox"
        return 0
    fi

    log_info "拉取 harness 构建镜像（已存在则跳过）..."
    local image
    for image in \
        "python:3.13-slim" \
        "node:24-slim" \
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

    log_success "init 完成。接下来: make -f Makefile.kjsc harness / sandbox"
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

# Host-platform path of the anydoc static archive (built by `make anydoc-lib`).
anydoc_host_archive() {
    case "$(uname -s)-$(uname -m)" in
        Darwin-arm64) echo "$PROJECT_ROOT/third_party/anydoc-go/lib/darwin_arm64/libanydoc_go.a" ;;
        Darwin-x86_64) echo "$PROJECT_ROOT/third_party/anydoc-go/lib/darwin_amd64/libanydoc_go.a" ;;
        Linux-x86_64)
            if [ -f "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_amd64_gnu/libanydoc_go.a" ]; then
                echo "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_amd64_gnu/libanydoc_go.a"
            else
                echo "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_amd64_musl/libanydoc_go.a"
            fi
            ;;
        Linux-aarch64)
            if [ -f "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_arm64_gnu/libanydoc_go.a" ]; then
                echo "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_arm64_gnu/libanydoc_go.a"
            else
                echo "$PROJECT_ROOT/third_party/anydoc-go/lib/linux_arm64_musl/libanydoc_go.a"
            fi
            ;;
        *) echo "" ;;
    esac
}

# Enable the in-process anydoc engine when the archive is present, unless the
# caller already set GO_BUILD_TAGS (including empty, which opts out).
enable_anydoc_build_tag() {
    if [ -n "${GO_BUILD_TAGS+x}" ]; then
        export GO_BUILD_TAGS
        if [ -n "$GO_BUILD_TAGS" ]; then
            log_info "使用已设置的 GO_BUILD_TAGS=$GO_BUILD_TAGS"
        else
            log_info "GO_BUILD_TAGS 为空，跳过 anydoc"
        fi
        return
    fi
    local archive
    archive="$(anydoc_host_archive)"
    if [ -n "$archive" ] && [ -f "$archive" ]; then
        export GO_BUILD_TAGS=anydoc
        log_info "检测到 anydoc 静态库，已启用 -tags anydoc"
    else
        log_info "未检测到 anydoc 静态库，.docm/.odt/.rtf 等格式不可解析。需要时先运行: make anydoc-lib"
    fi
}

# 本机进程把 Compose 主机名换成 localhost；远程开发则指向 DEV_REMOTE_HOST。
apply_host_dev_env() {
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
}

# 本机覆盖 Docker 主机名；连接串由 yuxi.config.env 按 B 段离散项拼接，不要写 POSTGRES_URL / REDIS_URL / MINIO_URI。
apply_harness_host_overrides() {
    local app_port sandbox_port

    app_port="${APP_PORT:-9980}"
    if [ -z "${WEKNORA_BASE_URL:-}" ] || [[ "${WEKNORA_BASE_URL}" == *"host.docker.internal"* ]] || [[ "${WEKNORA_BASE_URL}" == *"://app:"* ]]; then
        export WEKNORA_BASE_URL="http://localhost:${app_port}/api/v1"
    fi

    sandbox_port="${SANDBOX_PROVISIONER_PORT:-8002}"
    if [ -z "${SANDBOX_PROVISIONER_URL:-}" ] || [[ "${SANDBOX_PROVISIONER_URL}" == *"sandbox-provisioner"* ]]; then
        export SANDBOX_PROVISIONER_URL="http://localhost:${sandbox_port}"
    fi

    if [ -z "${MINIO_ENDPOINT:-}" ] || [[ "${MINIO_ENDPOINT}" == minio:* ]] || [[ "${MINIO_ENDPOINT}" == *"://minio:"* ]]; then
        export MINIO_ENDPOINT="localhost:9000"
    fi
    unset POSTGRES_URL REDIS_URL MINIO_URI

    # 与 Compose 挂载 ./docker/volumes/agent-harness:/app/saves 对齐，本机不另起一份 saves。
    if [ -z "${YUXI_SAVE_DIR:-}" ]; then
        export YUXI_SAVE_DIR="$PROJECT_ROOT/docker/volumes/agent-harness"
    fi
    mkdir -p "$YUXI_SAVE_DIR"

    unset RUNNING_IN_DOCKER
    export YUXI_ENV="${YUXI_ENV:-development}"
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
        log_error ".env 文件不存在，请先运行: ./scripts/kjsc/dev.sh init"
        return 1
    fi
    # 示例 AES 密钥会被拒绝用于签名；本地启动时补上独立密钥，已有值不覆盖。
    if ! env_has_value SYSTEM_SIGNING_KEY; then
        ensure_env_key "SYSTEM_SIGNING_KEY" "$(generate_hex 32)"
        load_env_files || return 1
    fi

    apply_host_dev_env

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

    enable_anydoc_build_tag

    if command -v air &> /dev/null; then
        log_success "检测到 Air，使用热重载模式启动..."
        log_info "修改 Go 代码后将自动重新编译和重启"
        # 不改官方 .air.toml；企业后端走 cmd/app-core
        air -c .air.appcore.toml
    else
        log_info "未检测到 Air，使用普通模式启动"
        log_warning "提示: 安装 Air 可以实现代码修改后自动重启"
        log_info "安装命令: go install github.com/air-verse/air@latest"
        LDFLAGS="$(kjsc_ldflags) -X 'google.golang.org/protobuf/reflect/protoregistry.conflictPolicy=warn'"
        tags_args=()
        if [ -n "${GO_BUILD_TAGS:-}" ]; then
            tags_args=(-tags "$GO_BUILD_TAGS")
        fi
        go run "${tags_args[@]}" -ldflags="$LDFLAGS" ./cmd/app-core
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
    export VITE_HARNESS_PROXY_TARGET="${VITE_HARNESS_PROXY_TARGET:-http://localhost:${HARNESS_PORT:-9990}}"

    log_info "启动 Vite 开发服务器..."
    log_info "前端将运行在 http://localhost:${VITE_DEV_PORT}"
    log_info "前端 API 代理目标: ${VITE_DEV_PROXY_TARGET}"
    log_info "Harness API 代理目标: ${VITE_HARNESS_PROXY_TARGET}"

    npm run dev
}

require_env_file() {
    cd "$PROJECT_ROOT"
    if [ ! -f ".env" ]; then
        log_error "缺少 .env，请先运行: ./scripts/kjsc/dev.sh init"
        return 1
    fi
}

repo_version() {
    local ver=""
    if [ -f "$PROJECT_ROOT/VERSION" ]; then
        ver="$(tr -d '\n\r' < "$PROJECT_ROOT/VERSION")"
    fi
    if [ -z "$ver" ]; then
        echo "latest"
        return 0
    fi
    echo "$ver"
}

# COMPOSE_FILE 可覆盖，默认 docker-compose-mac.yml。--no-deps 不拉基础设施。
harness_compose() {
    local compose_file="${COMPOSE_FILE:-docker-compose-mac.yml}"
    VERSION="$(repo_version)" docker compose -f "$compose_file" \
        --profile harness --profile minio "$@"
}

start_harness() {
    require_env_file || return 1

    log_info "加载环境配置..."
    if ! load_env_files; then
        log_error ".env 文件不存在，请先运行: ./scripts/kjsc/dev.sh init"
        return 1
    fi

    if ! command -v python3 >/dev/null 2>&1; then
        log_error "未安装 python3"
        return 1
    fi
    if ! command -v uv >/dev/null 2>&1; then
        log_error "未安装 uv，请先安装: https://docs.astral.sh/uv/"
        return 1
    fi

    apply_host_dev_env
    apply_harness_host_overrides

    if [ -z "${JWT_SECRET:-}" ]; then
        log_error "JWT_SECRET 为空，本机 harness 需要与 WeKnora 相同的密钥"
        return 1
    fi
    if [ -z "${WEKNORA_BASE_URL:-}" ]; then
        log_error "WEKNORA_BASE_URL 为空，请先运行: ./scripts/kjsc/dev.sh init"
        return 1
    fi
    if [ "${#SANDBOX_PROVISIONER_TOKEN}" -lt 32 ]; then
        log_error "SANDBOX_PROVISIONER_TOKEN 至少 32 字符，请先运行: ./scripts/kjsc/dev.sh init"
        return 1
    fi

    local harness_dir="$PROJECT_ROOT/apps/agent-harness"
    local api_port="${HARNESS_PORT:-9990}"
    local worker_pid=""

    cd "$harness_dir"
    if [ ! -d ".venv" ]; then
        log_info "首次同步 harness 依赖（uv sync）..."
        uv sync || return 1
    fi

    log_info "本机启动 harness api + worker（不启 Docker）..."
    log_info "数据库: ${DB_HOST}:${DB_PORT:-5432}/${DB_NAME:-agent-middle}"
    log_info "Redis: ${REDIS_ADDR:-localhost:6379} DB ${REDIS_DB:-0}"
    log_info "工作区: ${YUXI_SAVE_DIR}"
    log_info "API: http://localhost:${api_port}"
    log_info "WeKnora: ${WEKNORA_BASE_URL}"

    cleanup_harness() {
        if [ -n "${worker_pid:-}" ]; then
            kill "$worker_pid" 2>/dev/null || true
            wait "$worker_pid" 2>/dev/null || true
        fi
    }
    trap cleanup_harness EXIT INT TERM

    uv run watchfiles --filter python "arq server.worker_main.WorkerSettings" server package &
    worker_pid=$!
    uv run uvicorn server.main:app --host 0.0.0.0 --port "$api_port" \
        --reload --reload-dir server --reload-dir package --timeout-graceful-shutdown 5
}

start_sandbox() {
    require_env_file || return 1
    if ! grep -Eq '^SANDBOX_PROVISIONER_TOKEN=.+' .env; then
        log_error "SANDBOX_PROVISIONER_TOKEN 为空，请先运行: ./scripts/kjsc/dev.sh init"
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
    "$PROJECT_ROOT/scripts/dev.sh" start --minio || return 1
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
