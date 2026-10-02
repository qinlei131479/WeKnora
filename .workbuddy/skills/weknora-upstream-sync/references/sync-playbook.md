# 上游同步 Playbook（app-core / frontend / docs 三侧）

状态：持续维护 — 2026-10-02 结合 0.8.2 同步（旧上游 `d823ef61a` → 新上游 `bccb4b151`）实战沉淀。

> 本文件是技能 `weknora-upstream-sync` 的参考手册。技能位于项目 `.workbuddy/skills/weknora-upstream-sync/`（项目级，**随仓库提交**；`.gitignore` 用 `!.workbuddy/` + `.workbuddy/*` + `!.workbuddy/skills/` 三条规则只放行 `skills/`，`memory/`、`outputs/` 不入库）。配套脚本在本技能的 `scripts/` 下，作用于目标 WeKnora 仓库而非技能目录本身。脚本已做反向验证：在未同步状态下能精确报出当时手工发现的 26 个滞后文件。

---

## 1. 先理解结构：双轨，不是单轨

这是所有问题的根源，也是最容易误判的地方。

```
上游提交 ──git merge──> internal/  frontend/  cmd/server/  migrations/  docs/  website-docs/   ← 轨道 A：影子目录
                              │          │                                          │
                              │（人工端口）│（人工端口）                             │（人工端口）
                              ↓          ↓                                          ↓
                        apps/app-core  apps/frontend                                apps/docs    ← 轨道 B：企业活代码
                              ↑
                    cmd/app-core、Makefile.kjsc、config/*_kjsc* 只认这一份
```

- **轨道 A 自动**：`git merge upstream/master` 会直接更新上游原路径。AGENTS.md 明确 `frontend/`、`internal/` 禁止改动，所以这一轨零冲突。
- **轨道 B 手工**：`apps/app-core` 是 `internal/` 的整目录 fork，`apps/frontend` 是 `frontend/` 的 fork，**`apps/docs` 是 `website-docs/` 的 fork**。**merge 成功不等于 B 跟上**——本次就是 merge 全绿、构建全过，但 B 侧有 26 个文件仍停在旧上游（其中 `engine_factory.go` 漏掉的是 SSRF 加固），且 `apps/docs` 在 0.8.2 整轮同步中零跟进（上游从 106 → 210 个文件）。
- 判定"哪份是活的"：看 `Makefile.kjsc`（`app` → `cmd/app-core`，`frontend` → `apps/frontend`）。上游 `cmd/server` + `frontend/` 企业不构建。

**因此同步的本质工作不是解冲突，而是把 A 的增量搬到 B。**

### 映射表

| 上游路径 | 企业路径 | 说明 |
|---|---|---|
| `internal/**` | `apps/app-core/**` | 全量，含 `_test.go` |
| `frontend/src/**` | `apps/frontend/src/**` | 全量 |
| `frontend/tests/**` | `apps/frontend/tests/**` | 全量 |
| `website-docs/**` | `apps/docs/**` | **文档站 fork**（C1/C2/C7 均覆盖）。企业深度定制（93/97 共有文件被改写）：从未定制文件整文件端口，定制文件语义移植；上游新增整块内容（如 `homepage/`、`07-releases/`）由人工决定是否引入 |
| `frontend/Dockerfile`、`nginx*.conf` | — | **不映射**，企业部署走 `scripts/kjsc/docker-entrypoint.frontend.sh` |
| `frontend/package.json` | — | **不映射**，企业有 `bin/`、`packages/` workspace |
| `migrations/{mysql,paradedb,sqlite,versioned}` | 同名跟随 | 企业额外有 `migrations/version_kjsc`，追加而非改写 |
| `config/config.yaml` 等 | `config/*_kjsc*` | 整文件/整目录回退，见 §4 |
| `docs/**` | 根 `docs/` 自动跟随 | 上游 Swagger/README 领地，**禁新增企业文件**（`docs/plan/` 唯一例外）。企业文档站不是它，是 `apps/docs`，见 §5 |

---

## 2. 同步流程

### S0 前置

