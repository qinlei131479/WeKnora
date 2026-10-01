# 后端 app-core 迁 Python 执行计划

> **状态：进行中** — 阶段一（前端 views 收口）已完成；阶段二（Go `/api/v1` 迁 Python）尚未开始，本文保留阶段二内容。

**Goal:** 企业后端只维护一套 Python（agent-harness），前端请求 URL 与响应契约不变。

**Architecture:** 阶段二按功能与接口优先级，把 Go `apps/app-core` 的 `/api/v1` 模块迁到 Python，nginx 按前缀把对应 location 切到 agent-harness；前端不改。

**迁移范围:** 功能接口、架构边界、横切能力、后台任务，三层一起迁移。

## 0. 边界与原则

### 0.1 改 / 不改

| 目录 | 角色 | 本计划 |
| --- | --- | --- |
| `frontend/`、`internal/` | 上游开源 | 不改 |
| `apps/manager`、`apps/backend` | 另一条产品线 | 不改 |
| `apps/frontend` | 企业前端 | 阶段二不改业务页 |
| `apps/app-core` | 企业 Go fork | 本计划迁出 `/api/v1`，只卸路由 |
| `apps/agent-harness` | Python 落点 | 承接 `/api/v1` 实现 |

### 0.2 迁移原则

- **契约不变，实现搬家**：path / method / body / SSE 事件字段 / 错误语义与 Go 一致。
- **三层同迁**：功能接口、架构能力、后台任务都要覆盖。
- **按依赖分步**：身份/租户底座优先，SSE 最后。
- **稳定性优先**：先契约测试，通过才切流；复杂接口拆分推进。
- **契约测试与临时产物不提交**：凡与真实业务代码无关的测试脚本、fixture、生成文件都不提交仓库。

### 0.3 环境

| 进程 | 启动 | 端口 |
| --- | --- | --- |
| WeKnora / app-core | `make -f Makefile.kjsc app` | `:9980` |
| 前端 | `make -f Makefile.kjsc frontend` | `:9988` |
| harness API/Worker | `make -f Makefile.kjsc harness` | `:9990` |
| 基础设施 | `make -f Makefile.kjsc infra` | postgres / redis / minio |

库：`agent-middle`。身份按 WeKnora `users` + 同一套 JWT。

### 0.4 数据与系统稳定性红线（最高优先）

- 迁移期间不轻易删除数据库数据、表、索引、迁移记录；任何数据变更必须先备份、双写或保证可回滚。
- **禁止删除数据库**：schema、生产数据、凭证、会话、任务记录等，除非有明确授权和可验证的恢复方案。
- **禁止删除核心业务代码或关键实现**；迁移采用「新增 + 切换 + 回滚」，不做破坏性删除。
- 高风险操作（数据删除、DB 结构变更、核心代码下线）必须：先分析影响面 → 输出方案与回滚预案 → 小范围验证 → 确认后执行。
- 核心代码与数据变更必须有验证步骤，禁止未经验证直接删除。

## 1. Go 端功能与架构盘点

### 1.1 功能域（Go `/api/v1` 路由）

Go 端 `apps/app-core/router/router.go` 共 34 个 `Register*` 组，归为 8 个功能域：

| 域 | Go 路由组 | 说明 |
| --- | --- | --- |
| 身份认证 | `Auth`、`MyInvitation` | 登录、注册、OIDC、刷新、邀请 |
| 租户与权限 | `Tenant`、`System Admin` | 租户、成员、API key、管理员操作 |
| 模型与初始化 | `Model`、`Initialization`、`System`、`WeKnoraCloud` | 模型、探测、系统信息、云凭证 |
| 基础设施连接器 | `VectorStore`、`StorageBackend`、`WebSearch`、`WebSearchProvider`、`DataSource` | 连接器 CRUD + test |
| 平台智能体与发布 | `CustomAgent`、`Organization`、`IMChannel`、`EmbedChannel`、`Skill` | 平台 Agent、组织、发布面 |
| 知识库核心 | `KnowledgeBase`、`KnowledgeBaseActivity`、`Knowledge`、`Chunk`、`FAQ`、`KnowledgeTag`、`WikiPage` | 知识库全流程 |
| 对话与会话 | `Session`、`Chat`、`Message` | 会话、SSE、消息、建议 |
| 高级能力 | `MCPService`、`Evaluation`、`UserFavorite`、`ChunkerDebug` | 平台 MCP、评估、收藏、调试 |

