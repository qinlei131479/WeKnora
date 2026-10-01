# 企业版相对上游 WeKnora 的功能差异盘点

> **状态：持续维护** — 本文为差异盘点档案，非一次性执行计划；每次同步上游或改动企业代码后需同步更新，保持与现状一致。
>
> 对照基准：
> - 上游前端 `frontend/` ↔ 企业前端 `apps/frontend/`
> - 上游后端 `internal/`（+ `cmd/server/`）↔ 企业后端 `apps/app-core/`
> - 上游**无对应**，企业完全新增 `apps/agent-harness/`（Python FastAPI）
>
> 生成时间：2026-10-01。维护方式：每次上游升级合并后，同步更新本文件。

---

## 一、总览：三条产品线的定位与改动性质

| 产品线 | 上游基准 | 改动性质 | 冲突风险 |
| --- | --- | --- | --- |
| `apps/frontend` | `frontend/` | **同目录并存**：上游功能整体保留，企业新增页面/目录，并隐藏少量上游能力 | 中——同名文件较多，隐藏/菜单项改动易与上游冲突 |
| `apps/app-core` | `internal/` | **整目录复制 + 25 个企业独有文件 + `*_kjsc` 配置变体** | 高——1354 个同名文件，靠配置变体与漂移脚本管理 |
| `apps/agent-harness` | **无上游对应** | 完全自研 Python 后端，承接工作模式对话、MCP/Skill/Tool、数据总览等 | 低——上游合并不涉及，但依赖 app-core 的契约 |

---

## 二、frontend（apps/frontend vs frontend）

### 2.1 企业新增功能（上游完全没有）

新增目录与路由（`apps/frontend/src/router/index.ts`）：

| 新增目录 | 路由 | 功能 |
| --- | --- | --- |
| `views/chat-work/` | `/platform/chat-work`、`/platform/chat-work/:thread_id` | **工作模式对话**（区别于上游 `chat` 平台对话，两套会话体系并存） |
| `views/dashboard/` | `/platform/dashboard` | **数据总览 / 工作台**（用量统计、图表，`chart.ts` + `components/`） |
| `views/workspace/` | `/platform/workspace` | **工作台**（`WorkspaceSidebar.vue` 等） |
| `views/skills/` | `/platform/skills`、`/platform/skills/:slug` | **技能工具**（Skill 卡片列表 + 详情） |
| `views/tools/` | `/platform/tools` | **工具**（ToolsCardList） |
| `views/mcp/` | `/platform/mcp`、`/platform/mcp/:slug` | **MCP 服务管理**（McpCardList + 详情） |

新增配套代码：

- **api 层** `apps/frontend/src/api/chat-work/`（7 文件）：`agent.ts`、`base.ts`、`dashboard.ts`、`mcp.ts`、`skill.ts`、`tool.ts`、`workspace.ts` —— 工作模式对话的专属请求封装。
- **store 层**：`stores/chatWork.ts`、`stores/chatEngine.ts`、`stores/harness/`（`agent.ts`、`chatUI.ts`、`theme.ts`、`user.ts`）。
- **composables 层** `composables/harness/`（7 文件）：`useAgentRunStream.ts`、`useAgentRequestQueue.ts`、`useAgentStreamHandler.ts`、`useApproval.ts`（工具审批）、`useStreamSmoother.ts`、`useAgentMentionConfig.ts`、`useAgentThreadState.ts`；另 `useChatEngineNav.ts`、`chatEngineRoutes.ts`、`useListSurface.ts`。
- **组件层**：`components/harness/`、`components/ChatEngineSegmented.vue`、`components/ThemeToggle.vue`、`components/LanguageSwitch.vue`、`components/FontSizeSelect.vue`。
- **类型**：`types/shims.d.ts`（markdown-it / js-yaml 等第三方最小声明）。

> 说明：`chat-work`（工作模式）与上游 `chat`（平台对话）是**两套会话体系**，按产品边界不合并（见 AGENTS.md）。

