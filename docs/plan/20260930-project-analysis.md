# WeKnora 企业版仓库深度分析

> **状态：已完成** — 第一至十一节只读分析、第十二至十四节修复动作与提交均已落地，见文末提交记录。

- 分析对象：`/Users/qinlei/Documents/WorkSpace/PyCharmProjects/WeKnora`
- 基线：`VERSION = 0.8.0`，Go `1.26.0`，分支 `develop`，HEAD `233877a44`
- 方法：静态阅读 + 目录/代码规模量化 + `go build` 实测
- 本文第一至第十一节为只读分析，未修改任何代码、也未执行任何 git 提交；第十二至十四节为随后按建议执行的修复动作与提交记录。

---

## 一、一句话结论

这是一个**在上游腾讯开源项目 Tencent/WeKnora 之上做整目录 fork 的企业分支**：上游核心 `internal/`（1860 个 Go 文件 / 48.3 万行）被完整复制为 `apps/app-core/`（1885 个 Go 文件 / 48.8 万行），再用「独立入口 + `*_kjsc` 配置变体 + 独立迁移版本表 + 独立 Makefile/镜像」把企业改动隔离在外。

隔离做得干净、规范落地有实证（i18n 五语言 7503 行 × 5 完全同构、852 个后端测试文件、`go build ./cmd/app-core` 通过），但**最大的系统性风险也来自这个 fork 本身**：1355 个同名文件内容已分叉，且不存在任何自动同步机制。

---

## 二、仓库拓扑与产品线边界

### 2.1 两个远端、一个工作分支

```
origin    git@113.250.81.155:inner/AgentPlatform/Agent-Middle-Platform.git  # 内网企业仓库
upstream  git@github.com:qinlei131479/WeKnora.git             # 个人 fork
```

> 注：早期曾挂 `official git@github.com:Tencent/WeKnora.git` 作为上游开源直连远端，后已删除，现上游经 `upstream`（个人 fork）间接同步。

当前 `develop` 与 `origin/develop` 完全同步（ahead/behind = 0/0）。提交时间跨度 2025-08-05 → 2026-09-30，最近 200 次提交中 `fix` 93 次、`feat` 75 次、`chore` 11 次、`docs` 7 次、`refactor` 2 次。

### 2.2 六条产品线共存于一个仓库

| 产品线 | 目录 | 语言/栈 | 是否可改（AGENTS.md） |
|---|---|---|---|
| **企业 WeKnora 后端** | `apps/app-core/` + `cmd/app-core/` | Go 1.26 | ✅ 企业主战场 |
| **企业 WeKnora 前端** | `apps/frontend/` | Vue 3 + TDesign + Vite 7 | ✅ 企业主战场 |
| **企业 Agent 运行时** | `apps/agent-harness/` | Python 3.13 + FastAPI + LangGraph + ARQ | ✅ 企业主战场 |
| 上游开源核心 | `internal/`、`frontend/`、`cmd/server/` | Go / Vue 3 | ❌ 禁止改动 |
| 上游周边 | `cli/`、`client/`、`docreader/`、`mcp-server/`、`miniprogram/`、`packages/` | Go / Python / TS / 小程序 | 未被 AGENTS.md 划入禁改，实际视为上游 |
| **另一条产品线（智能体中台）** | `apps/backend/`（Java Spring Cloud）、`apps/manager/`（Vue 3 + Element Plus） | Java 17 / Vue | ❌ 禁止改动 |

`apps/backend` 的 Maven 坐标是 `com.iptv:agentic-cloud:3.6.7`，模块全部 `iptv-*` 前缀（`iptv-gateway` :9206、`iptv-auth` :9203 等），与 WeKnora 无任何代码关系。它与 `apps/manager`（145 个 `.vue`）构成独立的「通用智能体中台」，只是恰好和 WeKnora 企业线放在同一个 Git 仓库里。

> **需要留意的认知成本**：一个仓库里同时存在三套前端（`frontend/` 上游 Vue3、`apps/frontend/` 企业 Vue3+TDesign、`apps/manager/` 中台 Vue3+Element Plus）、三套后端（Go 上游、Go 企业、Java 中台）、三套文档站。新人上手前必须先把这张表背下来。

---

## 三、技术栈全景

### 3.1 后端（Go 1.26）

| 维度 | 选型 |
|---|---|
| Web 框架 | Gin 1.12 + swaggo（Swagger 仅非 release 环境暴露） |
| 依赖注入 | `uber/dig`，全局单例容器 + `dig.In` 参数聚合 |
| ORM / DB | GORM 1.31 + PostgreSQL（`pgx/v5`）/ SQLite 双驱动 |
| 迁移 | `golang-migrate`，双通道：`migrations/versioned`（192 文件）+ `migrations/version_kjsc` |
| 任务队列 | `hibiken/asynq`（Redis），6 个具名 server 按阶段分池；Lite 模式降级为同步执行器 |
| 流式 | SSE；`stream` 包双实现（memory 单机 / redis 多实例） |
| 配置 | Viper + 手写 `${VAR:-default}` 展开 |
| 可观测性 | Langfuse（唯一追踪后端，OTLP）+ logrus + lumberjack |
| 鉴权 | JWT（`golang-jwt/v5`）+ OIDC（JWKS 验签） |
| 向量库 | pgvector / Elasticsearch v7+v8 / OpenSearch / Milvus / Weaviate / Qdrant / Doris / SQLite(vec) / 腾讯云 VectorDB（10 种） |
| 对象存储 | local / MinIO / COS / TOS / S3 / OSS / KS3 / OBS（8 种） |
| 模型厂商 | 27 家注册表（OpenAI / Anthropic / Azure / DeepSeek / Qwen / 智谱 / 混元 / 豆包 / Gemini / MiniMax / NVIDIA / LiteLLM / Ollama…） |
| 沙箱 | Docker / E2B / Cube MicroVM（**Local 宿主机后端已移除**，仅留 `_legacy/`） |
| 解析 | 进程内 anydoc + gRPC docreader + MinerU + PaddleOCR-VL |

### 3.2 前端（`apps/frontend`）

Vue `3.5.34` + vue-router `4.5` + Pinia `3`（persistedstate）+ vue-i18n `11` + TDesign `1.19`（图标版本被 overrides/resolutions 锁死在 `0.4.4`）+ lucide + Vite `7.3` + TS `6.0` + Less `4.6`。

