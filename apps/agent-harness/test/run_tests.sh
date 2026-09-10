#!/bin/bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
COMPOSE_FILE="${COMPOSE_FILE:-$PROJECT_ROOT/docker-compose-mac.yml}"
API_PORT="${HARNESS_PORT:-9990}"
COMPOSE_CMD=("docker" "compose" "-f" "$COMPOSE_FILE" "--profile" "harness" "--profile" "minio")

echo "Agent-Harness 测试运行器"
echo "========================"

PYTEST_CMD=("${COMPOSE_CMD[@]}" "exec" "-T" "api" "uv" "run" "--group" "test" "pytest")

check_server() {
    echo "检查测试服务器状态..."
    if curl -fsS "http://localhost:${API_PORT}/api/system/health" > /dev/null 2>&1; then
        echo "✓ 测试服务器运行正常"
        return 0
    fi

    echo "✗ 警告: 测试服务器未运行或无法访问"
    echo "  请先在仓库根目录执行 make dev-kjsc-harness 并确认 agent-middle-harness-api 健康"
    return 1
}

run_unit_tests() {
    echo "运行单元测试..."
    "${PYTEST_CMD[@]}" test/unit -m "not slow"
}

run_integration_tests() {
    echo "运行集成测试..."
    check_server
    "${PYTEST_CMD[@]}" test/integration
}

run_e2e_tests() {
    echo "运行端到端测试..."
    check_server
    "${PYTEST_CMD[@]}" test/e2e -m e2e
}

run_all_tests() {
    echo "运行全部测试..."
    check_server
    "${PYTEST_CMD[@]}" test
}

show_help() {
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  unit         - 运行单元测试"
    echo "  integration  - 运行集成测试"
    echo "  e2e          - 运行端到端测试"
    echo "  all          - 运行全部测试"
    echo "  check        - 检查测试服务"
    echo "  help         - 显示此帮助"
    echo ""
    echo "示例:"
    echo "  $0 unit"
    echo "  $0 integration"
    echo "  $0 e2e"
    echo "  $0 all"
}

case "${1:-all}" in
    "unit")
        run_unit_tests
        ;;
    "integration")
        run_integration_tests
        ;;
    "e2e")
        run_e2e_tests
        ;;
    "all")
        run_all_tests
        ;;
    "check")
        check_server
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "未知选项: $1"
        show_help
        exit 1
        ;;
esac
