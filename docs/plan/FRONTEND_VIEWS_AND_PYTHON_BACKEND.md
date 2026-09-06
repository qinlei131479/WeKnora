# 前端正式 views 收口 + app-core 迁 Python 执行计划

> 执行手册。**门禁未绿不进下一批 / 下一阶段。**
>
> 与 `WEKNORA_YUXI_INTEGRATION_PLAN.md`（P0–P7 能力聚合，已完成）衔接：P7 之后产品仍是「两套前端孤岛 + 两套 HTTP」。本计划做下一跳：UI 收进正式 `views/`（TDesign），再把 Go `apps/app-core` 按模块迁到 `apps/agent-harness`。

**Goal:** 企业前端只维护一套 TDesign 正式页面；企业后端只维护一套 Python（agent-harness）。上游开源目录不改。

**Architecture:** 两个大阶段严格串行。阶段一只改 `apps/frontend`，按功能把 `src/harness/` 迁进 `src/views/`，后端 `/api/v1` 与 `/harness-api` 契约不动。阶段一全部验收后再改后端：前端冻结，nginx 按前缀把 `/api/v1` 模块从 `apps/app-core` 切到 `apps/agent-harness`。

**Tech Stack:** Vue 3 + TDesign（`apps/frontend`）；FastAPI + SQLAlchemy（`apps/agent-harness`）；过渡期仍经 nginx 打到 Go `apps/app-core`。

---

## 0. 边界与原则

### 0.1 改 / 不改

| 目录 | 角色 | 本计划 |
| --- | --- | --- |
| `frontend/`、`internal/` | 上游开源 | **不改**，继续合上游 |
| `apps/manager`、`apps/backend` | 另一条产品线 | **不改** |
| `apps/frontend` | 企业前端 fork | **阶段一唯一改动面** |
| `apps/app-core` | 企业 Go fork | **仅阶段二**：卸路由，不加新功能 |
| `apps/agent-harness` | Python 落点 | **仅阶段二**：承接 `/api/v1` 实现 |

### 0.2 两阶段锁

```text
F0 → F1 → … → F9 验收通过
                 ↓
            才允许 B0
                 ↓
            B1 → … → B9
```

禁止：前端做到一半改接口；后端改到一半回头改页面；把多批功能打进同一个 PR。

### 0.3 阶段一硬约束

- **不改后端接口**：不改 `apps/app-core`、`apps/agent-harness` 的 path / method / body / 事件字段。
- **逐功能、逐页面**：一批只迁一个产品功能；做完验收再开下一批。
- **迁进正式 views，消灭 harness 特征**：不是给 `src/harness/` 换 TDesign 皮。
  - 路由不再以 `/platform/harness/*` 作为正式入口（旧 URL 只 redirect）
  - 菜单 path 不再含 `harness/`
  - 列表页不再用 `?surface=runtime|skills|tools|mcp` 套 `HarnessIsland`
  - 新页面只用 TDesign，禁止新引入 `ant-design-vue` / `@ant-design/icons-vue`
- 数据调用：原 `/harness-api/...` 原样保留。F0 只允许把 `src/harness/apis/` **搬家**到 `src/api/runtime/`，URL 不变。

### 0.4 「不再保留 harness 特征」完成态（F9）

- `rg HarnessIsland apps/frontend/src` 为零
- `rg ant-design-vue apps/frontend` 为零（含 `package.json`）
- `rg "/platform/harness" apps/frontend/src/router` 仅剩 redirect 或已删除
- `src/harness/` 目录删除（API 已在 `src/api/runtime/`，工具函数已迁到 `src/utils/` 或随页面走）
- `main.ts` 不再 `app.use(Antd)`，不再引入 `@harness/assets/css/harness-entry.css`

### 0.5 环境

与现网 KJSC 开发一致：

| 进程 | 启动 | 端口 |
| --- | --- | --- |
| WeKnora / app-core | `make dev-kjsc-app` | `:9980` |
| 前端 | `make dev-kjsc-frontend` | `:9988` |
| harness API/Worker | `make dev-kjsc-harness` | `:5050`（经前端 `/harness-api`） |
| 基础设施 | `make dev-kjsc-infra` | postgres / redis / minio |

库：`agent-middle`。身份已按 P1/P7 走 WeKnora `users` + 同一套 JWT。

### 0.6 每批固定工序（阶段一 F1–F8）

