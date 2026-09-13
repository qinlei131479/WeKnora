# apps/frontend 融合代码收敛与上游对齐执行计划

> 状态：规划中。本文只描述执行方案，不直接改代码。

## 1. 背景与目标

`apps/frontend` 是上游开源 `frontend/` 的企业 fork，当前融合了三条代码来源：

1. 平台对话 / RAG 体系：与上游同源。
2. 企业 TDesign 页面：`views/skills`、`views/mcp`、`views/workspace`、`views/dashboard` 等。
3. 工作模式 / 生成式 Agent 体系：来自历史 harness，以 JS 为主。

当前主要问题：

- 三种代码代际并存：上游 TS、企业 TDesign TS、harness JS。
- 对话与工作模式存在一批平行实现。
- 融合后留下少量孤立文件与国际化遗漏。
- 与上游共享文件有 90 个已被企业修改，未来合并上游存在冲突风险。

目标：

- 逐步统一到与上游一致的 TS + Pinia setup store + TDesign 规范。
- 收敛重复实现，降低大文件耦合。
- 清理融合遗漏，补齐国际化。
- 建立可重复的上游合并工作流，尽量降低合并冲突。

## 2. 执行原则

- 只改 `apps/frontend`，不改上游 `frontend/`、`internal/`，也不改 `apps/app-core`、`apps/agent-harness` 业务接口。
- 分批小步推进，每批构建通过、可单独回滚。
- 优先 `git mv` 与新增企业命名空间，尽量少改与上游同名的共享文件。
- 迁移保持行为不变，不做功能取舍；涉及 UI 时按旧实现逐项对照。
- 不自动提交；提交信息使用 `type(frontend): 描述`。

## 3. 与上游合并冲突最小化

这是本计划的贯穿性约束。核心手段是把「企业自有代码」与「改动过的上游代码」分开管理。

### 3.1 建立分叉清单

新增 `docs/plan/FRONTEND_UPSTREAM_DIVERGENCE.md`，维护三类清单：

| 清单 | 当前数量 | 用途 |
| --- | --- | --- |
| 与上游同名但企业已修改 | 90 | 合并上游时重点回归 |
| 仅上游存在、企业已删除 | 22 | 判断是否随上游重新引入 |
| 仅企业存在 | 185 | 企业自有代码，不与上游重名冲突 |

当前共享文件共 476 个：386 个完全一致，90 个已修改。

### 3.2 冲突最小化策略

- **不动上游文件，改企业文件**：harness JS→TS 迁移限定在 `apps/frontend/src/**/harness/**` 与 `stores/chatWork.js`，不触碰上游同名文件。
- **新增走企业命名空间**：新增代码优先放企业自有目录，避免与上游未来新增文件重名。
- **删除上游文件前先确认上游仍在用**：上游仍存在的死文件，企业侧优先保留或标记，不主动删，等上游同步删除后再删。
- **依赖分叉单独仲裁**：`apps/frontend/package.json` 与上游的差异，合并时逐项按功能需求决策，不整体覆盖。
- **共享文件改动最小化**：确需改上游共享文件时，尽量采用扩展点、配置项或独立文件，而不是改写原逻辑。

### 3.3 合并工作流

每次合并上游分支：

1. 先读取分叉清单，确认本次上游变更命中了哪些已修改/已删除文件。
2. `git merge <upstream>`，只处理分叉清单中的冲突。
3. 对「企业已删除」文件：上游无变更则保持删除；上游有变更则评估重新引入或迁移企业替代实现。
4. 合并后跑 `type-check`、`build`，并回归被命中的共享页面。
5. 更新分叉清单，再进入下一批。

## 4. 现状基线

| 指标 | 当前值 |
| --- | --- |
| 上游同名文件 | 476 |
| 其中内容一致 | 386 |
| 其中企业已修改 | 90 |
| 仅企业新增 | 185 |
| 仅上游存在、企业已删除 | 22 |
| `.js` 文件数 | 52（上游为 2） |
| 无 `lang="ts"` 的 Vue 文件 | 83 |
| 路径含 `harness` 的文件 | 137 |

`harness` 目录分布：

| 目录 | 文件数 |
| --- | --- |
| `components/harness` | 59 |
| `utils/harness` | 30 |
| `assets/harness` | 25 |
| `composables/harness` | 7 |
| `stores/harness` | 6 |
| `api/harness` | 6 |
| `views/agent/harness` | 4 |

## 5. 分阶段执行

### Phase 0 · 基线快照与分叉清单

- [ ] 生成 `FRONTEND_UPSTREAM_DIVERGENCE.md`：90 个修改文件、22 个删除文件、185 个新增文件。
- [ ] 冻结基线：记录 `type-check`、`build` 结果，作为后续批次对照。
- [ ] 约定：本计划期间不新增 `@harness` 引用，不扩大与上游同名文件的改动面。

### Phase 1 · 清理融合遗漏（低风险）

