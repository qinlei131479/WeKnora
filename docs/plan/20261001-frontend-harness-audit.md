# apps/frontend 与 apps/agent-harness 维护性审计（appcore-to-python 前置）

> **状态：已完成** — 分析结论可用；「可删除」清单为建议，执行前需按 AGENTS.md 逐项人工确认，禁止夹带进迁移批次。

**目的：** 两个长期维护模块的死代码 / 优化空间 / 可删项盘点，为 `20260914-appcore-to-python.md` 阶段二（Go `/api/v1` 迁 Python）做前置清障与 B0 契约冻结数据准备。

**方法：** 依赖图可达性分析（从 `main.ts` / `embed-main.ts` 传播）+ ripgrep 全量引用复核 + 关键结论人工二次验证（grep 定向复核，排除同名本地标识符误报）。全程只读，未改任何代码。

---

## 一、apps/frontend

### 1.1 确认零引用可删（已人工复核）

| 文件                                | 行数 | 依据                                                            |
| --------------------------------- | -- | ------------------------------------------------------------- |
| `src/i18n/locales/embed/index.ts` | 18 | 纯转发 shim（`export {} from '@/i18n/embed'`），全仓零 import，目标已被直接引用 |
| `src/utils/_repro_gap.mjs`        | 15 | 临时复现脚本，`utils/` 下唯一散落 .mjs，零引用                                |

### 1.2 仅被自己的 .test.ts 引用（生产入度=0，二选一：接线或删）

| 文件                             | 行数  | 说明                                                                                                     |
| ------------------------------ | --- | ------------------------------------------------------------------------------------------------------ |
| `src/api/model/modelUsage.ts`  | 182 | 「模型被 KB/Agent 引用禁止删除」完整实现，疑似功能未接线（`RuntimeQueues.vue` 的 `modelUsage` 是本地同名函数，非引用）。**删模型流程是否应调用，需产品确认** |
| `src/config/settingsRoute.ts`  | 73  | 逻辑已在 `Settings.vue:280/297` 内联复制一份，属重复实现                                                               |
| `src/utils/contextWindow.ts`   | 44  | 导出全无生产使用（`ChatWorkPanel.vue` 的 `contextWindow` 是本地变量）                                                  |
| `src/utils/sessionMarkdown.ts` | 143 | 会话导出 Markdown 能力未接线                                                                                    |

**失效脚本：** `package.json` 的 `check-i18n` 指向不存在的 `src/i18n/localeKeyAudit.test.ts`，已失效，需修复（补文件）或删脚本行。

**易误判项（勿删）：** `utils/harness/mention_token.ts` 以 `'./mention_token.js'`（.js 指 .ts 的 ESM 写法）被引用，常规 grep 会误判零引用；`types/shims.d.ts` 天然无 import，属环境声明。

### 1.3 可优化项（长期维护成本主体，非死代码）

1. **两代工具结果渲染体系并存（最大去重目标，约 7700 行）**：
   - 旧：`views/chat/components/tool-results/*`（23 文件 / 3500 行）← `ToolResultRenderer` ← `AgentStreamDisplay.vue`，服务 `/platform/chat/:chatid`
   - 新：`components/harness/ToolCallingResult/*`（26 文件 / 4197 行）← `ToolCallRenderer` ← `ToolCallsGroupComponent.vue`，服务 `/platform/chat-work`
   - 两者均在线上使用。B9 迁移后若 chat 页与 chat-work 页后端统一，可评估合并。
