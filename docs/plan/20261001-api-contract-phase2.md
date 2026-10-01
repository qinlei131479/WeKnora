# API 契约（阶段二）B0 种子文档

> **状态：进行中** — B0 契约冻结的种子文档。阶段二（Go `/api/v1` → Python）尚未开始，本文先固定网关规则、调用面口径，以及三个必须在切流前处理的契约坑；逐接口字段级契约待 B0 展开。

**配套文档：** `20260914-appcore-to-python.md`（迁移执行计划）、`20261001-frontend-harness-audit.md`（前置审计，本文数据来源）。

**数据口径：** 2026-10-01 扫描 `apps/frontend/src/api/**`、`apps/app-core/router/*.go`、`apps/agent-harness/server/routers/*.py`。

---

## 1. 网关与挂载规则

| 环境 | 配置 | 浏览器侧 | 服务 |
| --- | --- | --- | --- |
| 生产 | `docker/config/nginx.frontend.conf:117` | `/api/` | Go app-core `:9980`（SSE 已配 `proxy_buffering off`） |
| 生产 | `docker/config/nginx.frontend.conf:142-146` | `/harness-api/` | Python agent-harness `:9990`，`rewrite ^/harness-api/(.*)$ /$1` 剥前缀 |
| 开发 | `apps/frontend/vite.config.ts:53-60,139-151` | 同上 | 同上（同构反代） |

Python 侧挂载链：`server/main.py:86` `include_router(router, prefix="/api")`，故外部 `/harness-api/api/<router-prefix>` 对应 FastAPI `/api/<router-prefix>`。

---

## 2. ⚠️ 三个必须在切流前处理的坑

### 坑 1：`harnessUrl()` 会改写 `/api/v1/*`（最高优先）

`apps/frontend/src/api/chat-work/base.ts:4-15`：

```
以 http(s):// 或 /harness-api 开头 → 原样返回
以 /api 开头（含 /api/v1/*）      → 一律拼成 /harness-api + url
其余                              → 原样返回
```

当前无调用方踩坑（chat-work/harness 文件都不调 `/api/v1`）。但 B1–B9 切流后，若这些封装被复用于已迁移路由，请求会被错误打到 harness 挂载点（`/harness-api/api/v1/xxx`，而 harness 实际挂在 `/api`，多了一层 `/api/v1` 前缀必然 404）。

**处置选项（B0 定）：** ① 收紧规则，只对 `/api/` 且非 `/api/v1/` 的前缀拼接；② 切流后统一让前端走同一条 `/api/v1` 链路，不用 harnessUrl 包 `/api/v1`。无论选哪种，修改后必须回归 `/harness-api/api/agent`、`/api/workspace` 等现有调用。

### 坑 2：`/api/system` 前缀已被 harness 占用

Python 已有 `/api/system`（`GET /health`），且 `/api/system/{mcp-servers,skills,tools,model-providers}` 均在其下。Go 的 `/api/v1/system/*`（capabilities/info/parser-engines/storage-engine/docreader/sandbox-check）与 `/api/v1/system/admin/*` 迁入后需在同一前缀族共存，禁止覆盖 `/health`；建议 Go 侧按 `/api/v1/system/...` 原样挂载、由 nginx 前缀切流，避免在 harness 内做路径重写。

### 坑 3：harness worker 只有 1 个任务

`package/yuxi/services/run_worker.py:764` 仅注册 `process_agent_run`（run_type ∈ {chat, resume, subagent}）。Go 侧 20 类后台任务（`document:process`、`chunk:extract`、`faq:import`、`summary:generation`、`kb:clone`、`datasource:sync`、`wiki:ingest` 等，见迁移计划 1.3）**全部未注册**。B3/B6/B7 落地时必须按 task type 隔离注册，禁止改动现有 run 队列语义。

---

## 3. 前端调用面（契约输入）

