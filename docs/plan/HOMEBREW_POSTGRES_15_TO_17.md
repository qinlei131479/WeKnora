# Homebrew PostgreSQL 15 → 17 升级流程（本机）

> 适用：Apple Silicon + Homebrew，已有 `postgresql@15` 且数据目录里有业务数据，需要升到 17 后给 WeKnora 本机开发使用。  
> 路径前缀均为 `/opt/homebrew`（Intel 改为 `/usr/local`）。  
> 本文记录一次真实升级中的命令、踩坑与后续步骤。

---

## 背景与结论

- Homebrew 的 `postgresql@17` **仍是原版 PostgreSQL 17**，不会变成 Docker 镜像 `paradedb/paradedb:*-pg17`。
- WeKnora 迁移依赖扩展：`uuid-ossp`、`vector`（pgvector）、`pg_trgm`、`pg_search`（ParadeDB BM25）。
- 大版本升级用 `pg_upgrade` 迁数据，不是 `brew upgrade` 原地改成 ParadeDB。
- `pg_search` 需在升级完成后，用 ParadeDB 官方 macOS `.pkg`（`pg_search@17`）装到这套 PG17 上。

**硬约束：**

1. 先备份，再停库、再 `pg_upgrade`。
2. `pg_upgrade` 期间 **15 和 17 都必须完全停止**。
3. 新簇（17）在升级前只能有 **当前执行升级的那个超级用户**（一般是 macOS 用户名），不能提前 `CREATE ROLE postgres`。
4. 升级成功后只启动 17，不要再 `start postgresql@15`（会抢 5432）。
5. 几天内不要跑 `delete_old_cluster.sh`。

---

## 0. 确认现状

```bash
brew services list | grep postgres
psql --version
psql -d postgres -c "SHOW data_directory; SHOW server_version; SELECT datname FROM pg_database WHERE datistemplate = false;"
pg_config --version --pkglibdir --sharedir
sw_vers
uname -m
```

记下：

| 项 | 常见值 |
|----|--------|
| 15 数据目录 | `/opt/homebrew/var/postgresql@15` |
| 17 数据目录 | `/opt/homebrew/var/postgresql@17` |
| 本机用户 | `whoami`（Homebrew 默认超级用户） |
| macOS | Darwin 25 → 后面下 `pg_search` 的 `.pkg` 优先选 `arm64_tahoe` |

---

## 1. 备份（必须做完再往下）

```bash
BACKUP=~/weknora-pg15-backup/$(date +%Y%m%d)
mkdir -p "$BACKUP"
```

### 1.1 逻辑备份（15 仍在跑时做）

```bash
brew services start postgresql@15
pg_dumpall -f "$BACKUP/pg15_dumpall.sql"
gzip -k "$BACKUP/pg15_dumpall.sql"

psql -d postgres -tAc "SELECT datname FROM pg_database WHERE datistemplate = false AND datname <> 'postgres';" \
| while read db; do
    [ -z "$db" ] && continue
    pg_dump -Fc -f "$BACKUP/${db}.dump" "$db"
  done
```

### 1.2 物理备份（必须停 15）

```bash
brew services stop postgresql@15
cp -a /opt/homebrew/var/postgresql@15 "$BACKUP/postgresql@15.data"
```

### 1.3 校验

```bash
gzip -t "$BACKUP/pg15_dumpall.sql.gz"
head -20 "$BACKUP/pg15_dumpall.sql"
du -sh "$BACKUP/postgresql@15.data"
```

没有可读 dump + 数据目录拷贝，不要继续升级。

---

## 2. 安装 PostgreSQL 17

```bash
brew install postgresql@17
```

Homebrew 装完常会 **自动启动 17**。装完立刻停两边：

```bash
brew services stop postgresql@17
brew services stop postgresql@15
```

确认无进程、无 pid 文件：

```bash
brew services list | grep postgres
ps aux | grep -E '[p]ostgres|[p]ostmaster'
ls /opt/homebrew/var/postgresql@17/postmaster.pid 2>/dev/null && echo "17 仍有 pid 文件"
ls /opt/homebrew/var/postgresql@15/postmaster.pid 2>/dev/null && echo "15 仍有 pid 文件"
```

若 `brew services stop` 后仍有进程：

```bash
/opt/homebrew/opt/postgresql@17/bin/pg_ctl -D /opt/homebrew/var/postgresql@17 stop -m fast
/opt/homebrew/opt/postgresql@15/bin/pg_ctl -D /opt/homebrew/var/postgresql@15 stop -m fast
```