渲染/可视化栈较重：markdown-it + marked + katex + highlight.js + shiki + mermaid + markmap + DOMPurify + echarts 6 + xterm（沙箱 PTY）+ docx-preview + `@vue-office/pptx`。

### 3.3 Python 两端

- `apps/agent-harness`：FastAPI + Uvicorn + ARQ（异步队列），LangGraph / LangChain / DeepAgents，`langgraph-checkpoint-postgres`，`langchain-mcp-adapters`；基础设施 `asyncpg` / `redis` / `minio` / `neo4j` / `pymilvus` / `sqlalchemy[asyncio]` / `torch(CPU)` / `rapidocr` / `docling` / `unstructured`。包管理用 `uv`。
- `docreader`：gRPC 文档解析微服务（:50051），引擎注册表 `builtin` / `markitdown` / `opendataloader`，`Read` + `ReadStream` + `ListEngines` 三个 RPC。

---

## 四、运行时架构与关键链路

### 4.1 启动链路与依赖注入

入口在 `cmd/app-core/main.go`，**不在** `apps/app-core/` 内（后者是纯库目录）。启动时序：

```
gin.SetMode → SilenceGinRouteSpam → LogStartupEnv → MarkServerStarted
  → container.BuildContainer(runtime.GetContainer())   // 184 个 Provide
  → runStartupBootstrap(c)                            // 失败不阻断
  → http.Server + listenWithRetry(10 次 / 300ms 退避)
  → systemSettingSvc.SubscribeRedis(ctx)              // 多实例配置热刷新
  → signal goroutine：先 listener.Close() 释放端口，再 Shutdown 优雅 drain
```

`container/container.go`（1793 行）按 12 个阶段、184 个 provider 装配；`router/router.go` 的 `RouterParams` 用 `dig.In` 一次声明 60+ 依赖。

**路由与中间件顺序**（`router/router.go:109-317`）：

```
CORS → RequestID → Language → Logger → Recovery → ErrorHandler
→ /health / Swagger → embedFrameAncestors → 静态文件(lite)
→ IM 回调 / Embed 公开路由 / 资源短时能力 URL / 沙箱终端 WS / BrowserSkill（均自带鉴权，在全局 Auth 之前）
→ middleware.Auth(...)          ← 全局鉴权分界线
→ 文件服务 / Langfuse / 审计注入
→ v1 业务：rbacGuards → apiKeyAuthorizer.Middleware() → 40+ 个 RegisterXxxRoutes
→ rbacGuards.assertAPIKeyPoliciesMatchRoutes(r)  ← 启动期 fail-fast，策略指向不存在的路由直接 panic
```

`SetTrustedProxies` 有显式安全处理：默认只信 loopback + 私网，防伪造 `X-Forwarded-For` 绕过 embed 限流。

### 4.2 RAG 检索流水线：插件化事件责任链

流水线是「事件 → 插件」，定义在 `types/chat_manage.go` 的 `Pipeline` 映射，调度器是 `application/service/chat_pipeline/chat_pipeline.go` 的 `EventManager`（`Register` 构建责任链、`Trigger` 触发）。

```
LOAD_HISTORY → QUERY_UNDERSTAND → CHUNK_SEARCH_PARALLEL → CHUNK_RERANK
→ CHUNK_MERGE → FILTER_TOP_K → DATA_ANALYSIS → INTO_CHAT_MESSAGE → CHAT_COMPLETION_STREAM
```

关键设计：

- **检索侧**：`PluginSearchParallel` 内部并发跑 chunk 检索 + 图谱检索；`searchByTargets()` 按**嵌入模型身份**（`name|baseURL`）分组，同组只算一次 query embedding 并把同组 full-KB target 合并成一次 `HybridSearch`；KB 检索与 Web 检索并发。
- **混合检索**：`KnowledgeBaseService.HybridSearch` → 多 KB 授权校验 → 按 `(storeID, ownerTenant)` 分组 → 并发 fan-out 到多引擎 → `EngineAwareNormalizer` 归一化 → 拆 vector/keyword → `fuseOrDeduplicate` 融合 → FAQ 迭代扩 TopK。BM25 与 Dense 统一收敛到 `KeywordsVectorHybridRetrieveEngineService`。
- **Rerank**：`getEnrichedPassage`（Content + 图片 Caption/OCR + 生成问题）→ `cleanPassageForRerank` → 模型重排 → **阈值降级**（0.7×，失败回退）→ `compositeScore = 0.6*model + 0.3*base + 0.1*sourceWeight` → FAQ 加权 → **MMR 去冗余**（λ=0.7）。同一事件上还挂了 `PluginWikiBoost`、`PluginMemoryAffinity`。
- **父子分块**：子块在 `PluginMerge.resolveParentChunks()` 被替换为父块内容。
- **引用机制**：`modelcontext.Registry` 把持久身份替换为请求内 handle（`cN/dN/bN/wN/res://`），向 system prompt 注入协议说明，既压缩上下文又防模型编造引用。

### 4.3 Agent 运行时（ReAct）

`agent/engine.go` 的 `AgentEngine.Execute` → `executeLoop` → 每轮 `runReActIteration`（think → act → observe），阶段拆成 `think.go` / `act.go` / `observe.go` / `finalize.go` / `steer.go`，轮次预算 `MaxIterations` + `allowSteerOverrun`，每轮开 Langfuse span。

工具统一收口在 `agent/tools/registry.go` 的 `ToolRegistry`：

- `RegisterTool` 首注册优先（防劫持）
- `RegisterDeferredTool` 延迟暴露
- `GetModelFunctionDefinitions` **稳定排序以命中 prompt cache**

注册决策在 `application/service/agent_service.go` 的 `registerTools()`：依据 `AllowedTools` + KB 能力探测（有无向量/Wiki KB）+ 运行开关决定最终工具集，再依次 `registerMCPTools` → `registerSandboxShellIfAllowed` → `registerSandboxFileTools` → `registerWebPageFiles`。另有 `agent/approval/` 工具审批门（MCP 高危工具人工审批）、`agent/compaction/` 上下文压缩、`agent/token/` token 估算。

### 4.4 三组关键抽象