1. **优先 move** `@harness` 页/组件到 `views/<域>/`，再改 TDesign；对照旧页勾能力与色相。
2. `apps/frontend/src/router/index.ts` 注册正式 path；旧 `/platform/harness/...` 与 `?surface=` 改为 redirect。
3. `apps/frontend/src/stores/menu.ts`、`components/menu.vue` 入口改正式 path。
4. 页面只通过 `src/api/runtime/*`（或尚未搬家时的原 api）打 **原 URL**。
5. **同批删除**该功能已无引用的 harness 页、组件、专用 api。
6. **完成后必须与旧实现深度比对，不得凭印象收工**（见 §0.7 第 7 条）。验收含配色、间距、标题栏、分隔线、空态。
7. 验证用测试文件当场删除，不提交。提交后再开下一批。

### 0.7 阶段一工程纪律（F2 起强制）

1. **功能与观感对齐**：正式页必须覆盖旧页全部可见能力（列表/详情/空态/加载/失败、图表、数字分色、图标语义色、图表调色盘）。允许换 TDesign 组件，**不允许少样式、少色相、少一块 UI**。做不到像素级（如 Ant Card 标题栏、Lucide 线宽）须在该批验收里写明；色相与数字颜色必须对齐旧语义 token（`--color-info/accent/warning/success/error`、`--chart-palette-*`），禁止只剩 `--td-brand-color` 一片绿。
2. **先 move 再改，禁止复制留双份**：把 `@harness/views` / 专用组件 **移到** `views/<域>/` 再改 TDesign。`chartColors` / `cssVars` 等已有工具上移或复用，不得每个模块再拷一份。
3. **本批删旧入口**：正式路由生效后，同 PR 删除该功能已无引用的 harness 页、组件、专用 api。禁止拖到 F9 再清死代码。
4. **文件数**：优先 move（不算新增）。净增文件（新增 − 删除）**≤ 3**；不含 move 的硬上限 **≤ 5**。超限先抽共享或拆批。
5. **不留测试文件**：验证用的 `*.test.ts` / 临时脚本验完即删，**不提交**。不为搬家补单测，除非改了契约。
6. **禁止新引入** `ant-design-vue` / `@ant-design/icons-vue`。
7. **完成后强制与原功能深度比对（F1 已因未执行本条返工 3 次，F2 起未比对不得标完成）**：
   - **对照源**：`git show <迁前 commit>:<旧文件>` 或未删的 `@harness` 源，**禁止只靠记忆或截图印象**。
   - **必须逐项对照并写进该批验收**（缺一项不算完成）：
     1. 信息架构：标题、数字、拆分、空态/加载/失败、表格列、按钮/筛选项是否齐全
     2. 图表 option：legend/grid/axisLine/splitLine/areaStyle/tooltip/圆角/emphasis，不得简化丢字段
     3. 色相：语义色与 `--chart-palette-*`，含深色 `html[theme-mode=dark]`
     4. **间距与版式**：`padding` / `gap` / `margin` / `min-height` 与旧页同一套；区块之间间隔必须一致，禁止一块挤死、一块被 min-height 撑开；标题栏分隔线与正文之间要有上内边距，禁止横线贴死内容
     5. 卡片铬：标题字号/字重、header 高度、hover、响应式断点
   - 发现不一致必须当场改，不能先交再等用户标红。
   - 该批 PR/回复里用短表列出「旧值 → 新值」，无差异写「已对齐」。
8. **最小改动（F1 因拆出独立 css / 两行 util / 重复 composable 返工；F2 起强制）**：
   - 每次调整或新增功能只改完成该需求所必需的最少文件与最少行，禁止借机新建目录树。
   - **禁止**为页面单独建 `*-tokens.css` / `*.module.css`；token 与该页专用铬写进该页 SFC 的 unscoped `<style>`（选择器挂页面根 class）。
   - **禁止**为 1–2 个短函数新建 `utils/`、`composables/` 文件；并进已有模块，或复用 `@/composables/useTheme` 等现成能力。
   - 能改现有文件就不新增；新增文件必须同时删掉等量或更多旧文件（move 除外）。
   - 不为「结构整齐」预建空目录或占位文件。

---

## 1. 阶段总览

