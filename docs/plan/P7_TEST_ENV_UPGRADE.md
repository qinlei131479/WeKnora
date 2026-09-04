# P7 测试环境升级方案

> 仅备份、升级 **`agent-middle` 这一套 Postgres 库**。不要 dump MinIO / Redis / 其它库。  
> **禁止** `migrate down`（包括 KJSC `000002` 与官方 `082`）。  
> 代码与迁移已在本机落地；本文件给测试环境按同样步骤升级。

---

## 0. 这次改了什么

| 项 | 结果 |
| --- | --- |
| 登录 | 主登录仍是 WeKnora `POST /api/v1/auth/login`。Harness `POST /api/auth/login`、`POST /api/auth/token` **保留**，校验 WeKnora `users`（email + bcrypt），签发 **同一套** WeKnora JWT（`JWT_SECRET`，claims：`user_id` UUID、`tenant_id`、`type=access`），并写入 `auth_tokens`。 |
| 身份表 | **删除** `h_users`、`h_api_keys`、`h_cli_auth_sessions`、`h_departments`、`h_user_identity_map`、`h_tenant_backfill_map`。用户只读 `users`。 |
| 重复能力表 | 同时 DROP 原生 KB / 图谱 / 评测 / `h_model_providers`。 |
| 保留 | `h_agents`、`h_skills`、`h_mcp_servers`、会话/消息/Run、`h_agent_envs`、`h_user_config`、LangGraph checkpoint 四表、WeKnora `users`/`tenants`/`knowledge_bases`。 |
| 配置 | 去掉 `JWT_SECRET_KEY`、`HARNESS_LEGACY_JWT_*`、`HARNESS_LOCAL_LOGIN_*`。JWT 只用 `JWT_SECRET`。 |

迁移文件：`migrations/version_kjsc/000006_drop_unused_harness_tables.up.sql`  
目标版本：`schema_migrations_kjsc.version = 6`

---

## 1. 升级前备份（只要这一步）

在 **测试环境 Postgres** 上，只 dump 库名 **`agent-middle`**（与 `.env` 的 `DB_NAME` 一致）：

```bash
# 在能连上测试库的机器执行；端口以实际为准（compose 内一般是 5432）
pg_dump -h <测试库主机> -p 5432 -U postgres -d agent-middle -Fc \
  -f agent-middle-p7-$(date +%Y%m%d).dump
```

确认文件可读：

```bash
pg_restore -l agent-middle-p7-YYYYMMDD.dump | head
```

不要备份其它库、不要备份 MinIO。回滚只靠这份 dump + 旧镜像/旧代码。

---

## 2. 部署顺序

1. **先备份**，确认 dump 文件已拷走。
2. 发布本分支代码（Go app-core、前端、harness 镜像一起升）。
3. **只升 KJSC 迁移**（不要跑官方 `make migrate-up` / `migrate down`）：

```bash
# 仓库根目录，.env 里 DB_HOST/DB_NAME 必须指向测试环境的 agent-middle
make migrate-kjsc
# 等价：./scripts/migrate_kjsc.sh up
```

4. 重启 WeKnora app、前端、harness api / worker。
5. 做第 5 节冒烟。

### 迁移注意

- `000006` 是 `DROP TABLE IF EXISTS ... CASCADE`，可重复执行，不会误删核心 `h_agents` 等表。
- 若 `schema_migrations_kjsc` **已经是 6**，但库里还能看到 `h_users` / `h_api_keys` / `h_cli_auth_sessions`（本机曾出现过：版本先记了 6，ORM `create_all` 又把表建回来），**不要** `migrate down`，把 `000006` 的 SQL **再执行一遍**即可。
- 查版本：`SELECT version FROM schema_migrations_kjsc;`
- 查残留：`\dt h_*` 不应再出现 `h_users`、`h_api_keys`、`h_cli_auth_sessions`、`h_departments`、`h_knowledge_*`、`h_evaluation_*`、`h_model_providers`。

---

## 3. 环境变量

测试环境 `.env` 与 `.env.kjsc.example` 对齐即可，关键点：