| 抽象 | 接口位置 | 实现分布 |
|---|---|---|
| 模型（Chat/Embedder/Reranker/VLM/ASR） | `models/chat/chat.go`、`models/embedding/embedder.go` 等 | `models/` 下按 provider 分派；27 家注册表在 `models/provider/provider.go`；`DetectProvider(baseURL)` 按 URL 子串猜厂商 |
| 检索引擎 | `types/interfaces/retriever.go`、`vectorstore.go` | `application/repository/retriever/{postgres,elasticsearch/v7,elasticsearch/v8,opensearch,milvus,qdrant,weaviate,doris,sqlite,tencentvectordb,neo4j}`；`CompositeRetrieveEngine` + `RetrieveEngineRegistry`（env store / DB store 双轨，按需重建 + singleflight + 失败冷却 30s） |
| 对象存储 | `types/interfaces/file.go` 的 `FileService` | `application/service/file/` 下 8 种 provider + `dummy` / `backend_scoped` 包装；`StorageBackendResolver` 按 KB 绑定解析 |

模型调用统一用装饰器叠加：`wrapChatDebug` / `wrapChatLangfuse` / `wrapChatConcurrency`，并发上限由 `Model.Parameters.MaxConcurrency` + `models/limiter` 全局闸门控制。

---

## 五、企业定制机制（KJSC 隔离）

这是本仓库最值得肯定的设计。

| 维度 | 上游 | 企业 |
|---|---|---|
| 入口 | `cmd/server/main.go` | `cmd/app-core/main.go` |
| 业务代码 | `internal/` | `apps/app-core/`（**零交叉 import**） |
| 配置 | `config/config.yaml` | `config/config_kjsc.yaml` 优先加载 |
| 提示词 | `config/prompt_templates/` | `config/prompt_templates_kjsc/`（11 个文件）优先 |
| 内置智能体 | `config/builtin_agents.yaml` | `config/builtin_agents_kjsc.yaml`（290 行）优先 |
| 迁移 | `migrations/versioned` + `schema_migrations` | 追加 `migrations/version_kjsc` + **独立表 `schema_migrations_kjsc`** |
| 构建 | `Makefile` | `Makefile.kjsc` + `.air.appcore.toml`（官方 Makefile 零 `app-core` 字样） |
| 镜像 | `weknora-*` | `kjsc/agent-middle-*`（`docker/Dockerfile.app-core`） |
| 依赖订阅 | — | `scripts/kjsc/dev.sh` 用 `sed 's\|internal/handler\|apps/app-core/handler\|g'` 改写 ldflags |

配置加载优先级链在 `apps/app-core/config/config.go:523-643`：`config_kjsc` → `config`，`prompt_templates_kjsc` → `prompt_templates`，`builtin_agents_kjsc.yaml` → `builtin_agents.yaml`。`config_kjsc.yaml` 与 `config.yaml` 内容唯一差异是 `port: ${APP_PORT:-8080}`——**证明企业定制主要靠「新增变体文件」而非改上游文件**。

KJSC 迁移通道（`database/migration.go:84-85`）使用 `file://migrations/version_kjsc` + `schema_migrations_kjsc`，与官方迁移并列执行，且**失败只告警不阻断启动**。现有 9 个迁移（12 文件），其中 `000001_schema_comments.up.sql` 83KB（全库中文表/字段注释）、`000008_amp_unification.up.sql` 107KB。

### 企业侧独有能力（相对上游）

| 能力 | 证据 |
|---|---|
| **按租户命名沙箱后端**（cube/e2b/docker/disabled），Self-contained 配置，不回退进程环境 | `types/tenant_sandbox_config.go`、`sandbox/tenant_config.go`、`sandbox/tenant_resolver.go` |
| **技能体系**：预加载目录 + 租户级安装/卸载/校验 | `application/service/skill_service.go`（`DefaultPreloadedSkillsDir = "skills/preloaded"`）、`agent/skills/*`；`skills/preloaded/` 下 5 个技能 |
| **内置工具目录（chat/work 双源）** | `agent/tools/builtin_directory.go`（`BuiltinToolSourceChat` / `BuiltinToolSourceWork`） |
| **租户内直接开账号**（不动原邀请链路） | `handler/tenant_add_user.go` + `router/routes_kjsc_tenant_add_user.go`（注释明示「与原有 /members、/invitations 并存，避免后续合并上游时改到邀请链路」） |
| 知识库思维导图 | `handler/knowledgebase_mindmap.go` + 迁移 `000004` |
| 模型代理端点 | `handler/model_proxy.go`（459 行） |
| 对话内文件解析 | `handler/session/internal_parse.go` |
| 跨会话记忆 / 上下文压缩 / 图片产出约束 | `agent/memory/consolidator.go`、`agent/token/compress.go`、`agent/image_requirement.go` |
| AMP 表统一（`h_*` → `amp_*`）+ 遥测三表 | `migrations/version_kjsc/000008`、`docs/plan/amp-unification-20261001.md` |
| 默认收紧自助建租户 | `WEKNORA_TENANT_SELF_SERVICE_CREATION_ENABLED=false`（官方示例为 true） |

**这里的工程规范意识很强**：`sandbox/tenant_resolver.go` 开篇用 20 行注释论证了「为什么 manager 每请求重建且刻意不缓存」——逐项核对了 `SessionBoundManager` 持有什么、锁保护什么、句柄是否跨请求持有，最后才落到「无缓存＝无失效链路，配置变更下一请求生效」。这是合格的架构决策记录。

---

## 六、多端与部署拓扑

### 6.1 端与端口

| 端 | 栈 | 端口/协议 | 规模（含测试） |
|---|---|---|---|
| `apps/app-core` | Go | :8080 HTTP | 1885 文件 / 48.8 万行 |
| `apps/frontend` | Vue 3 | 开发 :9988 | 281 `.vue` / 约 26.6 万行 |
| `apps/agent-harness` | Python | :9990 HTTP（前端经 Nginx `HARNESS_HOST` 反代，api 走 `/harness-api`） | 约 8.57 万行 |
| `docreader` | Python + Go | :50051 gRPC | 约 1.08 万行 |
| `cli` | Go + Cobra | — | 约 4.34 万行 |
| `client` | Go（零依赖） | — | 约 8.4 千行 |
| `mcp-server` | Python | stdio / SSE / Streamable HTTP，默认 :8000 | 约 2.1 千行 |
| `packages/dsh-weknora` | TS | DeepSeek Harness 插件 | 约 3 千行 |
| `miniprogram` | 微信小程序 | — | 约 1.1 千行 |
| `cmd/desktop` | Go + Wails v2 | WeKnora Lite 桌面壳（复用上游 `frontend/`） | — |

### 6.2 Harness 与主服务的数据隔离