| 阶段 | 批次 | 内容 | 状态 |
| --- | --- | --- | --- |
| 一 | **F0** | 基建：runtime API 搬家、路由/菜单约定、禁止新 Ant | 完成 |
| 一 | **F1** | 数据总览 → `views/dashboard` | 完成（已收束文件：无独立 css / 短 util） |
| 一 | **F2** | 工作区 → `views/workspace` | 未开始 |
| 一 | **F3** | Skill 列表/详情 → `views/skills` | 未开始 |
| 一 | **F4** | Tools 列表 → `views/tools` | 未开始 |
| 一 | **F5** | MCP 列表/详情 → `views/mcp`（UI 合一，接口仍两套） | 未开始 |
| 一 | **F6** | Runtime 智能体并进 `views/agent` | 未开始 |
| 一 | **F7** | Runtime 知识库并进 `views/knowledge`（开工前确认收口策略） | 未开始 |
| 一 | **F8** | Runtime 对话并进 `views/chat` + `creatChat` + 侧栏历史 | 未开始 |
| 一 | **F9** | 删除 `src/harness/`、Ant Design、`/platform/harness` 正式树 | 未开始 |
| 闸门 | **G1** | 阶段一全量验收，才允许 B0 | 未开始 |
| 二 | **B0** | 冻结阶段一实际调用的 OpenAPI 对照表 | 未开始 |
| 二 | **B1** | Model / Initialization | 未开始 |
| 二 | **B2** | Vector / Storage / WebSearch / Datasource | 未开始 |
| 二 | **B3** | System / 队列 / 审计 | 未开始 |
| 二 | **B4** | Organization / 分享 | 未开始 |
| 二 | **B5** | Tenant / RBAC | 未开始 |
| 二 | **B6** | Knowledge / Chunk / FAQ / Tag | 未开始 |
| 二 | **B7** | Wiki | 未开始 |
| 二 | **B8** | Agent 配置 + Embed + IM | 未开始 |
| 二 | **B9** | Session / RAG / SSE | 未开始 |
| 闸门 | **G2** | 阶段二全量验收；app-core 对应路由已卸 | 未开始 |

不在本计划：打开 `WeKnora_hide_features`、改 `apps/manager`、合 `frontend/` 与 `apps/frontend` 源码树、动上游 `internal/`。

---

## 阶段一 · 前端

### 现状对照（迁之前不要改这些后端）

| 现状入口 | 组件 | HTTP |
| --- | --- | --- |
| `/platform/harness/dashboard` | `src/harness/views/DashboardView.vue` | `/harness-api` dashboard |
| `/platform/harness/workspace` | `src/harness/views/WorkspaceView.vue` | workspace / knowledge |
| KB 列表 `?surface=skills\|tools\|mcp\|runtime` | `KnowledgeBaseList.vue` 内 `HarnessIsland` | skill / tools / mcp / knowledge |
| `/platform/harness/extensions/skill/:slug` | `SkillDetailView.vue` | skill_api |
| `/platform/harness/extensions/mcp/:slug` | `McpDetailView.vue` | mcp_api |
| Agent 列表 `?surface=runtime` | `AgentList.vue` 内 `AgentManageView` | agent_api |
| `/platform/harness/chat`、`chat/:thread_id` | `AgentView.vue` | agent / chat SSE |
| 侧栏 Runtime 历史 | `HarnessHistoryNav.vue` | chat threads |

---

### F0 · 基建

**Files:**

- Create: `apps/frontend/src/api/runtime/base.ts`（含 `HARNESS_API_PREFIX` / `harnessUrl`，不单建 prefix.ts）
- Create: `apps/frontend/src/api/runtime/base.ts`（从 `src/harness/apis/base.js` 迁 TS，行为不变）
- Move（可分批，F0 至少迁 dashboard 用到的）: `dashboard_api` → `apps/frontend/src/api/runtime/dashboard.ts`
- Modify: `apps/frontend/src/router/index.ts` — 增加注释约定：新路由只挂 `views/`，`/platform/harness/*` 只允许 redirect
- Modify: `apps/frontend/package.json` — 不在本批删 Ant，但注释/PR 说明禁止新依赖 Ant
- Do not modify: `apps/agent-harness/**`、`apps/app-core/**`

- [ ] **Step 1:** 建 `src/api/runtime/prefix.ts`，导出 `HARNESS_API_PREFIX = '/harness-api'`，与 `src/harness/apis/prefix.js` 一致。
- [ ] **Step 2:** 把 `dashboard_api.js` 的请求函数原样迁到 `src/api/runtime/dashboard.ts`（仅加类型，不改 path）。
- [ ] **Step 3:** 确认 `vite.config.ts` 里 `/harness-api` proxy 仍指向 `VITE_HARNESS_PROXY_TARGET`（默认 `http://127.0.0.1:5050`），本批不改 proxy。
- [ ] **Step 4:** 在 `router/index.ts` 顶部或 harness 子树处加约定注释：阶段一新页面禁止再挂 `@harness/views`。
- [ ] **Step 5:** 本地 `cd apps/frontend && npm run type-check`（或项目惯用的 `vue-tsc`）通过。
- [ ] **Step 6:** 提交：`chore(frontend): add runtime API home without changing harness-api URLs`