2. **6 组高相似度重复**（行相似度）：`useChatCitationPopover`(261) vs `useEmbedCitationPopover`(211) 0.67；`AgentShareSettings`(283) vs `KBShareSettings`(336) 0.57；`BatchTagDialog`(535) vs `TagEditDialog`(540) 0.56；`AgentCreateContextualGuide`(174) vs `KbCreateContextualGuide`(202) 0.41；`AgentAvatar`(160) vs `SpaceAvatar`(185) 0.39；3 个 MySQL 工具卡 0.62–0.79 可抽基类。
3. **54 个 >1000 行大文件**（Top5：`AgentEditorModal.vue` 6654、`WikiBrowser.vue` 6556、`FAQEntryManager.vue` 5765、`ChatWorkPanel.vue` 4720、`KnowledgeBase.vue` 4565）。拆分已被用户明确搁置（避免抬高上游合并成本），仅记录。
4. **3 处 `@ts-nocheck`**：`components/doc-content.vue`(3291 行)、`components/document-preview.vue`(1244 行)、`api/chat-work/agent.ts`。
5. `console.log` 残留 78 处 / 16 文件（`Input-field.vue` 16 处最多），建议 lint 禁止。
6. i18n 单文件巨型化：5 locale 各 7503 行 + `embed.ts` 2141 行；五语言行数一致性 ✓（7503/7503/7503/7503/7503，backend 120×5）。
7. 拼写遗留：`views/creatChat/`（应为 createChat），改名涉及路由，暂不动。

### 1.4 关键数据

views 165 文件 / 123785 行（体量最大）；components 145 / 64144；utils 120 / 13807；api 40 / 9285；composables 37 / 7323；stores 25 / 4604；i18n 21 / 41692。孤立 view = 0，路由 ↔ view 对照无孤儿。

---

## 二、apps/agent-harness

### 2.1 确认零引用可删（已人工复核；按迁移红线，删除单列审批、不夹带迁移批次）

| 对象                                                               | 行数 | 依据                                                                          |
| ---------------------------------------------------------------- | -- | --------------------------------------------------------------------------- |
| `package/yuxi/services/user_identity_service.py`                 | 22 | 零引用，身份逻辑已由 `weknora_identity_service.py` 承担                                 |
| `package/yuxi/agents/middlewares/context.py`                     | 25 | `context_aware_prompt`/`context_based_model` 无调用点，未进 chatbot/subagent graph |
| `package/yuxi/agents/middlewares/dynamic_tool.py`                | 69 | `DynamicToolMiddleware` 全仓无实例化                                              |
| `package/yuxi/agents/toolkits/debug/`（整包）                        | 3  | 空壳：`__all__=[]`、`tools.py` 0 行，仅 `toolkits/__init__.py` import 占位           |
| `inject_attachment_context` 弃用别名（`middlewares/attachment.py:89`） | —  | 自注释「已废弃」，仅 `__init__.py` 导出无外部调用                                            |
| `test/integration/api/test_settings_router.py`                   | 23 | 测已删除的 `/api/settings/rerankers`，死测试                                         |

**破损代码（优先级最高的「隐性炸弹」）：**

- `package/yuxi/knowledge/base.py:1053`：`repair_missing_file_stats()` 内 `from yuxi.repositories.knowledge_chunk_repository import KnowledgeChunkRepository` —— 该 repository 文件**不存在**（repositories/ 仅 9 个）。且全链路（base.py 定义 → manager.py:1031 包装）**无任何外部调用者**，属「死了但会炸」的路径：一旦被调用立即 ImportError。处置：要么删除整条路径，要么补上缺失 repository。
- `test/unit/config/test_runtime_config_sync.py:67` 断言引用不存在的 `yuxi.knowledge.parser.factory`，恒 False 的陈旧断言。

### 2.2 疑似未用需确认

| 对象                                              | 行数  | 说明                                                                  |
| ----------------------------------------------- | --- | ------------------------------------------------------------------- |
| `yuxi/knowledge/utils/mindmap_utils.py`         | 570 | 仅测试保活；生产已用 `models/weknora_proxy.get_or_generate_mindmap()`，疑为旧实现残留 |
| `yuxi/knowledge/utils/sample_question_utils.py` | 143 | 仅测试保活，疑为已下线功能                                                       |
| `yuxi/knowledge/parser/`（unified.py 24 行）       | 24  | 仅被一个「断言该 API 已删除」的测试当锚点，历史遗留目录                                      |
| `yuxi/models/providers/repository.py`           | 23  | 全桩（list→[]、get→None、其余 raise），原生供应商表已删后的兼容空壳                        |

### 2.3 结构与承接现状