### 2.2 企业隐藏的上游功能（上游有、企业删除/隐藏）

| 上游文件/能力 | 企业状态 | 说明 |
| --- | --- | --- |
| `views/settings/WeKnoraCloudSettings.vue` | **已删除** | 隐藏 WeKnora Cloud 云服务入口 |
| `views/settings/StorageEngineSettings.vue` | **已删除** | 存储引擎设置页 |
| `views/settings/GeneralSettings.vue` | **已删除** | 通用设置页 |
| 多处 `*.test.ts` / `*.test.mjs` 测试文件 | **已删除** | 企业侧未同步上游测试文件（`BrowserSearchPreferences.test.ts`、`McpSettings.test.ts`、`SkillSettings.test.mjs` 等） |

> 注意：删除上游文件是冲突高发点——上游升级若修改这些被删文件，合并时需保持「继续删除」而非恢复。

### 2.3 上游功能企业保留但调整

- **菜单/导航**：`components/menu.vue` 中新增 `skills` / `workspace` / `dashboard` / `chat-work` 等菜单项与图标映射（`harness-workspace`、`harness-dashboard`、`skills-tools` 等）。
- **路由**：`router/index.ts` 新增上述路由，并保留上游全部路由（`chat`、`creatChat`、`agent`、`knowledge-bases` 等）。
- **i18n**：五种语言（`zh-CN` / `en-US` / `ko-KR` / `ja-JP` / `ru-RU`）与上游一致，企业新增文案需五语言同步补齐（见 AGENTS.md 国际化条款）。

### 2.4 前端冲突规避要点（升级合并时）

1. **被删文件清单**（2.2 节）是「持续删除」清单——上游改动到这些文件时，合并结果仍是删除，勿恢复。
2. **新增文件/目录**（2.1 节）不与上游冲突（上游不会生成同名路径）。
3. **同名文件**（如 `menu.vue`、`router/index.ts`、`App.vue`、`Settings.vue` 等）是冲突高发区，需人工对比合并企业新增的菜单/路由段。

---

## 三、app-core（apps/app-core vs internal）

### 3.1 结构关系

`apps/app-core/` 是 `internal/` 的**整目录复制**（漂移报告：同名文件 1354 个、企业独有 25 个、上游新增未端口 0 个、注册点一致）。上游同步方式：把 `internal/` 变更整体复制到 `apps/app-core/`，再叠加企业定制。

### 3.2 企业独有文件（25 个，相对 internal 新增）

按功能归类：

| 归类 | 文件 | 功能 |
| --- | --- | --- |
| **Skill 服务** | `application/service/skill_service.go`、`types/interfaces/skill.go`、`agent/tools/builtin_directory.go` | 技能（Skill）服务层与内置工具目录 |
| **租户增员** | `application/service/tenant_add_user.go`、`handler/tenant_add_user.go`、`router/routes_kjsc_tenant_add_user.go` | 租户添加成员接口 |
| **模型代理** | `handler/model_proxy.go` | 模型代理处理 |
| **知识库脑图** | `handler/knowledgebase_mindmap.go` | 知识库思维导图能力 |
| **会话解析** | `handler/session/internal_parse.go` | 会话内部解析 |
| **Token 压缩** | `agent/token/compress.go` | 上下文 Token 压缩 |
| **图片需求** | `agent/image_requirement.go` | 图片需求（finalize_image_requirement） |
| **记忆整合** | `agent/memory/consolidator.go` | 记忆整合器 |
| **沙箱旧版** | `sandbox/_legacy/{docker,local,local_unix,local_windows}.go` | 沙箱旧实现（保留 `_legacy` 标记） |
| **旧版技能工具** | `agent/tools/_legacy/{skill_execute,skill_read}.go` | 旧版技能执行/读取工具（`_legacy` 标记） |
| **租户沙箱配置** | `types/tenant_sandbox_config.go` | 租户级沙箱配置类型 |
| **测试文件** | `agent/finalize_image_requirement_test.go`、`agent/memory/consolidator_test.go`、`agent/tools/builtin_directory_test.go`、`config/config_precedence_test.go`、`config/server_env_test.go`、`database/migration_kjsc_test.go` | 企业侧测试 |