**验收**

- [ ] 浏览器 Network 里 dashboard 相关请求仍是 `/harness-api/api/dashboard/...`（F1 接上后验；F0 可先单测/grep path 字符串未改）
- [ ] 无 Go/Python 文件变更

---

### F1 · 数据总览

**依赖:** F0。**后端:** 不动。

**Files:**

- Create: `apps/frontend/src/views/dashboard/index.vue`
- Create: `apps/frontend/src/views/dashboard/components/` 下用 TDesign + 现有 echarts 重写统计块（从 `src/harness/components/dashboard/*` 迁逻辑，换 `t-` 组件）
- Modify: `apps/frontend/src/router/index.ts` — 正式路由 `path: 'dashboard'`，`name: 'dashboard'`，组件 `views/dashboard/index.vue`
- Modify: 原 `path: 'harness/dashboard'` 改为 redirect → `/platform/dashboard`
- Modify: `apps/frontend/src/stores/menu.ts` — `path: 'harness/dashboard'` → `path: 'dashboard'`，图标不要再用 `harness-dashboard` 作为产品名（可暂留 svg 文件名）
- Modify: `apps/frontend/src/utils/weknoraFeatures.ts` — `HIDDEN_MENU_PATHS` / `isHiddenMenuPath('harness/dashboard')` 改为识别 `dashboard`
- Modify: `apps/frontend/src/i18n/locales/zh-CN.ts`（及 en-US）— 菜单文案保持「数据总览」，不出现 harness
- Delete（同批，已做）: `src/harness/views/DashboardView.vue`、`src/harness/components/dashboard/*`、`src/harness/apis/dashboard_api.js`；验证用 `prefix.test.ts` 验完即删、不提交

**落地说明（F1 偏差，后续批不得再扩大）：** 已用 TDesign Card/Statistic，非 Ant Card 像素级；图标形状可为 TDesign。色相已挂 `.dashboard-page` 对齐旧 `--color-*` / `--chart-palette-*`。F2 起必须先 move 再改，禁止再整树复制。

- [x] **Step 1:** 用 TDesign 写 `views/dashboard/index.vue`：页头 + 概览数字 + 调用/用户/Agent/工具/KB 图，数据走 `src/api/runtime/dashboard.ts`。
- [x] **Step 2:** 注册 `/platform/dashboard`；`/platform/harness/dashboard` redirect。
- [x] **Step 3:** 侧栏点「数据总览」落到 `/platform/dashboard`。
- [x] **Step 4:** 手工验收：有数据、空数据、加载、失败提示；暗色若主应用支持则跟 `theme-mode`。
- [ ] **Step 5:** 提交：`feat(frontend): move dashboard into official views`（未要求提交则先不提交）

**验收**

- [x] 打开 `/platform/dashboard` 图表与旧页同一 `/harness-api`
- [x] 旧 URL 自动跳到新 URL
- [x] 页面 DOM 无 `ant-` 组件（`a-` 标签）
- [ ] 与旧页并排：数字分色、图标语义色、图表调色盘对齐（人工再验一次）
- [ ] 区块间距一致（概览↔卡片、卡片↔卡片均为 16px）；标题横线与正文有上内边距，无 min-height 撑出空洞
- [x] 无后端仓库文件变更
- [x] 无本批验证测试文件残留

---

### F2 · 工作区

**依赖:** F1 验收。

**纪律:** 遵守 §0.7。先 move `WorkspaceView` + `components/workspace/*` 到 `views/workspace/`，再改 TDesign。正式路由生效后同批删旧入口。净增文件 ≤ 3。不提交 `*.test.ts`。

**Files:**

- Move: `src/harness/views/WorkspaceView.vue` → `apps/frontend/src/views/workspace/index.vue`
- Move: `src/harness/components/workspace/*` → `views/workspace/components/`（改 TDesign，不得少一块：文件树、预览、上传、空态）
- Move: `src/harness/apis/workspace_api.js` → `src/api/runtime/workspace.ts`（仅当本页独占；否则先留共享再在最后引用方删）
- Modify: `router/index.ts` — `/platform/workspace`；`/platform/harness/workspace` redirect
- Modify: `stores/menu.ts` — `path: 'workspace'`
- Delete 同批: 已无引用的 harness workspace 页/组件/专用 api

