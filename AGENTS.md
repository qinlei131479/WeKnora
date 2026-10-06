# AGENTS.md

本文件是仓库级通用工程规范，适用于本仓库所有代码改动。若某任务有专门计划或迁移文档，其硬约束优先于本文件的默认规则。

## 改动边界

- 企业产品线代码集中在 `apps/frontend`、`apps/app-core`、`apps/agent-harness`。
- 上游开源目录 `frontend/`、`internal/`、`website-docs/`、`cmd/server/`、`migrations/`（其中 `migrations/version_kjsc/` 是企业领地，不在此列）禁止改动。这些目录是「影子目录」：随 `git merge` 自动跟上上游，企业构建不引用，改动它们下次同步必被覆盖，还会制造冲突（参照 `docs/plan/20261003-upstream-compat-strategy.md`）。
- 其它产品线 `apps/manager`、`apps/backend` 禁止改动。
- 代码侧只允许改动 `apps/` 下的企业产品线代码；其它目录一律不动。
- 后端接口契约（path / method / body / SSE 事件字段）默认不改；确需改动时先评估兼容性与回滚方案。
- 前端请求 URL 默认保持原样；移动或封装 API 时只改位置与类型，不改 URL。

## 改动方式

- 一次只做一个功能，禁止把多个无关功能混进同一个 PR。
- 新增或人工修改的代码注释必须使用中文。随上游整目录复制到 `apps/app-core` 的既有英文注释保持原样，不做全量本地化，避免制造无意义的同步 diff；改动这些文件时只要求新增/修改的注释用中文。
- 后续新增执行计划统一放在 `docs/plan/`；文件名使用全小写英文、短横线分隔，且以 `YYYYMMDD` 日期**开头**（便于按时间排序），例如 `20260927-amp-unification.md`。日期取**文件本身的创建日期**，不是统一定为当前日期。除非用户明确指定，禁止使用大写、过长的文件名或省略日期开头。
- `docs/plan/` 下每个计划文件内容开头（标题之后）须有「状态」栏，标明当前执行进度（如 `进行中` / `已完成` / `待处理` / `持续维护`），并附一句简短描述说明现状与剩余事项。
- 优先 `git mv` 后再改；禁止复制文件留双份。
- 替换或删除旧实现时，同批清理已无引用的旧文件、旧组件、专用 api。
- 删除前先检查引用：无引用才删，有引用先迁移或改指向；禁止先删后修。
- 保持最小改动：只改完成需求所必需的最少文件与最少行，不借机扩大重构。
- 能改现有文件就不新增；避免通过新增文件解决本可在现有文件内完成的问题。
- 新增文件尽量同时删除等量或更多旧文件（move 除外）；不为「结构整齐」预建空目录或占位文件。

## 数据库变更