> 注：`_legacy` 前缀目录（`sandbox/_legacy`、`agent/tools/_legacy`）是历史遗留保留，升级时注意不要与上游同名功能冲突。

### 3.3 配置变体（企业入口，不改上游 config/）

| 企业侧维护入口 | 说明 |
| --- | --- |
| `config/config_kjsc.yaml` | 运行配置，支持 `${VAR:-default}` 展开（上游 `config.yaml` 为默认值，不得改回） |
| `config/builtin_agents_kjsc.yaml` | 内置智能体配置 |
| `config/prompt_templates_kjsc/` | 提示词模板 |
| `.env.kjsc.example` | 环境变量样例 |
| `Makefile.kjsc` | 构建入口（app/frontend/harness/infra 等 target） |
| `docker-compose-kjsc.yml`、`docker-compose-mac.yml` | 编排（删除了上游死变量 `WEKNORA_SANDBOX_MODE/TIMEOUT`） |
| `scripts/kjsc/` | 含 `drift_report.sh`（漂移报告脚本）等 |
| `migrations/version_kjsc/` | **企业数据库迁移**（表/字段变更必须在此新增 SQL，`.up.sql` + `.down.sql` 成对） |

### 3.4 冲突规避要点

1. **上游 `config/`、`internal/`、`cmd/server/` 不改**；官方新增配置项先补到 `config_kjsc.yaml`，不改上游 `config/`。
2. **数据库变更**只进 `migrations/version_kjsc/`，禁止 ORM 自动建表代替迁移文件。
3. **同步上游后**必须检查配置加载器、`docker-compose-kjsc.yml`、`scripts/kjsc/*`、`.env.kjsc.example` 是否仍指向 KJSC 变体。
4. 用 `bash scripts/kjsc/drift_report.sh` 定期核对 `internal` ↔ `apps/app-core` 的漂移（含注册点硬断言）。

---

## 四、agent-harness（apps/agent-harness，完全自研）

### 4.1 定位

上游**没有**对应实现。`apps/agent-harness/` 是企业自研的 **Python（FastAPI）后端**，服务端口 `:9990`，承接**工作模式对话**的完整后端能力，与 app-core（Go，`:9980`）并存。前端经 `/harness-api` 前缀反代。

### 4.2 功能模块清单

**HTTP 路由层** `server/routers/`（13 个 router）：

| Router | 功能 |
| --- | --- |
| `agent_router.py` | 智能体（Agent）CRUD |
| `chat_router.py` | 对话 / 会话 / 线程（SSE 流式） |
| `dashboard_router.py` | 数据总览 / 用量统计 |
| `workspace_router.py` | 工作台 |
| `mcp_router.py` | MCP 服务管理 |
| `skill_router.py` | 技能管理 |
| `tool_router.py` | 工具管理 |
| `model_provider_router.py` | 模型供应商 |
| `system_router.py` | 系统 |
| `user_router.py` | 用户 |
| `auth_router.py` | 认证 |
| `filesystem_router.py` | 文件系统 |
| `viewer_filesystem`（service） | 查看器文件系统 |

**服务层** `package/yuxi/services/`（约 24 个 service）：

- 对话：`chat_service.py`、`conversation_service.py`、`input_message_service.py`、`mention_search_service.py`
- 智能体运行：`agent_run_service.py`、`agent_runtime_service.py`、`subagent_run_service.py`、`run_worker.py`、`run_submission_service.py`、`run_queue_service.py`、`agent_request_queue_service.py`
- MCP / Skill：`mcp_service.py`、`mcp_oauth.py`、`skill_service.py`（在 agents/skills）、`file_preview.py`
- 工作台 / 数据：`workspace_service.py`、`dashboard`（`stats.py`）
- 身份 / 多租户：`user_identity_service.py`、`weknora_identity_service.py`、`tenancy/`（`context.py`、`resolve.py`、`schema.py`、`integrity.py`、`backfill.py`、`tenant_query.py`）
- 其他：`operation_log_service.py`、`usage_telemetry.py`、`chat_usage_sync.py`、`langfuse_service.py`、`thread_files_service.py`、`viewer_filesystem_service.py`