特殊项：

- Workspace、Dashboard：Python 已有实现，本计划不迁移，也不动现有 Python。
- WeKnora Cloud：冻结不迁。
- Go 平台 Skill（`/api/v1/skills`）与平台 MCP（`/api/v1/mcp-services`）：迁移到 Python 并保留，与现有 `/harness-api` 的 Skill/MCP 分开，不合并。
- 组织 / 分享：Go 端是完整功能域，必须整体迁移，见 B4。

### 1.2 架构能力迁移矩阵（Go → Python）

| Go 层/能力 | Python 落点 | 现状 | 归属 |
| --- | --- | --- | --- |
| HTTP 路由 | `server/routers/` | 部分已有 | B1–B9 |
| 中间件（Auth / RBAC / API-Key / EmbedAuth / RateLimit / CORS / Logger / Recovery / ErrorHandler / Audit） | FastAPI `Depends` / middleware | 部分已有 | B0 / B5 / B8 |
| 依赖注入 | FastAPI DI + `yuxi` 容器 | 已有雏形 | B0 |
| 服务层 | `yuxi/services/` | 部分已有 | 各批 |
| 仓储层 | `yuxi/repositories/` | 部分已有 | 各批 |
| 数据访问与迁移 | SQLAlchemy + Alembic | 部分已有 | B5 / B6 |
| 接口抽象 | Python protocol / pydantic | 部分已有 | 各批 |
| 模型与上下文 | `yuxi/models/` + citation/context | 部分已有 | B1 |
| Agent 引擎 / 运行时 / 沙箱 | `yuxi/agents/` | 已有 | B8 |
| 流式 | `StreamingResponse` | 部分已有 | B9 |
| 事件总线 | SSE 事件 + audit event | 部分已有 | B9 / B3 |
| 可观测 | Python tracing | 需补 | B0 / B9 |
| 存储与检索 | `yuxi/storage/`、`yuxi/knowledge/` | 部分已有 | B2 / B6 |
| 数据源连接器 | Python datasource connector | 需补 | B2 |
| MCP | 平台 MCP 模块 + `mcp_router` | 部分已有 | B7 |
| IM 回调 | Python IM 回调模块 | 需补 | B8 |
| 限流 | Redis/FastAPI 限流 | 需补 | B0 / B8 |
| 后台任务队列 | 共用 `/harness-api` worker | 部分已有 | B3 / B6 / B7 |
| 安全：AES 凭证 | Python 兼容加解密 | 需补 | B5 |
| 安全：预签名 URL / 资源授权 | Python URL 签名 | 需补 | B2 |
| 安全：CSP / Embed 公开面 | Python embed 安全 | 需补 | B8 |

### 1.3 后台任务清单

后台任务与现有 `/harness-api` worker 共用进程/队列，照搬 Go 的 asynq 任务语义，不另建调度模型。

`document:process`、`chunk:extract`、`faq:import`、`question:generation`、`summary:generation`、`kb:clone`、`index:delete`、`kb:delete`、`knowledge:list_delete`、`knowledge:list_reparse`、`knowledge:move`、`datatable:summary`、`image:multimodal`、`knowledge:post_process`、`knowledge:auto_tag`、`manual:process`、`datasource:sync`、`wiki:ingest`、`wiki:finalize`、`temporary_document:process`。

每类任务需说明：入参、状态流转、进度、失败重试、取消、幂等。

## 2. 阶段二执行计划（B0–B9）

### B0 · 契约与架构冻结

- B0 种子文档已建：`20261001-api-contract-phase2.md`（网关规则、前端调用面口径、Go 34 路由组 × Python 12 router 冲突表、SSE 比对清单、三个必处理坑、B0 剩余待办）；逐接口契约在此文档上继续展开。
- 维护本文档的功能域表、架构矩阵、任务清单。
- 标注复杂接口与权限矩阵。
- 契约测试临时生成，禁止提交。

### B1 · 模型与初始化