```bash
git fetch upstream
git status                     # 必须干净
git rev-parse upstream/master  # 记下 NEW_UP
```

确认当前分支历史里有「第二父属于上游」的合并提交，取到 `OLD_UP`（脚本会自动推导）：

```bash
git log --merges -n 20 --format='%H %P'   # 第二父在 upstream/master 上的那个即上次合并基
```

### S1 预检（看清上游改了什么）

```bash
git log --oneline $OLD_UP..$NEW_UP | wc -l
git diff --stat $OLD_UP $NEW_UP -- internal/ frontend/src/ docs/ migrations/ config/ | tail -5
git diff --name-status --diff-filter=A $OLD_UP $NEW_UP -- internal/ frontend/src/   # 新增文件
```

目的：提前判断量级与风险面（新增文件要端口、删除文件要确认企业是否有定制）。

### S2 合并（必须是真合并）

```bash
git checkout -b feature/YYYYMMDD-sync-upstream-<version>
git merge upstream/master        # 禁止整树导入/复制覆盖；合并提交第二父必须是上游提交
```

合并提交一旦建立**不得 rebase / amend / squash**（历史教训：合并基失效导致每次同步要重比数百提交、600+ 冲突）。

### S3 解冲突（四类规则）

| 情形 | 规则 |
|---|---|
| 上游新增文件 | 直接收；若企业有同名定制文件，保留企业版并在文件头注明差异来源 |
| 上游删除文件 | 若企业 fork 有定制 → 保留并注明；否则同步删除 |
| 双方改同一文件 | **以上游为底**，企业差异以「追加到文件末尾 / 走变体文件」方式重加，不就地改写上游行 |
| 品牌与术语 | 空间→租户、WeKnora→Agentic 属企业方向，保留企业译文；但**协议头/常量不改**（如 `X-WeKnora-Signature` 是 `embed_webhook.go` 硬编码的协议头，改了会破坏兼容性） |

必改的两个上游文件（企业必须就地改，合并被覆盖时要恢复）：`go.mod`、`go.sum`。改完用 `go build ./apps/app-core/... ./cmd/app-core/...` 验证。

### S4 端口（把 A 的增量搬到 B）

先跑验收脚本拿清单（见 §6），C1 列出的就是滞后文件。逐个判断：

```bash
# 该文件企业基线是否等于旧上游？等于 → 从未定制，可整文件取上游
git show d1f3499c8:apps/frontend/src/<f> > /tmp/base
diff <(git show $OLD_UP:frontend/<f>) /tmp/base        # 空 = 从未定制
git show $NEW_UP:frontend/<f> > apps/frontend/<f>      # 整文件端口
```

- **从未定制** → 整文件取上游版本（`git show $NEW_UP:... > ...`），最省事也最不易出错。
- **企业改过** → 手工合并，用 `diff $OLD_UP..$NEW_UP` 看上游意图，再叠加企业差异。
- Go 文件端口后要归一化 import：`internal` ↔ `apps/app-core`；端口完用归一化 diff 与上游逐字节比对验证。

### S5 变体补齐（最容易静默失效的地方）

三份企业变体都是**整文件/整目录回退**语义——官方缺一个键/缺一个模板文件，不报错，只是悄悄失效：

- `config/config_kjsc.yaml` ← 对照 `config/config.yaml` 新增配置项
- `config/prompt_templates_kjsc/` ← 对照 `config/prompt_templates/` 新增模板文件
- `config/builtin_agents_kjsc.yaml` ← 对照 `builtin_agents.yaml`
- `.env.kjsc.example` ← 对照 `.env.example` 做**全集差集**（不是只补眼熟的那几个）
- 五语言 locale ← 见 §6 C6

### S6 验收

见 §6。

### S7 提交

按主题拆分，便于回溯与 cherry-pick：

```
fix(app-core): 回灌上游 <version> 的 <具体能力>      # 后端端口
chore(frontend): 回灌 N 个仍停留在旧上游的前端文件    # 前端端口
chore(i18n): N 个值级回退键跟随上游                  # 文案
chore(env): .env.kjsc.example 补齐官方新增变量       # 配置
```