- [x] 正式页 TDesign：目录、上传、预览、与 Agent 工作区路径相关交互与旧页同等（能力+色相+组件块，不像素级）。
- [x] 菜单「工作区」进 `/platform/workspace`。
- [x] 同批删旧入口；验证测试当场删。
- [x] 提交：`feat(frontend): 将工作区迁入正式 views`

**验收**

- [ ] 浏览、上传、预览、空态/加载/失败与旧页同等，无少样式/少色/少一块 UI
- [ ] 无 `HarnessIsland`、无新 Ant、无本批 `*.test.ts`
- [ ] 请求仍为 `/harness-api/api/workspace/...`

---

F3–F8 一律遵守 §0.7：先 move 再改 TDesign、同批删旧入口、能力/色相/组件块不缩水、不提交 `*.test.ts`。

### F3 · Skill

**依赖:** F2 验收。

**Files:**

- Move: `SkillCardList.vue`、`SkillDetailView.vue`、`SkillInstallFlowModal.vue` → `views/skills/` 再改 TDesign
- Source: 上列 harness 文件（正式路由生效后同批删除）
- API: `skill_api.js` → `src/api/runtime/skill.ts`
- Modify: `KnowledgeBaseList.vue` — 去掉 `surface === 'skills'` 的 `HarnessIsland` 嵌入；入口改为路由 `/platform/skills`
- Modify: `router/index.ts` — `/platform/skills`、`/platform/skills/:slug`；旧 `harness/extensions/skill/:slug` redirect
- Modify: 命令面板 / KB 右侧 surface 导航：skills 项指向新路由，不再改 query `surface`

- [ ] 列表、详情、安装/分享表单用 TDesign。
- [ ] `KnowledgeBaseList` 不再渲染 Skill 嵌入岛。
- [ ] 提交：`feat(frontend): move skills into official views`

**验收**

- [ ] `/platform/skills` 与旧 surface=skills 能力、色相、组件块一致（不少样式/不少一块 UI）
- [ ] 深链 `/platform/harness/extensions/skill/:slug` 跳到新详情
- [ ] 仍打 `/harness-api` skill 接口
- [ ] 同批无死代码、无本批 `*.test.ts`

---

### F4 · Tools

**依赖:** F3 验收。

**Files:**

- Move: `ToolsCardList.vue` → `views/tools/` 再改 TDesign
- Source: 上列 harness 文件（同批删除）
- API: `tool_api.js` → `src/api/runtime/tool.ts`
- Modify: `KnowledgeBaseList.vue` — 去掉 tools surface 嵌入
- Modify: `router/index.ts` — `/platform/tools`

- [ ] TDesign 列表页；入口从 KB surface 改为正式菜单或知识库旁路按钮（与 F3 同一套导航模式）。
- [ ] 提交：`feat(frontend): move tools into official views`

**验收**

- [ ] 列表与旧 surface=tools 能力/色相/组件块一致
- [ ] `KnowledgeBaseList` 无 tools 的 `HarnessIsland`
- [ ] 同批无死代码、无本批 `*.test.ts`

---

### F5 · MCP

**依赖:** F4 验收。

说明：设置里已有 Go 版 `views/settings/McpSettings.vue`（`/api/v1/mcp-services`）。本批只把 **Runtime MCP**（`/harness-api` mcp_api）做成正式 `views/mcp/`。两套数据阶段一不合并。页面文案区分「平台 MCP」与「运行时 MCP」，不要写 harness。

**Files:**

- Move: `McpCardList.vue`、`McpDetailView.vue`、`McpFormModal.vue` → `views/mcp/` 再改 TDesign
- Source: 上列 harness 文件（同批删除）
- Modify: `KnowledgeBaseList.vue` — 去掉 mcp surface 嵌入
- Modify: `router/index.ts` — `/platform/mcp`、`/platform/mcp/:slug`；旧 extensions/mcp redirect
- Optional: `Settings.vue` 增加跳转到 `/platform/mcp` 的入口（不删原 Go MCP 设置页）

- [ ] TDesign 列表/详情/表单。
- [ ] 提交：`feat(frontend): move runtime MCP into official views`

**验收**

- [ ] Runtime MCP CRUD/详情与旧页能力/色相/组件块一致，URL 仍 `/harness-api`
- [ ] 设置里原 `/api/v1` MCP 页仍可用（回归）
- [ ] 同批无死代码、无本批 `*.test.ts`

---

### F6 · Runtime 智能体并进 Agent 列表

**依赖:** F5 验收。

**Files:**

