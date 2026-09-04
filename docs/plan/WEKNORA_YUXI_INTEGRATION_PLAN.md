# WeKnora × yuxi 能力聚合改造计划

> 执行手册。**门禁未绿不进下一阶段。** 全部完成后删除本文件。
>
> 范围：**P0–P7**（已去掉原会话隔离、对外入口两档空阶段，重新连续编号）。
>
> IM / 嵌入 / OpenAPI 不接到 yuxi；两套会话不聚合。这些不再单列阶段。
>
> 环境：本机 `make dev-kjsc-init/infra/app/frontend/harness`；库 **`agent-middle`**；表前缀 `h_`。测试环境升级见 `docs/plan/P7_TEST_ENV_UPGRADE.md`。

| 进程 | 启动 |
| --- | --- |
| WeKnora 后端 | `make dev-kjsc-app`（`:9980`） |
| 前端 | `make dev-kjsc-frontend`（`:9988`） |
| harness API/Worker | `make dev-kjsc-harness` |
| 基础设施 | `make dev-kjsc-infra`（postgres / redis / minio） |

编号对照（只此一处）：旧 P6 数据总览 → **P5**；旧 P7 模型/解析 → **P6**；旧 P9 裁剪 → **P7**。

---

## 0. 目标与原则

**WeKnora**：身份、租户、知识库、模型、解析、对外 API、IM/嵌入。
**yuxi / harness**：智能体运行时（Skill、MCP、工具、沙箱、Run、工作会话）。

1. 改动最小化；WeKnora 只加内部模型代理、附件解析代理、知识库思维导图。
2. **不新加环境变量。** P6 复用已有 `HARNESS_WEKNORA_KB`。P7 减配去掉只为已删能力服务的项。
3. P6 只接线 **P7 之后还要用的能力**；原生库、供应商后台、评测、yuxi 图谱、CLI Key **P6 不修**，留给 P7 删除。
4. P7 备份后 **删代码和表**，不是只隐藏。P7 之后关 `HARNESS_WEKNORA_KB` 不再能回到原生 KB/模型。
5. 禁止无备份的 DROP；P7 **只备份 `agent-middle` 库**。

### 已确认决策

| 议题 | 决策 |
| --- | --- |
| 用户 | 统一 WeKnora `users`；**P7 删除 `h_users`**。Harness `POST /api/auth/login` 与 `/api/auth/token` **保留**，校验 email+bcrypt，签发与 Go 相同的 WeKnora JWT |
| Token | 主路径 WeKnora JWT（`JWT_SECRET`）；P7 后不再签发 yuxi JWT |
| 知识库 | 只保留 WeKnora；yuxi 适配器实时透传 |
| 思维导图 | **迁到 WeKnora 知识库**；智能体 `get_mindmap` 走 WeKnora |
| 评测 / yuxi 知识图谱 | **删除**（图谱 ≠ 思维导图） |
| 模型 | 只留 WeKnora；OpenAI 兼容内部代理；yuxi 不读密钥 |
| OCR | WeKnora 解析引擎 |
| 选择器 | 全部改列 WeKnora 模型 |
| 默认模型 | 不维护 yuxi `default_model` 等兜底 |
| CLI / API Key | **删除**；对外 API 用 WeKnora 已有能力 |
| 部门 | P7 删除 `h_departments` |
| 对话 | 两套表独立，不聚合 |
| 对外入口 | 保持 WeKnora 原路径 |

### 配置（P6 不扩表）

继续对齐：`JWT_SECRET`、同库、`HARNESS_WEKNORA_IDENTITY`、`HARNESS_TENANT_SCOPE`、`HARNESS_WEKNORA_KB` + `WEKNORA_BASE_URL`、P0 run-token、`HARNESS_WEKNORA_DASHBOARD`。
`HARNESS_WEKNORA_KB_MAP` 只映射旧 `kb_*`，不放模型 ID。
P7 去掉：`HARNESS_LOCAL_LOGIN_*`、`HARNESS_LEGACY_JWT_*`、`JWT_SECRET_KEY`（仅当代码已不再引用）。Python 登录接口本身保留。

---

## 1. 阶段总览

| 阶段 | 内容 | 状态 |
| --- | --- | --- |
| **P0** | 阻断项验证 | 完成 |
| **P1** | 身份统一（投影，登录仍双轨） | 完成 |
| **P2** | 租户贯通 + 部门入口隐藏 | 完成 |
| **P3** | 知识库适配 WeKnora（mindmap 当时降级） | 完成 |
| **P4** | 前端知识库收口 | 完成 |
| **P5** | 数据总览分栏统计 | 完成 |
| **P6** | 模型代理 + 解析 + 知识库思维导图 | 完成 |
| **P7** | 删除重复能力 | 本机已执行；测试环境按 `P7_TEST_ENV_UPGRADE.md` |

---

## P0 · 阻断项 — 完成

JWT 进 Redis、`run_id` 传递；全文用 `/chunks`；模型协议：不返回密钥、禁用 knowledge-chat/agent-chat/debug 当运行时代理；渠道协议冻结且不落地。

---

## P1 · 身份统一 — 完成

WeKnora JWT + 当时投影到 `h_users`。P7 起直接读 `users`；Python 登录接口保留。

---

## P2 · 租户 — 完成

`HARNESS_TENANT_SCOPE`。部门仅隐藏，**表在 P7 DROP**。