同步类提交与日常业务改动**分开提**。

---

## 3. app-core 侧要点

- 现有工具 `<skill>/scripts/drift_report.sh`：文件级清单 + 注册点断言（网络搜索 provider 注册表、container 接线 import）+ `--deep` 归一化比对。它是硬门槛，退出码 1 即拦截。
- drift_report 做的是"两侧现状差异"，**发现不了"两侧都停在旧版本"**——这正是本次漏掉 `engine_factory.go` 的原因。所以必须有 C1（三方时效比对）补位。
- 端口后标准验证：`go build ./apps/app-core/...`、`go build -tags anydoc ./...`、相关包 `go test`。
- 已知非本次回归的噪声：`apps/app-core/application/service/` 的测试 fake 缺 `GetMindmap` 桩，该包 `go test` 编不过。**生产 `go build` 正常即可**，不要把它误判为同步引入的问题。
- anydoc 上游升级后（如新增 `ToDocumentWithAssetLinks`）必须重跑 `bash scripts/build-anydoc-lib.sh`，否则 `-tags anydoc` 构建报 Undefined symbols。
- `apps/backend`（Java）、`apps/manager` 属禁止改动区，即使发现死代码也只能报告。

---

## 4. frontend 侧要点

- 端口后必做三件事：① 检查新端口文件引用的 `@/...` 本地模块是否存在 ② 检查引用的 i18n 键是否存在 ③ `npx vue-tsc --build --force`。
- i18n 是重灾区，两类静默问题：**缺键**（页面直接显示键名）和**值级回退**（键在但文案悄悄倒退）。两者构建和类型检查都发现不了，只能靠 C6 四方比对。
- 改 i18n 值时**不能按叶子名替换**：`description` 在单文件里出现 108 次、`desc` 154 次。必须做栈式路径定位（逐行维护 `{`/`}` 与键栈，按完整 `a.b.c` 路径命中），替换后重新解析校验。
- 五语言键路径、键顺序、行数必须一致，以 `zh-CN` 结构为准。
- `ja-JP` 是特例：旧上游无此语言（0.8.2 才新增，企业此前自建），四方比对时值级判定不适用，需单独定策略。
- 上游的 i18n 守卫测试不要盲引：`localeKeyAudit.test.ts`、`memoryKeyReferences.test.ts`、`embedLocale.test.ts` 可直接引；但 `locales/workspaceTerminology.test.ts` **禁止出现"租户"**（上游走 workspace），与企业术语方向相反，直引必挂，需做企业反向版。另 AGENTS.md 禁止新增 test 相关 `.ts` 文件并提交，引入前先确认。

### 4.1 组件层外置：只对「模块级追加导出」成立

企业改造过的前端文件，能不能把企业内容搬到独立层（`src/kjsc/...`）、让上游文件恢复原文？
0.8.2 全量扫描（98 个改造文件）的实测分层：

| 档 | 定义 | 数量 | 处置 |
|---|---|---|---|
| L1 可外置-模块级 | 企业内容是**追加的导出/函数/类型**（企业 ⊇ 上游，上游一行没少） | 8 | 搬到 `src/kjsc/...`，上游文件恢复原文件，回到零人工档位 |
| L2 可外置-包裹层 | 改的是组件对外可见面（新增 prop/slot/class），差异只在少数几行 | 32 | 理论上可建 wrapper，实际收益低 |
| L3 需留守 | 改动发生在组件/函数**内部逻辑**（props 转发、条件分支、样式细节） | 58 | 外壳包不住，走 `port_trunk.sh --3way` |
| L4 企业独有 | 上游无对应文件 | — | 企业自有资产，不参与端口 |

**结论：外置只在 L1 成立。** 已落地示例：`src/kjsc/api/tenantMembers.ts` 承载
`addTenantUser/updateTenantUser`，`src/api/tenant/members.ts` 恢复为上游逐字节，
调用方改从 `@/kjsc/api/tenantMembers` 导入。