- [ ] 删除孤立文件 `apps/frontend/src/utils/weknoraCloudModels.ts`（WeKnora Cloud 设置页已删除，无引用）。
- [ ] 处理 `utils/sessionMarkdown.ts` + `sessionMarkdown.test.ts`：接入会话导出，或确认不启用后删除。
- [ ] 收口 WeKnora Cloud 凭证入口：
  - `components/ModelEditorDialog.vue` 的 `goToWeKnoraCloudSettings`。
  - `views/settings/ParserEngineSettings.vue` 的 `goToWkcSettings`。
  - `api/model/index.ts` 中 `saveWeKnoraCloudCredentials` / `getWeKnoraCloudStatus`。
- [ ] 补齐 `ko-KR` / `ru-RU` 缺失的 12 个 `knowledgeBase.mindmap*` 键。
- [ ] 复核 `views/agent/harness` 命名：是否收敛，需产品确认后单列。

### Phase 2 · harness JS → TS（语言统一）

按依赖顺序迁移，每批结束后 `type-check` + `build`。

- [ ] `utils/harness`（30 个 JS）→ TS，保持导出与行为不变。
- [ ] `api/harness`（6 个 JS）→ TS，合并到 `api/chat-work` 或保持独立但统一为 TS。
- [ ] `stores/harness`（6 个 JS）→ TS，Pinia setup store 风格。
- [ ] `composables/harness`（7 个 JS）→ TS。
- [ ] `stores/chatWork.js` → TS，删除 `chatWork.d.ts`。
- [ ] `components/harness` 中 57 个非 TS Vue 与 2 个 JS 逐步改 TS。
- [ ] 迁移过程中同步补齐 i18n，移除 `components/harness`、`utils/harness` 中的硬编码中文。

### Phase 3 · 收敛重复实现

优先合并低耦合、纯逻辑的部分，再评估 UI 层。

- [ ] Markdown 渲染：`utils/chatMarkdownRenderer.ts` 与 `utils/harness/markdown_preview.js` 收敛为一个统一渲染入口。
- [ ] @ 提及 token 规则：`utils/harness/mention_*` 与平台 `components/MentionSelector.vue` 的 token 规则抽公共层。
- [ ] 附件/文件工具：`utils/harness/file_utils.js`、`file_preview.js`、`file_icon.js` 与平台侧文件工具对齐。
- [ ] 评估输入框：`components/Input-field.vue` 与 `harness/MessageInputComponent.vue` 是否可抽公共基础输入层。
- [ ] 评估消息渲染：`views/chat/components/AgentStreamDisplay.vue` 与 `harness/AgentMessageComponent.vue` 是否可抽公共渲染层。

### Phase 4 · 降低复杂度

- [ ] 拆分 `views/chat-work/ChatWorkPanel.vue`（4527 行）：流式、审批、文件面板、子智能体分别抽 composable / 子组件。
- [ ] 拆分 `views/agent/AgentEditorModal.vue`（6004 行）：按 section 抽子组件。
- [ ] 拆分 `views/knowledge/wiki/WikiBrowser.vue`（6554 行）。
- [ ] 评估 `views/knowledge/components/FAQEntryManager.vue`（5697 行）、`views/knowledge/KnowledgeBase.vue`（4559 行）。

### Phase 5 · 规范化与自动化

- [ ] 收敛 `harness` 命名：目录、`harness-entry.css`、`harness-*` 菜单图标 id、i18n 命名空间。命名方案需产品确认。
- [ ] 引入最小 lint / format：与上游对齐，优先 `eslint` + `prettier`，先只对新增/迁移文件生效，再逐步覆盖存量。
- [ ] 依赖分叉收敛：核对 `apps/frontend/package.json` 与上游差异，移除已无用途的依赖，保留有明确用途的企业新增依赖。

### Phase 6 · 上游合并工作流固化

- [ ] 固化 `FRONTEND_UPSTREAM_DIVERGENCE.md` 的维护方式。
- [ ] 将「合并上游分支」的步骤写入本计划，作为每次 release 的标准流程。
- [ ] 合并后全量回归被命中的共享文件与功能入口。

## 6. 验收标准

- [ ] `apps/frontend` 不再有 `harness` JS 与非 TS Vue，或至少收敛到可接受范围。
- [ ] 对话与工作模式重复能力中，低耦合部分已合并。
- [ ] 孤立文件、国际化遗漏、WeKnora Cloud 入口已清零。
- [ ] 分叉清单持续更新，每次上游合并有据可查。
- [ ] `type-check`、`build` 通过，关键页面手工回归通过。

## 7. 风险与回滚

| 风险 | 缓解 |
| --- | --- |
| harness JS→TS 引入类型错误 | 按目录小批迁移，每批 `type-check`，保持导出不变 |
| 重复实现合并破坏行为 | 只合并纯逻辑/渲染，不改 SSE、session 数据模型；逐项对照旧实现 |
| 上游合并冲突 | 分叉清单 + 新增走企业命名空间 + 尽量少改共享文件 |
| 命名收敛面大 | 拆为独立小批，`git mv` 保留历史 |
| 引入 lint 后大规模报错 | 先只 lint 新增文件，存量逐步修复 |

回滚：每批独立提交，`git revert` 该批即可，不影响其他批次。
