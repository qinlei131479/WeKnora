#!/bin/bash
# kjsc / agent-middle 本地镜像构建脚本
# - 镜像前缀: kjsc/agent-middle-*
# - 前端源码: apps/frontend
# - 不修改上游 scripts/build_images.sh

# 设置颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # 无颜色

# 获取项目根目录（scripts/kjsc 的上两级）
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

FRONTEND_ROOT="$PROJECT_ROOT/apps/frontend"
IMAGE_PREFIX="kjsc/agent-middle"

# 版本信息
VERSION="1.0.0"
SCRIPT_NAME=$(basename "$0")

# 显示帮助信息
show_help() {
    echo -e "${GREEN}agent-middle (kjsc) 镜像构建脚本 v${VERSION}${NC}"
    echo -e "${GREEN}用法:${NC} $0 [选项]"
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -a, --all      构建所有镜像（默认）"
    echo "  -p, --app      仅构建应用镜像"
    echo "  -d, --docreader 仅构建文档读取器镜像"
    echo "  -f, --frontend 仅构建前端镜像"
    echo "  -s, --sandbox  仅构建沙箱镜像"
    echo "      --docs     仅构建文档站镜像 (VitePress → nginx)"
    echo "      --harness  仅构建 Agent-Harness 镜像"
    echo "      --sandbox-provisioner  仅构建 sandbox-provisioner 镜像"
    echo "  -c, --clean    清理所有本地 kjsc/agent-middle 镜像"
    echo "  -v, --version  显示版本信息"
    exit 0
}

# 显示版本信息
show_version() {
    echo -e "${GREEN}agent-middle (kjsc) 镜像构建脚本 v${VERSION}${NC}"
    exit 0
}

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查Docker是否已安装
check_docker() {
    log_info "检查Docker环境..."

    if ! command -v docker &> /dev/null; then
        log_error "未安装Docker，请先安装Docker"
        return 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker服务未运行，请启动Docker服务"
        return 1
    fi

    log_success "Docker环境检查通过"
    return 0
}

# 检测平台
check_platform() {
    log_info "检测系统平台信息..."
    if [ "$(uname -m)" = "x86_64" ]; then
        export PLATFORM="linux/amd64"
        export TARGETARCH="amd64"
    elif [ "$(uname -m)" = "aarch64" ] || [ "$(uname -m)" = "arm64" ]; then
        export PLATFORM="linux/arm64"
        export TARGETARCH="arm64"
    else
        log_warning "未识别的平台类型：$(uname -m)，将使用默认平台 linux/amd64"
        export PLATFORM="linux/amd64"
        export TARGETARCH="amd64"
    fi
    log_info "当前平台：$PLATFORM"
    log_info "当前架构：$TARGETARCH"
}

# 从 .env 读取单个键（未 export 到环境时使用）
load_env_var() {
    local key="$1"
    local file="$PROJECT_ROOT/.env"
    if [ -z "${!key:-}" ] && [ -f "$file" ]; then
        local val
        val=$(grep -E "^${key}=" "$file" | tail -n1 | cut -d= -f2- | sed 's/^["'\'']//;s/["'\'']$//')
        if [ -n "$val" ]; then
            export "$key=$val"
        fi
    fi
}

# 获取版本信息
get_version_info() {
    if [ -f "VERSION" ]; then
        VERSION=$(cat VERSION | tr -d '\n\r')
    else
        VERSION="unknown"
    fi

    if command -v git >/dev/null 2>&1; then
        COMMIT_ID=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    else
        COMMIT_ID="unknown"
    fi

    BUILD_TIME=$(date -u '+%Y-%m-%d %H:%M:%S UTC')

    if command -v go >/dev/null 2>&1; then
        GO_VERSION=$(go version 2>/dev/null || echo "unknown")
    else
        GO_VERSION="unknown"
    fi

    log_info "版本信息: $VERSION"
    log_info "Commit ID: $COMMIT_ID"
    log_info "构建时间: $BUILD_TIME"
    log_info "Go版本: $GO_VERSION"
}

# 构建 apps/frontend 静态资源（不调用上游 scripts/build_frontend_dist.sh）
build_apps_frontend_dist() {
    if [ ! -f "$FRONTEND_ROOT/package.json" ]; then
        log_error "未找到前端工程: $FRONTEND_ROOT/package.json"
        return 1
    fi

    export VITE_IS_DOCKER="${VITE_IS_DOCKER:-true}"
    if [ -z "${VITE_FRONTEND_COMMIT:-}" ]; then
        # shellcheck source=/dev/null
        eval "$("$PROJECT_ROOT/scripts/get_version.sh" env)"
        export VITE_FRONTEND_COMMIT="${COMMIT_ID:-unknown}"
    fi

    log_info "在 apps/frontend 构建前端静态资源..."
    log_info "前端目录: $FRONTEND_ROOT"
    cd "$FRONTEND_ROOT" || return 1
    npm ci
    npm run build
}

