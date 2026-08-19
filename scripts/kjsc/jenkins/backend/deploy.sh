#!/bin/bash
# 微服务通用管理脚本
# 用法: deploy.sh {start|stop|restart|status|healthcheck} [service-name]

ACTION=$1
SERVICE=$2
PREFIX="Agent-Middle-Platform"
JAVA_PATH="/usr/java/jdk-17.0.2/bin/java"
JAVA_OPTS="-Xms256m -Xmx512m -Dfile.encoding=UTF-8 -Dsun.jnu.encoding=UTF-8"
BASE_DIR="/usr/local/spring-boot/Agent-Middle-Platform/apps/backend"
LOGS_DIR="${BASE_DIR}/${SERVICE}/logs"
PID_FILE="${LOGS_DIR}/${SERVICE}.pid"
JAR_FILE="${BASE_DIR}/${SERVICE}/${PREFIX}-${SERVICE}.jar"
#LOG_FILE="${LOGS_DIR}/${SERVICE}.log"
LOG_FILE="${BASE_DIR}/${SERVICE}/logs/${SERVICE}.log"
# 根据服务类型设置默认端口
case $SERVICE in
    "gateway") DEFAULT_PORT=9206 ;;
    "auth") DEFAULT_PORT=9200 ;;
    "file") DEFAULT_PORT=9201 ;;
    "system") DEFAULT_PORT=9205 ;;
    "business") DEFAULT_PORT=9208 ;;
    "websocket") DEFAULT_PORT=9202 ;;
    "work-order") DEFAULT_PORT=9211 ;;
    *) DEFAULT_PORT=9210 ;;
esac

# 健康检查URL
HEALTH_URL="http://localhost:${DEFAULT_PORT}/actuator/health"

start_service() {
    echo "启动服务: $PREFIX-$SERVICE"

    # 确保日志目录存在
    mkdir -p $LOGS_DIR

    # 仅 business 模块加载 OLLAMA_BASE_URL 和 SYSTEM_AES_KEY 环境变量
    if [ "$SERVICE" = "business" ]; then
        ENV_FILE="${BASE_DIR}/.env"
        if [ -f "$ENV_FILE" ]; then
            OLLAMA_BASE_URL=$(grep -E '^OLLAMA_BASE_URL=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d ' "\t\r')
            if [ -n "$OLLAMA_BASE_URL" ]; then
                export OLLAMA_BASE_URL=$OLLAMA_BASE_URL
                echo "加载环境变量: OLLAMA_BASE_URL=$OLLAMA_BASE_URL"
            fi 
            SYSTEM_AES_KEY=$(grep -E '^SYSTEM_AES_KEY=' "$ENV_FILE" | head -n1 | cut -d= -f2- | tr -d ' "\t\r')
            if [ -n "$SYSTEM_AES_KEY" ]; then
                export SYSTEM_AES_KEY=$SYSTEM_AES_KEY
                echo "加载环境变量: SYSTEM_AES_KEY=$SYSTEM_AES_KEY"
            fi
        fi
    fi

    # 启动服务 -Dfile.encoding=utf-8
    nohup $JAVA_PATH $JAVA_OPTS -jar $JAR_FILE > $LOG_FILE 2>&1 &
    echo $! > $PID_FILE
    echo "服务 $PREFIX-$SERVICE 已启动，PID: $(cat $PID_FILE)"
}

stop_service() {
    echo "停止服务: $PREFIX-$SERVICE"

    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null; then
            echo "停止服务: $PREFIX-$SERVICE (PID: $PID)"
            kill $PID
            sleep 5
            if ps -p $PID > /dev/null; then
                echo "强制停止服务: $PREFIX-$SERVICE"
                kill -9 $PID
            fi
        fi
        rm -f $PID_FILE
        echo "服务 $SERVICE 已停止"
    else
        echo "PID文件不存在，尝试查找进程并停止"
        PIDS=$(ps -ef | grep "$PREFIX-$SERVICE.jar" | grep -v grep | awk '{print $2}')
        if [ ! -z "$PIDS" ]; then
            echo "停止进程: $PIDS"
            kill $PIDS
        fi
    fi
}

restart_service() {
    stop_service
    sleep 2
    start_service
}

check_status() {
    if [ -f $PID_FILE ]; then
        PID=$(cat $PID_FILE)
        if ps -p $PID > /dev/null; then
            echo "服务 $PREFIX-$SERVICE 正在运行, PID: $PID"
            return 0
        else
            echo "服务 $PREFIX-$SERVICE PID文件存在但进程未运行"
            return 1
        fi
    else
        # 检查是否有相关进程在运行
        PIDS=$(ps -ef | grep "$PREFIX-$SERVICE.jar" | grep -v grep | awk '{print $2}')
        if [ ! -z "$PIDS" ]; then
            echo "服务 $PREFIX-$SERVICE 正在运行 (无PID文件), PIDs: $PIDS"
            return 0
        else
            echo "服务 $PREFIX-$SERVICE 未运行"
            return 1
        fi
    fi
}

health_check() {
    # 等待服务启动
    sleep 5

    # 尝试健康检查
    for i in {1..10}; do
        response=$(curl -s -o /dev/null -w '%{http_code}' $HEALTH_URL 2>/dev/null || echo "000")
        if [ "$response" = "200" ]; then
            echo "OK"
            return 0
        fi
        sleep 3
    done

    echo "FAILED: 健康检查超时"
    return 1
}

case $ACTION in
    "start")
        start_service
        ;;
    "stop")
        stop_service
        ;;
    "restart")
        restart_service
        ;;
    "status")
        check_status
        ;;
    "healthcheck")
        health_check
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|healthcheck} [service-name]"
        exit 1
        ;;
esac