两者**共用同一套 PG / Redis / MinIO / JWT**，靠前缀隔离：Harness 业务表 `amp_`（原 `h_`），Redis key `arq:*`，MinIO bucket `agent-harness`。Harness 通过 HTTP 调 `WEKNORA_BASE_URL`（默认 `http://app:8080/api/v1`）访问知识库，携带当前用户 JWT + `X-Tenant-ID`。

### 6.3 编排

`docker-compose-kjsc.yml` 相对官方 `docker-compose.yml` 多出：`docs`、`elasticsearch`、`harness-db-init`、`api`、`worker`、`sandbox-provisioner`、`mineru-api`、`paddlex`，网络名改为 `agent-middle-network`，并新增 `redis-data` / `nltk_data` / `neo4j-logs` / `elasticsearch_data` 等卷。全栈含 langfuse（clickhouse + minio + worker + web）、dex、searxng、8 种向量库、doris-fe/be 等，是一个相当重的本地开发栈。

`Makefile.kjsc` 定义了清晰的顺序：`init → infra → migrate → app / frontend → harness`，CI 侧每端一个 Jenkins 目录（`scripts/kjsc/jenkins/{app-core,backend,docs,frontend,harness,manager,sandbox}`）。

---

## 七、工程规范落地实证（对照 AGENTS.md）

| AGENTS.md 规则 | 实测 | 结论 |
|---|---|---|
| 五语言 i18n 行数/键路径必须一致 | `locales/*.ts` 全部 **7503 行 × 5**；`locales_backend/*.ts` 全部 **120 行 × 5** | ✅ 严格达标（有 `localeKeyAudit.ts` / `localeGapScan.ts` 自动审计） |
| 禁止引入 ant-design-vue | 全量搜索 `ant-design` / `antd` / `a-input` / `a-button` 零命中 | ✅ 达标 |
| 后端错误统一 `{error_code, params}`，文案进 `locales_backend` | `errors/errors.go` + `attachBackendMessages` 合并进 `error.<领域>.*` | ✅ 机制存在 |
| 迁移必须成对 `.up.sql` / `.down.sql`，同需求合并编号 | `version_kjsc` 9 个编号，`000007`/`000008`/`000009` 成对；`000008` 计划文档明确「不拆成 000009、000010」 | ✅ 达标 |
| 同批清理旧实现 | Harness 旧 JS 层仍在（`src/api/harness/*.js`、`stores/harness/*.js`、`utils/harness/*.js`、`components/harness/`），路由已重定向但代码未删 | ⚠️ 未完全执行（注：后经复核该判断不准确，这些 `.js` 是活跃生产代码而非待删旧实现，且已全部迁 TS，见第十三节） |
| 优先 `git mv`，禁止复制留双份 | `internal/` 与 `apps/app-core/` 是整目录复制，1355 个同名文件内容分叉 | ⚠️ 与规则张力（属隔离决策，见下） |
| 代码注释必须中文，禁止新增英文注释 | `apps/app-core` 6.0 万条 `//` 注释中仅 6.3% 含中文（`internal` 为 6.2%） | ❌ 现状与规则冲突 |
| 提交信息 `type(scope): 描述` | 最近 200 次提交存在 `feat：xxx`（全角冒号）、`模型管理增加调试功能`（无 type）等不合规写法 | ⚠️ 部分不合规 |
| 禁止自动提交 | `git status` 干净，无未提交改动 | ✅ |

`go build ./cmd/app-core` 实测结果：**通过**，耗时约 38 秒，仅一条 `ld: warning: ignoring duplicate libraries: '-lc++'`。

---

## 八、量化规模

| 分区 | 文件数 | 行数 |
|---|---|---|
| `internal/`（上游） | 1860 `.go` | 483,353 |
| `apps/app-core/`（企业） | 1885 `.go` | 487,521（非测试 313,963） |
| `frontend/`（上游前端） | 206 `.vue` + 328 `.ts` | 约 236,211（vue+ts） |
| `apps/frontend/src`（企业前端） | 281 `.vue` + 296 `.ts` | 约 265,526（vue+ts） |
| `apps/manager/src`（中台前端） | 145 `.vue` | — |
| `apps/agent-harness` | Python | 约 85,700 |
| `cli/` | Go | 约 43,388 |
| `client/` | Go | 约 8,352 |
| `docreader/` | Python + Go | 约 10,835 |
| `migrations/versioned` | 192 个 SQL | — |
| Go 包总数 | 191 个 | — |

**测试密度**：`apps/app-core` 852 个 `_test.go`（占文件总数 45.2%）；`cli` 144 个；`apps/frontend` 50 个 `.test.ts`；`apps/agent-harness/test` 134 个 `.py`。

**双份代码的编译代价**：`internal` 与 `apps/app-core` 合计约 **97 万行 Go**，因零交叉引用而被 `go build ./...` 各编译一遍——CI 与本地全量构建成本实质翻倍。

**最大文件（Top 8）**：

| 行数 | 文件 |
|---:|---|
| 6654 | `apps/frontend/src/views/agent/AgentEditorModal.vue` |
| 7503 | `apps/frontend/src/i18n/locales/*.ts`（5 个文件各 7503 行） |
| 6556 | `apps/frontend/src/views/knowledge/wiki/WikiBrowser.vue` |
| 5765 | `apps/frontend/src/views/knowledge/components/FAQEntryManager.vue` |
| 4055 | `apps/app-core/application/service/knowledge_process.go` |
| 3453 | `apps/app-core/im/service.go` |
| 3448 | `apps/app-core/application/service/tenant_skill_install_test.go` |
| 3246 | `apps/app-core/application/service/wiki_ingest.go` |

---

## 九、风险清单

### P0：整目录 fork 的同步失控

**事实**：`internal/` 与 `apps/app-core/` 一级目录完全同名（34 个），**1355 个同名文件内容已不同**，`internal` 独有文件 0 个，`app-core` 独有 20 项（含 `agent/memory`、`agent/tools/_legacy`、`sandbox/_legacy` 三个目录，及 `image_requirement.go`、`builtin_directory.go`、`skill_service.go`、`tenant_add_user.go`、`knowledgebase_mindmap.go`、`model_proxy.go`、`tenant_sandbox_config.go` 等）。

**已经发生的漂移漏项**：`datasource/connector/gitlab/`、`datasource/connector/ima/` 目录与文件在 `apps/app-core` 中存在，但 **`container.go` 与 `datasource/connector.go` 里没有注册**；`exa` / `metaso` / `bocha` / `brave` 网络搜索 provider 同样「文件在、注册缺失」。上游 `internal` 已注册。这说明上游 0.8 的「能力端口」提交（`41a94f645`）存在遗漏。