# 构建应用镜像
build_app_image() {
    log_info "构建应用镜像 (${IMAGE_PREFIX}-app)..."

    cd "$PROJECT_ROOT"
    get_version_info
    load_env_var APK_MIRROR_ARG
    load_env_var GOPROXY
    load_env_var GOPRIVATE
    load_env_var GOSUMDB

    # 国内默认走 goproxy.cn + .env 中的 Debian 镜像源，避免官方源过慢
    local goproxy="${GOPROXY:-https://goproxy.cn,direct}"
    local apk_mirror="${APK_MIRROR_ARG:-mirrors.aliyun.com}"
    log_info "GOPROXY=$goproxy"
    log_info "APK_MIRROR_ARG=$apk_mirror"

    DOCKER_BUILDKIT=1 docker build \
        --platform $PLATFORM \
        --build-arg GOPRIVATE_ARG=${GOPRIVATE:-""} \
        --build-arg GOPROXY_ARG="$goproxy" \
        --build-arg GOSUMDB_ARG=${GOSUMDB:-"off"} \
        --build-arg APK_MIRROR_ARG="$apk_mirror" \
        --build-arg VERSION_ARG="$VERSION" \
        --build-arg COMMIT_ID_ARG="$COMMIT_ID" \
        --build-arg BUILD_TIME_ARG="$BUILD_TIME" \
        --build-arg GO_VERSION_ARG="$GO_VERSION" \
        -f docker/Dockerfile.app-core \
        -t ${IMAGE_PREFIX}-app:latest \
        .

    if [ $? -eq 0 ]; then
        log_success "应用镜像构建成功: ${IMAGE_PREFIX}-app:latest"
        return 0
    else
        log_error "应用镜像构建失败"
        return 1
    fi
}

# 构建文档读取器镜像
build_docreader_image() {
    log_info "构建文档读取器镜像 (${IMAGE_PREFIX}-docreader)..."

    cd "$PROJECT_ROOT"

    docker build \
        --platform $PLATFORM \
        --build-arg PLATFORM=$PLATFORM \
        --build-arg TARGETARCH=$TARGETARCH \
        --build-arg APT_MIRROR=${APT_MIRROR:-} \
        -f docker/Dockerfile.docreader \
        -t ${IMAGE_PREFIX}-docreader:latest \
        .

    if [ $? -eq 0 ]; then
        log_success "文档读取器镜像构建成功: ${IMAGE_PREFIX}-docreader:latest"
        return 0
    else
        log_error "文档读取器镜像构建失败"
        return 1
    fi
}

# 构建前端镜像（先在 apps/frontend 产出 dist，再以仓库根为 context）
build_frontend_image() {
    log_info "构建前端镜像 (${IMAGE_PREFIX}-ui)..."
    log_info "前端源码目录: $FRONTEND_ROOT"

    if [ ! -d "$FRONTEND_ROOT" ]; then
        log_error "前端目录不存在: $FRONTEND_ROOT"
        return 1
    fi
    if [ ! -f "$PROJECT_ROOT/docker/Dockerfile.frontend" ]; then
        log_error "缺少 docker/Dockerfile.frontend"
        return 1
    fi

    cd "$PROJECT_ROOT"
    get_version_info

    export VITE_IS_DOCKER=true
    export VITE_FRONTEND_COMMIT="$COMMIT_ID"
    build_apps_frontend_dist
    if [ $? -ne 0 ]; then
        log_error "前端静态资源构建失败（apps/frontend）"
        return 1
    fi

    cd "$PROJECT_ROOT"
    docker build \
        --platform $PLATFORM \
        -f docker/Dockerfile.frontend \
        -t ${IMAGE_PREFIX}-ui:latest \
        "$PROJECT_ROOT"

    if [ $? -eq 0 ]; then
        log_success "前端镜像构建成功: ${IMAGE_PREFIX}-ui:latest"
        return 0
    else
        log_error "前端镜像构建失败"
        return 1
    fi
}

# 构建沙箱镜像
build_sandbox_image() {
    log_info "构建沙箱镜像 (${IMAGE_PREFIX}-sandbox)..."

    cd "$PROJECT_ROOT"

    docker build \
        --platform $PLATFORM \
        -f docker/Dockerfile.sandbox \
        -t ${IMAGE_PREFIX}-sandbox:latest \
        .

    if [ $? -eq 0 ]; then
        log_success "沙箱镜像构建成功: ${IMAGE_PREFIX}-sandbox:latest"
        return 0
    else
        log_error "沙箱镜像构建失败"
        return 1
    fi
}