- 路由层：12 router 全部已注册，**无「文件存在未注册」**。挂载 `/api`（外部 `/harness-api/api/*`）。
- worker：**仅注册 1 个任务** `process_agent_run`（run_type ∈ chat/resume/subagent）。Go 端 20 类后台任务（document:process、kb:clone、datasource:sync、wiki:ingest…）**全部未注册** —— B3/B6/B7 的最大空白之一。
- 9 个 repository 全部有生产使用；24 个 service 仅 `user_identity_service` 零引用。
- agents 引擎 23901 行，无 `_legacy` 命名目录（不同于 Go 侧）。
- **office 技能脚本三份重复，但不能去重**：`agents/skills/buildin/{docx,pptx,xlsx}/scripts/office/` 各 61–62 文件 / 2916 行，md5 完全一致（≈5832 行冗余）。**已核实不可去重**：技能目录由 `skills/service.py` 以 `shutil.copytree(source_dir, ..., symlinks=False)` 整体拷入 `save_dir` 再挂给沙箱（`service.py:747/856/1321/1372`），且 `service.py:726` 会跳过含符号链接的技能目录（`_dir_contains_symlink`），SKILL.md 也声明「脚本路径相对本技能目录」——改成共享目录或软链会直接破坏技能装载。已在 `buildin/__init__.py` 加中文注释固化该约束。
- 超大文件 5 个：`agents/skills/service.py` 2192、`services/chat_service.py` 1470、`knowledge/manager.py` 1321、`knowledge/base.py` 1301、`services/agent_run_service.py` 1049。
- 两套 MCP 层（`services/mcp_service.py` 平台 vs `agents/mcp/service.py` 840 行运行时）+ `mcp_oauth.py` 与 `tool_approval.py` 职责交叉，B7 前建议先划清边界。

### 2.4 关键数据

server 20 py / 4051 行；yuxi 235 py / 50409 行；test 132 py（unit 108 / integration 14 / e2e 9 / api 占位 1）；git 跟踪 558 文件。

---

## 三、B0 契约冻结数据（前端调用面 × Go 路由 × Python 路由）

### 3.1 网关事实

- nginx（`docker/config/nginx.frontend.conf:117,142`）+ vite dev 同构：`/api/` → Go :9980；`/harness-api/` → Python :9990（rewrite 剥前缀，浏览器 `/harness-api/api/xxx` → FastAPI `/api/xxx`）。

### 3.2 前端调用面二分

| 链路                    | 封装                                                                                   | 规模                               |
| --------------------- | ------------------------------------------------------------------------------------ | -------------------------------- |
| Go `/api/v1`          | `utils/request.ts` axios（baseURL 同源 + JWT/X-Tenant-ID/X-Request-ID + 401 refresh 重放） | **27 个 api 文件 / 约 342 个 URL 模式** |
| Python `/harness-api` | `api/chat-work/base.ts` fetch + `harnessUrl()`（Bearer 头）                             | **9 个文件 / 约 53 个 URL 模式**        |

调 Go 的重头：knowledge-base 57 模式、system 41、organization 27、embed 21、mcp-service 20、initialization 18、wiki 17、chat 15、agent 13、datasource 14、memory 14、auth 16、tenant 23。

**⚠️ 契约坑（必须写入 B0 文档）：`harnessUrl()` 把一切以 `/api` 开头的 URL（含 `/api/v1/*`）改写为 `/harness-api/api/v1/*`。** 当前无人踩坑，但 B1–B9 切流后若该封装被复用于已迁移路由，请求会被错误打到 harness 挂载点。

### 3.3 Go 34 路由组 × Python 现状重叠

| Go 前缀                              | Python 近似实现                                        | 关系                                                               |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------- |
| `/auth`                            | `/api/auth`（仅 login）                               | 同名前缀不同体系，B5 扩展时并存避让                                              |
| `/mcp-services`                    | `/api/system/mcp-servers`（19 端点，最完整参照）             | 领域近似、路径与 ID 语义不同（数字 id vs slug）；按计划不合并，新挂 `/api/v1/mcp-services` |
| `/skills` + catalog                | `/api/skills` + `/api/system/skills`（29 端点）        | 部分重叠（sandbox-configs skills 子树两边都有），不合并                          |
| `/models`、`/models/providers`      | 仅 `GET /api/system/model-providers/models/v2` 只读代理 | B1 基本全缺                                                          |
| `/system`                          | `/api/system`（仅 health，已占用）                        | 前缀撞名风险，B1 需在同一 prefix 下共存                                        |
| `/agent`（tool-approvals/mcp-oauth） | `/api/agent`（21 端点）                                | 同前缀不同用途，B9 避让既有路径                                                |
| `/sessions`                        | `/api/chat/threads`                                | 概念近似、模型不同，仅参考 SSE 范式                                             |