**影响**：
1. 上游每次发版，都要人工把 1355 个文件的差异重放一遍，且没有 checklist 兜底。
2. 同一个 bug 可能需要修两遍（若上游也要修），或只修一边导致行为分叉。
3. 编译与 CI 成本翻倍（约 97 万行 Go 构建两遍）。

**建议**（按性价比排序）：
1. **加 CI 漂移报告**（不改架构即可落地）：对 `internal` 与 `app-core` 同名文件做归一化 diff（忽略 import path 前缀），输出「新增/删除/修改」清单，并对「文件存在但未在任何 `container.go` 注册」做定向断言——这能直接抓住 gitlab/ima/exa 这类漏项。
2. **建立同步 checklist 固化进仓库**：上游新增 provider/connector/engine/plugin 时，逐项核对 `apps/app-core/container/container.go`、`datasource/connector.go`、`infrastructure/web_search/registry.go`、`retriever/registry.go` 四个注册点。
3. 中期考虑**反向做法**：把企业改动做成薄 patch / 插件层，让 `app-core` 只保留差异文件而非整目录——但这需要上游提供扩展点，成本高，需评估。

### P1：规范与现状的显性冲突

1. **注释语言**：AGENTS.md 要求「代码注释必须使用中文，禁止新增英文注释」，但 `apps/app-core` 6 万条注释仅 6.3% 含中文。规则要么改成「新增/手改的注释用中文，随上游复制的代码保持原样」，要么做一轮注释本地化。当前状态会让 code review 无法判定合规。
2. **旧实现未同批清理**：Harness 遗留 JS 层（`api/harness/*.js`、`composables/harness/*.js`、`stores/harness/*.js`、`utils/harness/*.js`、`components/harness/`）与新的 `api/chat-work/` + TS 实现并存，路由已重定向但文件未删；另有 `hooks/` 与 `composables/` 分层重叠、`components/GlobalCommandPalette.vue` 与 `components/GlobalCommandPalette/` 目录并存。
3. **文档三套并存且已漂移**：`docs/`（138 个文件，原始 md）、`website-docs/`（`weknora-docs-site`，上游 VitePress）、`apps/docs/`（`agent-middle-docs-site`，企业 VitePress）。已发现实证漂移：`apps/agent-harness/README.md` 仍写「PostgreSQL 业务表 `h_` 前缀」，而 `000008` 迁移已把 `h_*` 全部改为 `amp_*` 并删除旧表。
4. **沙箱每次请求重建 manager**（有论证，但需关注）：`sandbox/tenant_resolver.go` 明确不缓存，连接复用靠共享 `http.Transport` 缓解。高并发 + 多租户下需实测其开销。
5. **`000008` 迁移不可逆**：删除 `h_*` 旧表后 `down` 无法恢复数据，只能整库备份还原；`scripts/kjsc/migrate.sh` 只执行 `up`，没有 `down` 命令。这是可接受的取舍（文档已写明），但上线前必须强制备份门禁。

### P2：工程质量与安全细节

6. **巨型文件**（记录，不做拆分）：`knowledge_process.go` 4055 行、`AgentEditorModal.vue` 6654 行、`WikiBrowser.vue` 6556 行、i18n 单文件 7503 行 × 5；测试文件也有 3448 行。可读性与协作成本高，但拆分会产生大量无意义 diff、抬高后续官方合并成本，故决定保持原样（见十一节行动表）。
7. **示例文件内嵌真实凭据形态**（已修复）：`.env.kjsc.example` 中原先预置了真实形态的 Tavily key（`tvly-dev-…`）、Langfuse 公私钥（`sk-lf-…` / `pk-lf-…`）与 `SANDBOX_PROVISIONER_TOKEN`（64 位 hex）。已全部替换为占位符。文件中保留的 `192.168.x.x` 私有地址属该文件作为内网部署模板的默认值（且非机密），未做替换。
8. **残留配置项**（已清理）：`WEKNORA_SANDBOX_MODE` / `WEKNORA_SANDBOX_TIMEOUT` 曾在 `.env.kjsc.example` 与两个 compose 文件中传递，但 Go 代码两侧均无读取点（全仓 grep 仅命中注释），已从三处删除；`WEKNORA_SANDBOX_DOCKER_ENABLED` 与 `WEKNORA_SANDBOX_DOCKER_IMAGE` 有真实读取点，保留。
9. **术语「空间 / 租户」并存**（评估后不改）：实测上游 `internal/` 自身就有 228 处「空间」，`apps/app-core` 210 处是同源继承，并非企业侧漂移；前端 `zh-CN.ts` 也是「租户」203 处 /「空间」104 处并存。对 app-core 做全量替换会新增约 210 行、38 个文件的**无意义同步 diff**，反而抬高下次上游合并成本。结论：不动注释，仅在新增/手改代码时沿用前端口径（租户）。
10. **i18n 单文件策略与「5 语言行数必须一致」的强约束叠加**：新增一条文案要在 5 个 7503 行文件里同步插入且保持行结构一致，人工极易出错，目前依赖 `localeKeyAudit` / `localeGapScan` 脚本兜底。若要按领域拆文件，需先改造审计脚本。

---

## 十、值得肯定的地方

1. **隔离边界设计教科书级**：独立入口 + 独立配置变体 + 独立迁移版本表 + 独立 Makefile/镜像，官方 `Makefile` 零污染，`config/*_kjsc*` 是纯增量。上游可原样升级配置而不被企业改动绊住。
2. **`config_kjsc.yaml` 与 `config.yaml` 只差一行 `port`** —— 这是「定制靠新增而非改上游」的最强证据。
3. **KJSC 迁移独立版本表 + 失败只告警**：`schema_migrations_kjsc` 与官方迁移互不污染，且支持「缺失中间版本」的锚点恢复。
4. **i18n 纪律严格且有自动化**：5 语言 7503 行 × 5 与 120 行 × 5 完全同构，配套 `localeKeyAudit.ts`（23KB）、`localeGapScan.ts`、`regeneratePrunedLocales.ts` 三个脚本，以及 `check-i18n` / `scan-i18n-gaps` npm 脚本。
5. **后端测试密度高**：852 个测试文件 / 1885 个文件 = 45.2%，`application/service/` 一个目录就有 289 个测试文件。
6. **架构文档质量高**：`docs/plan/amp-unification-20261001.md` 有明确的目标与边界、数据归属表、**「作废的设计」章节**、阶段记录、回滚方案、验收清单——是成熟团队才写得出的文档。`sandbox/tenant_resolver.go` 的「为什么不缓存」论证同理。
7. **安全细节到位**：`SetTrustedProxies` 默认只信 loopback+私网、API Key 与 MCP/数据源凭据 AES-256-GCM 静态加密、SSRF 出站白名单与缓存、`assertAPIKeyPoliciesMatchRoutes` 启动期 fail-fast、embed 域名白名单 + 限流 + Token 交换。
8. **启动链路健壮**：端口释放优先于优雅 drain（保证重启能立即 bind）、二次信号强杀、清理超时可控、`listenWithRetry` 指数退避。
9. **可构建**：`go build ./cmd/app-core` 干净通过。