# 构建文档站镜像（VitePress → nginx；源码 apps/docs，context=仓库根以读取 VERSION）
build_docs_image() {
    log_info "构建文档站镜像 (${IMAGE_PREFIX}-docs)..."

    local site_root="$PROJECT_ROOT/apps/docs"
    if [ ! -f "$site_root/package.json" ] || [ ! -f "$PROJECT_ROOT/docker/Dockerfile.docs" ]; then
        log_error "docs 站点不完整: 需要 $site_root/package.json 与 docker/Dockerfile.docs"
        return 1
    fi
    if [ ! -f "$PROJECT_ROOT/VERSION" ]; then
        log_error "缺少仓库根 VERSION 文件（文档站构建依赖）"
        return 1
    fi

    cd "$PROJECT_ROOT"
    docker build \
        --platform $PLATFORM \
        -f docker/Dockerfile.docs \
        -t ${IMAGE_PREFIX}-docs:latest \
        "$PROJECT_ROOT"

    if [ $? -eq 0 ]; then
        log_success "文档站镜像构建成功: ${IMAGE_PREFIX}-docs:latest"
        return 0
    else
        log_error "文档站镜像构建失败"
        return 1
    fi
}

harness_image_tag() {
    load_env_var AGENT_HARNESS_VERSION
    echo "${AGENT_HARNESS_VERSION:-$VERSION}"
}

# 构建 Agent-Harness（不并入 -a；不含 sandbox-provisioner）
build_harness_image() {
    log_info "构建 Agent-Harness 镜像 (${IMAGE_PREFIX}-harness)..."

    cd "$PROJECT_ROOT"
    get_version_info
    local harness_tag
    harness_tag="$(harness_image_tag)"

    if [ ! -f "$PROJECT_ROOT/docker/Dockerfile.agent-harness" ]; then
        log_error "缺少 docker/Dockerfile.agent-harness"
        return 1
    fi
    if [ ! -f "$PROJECT_ROOT/scripts/kjsc/docker-env.agent-harness.sh" ]; then
        log_error "缺少 scripts/kjsc/docker-env.agent-harness.sh"
        return 1
    fi

    docker build \
        --platform $PLATFORM \
        -f docker/Dockerfile.agent-harness \
        -t ${IMAGE_PREFIX}-harness:${harness_tag} \
        -t ${IMAGE_PREFIX}-harness:latest \
        "$PROJECT_ROOT"

    if [ $? -eq 0 ]; then
        log_success "Agent-Harness 镜像构建成功: ${IMAGE_PREFIX}-harness:${harness_tag}"
        return 0
    fi
    log_error "Agent-Harness 镜像构建失败"
    return 1
}

# 构建 sandbox-provisioner（独立于 harness）
build_sandbox_provisioner_image() {
    log_info "构建 sandbox-provisioner 镜像..."

    cd "$PROJECT_ROOT"
    get_version_info
    local harness_tag
    harness_tag="$(harness_image_tag)"

    docker build \
        --platform $PLATFORM \
        -f docker/sandbox_provisioner/Dockerfile \
        -t sandbox-provisioner:${harness_tag} \
        -t sandbox-provisioner:latest \
        "$PROJECT_ROOT/docker/sandbox_provisioner"

    if [ $? -eq 0 ]; then
        log_success "sandbox-provisioner 镜像构建成功: sandbox-provisioner:${harness_tag}"
        return 0
    fi
    log_error "sandbox-provisioner 镜像构建失败"
    return 1
}

# 构建所有镜像
build_all_images() {
    log_info "开始构建所有 agent-middle 镜像..."

    local app_result=0
    local docreader_result=0
    local frontend_result=0
    local sandbox_result=0

    build_app_image
    app_result=$?

    build_docreader_image
    docreader_result=$?

    build_frontend_image
    frontend_result=$?

    build_sandbox_image
    sandbox_result=$?

    echo ""
    log_info "=== 构建结果 ==="
    if [ $app_result -eq 0 ]; then
        log_success "✓ 应用镜像构建成功"
    else
        log_error "✗ 应用镜像构建失败"
    fi

    if [ $docreader_result -eq 0 ]; then
        log_success "✓ 文档读取器镜像构建成功"
    else
        log_error "✗ 文档读取器镜像构建失败"
    fi

    if [ $frontend_result -eq 0 ]; then
        log_success "✓ 前端镜像构建成功"
    else
        log_error "✗ 前端镜像构建失败"
    fi

    if [ $sandbox_result -eq 0 ]; then
        log_success "✓ 沙箱镜像构建成功"
    else
        log_error "✗ 沙箱镜像构建失败"
    fi

    if [ $app_result -eq 0 ] && [ $docreader_result -eq 0 ] && [ $frontend_result -eq 0 ] && [ $sandbox_result -eq 0 ]; then
        log_success "所有镜像构建完成！"
        return 0
    else
        log_error "部分镜像构建失败"
        return 1
    fi
}