**智能体引擎** `package/yuxi/agents/`：

- `base.py`、`context.py`、`models.py`、`state.py`
- `backends/`：`knowledge_base_backend.py`、`skills_backend.py`、`composite.py`、`sandbox/`
- `buildin/`：`chatbot/`、`subagent/`
- `mcp/`：`service.py`
- `skills/`：`service.py`、`repository.py`、`remote_install.py`、`buildin/`
- `toolkits/`：`service.py`、`registry.py`、`buildin/`、`kbs/`、`debug/`、`utils.py`
- `middlewares/`：`context.py`、`skills.py`、`summary.py`、`dynamic_tool.py`、`steer.py`、`token_usage.py`、`attachment.py`、`model_input.py`、`subagent_task.py`
- `tool_approval.py`（**工具审批**）

**知识库** `package/yuxi/knowledge/`：`base.py`、`factory.py`、`manager.py`、`runtime.py`、`schemas.py`、`read_models.py`、`cache.py`、`chunking/`、`parser/`、`graphs/`、`implementations/`、`utils/`

**数据层** `package/yuxi/repositories/`：`agent_repository.py`、`agent_run_repository.py`、`conversation_repository.py`、`mcp_service_repository.py`、`knowledge_base_repository.py`、`knowledge_file_repository.py`、`user_repository.py`、`subagent_thread_repository.py` 等。

**与 WeKnora 集成** `package/yuxi/weknora/`：`client.py`、`ids.py`、`mapping.py`、`flags.py`、`errors.py`、`virtual.py`、`kb_fulltext.py`。

**权限 / 认证** `package/yuxi/permissions/`（`resource_permission.py`）、`auth/`（`request_token.py`、`run_token_store.py`、`token_status.py`）。

### 4.3 冲突规避要点

1. agent-harness **无上游对应**，上游合并不产生直接冲突。
2. 但它**依赖 app-core / WeKnora 的接口契约**（身份 JWT、知识库体系、`/api/v1` 契约），app-core 升级时需确保契约不被破坏（见 `appcore-to-python-20261001.md` 的契约不变原则）。
3. 数据库为独立库 `agent-middle`，与 app-core 的 `migrations/version_kjsc/` 分离，需分别维护。

---

## 五、升级合并的冲突规避清单（速查）

| 维度 | 关键点 | 动作 |
| --- | --- | --- |
| 前端被删文件 | `WeKnoraCloudSettings.vue`、`StorageEngineSettings.vue`、`GeneralSettings.vue` 及若干测试文件 | 上游改动这些文件时，合并结果保持「删除」 |
| 前端新增文件 | `views/{chat-work,dashboard,workspace,skills,tools,mcp}` 及配套 api/store/composable | 上游不会生成同名，无需处理 |
| 前端同名文件 | `menu.vue`、`router/index.ts`、`App.vue`、`Settings.vue` | 人工合并企业新增菜单/路由段 |
| app-core 企业独有 | 25 个文件（Skill 服务、租户增员、模型代理、脑图、Token 压缩、`_legacy` 等） | 上游复制后叠加，勿覆盖 |
| app-core 配置 | `config_*_kjsc*`、`Makefile.kjsc`、`docker-compose-kjsc.yml`、`.env.kjsc.example`、`scripts/kjsc/*` | 只改这些企业入口，不改上游 `config/` |
| app-core 迁移 | `migrations/version_kjsc/` | 企业表/字段变更只进此目录 |
| 漂移核对 | `internal` ↔ `apps/app-core` | 定期跑 `bash scripts/kjsc/drift_report.sh` |
| agent-harness | 无上游对应，依赖 app-core 契约 | app-core 升级时验证契约不破坏 |