| 键 | 要求 |
| --- | --- |
| `DB_NAME` | `agent-middle` |
| `JWT_SECRET` | **与升级前一致**，Go / harness 共用 |
| `HARNESS_WEKNORA_KB` | `true`（代码里已写死走 WeKnora，此项可留作兼容） |
| `WEKNORA_BASE_URL` | harness 能访问到 WeKnora 内部 API，例如 `http://app:8080/api/v1` 或测试机实际地址 |
| `HARNESS_TENANT_SCOPE` | `true` |
| `HARNESS_WEKNORA_DASHBOARD` | `true` |

**删掉（若还在）：** `JWT_SECRET_KEY`、`HARNESS_LEGACY_JWT_ENABLED`、`HARNESS_LOCAL_LOGIN_ENABLED`、`HARNESS_WEKNORA_IDENTITY`（身份已固定，不再靠开关）。

不要改官方 `scripts/dev.sh` / `cmd/server` 那套端口约定。Compose `15432` 与宿主机 `5432` 不要混用。

---

## 4. 数据会丢什么、不会丢什么

**会删（表级，不可恢复除非 restore dump）：**

- `h_users`、`h_api_keys`、`h_cli_auth_sessions`、`h_departments`
- `h_user_identity_map`、`h_tenant_backfill_map`
- `h_knowledge_bases` / `h_knowledge_files` / `h_knowledge_chunks`
- `h_knowledge_graph_*`、`h_evaluation_*`、`h_model_providers`

**必须还在：**

- WeKnora：`users`、`tenants`、`tenant_members`、`knowledge_bases`、`auth_tokens`、`models`
- Harness：`h_agents`、`h_skills`、`h_mcp_servers`、`h_conversations`、`h_messages`、`h_tool_calls`、`h_subagent_threads`、`h_conversation_stats`、`h_agent_runs`、`h_agent_run_requests`、`h_agent_envs`、`h_user_config`、`h_tasks`、`h_message_feedbacks`、`h_operation_logs`、`h_config_options`
- 无前缀：`checkpoints`、`checkpoint_blobs`、`checkpoint_writes`、`checkpoint_migrations`

`h_operation_logs.user_id` 会改成 `VARCHAR(36)`，旧数字 id 变成字符串，仅作审计，不再外键到 `h_users`。

---

## 5. 冒烟清单

登录：

- [ ] WeKnora 前端 `/login`（`/api/v1/auth/login`）成功，进入平台。
- [ ] 同一账号用 email + 密码调 harness `POST /api/auth/login` 或 `POST /api/auth/token`，拿到的 JWT 能调 harness `/api/auth/me`，且 `user_id` 为 UUID。
- [ ] 旧会话（`h_conversations` / `h_messages`）仍能打开。
- [ ] 工作区能列出 WeKnora 知识库；对话检索、模型出话、附件解析、思维导图可用。
- [ ] Skill / MCP / 智能体 / 数据总览可用。

应 404 / 不可用：

- [ ] `GET /api/auth/check-first-run`、`POST /api/auth/initialize`、OIDC、CLI session
- [ ] `/api/user/apikey/`、部门接口、原生 KB 管理写接口、图谱/评测接口
- [ ] 页面不再出现 Harness Token Gate；无 token 回 WeKnora `/login`

---

## 6. 回滚

1. 停 harness / app（避免启动时再跑 DDL）。
2. 用第 1 步的 dump 恢复 **仅** `agent-middle`：

```bash
# 先确认连的是测试库
dropdb -h <主机> -U postgres --if-exists agent-middle
createdb -h <主机> -U postgres agent-middle
pg_restore -h <主机> -U postgres -d agent-middle --no-owner --no-acl \
  agent-middle-p7-YYYYMMDD.dump
```

3. 回退到升级前的镜像/代码。
4. **不要**在「恢复错的库」上再跑一遍 `000006`。

`dropdb` 前必须再确认主机和库名，禁止对生产库操作。

---

## 7. 本机已验证（对照）

本机 Homebrew PG17 `127.0.0.1:5432`，库 `agent-middle`：

- 备份：`~/weknora-p7-backup/20260903/agent-middle.dump`（`pg_dump -Fc`）
- `schema_migrations_kjsc.version = 6`
- `\dt h_*` 仅剩 16 张核心表；`h_agents` 6 行、`users` 2 行仍在
- `h_users` / `h_api_keys` / `h_cli_auth_sessions` 已不存在