# 清理本地镜像
clean_images() {
    log_info "清理本地 ${IMAGE_PREFIX}-* 镜像..."

    log_info "停止相关容器..."
    docker stop $(docker ps -q --filter "ancestor=${IMAGE_PREFIX}-app:latest" 2>/dev/null) 2>/dev/null || true
    docker stop $(docker ps -q --filter "ancestor=${IMAGE_PREFIX}-docreader:latest" 2>/dev/null) 2>/dev/null || true
    docker stop $(docker ps -q --filter "ancestor=${IMAGE_PREFIX}-ui:latest" 2>/dev/null) 2>/dev/null || true
    docker stop $(docker ps -q --filter "ancestor=${IMAGE_PREFIX}-sandbox:latest" 2>/dev/null) 2>/dev/null || true
    docker stop $(docker ps -q --filter "ancestor=${IMAGE_PREFIX}-docs:latest" 2>/dev/null) 2>/dev/null || true

    log_info "删除相关容器..."
    docker rm $(docker ps -aq --filter "ancestor=${IMAGE_PREFIX}-app:latest" 2>/dev/null) 2>/dev/null || true
    docker rm $(docker ps -aq --filter "ancestor=${IMAGE_PREFIX}-docreader:latest" 2>/dev/null) 2>/dev/null || true
    docker rm $(docker ps -aq --filter "ancestor=${IMAGE_PREFIX}-ui:latest" 2>/dev/null) 2>/dev/null || true
    docker rm $(docker ps -aq --filter "ancestor=${IMAGE_PREFIX}-sandbox:latest" 2>/dev/null) 2>/dev/null || true
    docker rm $(docker ps -aq --filter "ancestor=${IMAGE_PREFIX}-docs:latest" 2>/dev/null) 2>/dev/null || true

    log_info "删除本地镜像..."
    docker rmi ${IMAGE_PREFIX}-app:latest 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-docreader:latest 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-ui:latest 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-sandbox:latest 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-docs:latest 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-odl-hybrid:local 2>/dev/null || true
    docker rmi ${IMAGE_PREFIX}-mcp:latest 2>/dev/null || true

    docker image prune -f

    log_success "镜像清理完成"
    return 0
}

# 解析命令行参数
BUILD_ALL=false
BUILD_APP=false
BUILD_DOCREADER=false
BUILD_FRONTEND=false
BUILD_SANDBOX=false
BUILD_DOCS=false
BUILD_HARNESS=false
BUILD_SANDBOX_PROVISIONER=false
CLEAN_IMAGES=false

if [ $# -eq 0 ]; then
    BUILD_ALL=true
fi

while [ "$1" != "" ]; do
    case $1 in
        -h | --help )       show_help
                            ;;
        -a | --all )        BUILD_ALL=true
                            ;;
        -p | --app )        BUILD_APP=true
                            ;;
        -d | --docreader )  BUILD_DOCREADER=true
                            ;;
        -f | --frontend )   BUILD_FRONTEND=true
                            ;;
        -s | --sandbox )    BUILD_SANDBOX=true
                            ;;
        --docs )            BUILD_DOCS=true
                            ;;
        --harness )         BUILD_HARNESS=true
                            ;;
        --sandbox-provisioner ) BUILD_SANDBOX_PROVISIONER=true
                            ;;
        -c | --clean )      CLEAN_IMAGES=true
                            ;;
        -v | --version )    show_version
                            ;;
        * )                 log_error "未知选项: $1"
                            show_help
                            ;;
    esac
    shift
done

check_docker
if [ $? -ne 0 ]; then
    exit 1
fi

check_platform

if [ "$CLEAN_IMAGES" = true ]; then
    clean_images
    exit $?
fi

if [ "$BUILD_ALL" = true ]; then
    build_all_images
    exit $?
fi

if [ "$BUILD_APP" = true ]; then
    build_app_image
    exit $?
fi

if [ "$BUILD_DOCREADER" = true ]; then
    build_docreader_image
    exit $?
fi

if [ "$BUILD_FRONTEND" = true ]; then
    build_frontend_image
    exit $?
fi

if [ "$BUILD_SANDBOX" = true ]; then
    build_sandbox_image
    exit $?
fi

if [ "$BUILD_DOCS" = true ]; then
    build_docs_image
    exit $?
fi

if [ "$BUILD_HARNESS" = true ]; then
    build_harness_image
    exit $?
fi

if [ "$BUILD_SANDBOX_PROVISIONER" = true ]; then
    build_sandbox_provisioner_image
    exit $?
fi

exit 0