---

## 十一、行动建议（优先级排序）

| 优先级 | 动作 | 预期收益 | 状态 |
|---|---|---|---|
| P0 | 在 CI 增加 `internal` ↔ `apps/app-core` 漂移报告 + 「文件存在但未注册」定向断言 | 直接消灭 gitlab/ima/exa 这类漏项，把人工比对变成机械检查 | ✅ 已落地 `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh` |
| P0 | 把「上游升级同步 checklist」写入 `docs/plan/`（四个注册点 + 配置加载器 + compose + scripts/kjsc） | 让每次上游同步可重复、可审计 | ✅ 已落地 `docs/plan/upstream-sync-20261001.md` |
| P1 | 修订 AGENTS.md 注释语言条款为「新增/手改部分用中文，随上游复制的代码保持原样」，或启动一次 `app-core` 注释本地化 | 消除规范与现状的显性冲突，让 review 有可判定标准 | ✅ 已修订（取前者，放弃全量本地化） |
| P1 | 清理 Harness 遗留 JS 层，合并 `hooks/` 与 `composables/` | 减少两套实现并存造成的 bug 面 | ✅ 已完成：50 个 harness JS 全部迁 TS（见第十二节「JS→TS 迁移」）；⚠️ 复核发现「hooks 与 composables 重叠」不成立（hooks 仅 3 个文件且无同名，均活跃） |
| P1 | 文档收敛：三套站点明确分工（上游站 / 企业站），修正 `apps/agent-harness/README.md` 的 `h_` 表前缀；`.env.kjsc.example` 凭据全部替换为占位符 | 消除已知漂移与泄漏面 | ✅ `h_`→`amp_`、凭据占位符已改；⏸️ 三套文档站分工暂缓（用户指示先不做） |
| P2 | 拆分 `knowledge_process.go`、`AgentEditorModal.vue`、`WikiBrowser.vue` | 降低维护成本 | ❌ 有意不做：这些是随上游复制/大规模分叉的文件，拆分会产生海量无意义 diff，抬高后续官方合并成本 |
| P2 | 清理 `WEKNORA_SANDBOX_MODE` 等无读取点的残留配置项；统一「空间/租户」注释术语 | 减少认知噪声 | ✅ 残留配置已删（3 处）；❌ 术语统一经评估后放弃，理由见 9 |
| P2 | 对多租户高并发场景实测「沙箱 manager 每请求重建」的开销 | 验证已论证的设计取舍在真实负载下成立 | ⏸️ 暂缓（用户指示先不做） |

---

## 十二、本轮落地记录

针对第十一节中标记为可安全执行的项目，已完成如下改动（已按「一个提交只做一件事」拆分为 4 个 commit 提交，见文末「提交记录」）：

**新增（3 个文件）**

| 文件 | 作用 |
|---|---|
| `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh` | 漂移检测工具：文件级清单 + 两个注册点硬断言（provider 字符串键集合、容器接线 import 集合，带 `WIRING_WHITELIST`）+ `--deep` 归一化内容比对。退出码 0/1 可直接做 CI 门槛。无外部依赖 |
| `docs/plan/upstream-sync-20261001.md` | 上游同步 checklist：四个注册点、已知盲区（pipeline 插件顺序、models provider、types 契约）、配置体系、企业入口核查、验收命令 |
| `docs/plan/project-analysis-20261001.md` | 本报告 |

**修正（5 个文件）**

| 文件 | 改动 |
|---|---|
| `apps/app-core/container/container.go` | **补齐 6 项漏端口注册**：搜索 provider `exa` / `metaso` / `bocha` / `brave`，数据源连接器 `ima` / `gitlab`（文件早已复制，仅差 import + `registry.Register`）。补齐后 `go build ./cmd/app-core` 通过，`gofmt` 干净 |
| `AGENTS.md` | 注释语言条款改为「新增或人工修改的注释用中文；随上游整目录复制的既有英文注释保持原样」，消除规范与现状冲突 |
| `apps/agent-harness/README.md` | 数据隔离表 `h_` 前缀 → `amp_`，并注明由 `000008` 迁移完成 |
| `.env.kjsc.example` | Tavily key、Langfuse `sk-lf-`/`pk-lf-`、`SANDBOX_PROVISIONER_TOKEN` 替换为占位符；删除无读取点的 `WEKNORA_SANDBOX_MODE` / `WEKNORA_SANDBOX_TIMEOUT` |
| `docker-compose-kjsc.yml`、`docker-compose-mac.yml` | 同步删除上述两个死变量的传递行；`docker compose config` 校验通过 |

**验证结果**

- `go build ./cmd/app-core`：通过（约 38s，仅 `ld: ignoring duplicate libraries '-lc++'` 警告）
- `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh`：退出码 0；provider 集合两侧各 13 个、容器接线集合一致；快速模式约 8.5s（已从 `diff -rq` 改为 `find`+`comm`+`cmp`，避免在 7 万文件上超时）
- `--deep`：1354 个分叉文件中 **1286 个仅 import 路径差异**，真正需要人工比对的**实质差异只有 68 个文件**——上游同步的实际工作面远小于文件数给人的印象；企业独有文件 25 个（均为合理定制，含 `_legacy` 沙箱、tenant_add_user、mindmap、model_proxy 等）
- 反向测试：临时删除一个 `registry.Register` 后脚本准确报缺并返回 1，恢复后返回 0

### 十三、JS → TS 迁移（Harness 前端）

用户目标：项目前端不再有 `.js`，全部迁移为 `.ts`。完成情况如下。

**范围与结果**