- Modify: `apps/frontend/src/views/agent/AgentList.vue` — 删除 `HarnessIsland` + `AgentManageView`；用 TDesign 卡片/表格展示 Runtime 智能体（数据 `src/api/runtime/agent.ts`）
- Modify: `apps/frontend/src/views/agent/AgentEditorModal.vue` 或新建 `RuntimeAgentEditor.vue`（TDesign）承接 `AgentEditModal.vue` 能力
- Modify: 去掉 `surface=runtime` 作为嵌岛开关；若仍需「平台智能体 / 运行时智能体」切换，用与 KB 无关的正式 tab（query 可用 `engine=runtime`，禁止再叫 surface=runtime 嵌 Ant）
- Modify: `router/index.ts` — `harness/agents` 已 redirect 到 `agents?surface=runtime`，改为 `agents?engine=runtime` 或默认进正式列表
- Source: `AgentManageView.vue`、`AgentManagePanel.vue`、`AgentEditModal.vue`

- [ ] 平台 Agent 原 `/api/v1/agents` 回归不能坏。
- [ ] Runtime Agent 列表/编辑走原 `/harness-api` agent 接口。
- [ ] 提交：`feat(frontend): fold runtime agents into official agent views`

**验收**

- [ ] `/platform/agents` 可管理两套智能体（或 tab 切换），无 Ant 岛
- [ ] 创建/编辑/删除 Runtime Agent 与旧页能力/色相/组件块一致
- [ ] 平台 Agent 编辑器（6000 行级）无回归
- [ ] 同批无死代码、无本批 `*.test.ts`

---

### F7 · Runtime 知识库并进 knowledge views

**依赖:** F6 验收。**开工前门禁：** 产品二选一写进本批 PR 描述。

| 选项 | 含义 |
| --- | --- |
| **A 收口（默认，对齐 P4）** | 不再做 yuxi 库管理 UI；`surface=runtime` 入口删除；工作区/对话里用 WeKnora KB |
| **B 并入正式 KB** | 把 `DataBaseView` / `DataBaseInfoView` 用 TDesign 做成 `views/knowledge/` 下的正式页（仍打 knowledge_api） |

未书面确认前 **禁止开工 F7**。

**若选 A**

- [ ] 删除 `KnowledgeBaseList` 对 `DataBaseView` 的嵌入与 `surface=runtime` 导航项
- [ ] `HIDDEN_KB_SURFACES` 的 runtime 相关逻辑改为无入口而非藏岛
- [ ] 提交：`feat(frontend): remove runtime KB management surface`

**若选 B**

- [ ] TDesign 重写列表/详情（文件表、图谱、思维导图、评测 tab 按 P7 后仍存在的能力保留）
- [ ] 正式路由例如 `/platform/knowledge-bases` 内 tab `engine=runtime` 或独立 path，无 HarnessIsland
- [ ] 提交：`feat(frontend): move runtime KB into official knowledge views`

**验收（共同）**

- [ ] WeKnora KB 列表/详情/上传/Wiki 回归通过
- [ ] 无 `DataBaseView` 的 Ant 嵌入
- [ ] 后端接口未改

---

### F8 · Runtime 对话并进正式 chat

**依赖:** F7 验收。最重一批，单独 PR，禁止夹带删目录。

**Files:**

- Modify: `apps/frontend/src/views/chat/index.vue`、`views/creatChat/creatChat.vue` — Runtime 会话走同一套正式壳，消息区用 TDesign 重写自 `AgentChatComponent.vue`（可拆 `views/chat/runtime/` 子组件，但仍在 views 下）
- Modify: `apps/frontend/src/components/menu.vue` — 用正式历史列表替换 `HarnessHistoryNav`；`ChatEngineSegmented` 可保留「平台 / 运行时」切换，文案不要 harness
- Modify: `apps/frontend/src/composables/useChatEngineNav.ts` — 去掉 `@harness/stores`，store 迁到 `src/stores/runtimeChat.ts`
- Modify: `router/index.ts` — `/platform/harness/chat` → `/platform/chat/:id` 或现有 `chat/:chatid` 带 `engine=runtime`；禁止正式入口仍挂 `AgentView.vue`
- API: agent_api / chat 相关 → `src/api/runtime/agent.ts`、`chat.ts`，SSE URL 不变
- Source: `AgentView.vue`、`AgentChatComponent.vue`（约 4700 行）

- [ ] 平台对话（`/api/v1/agent-chat`、`knowledge-chat`）回归。
- [ ] Runtime 对话 SSE 事件处理与旧页一致（只换 UI）。
- [ ] 提交：`feat(frontend): fold runtime chat into official chat views`

