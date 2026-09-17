# AGENTS.md

本文件是仓库级通用工程规范，适用于本仓库所有代码改动。若某任务有专门计划或迁移文档，其硬约束优先于本文件的默认规则。

## 改动边界

- 企业产品线代码集中在 `apps/frontend`、`apps/app-core`、`apps/agent-harness`。
- 上游开源目录 `frontend/`、`internal/` 禁止改动。
- 其它产品线 `apps/manager`、`apps/backend` 禁止改动。
- 代码侧只允许改动 `apps/` 下的企业产品线代码；其它目录一律不动。
- 后端接口契约（path / method / body / SSE 事件字段）默认不改；确需改动时先评估兼容性与回滚方案。
- 前端请求 URL 默认保持原样；移动或封装 API 时只改位置与类型，不改 URL。

## 改动方式

- 一次只做一个功能，禁止把多个无关功能混进同一个 PR。
- 代码注释必须使用中文，禁止新增英文注释。
- 优先 `git mv` 后再改；禁止复制文件留双份。
- 替换或删除旧实现时，同批清理已无引用的旧文件、旧组件、专用 api。
- 删除前先检查引用：无引用才删，有引用先迁移或改指向；禁止先删后修。
- 保持最小改动：只改完成需求所必需的最少文件与最少行，不借机扩大重构。
- 能改现有文件就不新增；避免通过新增文件解决本可在现有文件内完成的问题。
- 新增文件尽量同时删除等量或更多旧文件（move 除外）；不为「结构整齐」预建空目录或占位文件。

## 前端技术栈与实现

- 前端使用 Vue 3 + TDesign。
- 禁止新引入 `ant-design-vue` / `@ant-design/icons-vue`；图标优先 lucide 或 `t-icon`。
- 代码风格、目录命名、注释语言与现有代码保持一致。
- 不为单个页面新建 `*-tokens.css` / `*.module.css`；页面专用样式写进该页 SFC 的样式块。
- 不为 1–2 个短函数新建 `utils/` / `composables/` 文件；优先并进已有模块或复用现有能力。
- 引入新依赖前先说明用途与替代方案，避免引入仅满足单点需求的重依赖。

## UI 迁移与重构

- 迁移或重写已有功能时，必须保留原有全部可见能力：列表、详情、空态、加载、失败、图表、数字分色、图标语义色、调色盘。
- 不允许少样式、少色相、少一块 UI。
- 色相、间距、版式、卡片铬、深色模式应与原实现一致，优先复用现有语义 token。
- 与旧实现逐项对照，以 git 历史或原实现为准，不凭记忆或截图；不一致当场修正。

## 国际化

- 前端任何涉及用户可见文案的改动，必须同步改齐全部 locale，禁止只改中文或只改一份语言：`zh-CN` / `en-US` / `ko-KR` / `ja-JP` / `ru-RU`。
- 新增、修改、删除 i18n key 时，上述 locale 文件必须同批处理，key 路径保持一致。
- 文案统一走 i18n key，不硬编码。

## 产品边界

- 平台对话与工作模式对话是两套会话体系，不合并。
- 平台 MCP 与 Runtime MCP 是两套数据，不合并。
- 平台 Agent 与 Runtime 智能体是两套对象，不合并。
- 知识库统一使用 WeKnora 知识库体系。

## 企业配置与上游同步

- `apps/app-core` 是企业入口，运行配置必须使用 KJSC 变体：`config/config_kjsc.yaml`、`config/builtin_agents_kjsc.yaml`、`config/prompt_templates_kjsc/`。
- 禁止把 `apps/app-core` 的配置加载顺序、部署挂载或默认值改回官方 `config/config.yaml`、`builtin_agents.yaml`、`prompt_templates/`。
- 同步官方代码后必须逐项检查配置加载器、`docker-compose-kjsc.yml`、`docker-compose-mac.yml`、`scripts/kjsc/*`、`.env.kjsc.example` 是否仍指向 KJSC 变体。
- `config_kjsc.yaml` 支持 `${VAR:-default}` 展开；该能力不得简化为只支持 `${VAR}`。
- 官方新增配置项先补到 KJSC 变体，不改官方 `config/`、`internal/`、`cmd/server/`。
- `config/*_kjsc*`、`docker-compose-kjsc.yml`、`docker-compose-mac.yml`、`scripts/kjsc/*`、`.env.kjsc.example`、`AGENTS.md` 属于企业侧维护入口，修复只能落在这些文件内。

## 提交

- 禁止自动提交：只有收到明确的人工指令后，才执行 `git add` / `git commit` 等提交操作。
- 提交信息使用 `type(scope): 描述`，例如 `feat(frontend): ...`、`fix(frontend): ...`、`chore(frontend): ...`。
- 一个提交只做一件事；避免把跨产品线的改动混在同一个提交。