进程已死、只剩 stale `postmaster.pid` 时再删 pid 文件（进程还活着时不要删）。

`pg_upgrade` 要求 17 簇 **只做过 initdb、没有业务数据、没有额外角色**。若曾连上 17 建过库或用户，见第 4 节。

---

## 3. `pg_upgrade --check`

两边都停干净后：

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

/opt/homebrew/opt/postgresql@17/bin/pg_upgrade \
  --old-bindir=/opt/homebrew/opt/postgresql@15/bin \
  --new-bindir=/opt/homebrew/opt/postgresql@17/bin \
  --old-datadir=/opt/homebrew/var/postgresql@15 \
  --new-datadir=/opt/homebrew/var/postgresql@17 \
  --jobs=$(sysctl -n hw.ncpu) \
  --check
```

成功标志：

```text
*Clusters are compatible*
```

`--check` **不改数据**。通过后再去掉 `--check` 正式升级。

---

## 4. 本次实际踩坑

### 4.1 新簇 postmaster 仍在跑

报错：

```text
There seems to be a postmaster servicing the new cluster.
Please shutdown that postmaster and try again.
```

原因：brew 安装/启动了 17。

处理：`brew services stop postgresql@17` 与 `postgresql@15`，确认无 `postmaster.pid` 后再 `--check`。

### 4.2 新簇里多了 `postgres` 角色

报错：

```text
Checking database user is the install user
Only the install user can be defined in the new cluster.
```

原因：为方便登录在 **17** 上执行了：

```sql
CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';
```

`pg_upgrade` 规定：新簇只能有当前安装用户（`whoami`）。旧簇（15）里有多少角色都没关系，会一起迁过去。

**只改 17，不要在 15 里 `DROP ROLE postgres`。**

处理 A — 删多余角色：

```bash
brew services stop postgresql@15
brew services start postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

whoami
psql -U "$(whoami)" -d postgres -c '\du'
```

```sql
REASSIGN OWNED BY postgres TO CURRENT_USER;
DROP OWNED BY postgres;
DROP ROLE postgres;
\du
```

`\du` 只剩自己那个超级用户后：

```bash
brew services stop postgresql@17
brew services stop postgresql@15
```

再跑 `--check`。

处理 B — 清空 17 空簇后重建（17 里没有要保留的数据时更干净）：

```bash
brew services stop postgresql@17
rm -rf /opt/homebrew/var/postgresql@17
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
/opt/homebrew/opt/postgresql@17/bin/initdb \
  -D /opt/homebrew/var/postgresql@17 \
  --encoding=UTF8
```

locale 尽量与 15 一致（`SHOW lc_collate;`）。重建后 **不要** `CREATE ROLE postgres`，**不要** `start postgresql@17`，直接 `--check`。

`postgres` 角色等到升级完成后再建（若 15 里本来就有，升级后会带过来）。

---

## 5. 正式升级

预检出现 `*Clusters are compatible*` 后，两边保持停止，去掉 `--check`：

```bash
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"

/opt/homebrew/opt/postgresql@17/bin/pg_upgrade \
  --old-bindir=/opt/homebrew/opt/postgresql@15/bin \
  --new-bindir=/opt/homebrew/opt/postgresql@17/bin \
  --old-datadir=/opt/homebrew/var/postgresql@15 \
  --new-datadir=/opt/homebrew/var/postgresql@17 \
  --jobs=$(sysctl -n hw.ncpu)
```

成功后当前目录常会生成 `analyze_new_cluster.sh`、`delete_old_cluster.sh`。

---

## 6. 升级后只使用 17

```bash
brew services start postgresql@17
# 不要 start postgresql@15

export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
# 写入 ~/.zshrc（若已有 @15 的 PATH，改成 @17 或放在更前面）

which psql          # /opt/homebrew/opt/postgresql@17/bin/psql
psql --version      # 17.x
psql -d postgres -c "SELECT version();"
psql -d postgres -c '\l'
psql -d postgres -c '\du'
```

可选：

```bash
brew unlink postgresql@15
brew link postgresql@17 --force
```

在 **执行 `pg_upgrade` 时的目录** 更新统计信息：

```bash
./analyze_new_cluster.sh
```

`delete_old_cluster.sh` **先不要跑**。确认应用与检索正常几天后再删 15 数据目录。

---

## 7. WeKnora 登录角色

项目默认 `DB_USER=postgres`。看 `\du`：

- 15 里已有 `postgres`：升级后一般已在，按需设置密码。
- 没有：现在可以建：

```sql
CREATE ROLE postgres WITH SUPERUSER LOGIN PASSWORD 'postgres';
```

`psql -h 127.0.0.1 -U postgres` 失败时检查：

```text
/opt/homebrew/var/postgresql@17/pg_hba.conf
```

本地 TCP 需要类似：

```text
host    all    all    127.0.0.1/32    scram-sha-256
host    all    all    ::1/128         scram-sha-256
```

```bash
brew services restart postgresql@17
psql -h 127.0.0.1 -U postgres -d postgres -c 'SELECT 1;'
```

---

## 8. 安装 WeKnora 扩展

迁移会执行 `vector`、`pg_trgm`、`pg_search`（以及 `uuid-ossp`）。`CREATE EXTENSION` **按库生效**。

### 8.1 pgvector / pg_trgm

```bash
brew install pgvector