**验收**

- [ ] 新建 Runtime 对话、历史恢复、停止生成、工具卡片、附件
- [ ] 引擎切换后平台会话不丢
- [ ] 无 `AgentView` 路由、无 Ant 聊天岛

---

### F9 · 拆除 harness 产品目录

**依赖:** F8 验收。此时 `@harness/views` 应已无路由引用。

**Files:**

- Modify: `apps/frontend/src/main.ts` — 删除 `app.use(Antd)`、`ant-design-vue` CSS、`@harness/assets/css/harness-entry.css`
- Modify: `apps/frontend/src/App.vue` — 确认仅 `t-config-provider`
- Modify: `apps/frontend/vite.config.ts`、`tsconfig.app.json` — 删除 `@harness` alias
- Modify: `apps/frontend/package.json` — 移除 `ant-design-vue`、`@ant-design/icons-vue`；lucide 若仅 harness 使用则移除
- Delete: `apps/frontend/src/harness/` 整树
- Modify: `router/index.ts` — 删除 `path: 'harness'` 子树，或整段只留兼容 redirect 表（可另文件 `router/legacyHarnessRedirects.ts`，限期）
- Modify: `nginx.conf` **不改**（阶段二才动分流）；前端仍请求 `/harness-api`

- [ ] `rg "@harness" apps/frontend/src` 为零
- [ ] `rg "ant-design-vue" apps/frontend` 为零
- [ ] `npm run type-check`、`npm run build` 通过
- [ ] 提交：`chore(frontend): remove harness island and ant-design-vue`

**验收**

- [ ] F1–F8 全部入口仍可用
- [ ] 登录、KB、平台 Agent、组织、设置、Embed、系统管理回归
- [ ] bundle 不再包含 antd

---

### G1 · 阶段一闸门（进入阶段二之前）

- [ ] F0–F9 全部勾选
- [ ] 对照清单：无 harness 菜单 path、无 HarnessIsland、无 Ant 依赖
- [ ] 两套 HTTP 前缀行为与改造前一致（抓包或日志对比 path）
- [ ] 书面确认：**此后冻结 `apps/frontend` 页面与请求 URL**，阶段二不得改 Vue 业务页

未过 G1 **禁止** 修改 `apps/app-core`、`apps/agent-harness` 业务接口。

---

## 阶段二 · 后端（前端冻结）

原则：**契约不变，实现搬家。** 阶段一结束时前端既打 `/api/v1/*` 也打 `/harness-api/api/*`。阶段二把 Go 的 `/api/v1` 模块在 Python 实现后，用 nginx（`apps/frontend/nginx.conf`）或网关把对应 location 切到 agent-harness；**不改前端。**

已有 Python、不要重写当新项目：Skill / MCP / Workspace / Runtime Agent Run / Dashboard。这些在阶段一已经由正式 views 调用。阶段二重点是 **Go 独有的 `/api/v1` 域**。

今天 Python 对知识库/模型仍是 **HTTP 客户端**（`apps/agent-harness/package/yuxi/p3/client.py`）。B6 要把透传改成本进程，再让 `/api/v1/knowledge-bases*` 落到 Python。

### 每批固定工序（B1–B9）

1. 列出本模块全部 method+path（以 B0 对照表为准）。
2. 在 `apps/agent-harness/server/routers/` 增加 **与 `/api/v1` 兼容的路由**（或内部 mount 同一 path）。
3. 契约测试：同一请求旧 Go vs 新 Python。
4. 改 nginx：该前缀切到 harness；前端不改。
5. 手工走对应正式 views。
6. 从 `apps/app-core` 路由注册中删除该模块（handler 文件可后删）。
7. 提交后再开下一批。

---

### B0 · 契约冻结

**依赖:** G1。

**Files:**

- Create: `docs/plan/API_CONTRACT_PHASE2.md` — 两列：前端实际调用的 `/api/v1` 与 `/harness-api`（从 `apps/frontend/src/api/` 扫出）
- 注明已知缺口（阶段一不修后端，B0 只记录）：`GET /api/v1/auth/tenant`、`POST .../rebuild-index`、`PUT /api/v1/agents/:id/shares/:shareId`、mindmap 仅 app-core 等

- [ ] 扫 `apps/frontend/src/api/**` 与 `src/api/runtime/**` 生成表
- [ ] 与 `apps/app-core` 路由（或 `internal/router` 镜像）对齐
- [ ] 提交文档；不改运行时代码

**验收**

- [ ] 表能作为 B1–B9 的 path 清单，无「待补充模块」空行