功能：`/models`、`/initialization`、`/system` 的 info / parser / docreader / storage-status。
架构：`yuxi/models`、模型代理、初始化探测、解析引擎。
重点：模型代理三接口、凭证不回传、初始化自动探测。

### B2 · 向量 / 存储 / 搜索 / 数据源

功能：vector-store、storage-backend、web-search、web-search-provider、datasource。
架构：`yuxi/storage`、datasource connector + scheduler、预签名 URL、资源授权。
重点：连接器 test、datasource sync、URL 签名。

### B3 · 系统 / 队列 / 审计

功能：system admin、runtime queues、audit-log、platform api-keys。
架构：在现有 `worker_main.py` 扩展任务注册，接 `datasource:sync` 做共享队列首验。
重点：任务调度语义对齐 Go，审计事件字段一致。

### B4 · 组织 / 分享

功能：组织 CRUD、成员、邀请、join-request、KB/Agent 分享。
架构：`yuxi/permissions`、组织 RBAC。
重点：共享权限计算（Viewer/Admin/OwnedKB/OwnedAgent）、join request 审批。

### B5 · 租户 / RBAC

功能：auth、tenant、invitations、api-principal、api-keys。
架构：`yuxi/auth`、`yuxi/tenancy`、Auth/RBAC/API-Key 依赖、AES 兼容、DB 迁移底座。
重点：login / auto-setup / OIDC / switch-tenant / change-password、AES 解现网数据。

### B6 · 知识库 / 切片 / FAQ / 标签

功能：KB CRUD、knowledge、chunk、FAQ、tag、activity。
架构：`yuxi/knowledge` 读写、docreader gRPC 保持、知识库任务类型。
重点：解析/入库/取消/重解析状态机、chunk revision、FAQ/tag、批量幂等。

### B7 · Wiki + 平台 MCP + 高级能力

功能：wiki、`/api/v1/mcp-services`、evaluation、user-favorites、chunker-debug。
架构：wiki 任务、平台 MCP + OAuth、评估任务。
重点：wiki 防抖收尾、MCP OAuth / tool-approval。
WeKnora Cloud 不迁。

### B8 · Agent 配置 + 平台 Skill + Embed + IM

功能：agents、type-presets、placeholders、`/api/v1/skills`、embed-channels、im-channels、wechat/qrcode。
架构：`yuxi/agents` 复用、embed CSP/限流、IM 回调签名、平台 Skill。
重点：Embed publish token / CSP / external-user、IM 幂等、平台与 Runtime Agent/Skill 不合并。

### B9 · Session / RAG / SSE

功能：sessions、knowledge-chat、agent-chat、continue-stream、stop、messages、suggestions。
架构：事件总线、StreamingResponse、tracing/langfuse。
重点：SSE 事件字段逐项对照、断连续跑、stop、引用/tool_calls/审批中断。

## 3. 稳定性保障

- 每接口 Go vs Python 同请求契约测试，通过才切 nginx。
- 复杂接口拆“字段定义 → 单测 → 集成 → 灰度”。
- 后台任务先做状态机、幂等、取消测试。
- nginx 按 prefix 切，保留最后一版 app-core 镜像可回切。
- 每批验收：功能接口、架构组件、后台任务三层全过，前端业务页零改动。
- 数据与代码删除类操作单列审批，禁止夹带在常规迁移批次。
- DB 变更使用迁移脚本；删除字段/表前确认无引用、数据已备份或已迁移。
- 保留 Go 实现直至新实现稳定并通过观察期，不提前删除 Go 代码。

## 4. 验收与门禁

- B0 契约表 + 架构矩阵冻结并评审。
- B1–B9 每批完成三层验收。
- 全部完成后：`apps/app-core` 仅剩 health 或明确保留项，G2 通过。

## 5. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| 契约不一致 | 先契约测试，再切流 |
| 复杂接口反复返工 | 字段级拆分，先单测后集成 |
| 后台任务破坏现有 harness worker | 共用队列但按 task type 隔离注册，先小任务验证 |
| AES 无法解现网数据 | 先做加解密兼容测试 |
| 切流后不可回滚 | 保留 app-core 镜像，nginx 可回切 |
| 误删数据或核心代码 | 删除类操作单列审批，先备份/迁移/回滚，禁止夹带 |

回滚：nginx 前缀切回 app-core。