| 链路 | 封装 | 规模 |
| --- | --- | --- |
| Go `/api/v1` | `utils/request.ts` axios（同源 baseURL + JWT / X-Tenant-ID / X-Request-ID + 401 refresh 重放） | **27 个文件 / 约 342 个 URL 模式** |
| Python `/harness-api` | `api/chat-work/base.ts` fetch + `harnessUrl()` | **9 个文件 / 约 53 个 URL 模式** |

调 Go 的重头（按 URL 模式数）：`knowledge-base` 57、`system` 41、`organization` 27、`tenant` 23、`embed` 21、`mcp-service` 20、`initialization` 18、`wiki` 17、`auth` 16、`chat` 15、`datasource` 14、`memory` 14、`agent` 13。

调 Python 的 9 个文件：`chat-work/{agent,workspace,dashboard,mcp,skill,tool}.ts`、`harness/{system_api,user_api,viewer_filesystem}.ts`。

无第三类调用（`embed/index.ts:628` 的 `https://your-backend.example.com/...` 只是占位字符串常量）。

---

## 4. Go 路由组 → B 批次归属

Go 共 34 个 `Register*` 组（定义见 `apps/app-core/router/routes_*.go`），与迁移计划 1.1 一致：

| 批次 | Go 前缀 | 备注 |
| --- | --- | --- |
| B1 | `/models`、`/initialization`、`/system`、`/sandbox-configs` | `/models/weknoracloud/status` 属冻结域，单独标注；harness 遗留 providers CRUD 子系统暂缓退役至本批次再定（见审计报告 5.4） |
| B2 | `/vector-stores`、`/storage-backends`、`/web-search/providers`、`/web-search-providers`、`/datasource` | 含预签名 URL 与资源授权 |
| B3 | `/system/admin/*`、`/tenants/:id/api-keys` | 含 runtime queues / audit-log |
| B4 | `/organizations`（含 kb/agent shares、join-request） | |
| B5 | `/auth`、`/tenants`、`/me/invitations`、`/me/env-vars`、`/tenants/:id/add-users` | |
| B6 | `/knowledge-bases`（含 activity/tags/faq/knowledge/shares）、`/knowledge`、`/chunks`、`/chunker/preview` | 前端 URL 模式最多 |
| B7 | `/knowledgebase/:kb_id/wiki`、`/mcp-services`、`/evaluation`、`/user/favorites` | |
| B8 | `/agents`（含 type-presets/placeholders/im-channels/embed-channels/shares）、`/skills`、`/embed-channels`、`/im-channels`、`/wechat`、`/im`、`/embed/:channel_id` | `/embed/:channel_id` 为公开面 |
| B9 | `/sessions`、`/knowledge-chat`、`/agent-chat`、`/knowledge-search`、`/messages` | SSE 契约最敏感 |
| 公开/特殊 | `/r/:token`、`/files`、`/api/v1/files/presigned*`、`/api/v1/local-browser/*`、`/api/v1/sessions/:id/sandbox/terminal`（WS）、`/health` | 中间件之前，单独评估 |
| 不迁 | `/weknoracloud`（冻结） | Go 无 `/api/v1/dashboard`、`/api/v1/workspace` |

---

## 5. Python 现有路由（切流时必须保持可用）

| 文件 | prefix | 外部前缀 |
| --- | --- | --- |
| `system_router.py` | `/system` | `/harness-api/api/system`（仅 health） |
| `auth_router.py` | `/auth` | `.../api/auth`（仅 login） |
| `agent_router.py` | `/agent` | `.../api/agent`（含 2 个 SSE） |
| `chat_router.py` | `/chat` | `.../api/chat`（含 `POST /call` SSE） |
| `dashboard_router.py` | `/dashboard` | `.../api/dashboard` |
| `mcp_router.py` | `/system/mcp-servers` | `.../api/system/mcp-servers` |
| `model_provider_router.py` | `/system/model-providers` | `.../api/system/model-providers` |
| `skill_router.py` | `/system/skills` 与 `/skills` | `.../api/system/skills`、`.../api/skills` |
| `tool_router.py` | `/system/tools` | `.../api/system/tools` |
| `user_router.py` | `/user` | `.../api/user` |
| `filesystem_router.py` | `/viewer/filesystem` | `.../api/viewer/filesystem` |
| `workspace_router.py` | `/workspace` | `.../api/workspace` |