---

### B1 · Model / Initialization

**Files（实现时再精确到函数）:**

- Go: `apps/app-core` 中 model / initialization handler（与 `internal/handler/model.go`、`initialization.go` 镜像）
- Python: 扩展现有 `server/routers/model_provider_router.py`（P6 已 403 锁 yuxi 供应商）；新增与 `/api/v1/models`、`/api/v1/initialization` 兼容的 router
- nginx: `/api/v1/models`、`/api/v1/initialization` 切 Python
- 前端: **零改**（`src/api/model`、`initialization`）

**验收:** 设置 → 模型、初始化探测与改前一致；密钥不回传。

---

### B2 · Vector / Storage / WebSearch / Datasource

连接器类 CRUD + test。Python SDK 已有方向（minio、各检索）。nginx 按 path 前缀切。

**验收:** 设置里向量库/存储/搜索/数据源列表、创建、测试连接。

---

### B3 · System / 队列 / 审计

Go: system / runtime queues / audit。读多写少。

**验收:** 系统管理员 settings sections：全局配置、队列、审计日志、平台 API Key（若本批包含）。

---

### B4 · Organization / 分享

Go: organization + KB/Agent shares。无 SSE。

**验收:** 共享空间 CRUD、邀请、KB/Agent 分享；viewer/admin 权限与现网一致。

---

### B5 · Tenant / RBAC

身份已 P1/P7。本批迁租户 CRUD、成员、邀请、`X-Tenant-ID` 语义。高危：AES 凭证字段必须能解现网数据。

**验收:** 登录、切租户、成员角色；Runtime 页仍用同一 JWT。

---

### B6 · Knowledge / Chunk / FAQ / Tag

最大批次。将 `yuxi/p3/client.py` 的透传改为本进程写 WeKnora 表（`knowledge_bases` 等，与现网同库 `agent-middle`）。nginx 切 `/api/v1/knowledge-bases`、`/knowledge`、`/chunks`、FAQ、tag、`/knowledge-search`。

**验收:** KB 全流程：创建、上传、解析进度、切片、FAQ、标签、检索。docreader 仍走现有 gRPC，不重写解析器。

---

### B7 · Wiki

Go wiki_page 服务。nginx 切 `/api/v1/knowledgebase/:id/wiki/*`。

**验收:** Wiki 浏览、编辑、修订历史。

---

### B8 · Agent 配置 + Embed + IM

平台 Agent（`/api/v1/agents`）与 Runtime `h_agents` 不是同一对象。本批迁 **平台 Agent 配置、Embed 渠道、IM 九渠道回调**。不要把 Runtime Run 协议改成 Go QA 协议。

**验收:** 平台 Agent CRUD、Embed 聊天页、至少一个 IM 渠道（钉钉或企微）收发。

---

### B9 · Session / RAG / SSE

最后。Go `handler/session` SSE（`agent-chat`、`knowledge-chat`、`continue-stream`）语义：断连续跑、stop。必须先做事件字段对照，再实现 Python StreamingResponse。

**验收:** 平台对话流式、停止、刷新后续流、引用与工具卡片；与阶段一 F8 的 Runtime SSE 仍互不合并会话表（P7 决策：两套会话不聚合，除非本批另有书面变更）。

---

### G2 · 阶段二闸门

- [ ] B0–B9 完成；前端仍无业务页改动（允许 nginx/env）
- [ ] `apps/app-core` 已无本计划范围内的业务路由（或仅 health）
- [ ] 生产切流可回滚：nginx 能把前缀切回 Go 镜像（保留最后一版 app-core 镜像直至 G2+观察期）

---

## 2. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| 合上游 `frontend/` 冲突 | 阶段一只动新增 `views/` 与 router 增量；少改上游同名大文件（WikiBrowser、AgentEditorModal 尽量只删嵌入岛） |
| F8 聊天回归面大 | 独立 PR；平台对话与 Runtime 对话分两次手工清单 |
| F7 产品未定 | 未确认禁止开工 |
| B6/B9 一次切太大 | 可按子 path 再拆 PR，但仍属同一批次门禁内 |
| 阶段二改坏契约 | 先契约测试再切 nginx；保留 Go 镜像回切 |

阶段一回滚：revert 该批前端 commit，后端无改。  
阶段二回滚：nginx 前缀切回 app-core。

---

## 3. 建议的第一个实现 PR

只做 **F0 + F1**（基建 + 数据总览）。不要包含工作区或拆除 Ant。

完成后更新本文件状态列：F0/F1 → 完成。