L2/L3 不要硬做外壳：`SkillFilesDrawer`、`KbUploadSourceDropdown` 这类组件的企业改动在内部行为上，
wrapper 无法拦截，做了反而多一层间接。它们交给 `--3way` 自动合并，冲突的才人工。

---

## 5. docs 侧要点

四份文档，策略完全不同——**注意企业文档站是 `apps/docs`，对应上游 `website-docs`，不是根 `docs/`**：

| 目录 | 归属 | 同步策略 |
|---|---|---|
| 根 `docs/` | 上游领地（轨道 A） | merge 自动跟随；**禁止新增企业文件**（`docs/plan/` 是唯一例外）。C7(a) 检查是否有混入 |
| `website-docs/` | 上游领地（轨道 A） | 企业仓库里的同名影子目录，merge 自动跟随，应与上游**逐字节一致**。C7(b) 验证 |
| `apps/docs/` | 企业文档站（轨道 B，`website-docs` 的 fork） | **深度定制**（0.8.2 实测：93/97 共有文件被企业改写，术语 空间→租户、品牌 WeKnora→Agentic、企业部署说明）。同步分三档：① 从未定制的文件（如 `.vitepress/theme/*`、`scripts/check-*.mjs`）整文件端口，C1 硬门槛管辖；② 定制文件按上游 diff 语义移植（改企业对应段落，不动企业结构）；③ 上游新增整块内容（如 `homepage/` 63 个文件、`07-releases/`）由业务决定是否引入，引入时做术语适配 |

docs 侧的验收是「脚本报告 + 人工语义确认」：C1 报从未定制文件的静默滞后（0.8.2 实测抓到 3 个：`.gitignore`、`scripts/check-links.mjs`、`scripts/check-mermaid.mjs`）；C2/C7 报文件清单缺口（0.8.2 实测 107 个）；C7(d) 列上游改动清单，据此过一遍 `apps/docs` 对应章节。若上游改动涉及 API/配置项，优先检查 `apps/docs/04-api`、`02-architecture`。

---

## 6. 验收：脚本 + 构建 + 三侧专项

### 6.1 一键验收脚本

```bash
cd <weknora仓库>
<skill>/scripts/upstream_sync_check.sh                                # 自动推导基准
<skill>/scripts/upstream_sync_check.sh --old <OLD_UP> --new <NEW_UP> --base <企业基线>
<skill>/scripts/upstream_sync_check.sh --skip i18n,config             # 跳过指定检查
<skill>/scripts/upstream_sync_check.sh --repo <仓库路径> ...          # 不 cd 也能跑
```

| 检查 | 门槛 | 判什么 |
|---|---|---|
| C1 映射时效性 | **硬** | 上游改过但企业 fork 仍等于旧上游 —— 静默回退。0.8.2 实测报出 26 个滞后 + apps/docs 3 个 |
| C2 映射缺失 | 报告 | 上游有、企业 fork 无（区分测试/非测试）。0.8.2 实测：frontend 156、website-docs 107 |
| C3 冲突标记 | **硬** | `apps/` 下 `<<<<<<<` / `>>>>>>>` 残留 |
| C4 env 全集差集 | **硬** | `.env.example` 有而 `.env.kjsc.example` 无的变量 |
| C5 配置变体对齐 | **硬** | `prompt_templates_kjsc` 缺模板、KJSC 变体缺键路径 |
| C6 i18n 四方比对 | **硬** | 缺键 + 值级回退（区分企业有意定制） |
| C7 docs 侧 | 报告 | 四子项：根 docs/ 混入检查、影子目录 website-docs/ 一致性、website-docs→apps/docs 缺口清单、上游 docs/website-docs 改动清单 |
| C8 migrations | 报告 | 上游新增迁移，提示 `version_kjsc` 是否跟进 |

退出码 `0` 通过、`1` 有硬门槛未过。C6 可用 `--allow-reg <key>` 逐键豁免确认为有意保留的文案。

两种跑法要分清：