**完全缺失（Python 零基础）：** `/tenants`、`/me/invitations`、`/me/env-vars`、`/knowledge-bases` 全家、`/knowledge`、`/chunks`、`/chunker`、`/messages`、`/knowledge-chat`、`/agent-chat`、`/knowledge-search`、`/internal`、`/initialization`、`/evaluation`、`/web-search*`、`/vector-stores`、`/storage-backends`、`/datasource`、`/agents`（CustomAgent 全套）、`/user/favorites`、`/organizations`、`/embed-channels`、`/im-channels`、`/wechat`、`/im`、`/embed/:channel_id` 公开面、wiki、`/memory`、`/system/admin`、`/files*`、`/r/:token`、`/local-browser`、sandbox terminal WS。  
**不迁：** `/weknoracloud`（冻结）；`/dashboard`、`/workspace`（Python 独占，Go 无对应）。


### 3.4 SSE 契约关键点（B9 验收比对清单）

**Go 侧（迁移对象）：**

1. `useStream`（`api/chat/streame.ts:163`，fetchEventSource）：`POST /api/v1/knowledge-chat/{id}`、`POST /api/v1/agent-chat/{id}`（`views/chat/index.vue:900`）；`GET /api/v1/sessions/continue-stream/{id}`（断连续跑，`index.vue:664`）；Embed 变体 `POST /api/v1/embed/{cid}/agent-chat|knowledge-chat/{sid}`（`useEmbedChatSession.ts:302`，`Authorization: Embed <token>` + X-Embed-Session/X-Embed-Visitor）。
2. Skill 安装进度：`GET /api/v1/sandbox-configs/{cid}/skills/{sid}/install-events`（`useConfigSkillInstallProgress.ts:70`、`SandboxSkillsPanel.vue:1160`）。
3. Skill transcript 直播：`GET .../transcript`（`SkillInstallTimeline.vue:229`，404 回落历史消息）。
4. API Playground：`ApiIntegrationSettings.vue:1486` 裸 fetch `POST /agent-chat/{sid}`（X-API-Key、channel=api），`apiPlaygroundSSE.ts:86` 手工解析 data 帧，终态 `complete|answer(done)|error` + `[DONE]` 哨兵。

**Python 侧（B9 期间保持原样，不得破坏）：** `GET /harness-api/api/agent/runs/{id}/events`（Last-Event-ID 断线恢复）、`GET .../requests/{id}/events`、`POST /harness-api/api/chat/call`。

---

## 四、行动建议（按优先级）

1. **修复隐性炸弹**（迁移前必须）：处置 `knowledge/base.py:1053` 破损 import（建议直接删 `repair_missing_file_stats` 全链路，全仓无调用者）；修复或删除 `check-i18n` 失效脚本。
2. **安全删除清单**（低风险、单列一个 PR）：前端 2 个零引用文件 + harness 4 项零引用对象 + 1 个死测试 + 陈旧断言。合计 <200 行。
3. **待产品/人工确认后再动**：`modelUsage.ts`（是否本应接线到删模型流程）、4 个测试孤岛模块、`providers/repository.py` 空壳、mindmap/sample_question/parser 三个仅测试保活模块。
4. **B0 前的结构去噪**：office 脚本三副本抽公共包（-5832 行，纯机械、无行为差异，收益最大）；`settingsRoute.ts` 二选一。
5. **写入 B0 契约文档的三个坑**：`harnessUrl()` 的 `/api` 前缀改写行为；`/api/system/health` 与 Go `/api/v1/system/*` 前缀共存；Python worker 单任务现状 vs Go 20 类任务的注册缺口。
6. **暂不做**：大文件拆分（用户已搁置）、两代工具渲染体系合并（待 B9 后端统一后再评估）、creatChat 改名。