---

## P3 · 知识库适配 — 完成

`kb_type=weknora`；list/query/open/find/download 接通。当时 `get_mindmap` 对 UUID **降级**，由 **P6 补齐**。

回滚（仅 P7 删除原生实现之前）：关 `HARNESS_WEKNORA_KB`。

---

## P4 · 前端知识库收口 — 完成

yuxi 库管理隐藏；工作区目录仍原地浏览。

---

## P5 · 数据总览 — 完成

对话 / 工作分栏；用户只计 WeKnora。开关 `HARNESS_WEKNORA_DASHBOARD`。

---

## P6 · 模型、解析、思维导图 — 完成

> 不新加开关。`HARNESS_WEKNORA_KB=true` 时走 WeKnora。
> **只做 P7 之后还活着的路径。**

### P6.1 模型代理

WeKnora 新增（Viewer+，用户 JWT）：

- `POST /api/v1/internal/models/:id/chat/completions`（SSE + tool_call）
- `POST /api/v1/internal/models/:id/embeddings`
- `POST /api/v1/internal/models/:id/rerank`

不写 session。yuxi：`ChatOpenAI(base_url=代理)`，JWT 当调用凭证，禁止把 WeKnora 密钥写入 `yuxi:model_cache`。供应商 POST/PUT/DELETE → 403。选择器 value = WeKnora `models.id`。旧 `provider:model` 按模型名唯一匹配；对不上或空模型则报错列清单，不落到默认模型。不改 WeKnora「模型设置」页。

### P6.2 附件解析

对话附件走 WeKnora 解析引擎。`POST /api/v1/internal/parse`（JWT + 文件 → markdown），不创建 WeKnora session。隐藏 yuxi OCR 下拉。

### P6.3 知识库思维导图

把 yuxi `get_mindmap` 做到 WeKnora 知识库。知识库页用 Markmap 可视化；对话里 `get_mindmap` 仍返回层级文本（与原 yuxi 对话工具卡片一致，未另做图）。不是实体三元组图谱。

### P6 不做

原生 milvus/dify/notion、供应商管理 UI、评测、yuxi 图谱、独立登录、CLI Key、删表、新 `.env` 键。

### P6 门禁

1. 工作智能体 WeKnora 模型出话（流式 + 工具）
2. 选择器切换立即生效
3. 旧 spec 能唯一对上则可用；否则明确失败
4. yuxi 供应商入口不可用
5. 附件解析走 WeKnora
6. WeKnora 知识库思维导图可生成；`get_mindmap` 对 WeKnora UUID 成功
7. 缓存/日志无密钥
8. 关 `HARNESS_WEKNORA_KB` 仍能回到旧路径（仅本阶段，P7 后不再保证）

---

## P7 · 删除重复能力 — 本机已执行

**只备份 `agent-middle`。** 迁移 `000006` 已 DROP 未列入核心清单的表（含 `h_users`、`h_api_keys`、`h_cli_auth_sessions`）。测试环境步骤见 `docs/plan/P7_TEST_ENV_UPGRADE.md`。残留未引用代码清完后再删本手册。

### 保留（harness 核心）

**表：** `h_agents`、`h_skills`、`h_mcp_servers`、`h_conversations`、`h_messages`、`h_tool_calls`、`h_subagent_threads`、`h_conversation_stats`、`h_agent_runs`、`h_agent_run_requests`、`h_agent_envs`、`h_user_config`、`h_tasks`、`h_message_feedbacks`（`h_operation_logs` 建议保留作审计）。

**无前缀：** LangGraph checkpoint 四表。

**代码：** Runtime、Skill/MCP/工具/沙箱、WeKnora KB 适配器（含 mindmap）、工作会话、数据总览。

核心表继续用字符串 `uid`，不再 FK 到 `h_users`。

### 删除

| 块 | 表 / 能力 |
| --- | --- |
| 身份 | `h_users`、`h_user_identity_map`、`h_tenant_backfill_map`；OIDC/Token Gate；`JWT_SECRET_KEY`。**保留** Python `/api/auth/login`、`/api/auth/token` |
| CLI/API Key | **删除** `h_api_keys`、`h_cli_auth_sessions` 及 CLI device flow |
| 部门 | `h_departments` 及 `department_id` |
| 原生知识库 | `h_knowledge_bases/files/chunks`；milvus/dify/notion；管理 UI |
| yuxi 图谱 | `h_knowledge_graph_*` 四表 + 图谱 UI（导图已在 WeKnora） |
| 评测 | `h_evaluation_*` 及 Benchmark/RAG 评测 UI |
| 模型供应商 | `h_model_providers`、旧 cache、供应商面板 |
| yuxi OCR | parser 实现、OCR 配置项 |

### P7 门禁

1. 工作智能体：对话、工具、WeKnora 检索、模型、附件解析、思维导图
2. 清单内表和入口已不存在
3. 未列入的核心表数据还在
4. WeKnora 登录可用；harness `/api/auth/login` 与 `/token` 用同一套 `users`+JWT；initialize / CLI / Token Gate 404
5. harness CLI/API Key 不可用
6. 相关环境变量已从 example 去掉
7. 删除本文件

---

## 附录

- LangGraph 表无前缀；`spatial_ref_sys` 不动。
- P6 不新增 `.env` 键。
- 本机验收走 `make dev-kjsc-*`；库 `agent-middle`。