**冲突清单：**

| Go 前缀 | Python 现状 | 处理 |
| --- | --- | --- |
| `/auth` | `/api/auth`（仅 login，harness 自有 JWT） | 同名前缀不同体系，B5 扩展时并存，勿覆盖 login |
| `/mcp-services` | `/api/system/mcp-servers`（19 端点） | 按计划**不合并**，新挂 `/api/v1/mcp-services` |
| `/skills` | `/api/skills` + `/api/system/skills`（29 端点） | 同上，平台 Skill 与 Runtime Skill 分开 |
| `/agent`（tool-approvals / mcp-oauth-resolutions） | `/api/agent`（21 端点） | 同前缀不同用途，B9 路径避让 |
| `/system` | `/api/system`（health） | 见坑 2 |

---

## 6. SSE 契约比对清单（B9 验收）

**Go 侧（迁移对象）：**

1. `useStream`（`api/chat/streame.ts:163`，fetchEventSource）：
   - `POST /api/v1/knowledge-chat/{session_id}`、`POST /api/v1/agent-chat/{session_id}`（`views/chat/index.vue:900`）
   - `GET /api/v1/sessions/continue-stream/{session_id}?message_id=`（断连续跑，`index.vue:664`）
   - Embed 变体 `POST /api/v1/embed/{channelId}/agent-chat|knowledge-chat/{sessionId}`（`useEmbedChatSession.ts:302`，`Authorization: Embed <token>` + `X-Embed-Session` / `X-Embed-Visitor`）
   - 事件判定：`response_type === 'answer' || type === 'answer'` 为首个 answer chunk（TTFB 打点）；业务事件含 references / tool_calls
2. `GET /api/v1/sandbox-configs/{configId}/skills/{skillId}/install-events`（`useConfigSkillInstallProgress.ts:70`、`SandboxSkillsPanel.vue:1160`）
3. `GET /api/v1/sandbox-configs/{configId}/skills/{skillId}/transcript`（`SkillInstallTimeline.vue:229`，404 回落历史消息）
4. API Playground：`ApiIntegrationSettings.vue:1486` 裸 fetch `POST /agent-chat/{sessionId}`（X-API-Key、`channel=api`），`apiPlaygroundSSE.ts:86` 手工解析 data 帧，终态 `complete|answer(done)|error` + `[DONE]` 哨兵

**Python 侧（B9 期间不得破坏）：** `GET /api/agent/runs/{id}/events`（`Last-Event-ID` 断线恢复，`id:` 为 Redis stream seq）、`GET /api/agent/requests/{id}/events`、`POST /api/chat/call`。

**非 SSE 排除项：** `/api/v1/sessions/{id}/suggestion-events`、`/api/v1/embed/{cid}/sessions/{sid}/events` 为普通 POST 回传；`ollama download/progress`、`knowledge/move/progress`、`faq/import/progress` 为轮询 GET。

---

## 7. B0 剩余待办

- [ ] 逐接口字段级契约（path / method / body / 响应 / 错误码 / 权限），按 B1–B9 分批落表。
- [ ] 权限矩阵（viewer / contributor / admin / owner，含 space / tenant 维度）。
- [ ] 错误码对照：Go 错误语义 ↔ `locales_backend` 的 `error.<领域>.<错误码>`（新接口按错误码，历史接口走 `error.kb.*` 原文对照）。
- [ ] SSE 事件字段逐项表（对齐第 6 节）。
- [ ] 契约测试脚本：临时生成，**禁止提交**（见迁移计划 0.2）。
- [ ] B1 时决策：harness 遗留 providers CRUD 子系统整体退役（约 700 行，含 `builtin.py` 供应商目录），还是保留 `builtin.py` 作 `/models` 迁移参考。活代码边界见审计报告 5.4（`resolve_api_key` 链路必须保留）。