- 本地开发不依赖、不检查、不启动 Docker 编排；本机 Go、Python 和前端进程直连本地或远程数据库等基础设施。
- 后续所有涉及表或字段的改动，包括新增、修改、删除表/字段/索引/约束/注释，必须在 `migrations/version_kjsc/` 中新增 SQL，从现有最大编号顺延。
- 同一需求中的多个结构调整必须合并到同一个迁移编号；不得按执行次数或调试轮次拆分迁移。
- 每个变更必须成对提交 `.up.sql` 和 `.down.sql`；确实不可完全回退时，`.down.sql` 必须显式说明不可逆部分，并写入人工核对和补偿步骤。
- 注释类迁移的 `.down.sql` 不做「无法回退」豁免：只写 `pg_description` 的迁移可完整还原，须把执行前带英文注释的对象还原为原英文文案（文案从迁移原文或回退前的实库导出，禁止人工转写），其余对象还原为 `IS NULL`。
- 表注释和列注释统一使用中文，且尽量简短：**表注释不超过 10 个字，列注释不超过 20 个字**。只写用途与取值含义，不写实现背景、变更动机、上下游调用关系等长句说明。
- 禁止只通过 ORM 自动建表、临时 SQL、手工执行记录或文档 SQL 代替迁移文件；禁止只提交升级脚本。

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
- `apps/frontend/src/i18n/locales` 与 `apps/frontend/src/i18n/locales_backend` 里，五种语言文件的键路径、键顺序和行结构必须一致，行数也要一致。以 `zh-CN` 的键结构为准，其它语言只替换文案。缺的键当场补译文，重复键删掉，禁止只改一种语言后再等提醒。
- 文案统一走 i18n key，不硬编码。
- 界面自己的文案放 `apps/frontend/src/i18n/locales`。后端接口返回、要给用户看的错误文案放 `apps/frontend/src/i18n/locales_backend`，五种语言同批补齐。由 `apps/frontend/src/i18n/index.ts` 里的 `attachBackendMessages` 并进 `error.<领域>.*`，不要写进页面语言包。
- 用户能看见的接口失败统一返回 `{ error_code, params }`。Python 用 `yuxi.config.errors.ApiError`，未在路由里接住时由全局异常处理按同一形态返回。`error_code` 对应 `locales_backend` 的 `error.<领域>.<错误码>`，领域是错误码第一段，例如 `skill_duplicate` 对应 `error.skill.skill_duplicate`。动态内容放 `params`，占位符与文案里的 `{name}` 一致。后端不写界面句子。
- 知识库等历史接口仍用英文或中文原文，由 `error.kb.*` 对照。新接口按错误码增加，不再新增原文对照。

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

### 合并基纪律（必读）

- **同步节奏：每两周一次**（跟随上游 release 顺延）。禁止攒数月做一次「大爆炸同步」——参照 `docs/plan/20261003-upstream-iteration-model.md`：同步周期越长，滞后累积越快，单次冲突量呈超线性增长（本次两个月积压造成 648 处冲突）。
- 同步前先做「影子目录预对齐」：`git checkout upstream/master -- internal frontend website-docs` 并提交，使三方合并中我方与对方一致，冲突归零。
- 同步上游只能用真三方合并：`git fetch upstream` 后 `git merge upstream/main`，合并提交的**第二个父必须是一个上游提交**。禁止用「整树导入 / 复制覆盖」的普通提交代替同步（历史 `ee231f69f` 因此让合并基长期停在 2026-08-08 `d823ef61a`，每次同步都要重比数百个上游提交，产生 600+ 处冲突）。
- 合并提交一旦建立，不得 rebase / amend / 压缩，否则合并基再次失效。
- 企业规则一律「追加」而不「就地改写」上游文件：`.gitignore`、`.dockerignore` 的企业规则写在文件末尾的「企业追加段」（二者均为最后匹配生效，末尾追加即可覆盖上游规则）。
- 根文件 `CHANGELOG.md`、`README*`、`VERSION`、`THIRD_PARTY_NOTICES.md`、`.env.example`、`.github/workflows/*` 一律跟随上游，不就地改；企业定制走变体名（`.env.kjsc.example`、`config/*_kjsc*`、`Makefile.kjsc`、`scripts/kjsc/*`）。
- 企业文档站是 `apps/docs`；根 `docs/` 属上游领地（企业构建不引用），禁止在其中新增企业文件。
- 每次同步后三步校验：① `git diff --name-status upstream/main` 除企业专属路径外应无差异；② `git grep -nE '^(<<<<<<<|>>>>>>>)'` 应为空；③ `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh` 确认 `apps/app-core` 与 `internal/` 的漂移在预期内。

## 提交

- 禁止自动提交：只有收到明确的人工指令后，才执行 `git add` / `git commit` 等提交操作。
- 提交信息使用 `type(scope): 描述`，例如 `feat(frontend): ...`、`fix(frontend): ...`、`chore(frontend): ...`。
- 一个提交只做一件事；避免把跨产品线的改动混在同一个提交。
- 禁止新增 test 相关 `.ts` 文件、类、用例并提交；历史遗留测试文件仅做修改时可提交。
