# P7 测试环境升级方案

> 仅备份、升级 **`agent-middle` 这一套 Postgres 库**。不要 dump MinIO / Redis / 其它库。  
> **禁止** `migrate down`（包括 KJSC `000002` 与官方 `082`）。  
> 代码与迁移已在本机落地；本文件给测试环境按同样步骤升级。

测试环境统一用户：

`98e324c7-8d86-4550-a4c2-cfca9e0d42b6`（WeKnora `users.id`）

历史 harness 数据里的旧 `uid` / `created_by`（如 `admin`）必须 remap 到该 UUID，否则 P7 后旧会话、智能体、Run 对不上当前登录用户。

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
2. **uid remap（必须在 000006 之前）**，见第 2.1 节。
3. 发布本分支代码（Go app-core、前端、harness 镜像一起升）。
4. **只升 KJSC 迁移**（不要跑官方 `make migrate-up` / `migrate down`）：

```bash
# 仓库根目录，.env 里 DB_HOST/DB_NAME 必须指向测试环境的 agent-middle
make migrate-kjsc
# 等价：./scripts/migrate_kjsc.sh up
```

5. 重启 WeKnora app、前端、harness api / worker。
6. 做第 5 节冒烟。

### 2.1 uid remap（测试环境）

目标：旧 `uid=admin` → `98e324c7-8d86-4550-a4c2-cfca9e0d42b6`。

**一次性 remap 脚本已删除**（`p1_uid_remap.sql`、`p1_uid_remap_reverse.sql`、`p1_identity_candidates.py`）。000006 已 DROP 相关表后，历史 remap **不可重复执行**。

若测试环境尚未 remap 且仍停在 000006 之前：按当时备份时的手工 UPDATE 思路处理（只改仍保留的核心表，例如 `h_conversations.uid`、`h_agent_runs.uid`、`h_agents.created_by`、`share_config` 等，目标 UUID 同上），或直接用第 1 节 dump 恢复到 remap 前快照后再升。

核对（remap 后、000006 前）：

```sql
SELECT id, username, email FROM users
 WHERE id = '98e324c7-8d86-4550-a4c2-cfca9e0d42b6' AND deleted_at IS NULL;

SELECT DISTINCT uid FROM h_conversations;
SELECT DISTINCT created_by FROM h_agents;
-- 期望看到 98e324c7-8d86-4550-a4c2-cfca9e0d42b6，不应再大量出现 admin
```

**若已经跑过 000006**：不要尝试重跑已删脚本。只对还在的表做 UPDATE，目标 UUID 相同。

回滚 **只用第 1 节 dump**；不要用 reverse SQL。

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

- [ ] WeKnora 前端 `/login`（`/api/v1/auth/login`）成功，进入平台。登录用户 id 为 `98e324c7-8d86-4550-a4c2-cfca9e0d42b6`。
- [ ] 同一账号用 email + 密码调 harness `POST /api/auth/login` 或 `POST /api/auth/token`，拿到的 JWT 能调 harness `/api/auth/me`，且 `user_id` 为上述 UUID。
- [ ] remap 前的旧会话（`h_conversations` / `h_messages`）仍能打开，不是空列表。
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
5. remap 脚本已删除；已跑 000006 或已发 P7 代码后，**不要**尝试 reverse SQL，回滚只用第 1 节 dump。

`dropdb` 前必须再确认主机和库名，禁止对生产库操作。

---

## 7. 本机已验证（对照）

本机 Homebrew PG17 `127.0.0.1:5432`，库 `agent-middle`：

- 备份：`~/weknora-p7-backup/20260903/agent-middle.dump`（`pg_dump -Fc`）
- `schema_migrations_kjsc.version = 6`
- `\dt h_*` 仅剩 16 张核心表；`h_agents` 6 行、`users` 2 行仍在
- `h_users` / `h_api_keys` / `h_cli_auth_sessions` 已不存在

---

## 8. 清理执行计划

代码清理已在仓库分支 `chore/p7-cleanup` 按 **`docs/plan/P7_CLEANUP.md`** 执行完毕（禁止 `migrate down`；未连接测试环境）。

已删（升级当时，不挡升级）：

- 脚本：`p0_verify.py`、`copy_harness_tables_to_weknora.sh`、`seed_initial_users.py`
- 已砍能力测试：部门 / API Key / CLI / OIDC / 原生 KB / 图谱 / 评测 / yuxi 供应商 / OCR 配置中心 e2e

升级完成后的代码清理（见 `docs/plan/P7_CLEANUP.md`）：

| 时机 | 项 | 说明 |
| --- | --- | --- |
| 已删除（P7_CLEANUP Task 1） | `scripts/p1_identity_candidates.py` | remap 前只读核对用 |
| 已删除（P7_CLEANUP Task 1） | `scripts/p1_uid_remap.sql` | 正向 remap；不可重复，回滚用 dump |
| 已删除（P7_CLEANUP Task 1） | `scripts/p1_uid_remap_reverse.sql` | 仅 000006 前的 remap 回滚 |
| 已删除（P7_CLEANUP Task 2） | 未注册路由：`auth_dept_router.py`、`knowledge_eval_router.py`、`graph_router.py`、`external_kb_router.py` | 路由已不挂载 |
| 已删除（P7_CLEANUP Task 3–7） | 死实现：`oidc_service.py`、`department_repository.py`、原生 milvus/dify/notion、`knowledge/graphs/`、`knowledge/eval/`、yuxi OCR parser | 登录 / WeKnora KB / mindmap 保留 |

长期保留：`scripts/docker-env.py`（compose / 测试启动仍用）。