- **不带参数** = 增量验收。自动把 `NEW_UP` 设为 `upstream/master`，`OLD_UP` 设为最近一次合并提交的第二父（即"上次同步到哪"）。上游没有新提交时差集为空，属正常。
- **显式 `--old`** = 全量体检。给一个更早的基线（如 `--old d823ef61a`）会把整段区间的改动都纳入比对，适合日常定期排查 fork 漂移，或在怀疑某次同步没搬干净时用。

**脚本已做反向验证**：在 0.8.2 同步前的状态（`6e1b14b98`）上跑，精确报出本次手工发现的全部 26 个滞后文件并退出 1；在修复后的当前状态上跑，全部通过退出 0。

### 6.2 构建与测试（脚本之外的硬门槛）

```bash
go build ./apps/app-core/... ./cmd/app-core/...      # 必过
go build -tags anydoc ./apps/app-core/...            # 上游动过 anydoc 时必过
go test ./apps/app-core/container/ ./apps/app-core/common/ ./apps/app-core/modelcontext/
bash <skill>/scripts/drift_report.sh --deep             # app-core 漂移硬门槛
cd apps/frontend && npx vue-tsc --build --force      # 必过
npx tsx src/i18n/localeGapScan.ts                    # missing referenced 应为 0
```

### 6.3 三侧专项复核

- **app-core**：`drift_report.sh`（注册点断言）+ 对端口过的 Go 文件做归一化 diff 与上游逐字节比对 + 符号级检查（上游新增导出符号，企业侧是否有）。
- **frontend**：C6 i18n 四方比对 + 新端口文件的 `@/...` 与 i18n 键引用检查 + `localeGapScan`。
- **docs**：C7 四子项逐个过（影子目录一致性 / apps/docs 缺口 / 上游改动语义跟进）；根 `docs/` 确认无企业文件混入；`apps/docs` 深度定制文件的移植必须做术语适配（空间→租户、WeKnora→Agentic）。

### 6.4 抽样人工比对

脚本覆盖不到的语义差异靠抽样：从 C1「已跟上」的文件里随机抽 10 个，人工看一眼企业的定制是否还在、有没有被上游版本覆盖掉。

---

## 7. 已知陷阱清单

| 陷阱 | 说明 |
|---|---|
| merge 绿 ≠ 同步完 | 轨道 B 不会自动跟上，必须跑 C1 |
| 品牌替换不能碰协议头 | `X-WeKnora-Signature` 等硬编码常量改了会破坏兼容 |
| `go.mod` / `go.sum` | 企业会就地改的上游文件，合并被覆盖必挂，同步后第一个查它 |
| anydoc 静态库 | 上游升级后必须 `bash scripts/build-anydoc-lib.sh` |
| `service` 包 `go test` 编不过 | 既有问题（fake 缺 `GetMindmap` 桩），非本次回归，别误判 |
| 上游守卫测试禁"租户" | `workspaceTerminology.test.ts` 与企业术语相反，不可直引 |
| macOS grep 不支持 `\|` | 交替会静默返回空，导致"零引用"误判；多关键词一律用内置检索工具 |
| zsh 不做变量分词 | `for f in $FILES` 当成一个文件名，用 `while IFS= read -r` |
| i18n 按叶子名替换 | `description` 出现 108 次，必须栈式路径定位 |
| 静态库/测试文件不进 git | `third_party/anydoc-go/lib/*/libanydoc_go.a` 被 gitignore，同步后本地需重建 |

---

## 8. CI 接线建议

尚未接线，建议顺序：

1. **pre-push**：跑 `upstream_sync_check.sh --skip i18n`（快，约 1 分钟）。不适合 pre-commit——C1 要跑大量 `git show`，提交时太慢。
2. **Jenkins（`scripts/kjsc/jenkins/`）**：在 app-core 构建阶段前加一步完整验收（`--skip` 都不加），失败即阻断。
3. **周期性**：即使不做同步，也可每周跑一次全量验收，防止 fork 在日常开发中再次漂移。

接线时注意：C5 若企业确实有意裁剪配置项，用 `--skip config` 并把裁剪清单补进本文档，不要直接放宽脚本。
