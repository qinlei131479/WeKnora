#!/bin/bash
# app-core 容器入口（官方请用 scripts/docker-entrypoint.sh）
set -e

# ─── Fix ownership of bind-mounted directories ───
# When users bind-mount host directories (e.g. ./skills/preloaded),
# the mount inherits the host UID/GID which may differ from the
# container's appuser. This entrypoint runs as root, fixes ownership,
# then drops privileges to appuser via gosu — the same pattern used
# by official postgres/redis images.
#
# Skip when the mount is read-only (:ro) — chown/cp would fail and
# abort startup under set -e; host-owned 644/755 files remain readable.

# Directories that may be bind-mounted and need appuser access
MOUNT_DIRS=(
    /app/skills/preloaded
    /data/files
)

for dir in "${MOUNT_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -w "$dir" ]; then
        chown -R appuser:appuser "$dir" 2>/dev/null || true
    fi
done

# ─── Merge built-in skills into preloaded ───
# Built-in skills are backed up at /app/skills/_builtin during image build.
# After a bind-mount replaces /app/skills/preloaded, copy back any
# missing built-in skills (without overwriting user-provided ones).
BUILTIN_DIR="/app/skills/_builtin"
PRELOADED_DIR="/app/skills/preloaded"

if [ -d "$BUILTIN_DIR" ]; then
    mkdir -p "$PRELOADED_DIR" 2>/dev/null || true
    if [ -d "$PRELOADED_DIR" ] && [ -w "$PRELOADED_DIR" ]; then
        for skill_dir in "$BUILTIN_DIR"/*/; do
            [ -d "$skill_dir" ] || continue
            skill_name="$(basename "$skill_dir")"
            if [ ! -d "$PRELOADED_DIR/$skill_name" ]; then
                cp -r "$skill_dir" "$PRELOADED_DIR/$skill_name"
            fi
        done
        chown -R appuser:appuser "$PRELOADED_DIR" 2>/dev/null || true
    else
        echo "WARN: $PRELOADED_DIR is not writable (read-only mount?); skip skills merge/chown"
    fi
fi

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