psql -d postgres -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -d postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d postgres -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
```

### 8.2 ParadeDB `pg_search`（PG17 官方 pkg）

Release：https://github.com/paradedb/paradedb/releases

下载 **`pg_search@17`** + `arm64` + 系统（`sequoia` / `tahoe`）：

```bash
sudo installer -pkg ~/Downloads/pg_search@17--....pkg -target /
```

确认装进 **当前** `pg_config`（必须是 17）：

```bash
pg_config --pkglibdir
ls "$(pg_config --pkglibdir)" | grep -i search
```

看不到相关 `.dylib` / `.so` **不要**改 `shared_preload_libraries`，否则 17 起不来。

能看到后编辑 `/opt/homebrew/var/postgresql@17/postgresql.conf`：

```ini
shared_preload_libraries = 'pg_search'
```

已有其它库则逗号拼接。然后：

```bash
brew services restart postgresql@17
psql -d postgres -c "SHOW shared_preload_libraries;"
psql -d postgres -c "CREATE EXTENSION IF NOT EXISTS pg_search CASCADE;"
psql -d postgres -c "SELECT extname, extversion FROM pg_extension;"
```

官方 `.pkg` 不一定按 Homebrew Cellar 路径编译。进不了 `pkglibdir` 时不要强行改 preload，改回 Docker ParadeDB 更安全。

---

## 9. 给 WeKnora 单独建库并改环境变量

不要把旧业务数据和 WeKnora schema 混在同一个库。

```bash
createdb -U postgres weknora

psql -U postgres -d weknora -c "CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
psql -U postgres -d weknora -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -U postgres -d weknora -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -d weknora -c "CREATE EXTENSION IF NOT EXISTS pg_search CASCADE;"
```

本机 app（`.env` / `.env.local`）：

```text
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=weknora
```

Docker 容器要连本机 17：`DB_HOST=host.docker.internal`，端口仍 `5432`。

**不要再 up Docker postgres**（会和本机 17 抢端口或连错库）。本机已有 Redis 时同样不要再起 compose 里的 redis。

```bash
make migrate-kjsc
make dev-kjsc-app
make dev-kjsc-frontend
```

`vector` / `pg_search` 未装好时，迁移多在 `000002` 一类语句失败。

---

## 10. 回滚

| 情况 | 做法 |
|------|------|
| 只动了 17 扩展 / 配置 | `brew services restart postgresql@17`；必要时对照 `postgresql.conf` |
| `pg_upgrade` 失败且 15 数据目录未删 | `brew services start postgresql@15`，PATH 切回 `@15` |
| 需要从 dump 恢复 | 对空实例 `psql -f "$BACKUP/pg15_dumpall.sql" postgres` |
| 需要从物理拷贝恢复 | 停库后把 `$BACKUP/postgresql@15.data` 拷回 `/opt/homebrew/var/postgresql@15` |

---

## 命令速查

```bash
# 预检 / 正式升级（正式升级去掉最后一行 --check）
export PATH="/opt/homebrew/opt/postgresql@17/bin:$PATH"
/opt/homebrew/opt/postgresql@17/bin/pg_upgrade \
  --old-bindir=/opt/homebrew/opt/postgresql@15/bin \
  --new-bindir=/opt/homebrew/opt/postgresql@17/bin \
  --old-datadir=/opt/homebrew/var/postgresql@15 \
  --new-datadir=/opt/homebrew/var/postgresql@17 \
  --jobs=$(sysctl -n hw.ncpu) \
  --check
```

本次已完成：备份 → 安装 17 → 处理 postmaster / 多余 `postgres` 角色 → `--check` 通过 → 正式 `pg_upgrade` → 数据在 17。  
尚未完成（按第 8–9 节继续）：`pgvector` + `pg_search@17` pkg、WeKnora 专用库、`.env`、`make migrate-kjsc`。
