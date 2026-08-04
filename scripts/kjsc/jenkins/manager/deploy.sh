#!/bin/bash
set -e

REMOTE_USER="tomcat01"
REMOTE_IP="192.168.180.238"
REMOTE_WEB_DIR="/usr/local/spring-boot/Agent-Middle-Platform/apps/manager"
LOCAL_DIST_DIR="./apps/manager/dist"
TIMESTAMP=$(date "+%Y%m%d%H%M%S")

echo ">>> 开始备份远程旧版本前端..."
ssh ${REMOTE_USER}@${REMOTE_IP} "
    if [ -d ${REMOTE_WEB_DIR}/dist ]; then
        mv ${REMOTE_WEB_DIR}/dist ${REMOTE_WEB_DIR}/dist.bak${TIMESTAMP}
        echo '旧版本备份成功'
    else
        echo '首次部署，无旧版本需要备份'
    fi
"

echo "开始上传新版本前端文件..."
if [ ! -d "${LOCAL_DIST_DIR}" ]; then
    echo "错误: 本地目录 ${LOCAL_DIST_DIR} 不存在，请检查前端是否打包成功！"
    exit 1
fi
scp -r ${LOCAL_DIST_DIR} ${REMOTE_USER}@${REMOTE_IP}:${REMOTE_WEB_DIR}
echo "文件上传完成"

echo "重新加载 Nginx 配置..."
ssh ${REMOTE_USER}@${REMOTE_IP} "sudo service nginx reload"
echo "Nginx 重载完成"

echo "前端部署全部完成！"
date -R