---

## 五、本轮执行记录（2026-10-01）

### 5.1 已执行

| 项         | 内容                                                                                                                                                                                           | 验证                                                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 破损 import | 删 `knowledge/base.py` 的 `repair_missing_file_stats`（87 行）+ 其独占辅助 `_should_repair_file_stats`、`INDEXED_STATS_STATUSES`、`_fill_missing_file_sizes_for_records`；删 `knowledge/manager.py` 同名包装方法 | py_compile 通过；全仓零残留引用；`pytest test/unit/config/test_runtime_config_sync.py test/unit/knowledge/{test_knowledge_manager_ownership,test_knowledge_base_update}.py` = **23 passed** |

| harness 零引用 | 删 `services/user_identity_service.py`、`middlewares/context.py`、`middlewares/dynamic_tool.py`、`toolkits/debug/`（空壳包）；同步清 `middlewares/__init__.py` / `toolkits/__init__.py` 导入与 `__all__`、`toolkits/service.py` 注释；删弃用别名 `inject_attachment_context` | 导入烟测通过（middlewares `__all__` 收敛为 5 项，`toolkits.debug` 已消失）；`save_attachments_to_fs` 仍被 chatbot/subagent 两个 graph 正常消费 |  
| 死测试 | 删 `test/integration/api/test_settings_router.py`（测已删除的 `/api/settings/rerankers`） | — |  
| 陈旧断言 | `test/unit/config/test_runtime_config_sync.py` 去掉指向不存在模块的 `factory_loaded` / `parser_loaded` 探测键（保留 `manager_loaded` 这一真实保证） | 该文件 16 passed |  
| 前端死代码 | 删 `src/i18n/locales/embed/`（仅转发 shim）、`src/utils/_repro_gap.mjs`、`src/config/settingsRoute.ts` + `settingsRoute.test.ts` | 零残留引用；`vue-tsc --build` = **10 errors（全是历史基线：SkillFilesDrawer 5 + SkillSettings 5），零新增** |  
| 失效脚本 | `package.json` 删死脚本 `check-i18n`（指向从未存在的 `localeKeyAudit.test.ts`；审计逻辑实为库 `localeKeyAudit.ts`，由 `scan-i18n-gaps` 消费） | 非测试文件，按 AGENTS.md 不得新建 test .ts，故删除而非补建 |  
| B0 契约 | 新建 `20261001-api-contract-phase2.md`（三个坑 + 调用面 + 路由对照 + SSE 清单）；`20260914-appcore-to-python.md` 的 B0 节改为指向该文档 | — |

### 5.2 结论修正（原建议不可执行）

- **office 脚本三副本去重：不可行**。原因见 2.3；非「不做」，而是「做了会坏」。已在代码注释中固化约束。
- **`settingsRoute.ts` 二选一：选删除，不能接线**。模块版 `normalizeSettingsSection(section, tab?)` 比 `Settings.vue:297` 的本地版**旧且不完整**——缺 `general → userprofile`、`weknoracloud → models` 两个别名映射（后者是「设置页已移除、旧深链回落模型管理」的兜底）。接线会直接破坏设置页深链，故删除模块与其测试，保留页面内本地实现为准。
- 复核方法提示：macOS 自带 grep 不支持 `\|` 交替，用交替模式检索会静默返回空，需改用逐词检索或 ripgrep；且 grep 命中后必须确认是 import 还是本地同名标识符（`RuntimeQueues.vue` 的 `modelUsage`、`ChatWorkPanel.vue` 的 `contextWindow` 都是本地定义，非引用）。

### 5.3 未执行（按建议保留待决）

- 第 3 项全部（需产品确认）。
- 第 6 项全部（大文件拆分、两代渲染体系合并、creatChat 改名）。
- 两处待确认的「仅测试保活」模块（mindmap_utils / sample_question_utils / knowledge.parser / providers.repository 桩）未动。
- 未执行 `git add` / `git commit`（AGENTS.md 禁止自动提交）。