| 指标 | 数值 |
|---|---|
| 迁移的 `.js` 文件 | 50 个（api 6 + stores 5 + composables 7 + utils 30 + components 工具 2） |
| 迁移后 `vue-tsc` 错误 | 683 → **10**（剩 10 个均为迁移前就存在的 `.vue` 历史错误，与本次无关） |
| 迁移方式 | `git mv` 改名（保留历史），补最小类型标注，import 路径零改动（引用均省略扩展名） |
| 新增文件 | `src/types/shims.d.ts`（为 `markdown-it`/`js-yaml`/`markdown-it-task-lists` 三个无类型依赖补最小声明） |

**保留未迁的 `.js`（2 个）**：`src/wailsjs/go/main/App.js`、`src/wailsjs/runtime/runtime.js` —— Wails 桌面端自动生成物（文件头明确 `DO NOT EDIT`），配套 `.d.ts`，由 Wails 构建时重新生成，不应手动迁移。

**关键澄清（修正报告第十一节的前提判断）**
- 原报告称「Harness 遗留 JS 层与新 TS 实现并存、路由已重定向但文件未删」——**复核后不准确**。这些 `.js` 就是当前生产实现，被 `chat-work`/`workspace`/`mcp`/`skills`/`tools` 等活跃页面直接引用，并非待删的旧代码，只是尚未迁 TS。
- 真正零引用的仅 `api/harness/index.js` 一个（纯转发聚合层），已在迁移中一并改为 `.ts`（保留，因其它导出仍可能被统一入口引用）。
- 「hooks 与 composables 分层重叠」**不成立**：`hooks/` 仅 3 个文件（`useMarqueeSelect`/`useKnowledgeBase`/`useKnowledgeBaseCreationNavigation`），均被活跃引用且 `composables/` 无同名，无重叠。
- 发现真正的技术债：`api/harness/base.js`（旧）与 `api/chat-work/base.ts`（新）是两份**行为有实质差异**的请求封装（旧版走 Pinia store + 真实权限检查 + 401 主动登出；新版走 localStorage + `apiAdminGet` 直接别名无权限检查）。且新代码 `chat-work/agent.ts` 反向依赖旧版 `base.js`。本次迁移**未合并**（属行为改动，需单独评估），仅各自补类型。

**验证**
- `vue-tsc --build`：683 → 10 错误，迁移零新增。
- Vite build：2552 模块 transform 成功（所有 `.ts` 被正确解析），但最终在 `[vite:css] [less]` 阶段因沙箱网络限制报 `connect failed: Connection refused`（less 单测可正常编译，确认是环境而非代码问题），需在本地正常环境跑 `npm run build` 复核。

### 十三·补、复核修正（二次审查发现并修复）

迁移初版由并行子代理补齐类型，二次独立复核发现两处需修正的问题，已修复：

1. **子代理引入 2 处 `as any`（`stores/chatWork.ts`）**：为绕过 `getThreads` 参数类型不匹配，写了 `agentId as string | null as any` 双重断言。根因是 `api/chat-work/agent.ts` 带 `@ts-nocheck`，`getThreads(agentId = null)` 参数被推断为 `null | undefined`，导致严格模式的 `chatWork.ts` 传 `string | null` 报错。**治本修法**：给 `agent.ts` 的 `getThreads` 参数补准确标注 `(agentId: string | null = null, …)`（与其 JSDoc `{string | null | undefined}` 一致）。修复后全项目迁移文件 `as any` 清零，且无 `@ts-nocheck`/`@ts-ignore`/`@ts-expect-error` 偷懒标记。
2. **一度误判 `shims.d.ts` 为「死声明」**：复核时因搜索路径笔误误判其为子代理臆造的无效文件，经删文件验证（删除后 `markdown_preview.ts` 冒出 11 个 TS7016）确认它确为必要——`markdown-it`/`js-yaml`/`markdown-it-task-lists` 三个包均无官方类型声明，该 shim 是正确的最小声明，予以保留。

**遗留技术债（记录，未处理）**：`api/chat-work/agent.ts` 中 `threadApi` 其余方法（`createThread`/`updateThread`/`deleteThread` 等）仍在 `@ts-nocheck` 下无类型，调用方（`chatWork.ts`）仍需 `as ChatThread | null` 返回值断言。本次只修了被 `as any` 污染的一处，其余保持不动（避免扩大改动范围）；彻底消除需给整个 `threadApi` 补完整类型，属独立任务。

---

## 十四、提交记录

以上改动已拆分为 4 个独立提交（遵循 AGENTS.md「一个提交只做一件事、不跨产品线混改」），位于本地 `develop` 分支，尚未 push：

| 提交 | 类型 | 内容 |
|---|---|---|
| `5517869a7` | `fix(app-core)` | 补齐上游同步漏掉的 6 项 provider/connector 注册（exa/metaso/bocha/brave + ima/gitlab） |
| `df67240a3` | `feat(frontend)` | Harness 50 个 `.js` → `.ts` 迁移 + `shims.d.ts` + `agent.ts` 参数类型（55 文件） |
| `53c68ca4d` | `chore(kjsc)` | 漂移检测脚本 + 上游同步 checklist + 本报告（3 文件） |
| `383fc6982` | `chore` | AGENTS.md 注释条款 + README 表前缀 + env 凭据 + compose 死变量（5 文件） |

*第一节至第十一节的结论基于静态阅读与量化统计，均可通过文中给出的文件路径复核；第十二至十三节记录的是按建议执行的修复动作及二次复核修正；第十四节为提交记录。*

---

## 十五、Go 后端熟悉路径（原 BACKEND_GO_LEARN 合并）

> 面向需要快速建立心智模型、深入「知识库解析 / RAG 对话 / 智能体」三条主线的阅读指南。文档 + 代码对照阅读；冲突时以源码为准。

### 15.1 心智模型

后端不是「一堆 handler」，而是：

```text
HTTP(Gin) → Handler → Service → Repository / 外部系统
                ↓
         Asynq Worker（同进程）→ 再回调同一套 Service
```

| 层 | 目录 | 职责 |
|----|------|------|
| 入口 | `cmd/app-core/main.go` | 启服、优雅退出 |
| DI | `apps/app-core/container/container.go` | dig 装配一切 |
| 路由 | `apps/app-core/router/` | URL → Handler |
| Handler | `apps/app-core/handler/` | 参数/鉴权后调 Service |
| Service | `apps/app-core/application/service/` | **业务核心** |
| Repo | `apps/app-core/application/repository/` | GORM |
| 领域 | `apps/app-core/types/` | 实体、任务类型、接口 |
| Agent | `apps/app-core/agent/` | ReAct 引擎 |
| 解析侧车 | `docreader/`（Python gRPC） | 真正读 PDF/Office |

