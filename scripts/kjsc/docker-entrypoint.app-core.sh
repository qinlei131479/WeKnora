#!/bin/bash
# app-core 容器入口（官方请用 scripts/docker-entrypoint.sh）
set -e

# ─── Fix ownership of bind-mounted directories ───
# 用户 bind-mount 的目录继承宿主 UID/GID，可能与容器内 appuser 不同。
# 本入口先以 root 修正属主，再经 gosu 降权到 appuser —— 与官方
# postgres/redis 镜像同一模式。只读挂载（:ro）时跳过：chown 会失败
# 并在 set -e 下中断启动，宿主持有的 644/755 文件保持可读即可。

# Directories that may be bind-mounted and need appuser access
MOUNT_DIRS=(
    /data/files
)

for dir in "${MOUNT_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -w "$dir" ]; then
        chown -R appuser:appuser "$dir" 2>/dev/null || true
    fi
done

# ─── Docker socket access for the Docker sandbox backend ───
# The Engine API socket is normally root:docker 0660. This entrypoint runs
# before gosu, so add appuser to the socket's GID. Do not chmod the host
# socket: that would weaken daemon access outside this container.
grant_docker_sock_to_appuser() {
    local sock="$1"
    local gid grp
    [ -S "$sock" ] || return 0
    if gosu appuser sh -c "test -r \"$sock\" && test -w \"$sock\"" 2>/dev/null; then
        return 0
    fi
    gid="$(stat -c '%g' "$sock" 2>/dev/null || true)"
    if [ -z "$gid" ]; then
        echo "WARN: cannot stat $sock; Docker sandbox may be unable to reach the daemon" >&2
        return 0
    fi
    if [ "$gid" = "0" ]; then
        echo "WARN: $sock is owned by GID 0 and not writable by appuser; mount a group-writable socket" >&2
        return 0
    fi
    if ! getent group "$gid" >/dev/null 2>&1; then
        groupadd -g "$gid" dockersock >/dev/null 2>&1 || {
            echo "WARN: cannot create group for $sock GID $gid" >&2
            return 0
        }
    fi
    grp="$(getent group "$gid" | cut -d: -f1)"
    if [ -z "$grp" ]; then
        echo "WARN: cannot resolve group for $sock GID $gid" >&2
        return 0
    fi
    usermod -aG "$grp" appuser >/dev/null 2>&1 || {
        echo "WARN: cannot add appuser to $grp for $sock" >&2
        return 0
    }
}

grant_docker_sock_to_appuser /var/run/docker.sock
case "${DOCKER_HOST:-}" in
    unix://*)
        grant_docker_sock_to_appuser "${DOCKER_HOST#unix://}"
        ;;
esac

# ─── Drop privileges and exec the main process ───
exec gosu appuser "$@"