> 企业 Go 后端主体在 `apps/app-core/`（`internal/` 的整目录复制），入口在 `cmd/app-core/`。上游对应路径把 `apps/app-core/` 换成 `internal/` 即可。

### 15.2 三条主线

| 主线 | HTTP / Task 入口 | 核心文件 | 模式 |
|------|------------------|----------|------|
| 解析入库 | 上传 API → `document:process` | `knowledge_create.go` / `knowledge_process.go` | 异步任务 + docreader |
| RAG 对话 | `POST /knowledge-chat/:session_id` | `session_knowledge_qa.go` + `chat_pipeline/` | 固定阶段流水线 |
| 智能体 | `POST /agent-chat/:session_id` | `session_agent_qa.go` + `agent/engine.go` | ReAct 动态调工具 |

### 15.3 各阶段阅读路径

**第 1 阶段：入口与请求链路（约 1 天）**

1. `cmd/app-core/main.go`：`container.BuildContainer` → `Invoke` 拿 `*gin.Engine` → Listen。
2. `apps/app-core/container/container.go` 的 `BuildContainer`：config / DB / Redis / Repo / Service / chat_pipeline 插件 / Handler / Router / Asynq。
3. `apps/app-core/router/router.go` → `NewRouter`：中间件链、`/api/v1` 下 `Register*Routes`。
4. 挑两条路由对照：`routes_knowledge.go`（上传/知识）、`routes_chat.go`（`/knowledge-chat`、`/agent-chat`）。

横切能力（半小时）：`middleware/`（Auth、RBAC、RequestID）、`types/interfaces/`（Service 契约）、`errors/`（错误信封）、`logger/`（日志字段）。

**第 2 阶段：领域模型与存储（约 0.5–1 天）**

先读实体再读流程：`types/knowledge.go`、`types/knowledgebase.go`、`types/chunk.go`、`types/session.go` / `message.go`、`types/task.go`，以及 `migrations/version_kjsc/` 最近几条（表演进）。

**第 3 阶段：知识库解析入库（核心链路 A，约 2–3 天）**

```text
handler/knowledge.go → CreateKnowledgeFromFile
  → service/knowledge_create.go → 写 knowledges 行 → Enqueue asynq: TypeDocumentProcess
```

异步 Worker：`router/task.go` 注册 `ProcessDocument` → `service/knowledge_process.go`（主干，约 3149 行起）。建议按 `ProcessDocument` 幂等 → `callDocReaderWithTimeout`（调 docreader gRPC）→ `convert` → `processChunks`（切块、落库、向量化）→ 后置任务（摘要/问题/图片/打标/Wiki ingest）顺序读，不要通读整文件。

侧车解析：Go 客户端 `infrastructure/docparser/`，Python `docreader/main.py`、`docreader/parser/`，分块 `infrastructure/chunker/` + `docs/CHUNKING.md`。

**第 4 阶段：对话 / RAG 核心（核心链路 B，约 2–3 天）**

两条 HTTP 入口在 `router/routes_chat.go`：

| API | Handler | Service |
|-----|---------|---------|
| `POST /knowledge-chat/:session_id` | `handler/session/qa.go` → `KnowledgeQA` | `session_knowledge_qa.go` |
| `POST /agent-chat/:session_id` | 同上 → `AgentQA` | `session_agent_qa.go` |

RAG 推荐阅读顺序（与代码一致）：

```text
LOAD_HISTORY（可选）→ QUERY_UNDERSTAND → CHUNK_SEARCH_PARALLEL
→ CHUNK_RERANK → WEB_FETCH（可选）→ CHUNK_MERGE → FILTER_TOP_K
→ DATA_ANALYSIS（可选）→ INTO_CHAT_MESSAGE → CHAT_COMPLETION_STREAM
```

框架胶水：`chat_pipeline/chat_pipeline.go`（Plugin / EventManager）。模型适配 `models/chat/`，检索 `application/repository/retriever/*`。

**第 5 阶段：智能体 Agent（核心链路 C，约 2 天）**

1. `handler/session/qa.go` → `AgentQA`；2. `session_agent_qa.go` 准备 AgentConfig、工具注册、历史；3. `agent/engine.go` → `Execute`（ReAct 主循环）；4. 同包 `think.go` / `act.go` / `observe.go` / `finalize.go`；5. 工具箱 `agent/tools/`（先读 `knowledge_search.go`）；6. 自定义 Agent `handler/custom_agent.go`；7. MCP `apps/app-core/mcp/`。

**第 6 阶段：横向加深（按需）**

租户/RBAC（`routes_auth_tenant.go`）、模型管理（initialization / model service）、数据源同步（`datasource_service.go`）、Wiki（`TypeWikiIngest`）、IM/Embed（`im/`）、可观测（Langfuse span）、公司定制（对照 `apps/` 与 Jenkins）。

### 15.4 阅读纪律

1. 永远先找 HTTP/Task 入口再往下钻，不要从 `knowledge_process.go` 中间跳读。
2. 大文件只读「函数目录 + 主干函数」。
3. 用一条真实请求串起来：上传 → 看 DB parse_status → 再发 knowledge-chat → 看日志 stage。
4. 接口优先于实现：先看 `types/interfaces` 再跳具体 struct。
5. 文档当地图、代码当真相：不一致以源码为准。

### 15.5 最小必读文件清单

```text
cmd/app-core/main.go
apps/app-core/container/container.go            # 扫阶段即可
apps/app-core/router/router.go
apps/app-core/router/routes_knowledge.go
apps/app-core/router/routes_chat.go
apps/app-core/router/task.go
apps/app-core/types/task.go
apps/app-core/handler/knowledge.go              # CreateKnowledgeFromFile
apps/app-core/application/service/knowledge_create.go
apps/app-core/application/service/knowledge_process.go   # ProcessDocument
apps/app-core/handler/session/qa.go
apps/app-core/application/service/session_knowledge_qa.go
apps/app-core/application/service/session_agent_qa.go
apps/app-core/application/service/chat_pipeline/*.go     # 按 stage
apps/app-core/agent/engine.go
apps/app-core/agent/tools/knowledge_search.go
```
