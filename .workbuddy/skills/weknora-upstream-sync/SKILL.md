---
name: weknora-upstream-sync
description: WeKnora 企业分支同步上游开源仓库（app-core / frontend / docs 三侧）的流程、验收与排错。当用户说「同步上游」「merge upstream」「跟上上游版本」「检查 fork 漂移」「同步后验收」「i18n 缺键/文案回退」「env 变量缺口」「配置变体失效」时使用。触发关键词：同步上游、upstream merge、0.8.x、drift、fork 漂移、静默回退、locale gap、config_kjsc、env.kjsc。
agent_created: true
---

# WeKnora 上游同步

适用于「上游开源仓库 + 企业多产品线 fork」的仓库（企业分支在 `apps/`，上游在 `internal/`、`frontend/`）。

> 技能位置：项目 `.workbuddy/skills/weknora-upstream-sync/`（项目级），**随仓库提交**，团队 clone 后即可用，同一工作区内的所有智能体会话自动发现。
> `.gitignore` 第 2 行的 `.*` 会忽略整个 `.workbuddy/`，故 `.gitignore` 中专门开了一组例外：`!.workbuddy/` + `.workbuddy/*` + `!.workbuddy/skills/` —— 只放行 `skills/`，`memory/`、`outputs/` 等仍不入库。**改这个目录时不要动那三条规则。**
> `.workbuddy/memory/` 下有配套的项目记忆（双轨结构、同步陷阱），不提交。

### 技能自带什么（4 脚本 + 1 数据）

| 文件 | 干什么 | 何时跑 |
|---|---|---|
| `scripts/upstream_sync_check.sh` | 八项体检（C1–C9），退出 1 即拦截 | 同步后必跑 |
| `scripts/port_trunk.sh` | L0 整文件端口 + `--3way` 三向合并 | 端口阶段 |
| `scripts/i18n.mjs` | `format` / `overlay` / `align` / `check` 四子命令 | 动 i18n 时 |
| `scripts/drift_report.sh` | `internal` ↔ `apps/app-core` 漂移与注册点断言 | app-core 端口后 |
| `references/docs-terms.json` | 文档术语表（空间→租户 等 5 条，人工沉淀） | 被 `docs_anchor.mjs` 读 |

`scripts/docs_anchor.mjs`（文档站锚点）也在，文档站同步时用。
**不入库的产物**：锚点索引、各类 CSV/报告 → 一律落 `.workbuddy/outputs/`。

## 第一性原理：双轨，不是单轨

**这是所有同步问题的根源，动手前必须先确认。**

```
上游 ──git merge──> internal/  frontend/  cmd/server/  migrations/  根docs/  website-docs/   ← 轨道A：自动跟上
                          │         │                                                    │
                    （人工端口）（人工端口）                                           （人工端口）
                          ↓         ↓                                                    ↓
                    apps/app-core  apps/frontend                                         apps/docs  ← 轨道B：企业活代码
```

- 轨道 A：`git merge upstream/master` 直接更新，`AGENTS.md` 禁止改动，零冲突。
- 轨道 B：`apps/app-core` 是 `internal/` 的整目录 fork，`apps/frontend` 是 `frontend/` 的 fork，**`apps/docs` 是 `website-docs/` 的 fork（企业文档站，不是根 `docs/`）**。**不会随 merge 自动跟上**。
- 判定谁是活的：看 `Makefile.kjsc`（`app` → `cmd/app-core`，`frontend` → `apps/frontend`）。上游 `cmd/server` + `frontend/` 企业不构建。

> **merge 成功 ≠ 同步完成。** 0.8.2 同步时 merge 全绿、`go build` 与 `vue-tsc` 全过，B 侧仍有 26 个文件停在旧上游，其中 `container/engine_factory.go` 漏掉的是整套 SSRF 加固；`apps/docs` 则整轮零跟进（上游 106→210 个文件）。同步真正的活不是解冲突，是**把 A 的增量搬到 B**。

### 映射表

| 上游 | 企业 | 备注 |
|---|---|---|
| `internal/**` | `apps/app-core/**` | 全量，含 `_test.go` |
| `frontend/src/**` | `apps/frontend/src/**` | 全量 |
| `frontend/tests/**` | `apps/frontend/tests/**` | 全量 |
| `website-docs/**` | `apps/docs/**` | **文档站 fork**（深度定制：93/97 文件被企业改写）。未定制文件整文件端口；定制文件语义移植；上游新增整块（`homepage/`、`07-releases/`）由业务决定是否引入 |
| `frontend/Dockerfile`、`nginx*.conf`、`package.json` | — | **不映射**，企业部署与 workspace 是自建的 |
| `config/config.yaml` 等 | `config/*_kjsc*` | 整文件/整目录回退，缺了静默失效 |
| 根 `docs/**` | 跟随 | 上游领地（Swagger/README），禁新增企业文件（`docs/plan/` 例外） |

## 同步纪律（先读，防不可逆破坏）

1. **上游不拆，企业绝不拆。** 上游保持单文件的结构（五语言 i18n 大文件 `locales/*.ts`、`config.yaml` 等），企业**绝不主动拆分/重构/重命名**——一旦结构分叉，「整文件端口」这条最快的同步路径就永久失效，之后每次同步都要手工缝合。企业差异一律走「追加到末尾 / 变体文件」，不改写上游行。
2. **动文件前先查企业定制史**：`diff <(git show $OLD_UP:上游路径) <(git show <企业基线>:企业路径)`，空 = 从未定制 → 整文件取上游；非空 = 企业改过 → 语义合并。
3. **三类 fork 文件的处理档位**：
   - 从未定制 → **整文件端口**（`git show $NEW_UP:<上游路径> > <企业路径>`），最省事最不易错
   - 轻度定制 → 取上游 diff 语义，叠加在企业版本上
   - 深度定制（如 `apps/docs` 93/97、i18n 五语言）→ 只做**语义移植**：上游行为变了（新配置项、新 API、新流程），人工更新企业对应段落，术语适配（空间→租户、WeKnora→Agentic）
4. **合并提交一旦建立不得 rebase / amend / squash**（第二父必须指向上游提交，否则合并基失效，下次同步重比数百提交）。

## 何时用

- 要把企业分支升到某个上游版本
- 同步完之后要验收（**必跑脚本，不要靠肉眼**）
- 怀疑 fork 漂了（功能表现与上游不一致、构建绿但行为不对）
- i18n 缺键或文案疑似倒退、env 变量疑似缺失、配置项改了不生效

## 工作流

### 1. 准备

```bash
git fetch upstream
git log --oneline $OLD_UP..$(git rev-parse upstream/master) | wc -l     # 量级
git diff --stat $OLD_UP upstream/master -- internal/ frontend/src/ config/ | tail -5
```

`OLD_UP` = 最近一个「第二父属于 upstream」的合并提交的第二父：

```bash
git log --merges -n 20 --format='%H %P'
```

### 2. 合并（必须真合并）

```bash
git merge upstream/master        # 合并提交第二父必须是上游提交
```

禁止整树导入/复制覆盖；合并提交一旦建立**不得 rebase / amend / squash**（历史教训：合并基失效后每次同步要重比数百提交、600+ 冲突）。

解冲突四类规则：

| 情形 | 规则 |
|---|---|
| 上游新增 | 直接收；企业有同名定制则保留并注明 |
| 上游删除 | 企业 fork 有定制就保留；否则同步删 |
| 双方改同一文件 | **以上游为底**，企业差异用「追加到末尾 / 走变体文件」重加，不就地改写上游行 |
| 品牌与术语 | 空间→租户、WeKnora→Agentic 属企业方向，保留；但**协议头/常量不改**（`X-WeKnora-Signature` 是硬编码协议头） |

同步后第一个查 `go.mod` / `go.sum`——企业会就地改这两个上游文件，被覆盖必挂。

### 3. 端口（A → B）

**先用脚本跑 L0 主干**（占映射文件绝大多数，零人工）：

```bash
<skill>/scripts/port_trunk.sh --old <OLD_UP> --new <NEW_UP>              # 预演
<skill>/scripts/port_trunk.sh --old <OLD_UP> --new <NEW_UP> --aggressive # 含 B 档
<skill>/scripts/port_trunk.sh --old <OLD_UP> --new <NEW_UP> --apply      # 实际写入
```

判据是**子集判定**，不是「企业 == 上游旧版」：

| 档 | 条件 | 处置 |
|---|---|---|
| A | 企业是上游 NEW 的严格子集（企业无任何上游没有的行） | 自动端口 |
| B | 企业自有行 ≤3 且远少于滞后量（多为注释/位置差异） | `--aggressive` 才端口 |
| C | 其余 | 只报告，人工 |

> 曾用「企业 == 上游 OLD」和「企业 == OLD..NEW 间某个历史版本」两种判据，**实测全部漏判**：
> 企业 fork 常是「OLD + 部分中间改动」的混合，不等于任何单一上游版本（`tenant.go` 遍历 15 个
> 历史版本无一命中）。子集判定是唯一能覆盖这种情况的。

剩下 C 档不再逐个 diff —— 交给 **三向合并**（见下）。

#### 三向合并取代补丁队列（M3 精简后的形态）

C 档文件 = 企业改造过、不能整文件端口的部分。

```bash
<skill>/scripts/port_trunk.sh --old <OLD_UP> --new <NEW_UP> --3way              # 预演
<skill>/scripts/port_trunk.sh --old <OLD_UP> --new <NEW_UP> --3way --apply      # 干净的直接写回
<skill>/scripts/port_trunk.sh ... --3way --filter views/                        # 只看某路径
```

对每个 C 档文件跑 `git merge-file ours=企业当前 base=上游OLD(归一化) theirs=上游NEW(归一化)`，
结果 = 企业定制 + 上游 OLD→NEW 的增量：

- **干净的**自动写回（`--apply`），**冲突的**留 `<<<<<<<` 标记写到 `--out`
  （默认 `.workbuddy/outputs/port-3way/`），**绝不覆盖企业原文件**
- 退出码 3 = 存在冲突未解

> **为什么不预先物化成补丁文件**（曾做过，已删除）：补丁 = `diff(上游某版本 → 企业)`，
> 上游一升版就全部失效、必须整体重新生成，是纯派生物而非资产；而它的基线 rev 本来就在
> git 里（合并提交的第二父）。三向合并零存储，且冲突时能**精确标位**——
> 实测 89 个「上游改过 ∩ 企业定制」的 frontend 文件：34 个自动合并干净（双向无损验证通过）、
> 43 个留标记，其中 15 个只有 1 个冲突块。补丁队列在同样场景下是「打不上就整体放弃」。

- ⚠️ `i18n/locales/`、`locales_kjsc/`、`locales_backend/` **自动排除**：它们有专门的
  叠加层流程（`i18n.mjs`），主文件必须与上游 AST 等价。实测若参与三向合并，
  `zh-CN.ts` 会炸出 53 个冲突块并把上游译文和企业术语混进同一文件。

#### 组件层外置（M3）

只需记住结论，不需要扫描工具（原 `component_scan.mjs` 已删，分层定义保留在 playbook 4.1）：

| 层 | 含义 | 处置 |
|---|---|---|
| L1 | 模块级追加导出（企业 ⊇ 上游） | 搬到 `src/kjsc/...`，上游文件恢复原文 → 回到整文件端口 |
| L2 | 改组件对外可见面（prop/slot/class） | 理论上可建 wrapper，实际收益低 |
| L3 | 组件/函数内部逻辑改造 | 外壳包不住，交给 `--3way` |
| L4 | 上游无此文件 | 企业自有资产，不参与端口 |

**外置只在 L1 成立**（实测 L1 8 / L2 32 / L3 58）。已落地示例：`api/tenant/members.ts` 的 `addTenantUser`/
`updateTenantUser` 外置到 `src/kjsc/api/tenantMembers.ts`，对上游 `TenantMember` 的字段
补充用 **TS 模块增强**（`declare module`）完成，上游文件已恢复逐字节一致。
> `declare module` 要用**相对路径**写，用 `@/` 别名在部分 TS 配置下解析不到。

#### 文档锚点机制（M3）

```bash
<skill>/scripts/docs_anchor.mjs build --learn-terms   # 生成索引（Learn 的术语需人工确认）
<skill>/scripts/docs_anchor.mjs verify                # 零落盘自检：能否精确重建企业版
<skill>/scripts/docs_anchor.mjs check                 # 端口后锚点是否漂移
<skill>/scripts/docs_anchor.mjs apply                 # 回填（带哈希硬保险，不一致就拒写）
```

- 先按**标题路径**切块，企业定制登记为「锚点 + 上游原文 + 企业原文」，不再全文 diff
- **12/67 篇是企业整篇重写**（标题结构全不同，如 `01-introduction.md`），锚点对它们无意义，
  索引里单列 `rewritten`，判为企业自有文档、不参与端口
- 术语表由 `--learn-terms` Learn，两道去噪：替换必须能**完整解释**该块差异；术语不得含
  `_ / .` 等标识符字符（否则会 Learn 出 `s_knowledge→r` 这种从被删路径里切出来的垃圾）
- **apply 的硬保险**：索引记企业版全文 sha256，重放结果不一致就拒写整篇。
  实测：端口 `03-features/14-wiki.md` 回上游后 apply → 逐字节还原
- 已知边界：52 篇里 28 篇可精确重建；其余多为「多处插入共用同一锚点」的重排场景，
  下一步改成**章节级锚点**（按标题整段替换）可进一步收敛
- 锚点索引（1.8MB）默认写在 `.workbuddy/outputs/docs-anchors.json`（不入库）：它是从
  「上游 docs + 企业 docs」实时算出的派生物。只有术语表 `<skill>/references/docs-terms.json`
  （454B，人工沉淀的 空间→租户 等 5 条）是真资产，随技能入库

- **从未定制** → 整文件取上游，最省事也最不易错
- **改过** → 手工合并，看 `diff $OLD_UP..$NEW_UP` 理解上游意图再叠加企业差异
- Go 文件端口后归一化 import（`internal` ↔ `apps/app-core`）再与上游逐字节比对验证

**脚本边界**：不保证编译通过。企业若把上游单文件拆成多个（如 `tenant.go` →
`tenant_sandbox_config.go`），端口主文件会类型重复声明——判据是「上游无此拆分文件」，
按「上游不拆、企业不拆」删除。端口后必跑构建。

**文档站另走三步法**（`--docs` 只做检测，不建议直接端口）：整文件端口 → 术语替换
（空间→租户）→ 定制段落回填。因为企业版含「租户」而上游是「空间」，plus 恒 >0，
子集判定对文档站不适用。

### 4. 补齐变体（最容易静默失效）

三份企业变体都是「整文件/整目录回退」语义——缺键或缺模板文件**不报错，只是悄悄失效**：

- `config/config_kjsc.yaml`、`config/prompt_templates_kjsc/`、`config/builtin_agents_kjsc.yaml`
- `.env.kjsc.example`：与 `.env.example` 做**全集差集**，不是只补眼熟的那几个
- 五语言 locale：已改为叠加层，见下

#### i18n 叠加层（已完成，勿回退）

主 `i18n/locales/*.ts` 与上游 **AST 等价**（整文件端口 + `i18n.mjs format` 统一顺序/注释，
永不手工改文案）；企业内容全部在 `i18n/locales_kjsc/*.ts`，由 `index.ts` 的 `deepMerge` 运行时合并。

三个目录 × 五语言的行数必须**完全一致**（当前 7804 / 1678 / 119），不一致就是缺陷。
i18n 的四个能力合并为一个 `i18n.mjs`（子命令 `format` / `overlay` / `align` / `check`），
住在技能目录 `<skill>/scripts/` 下，用 `--repo` > `WEKNORA_REPO` > git 顶层推导目标仓库，
可以在任意 cwd 运行；脚本**只是工具，产物（locale 文件）才入库**。
```bash
node <skill>/scripts/i18n.mjs format               # 预演报告行数是否对齐（不一致会 exit 1）
node <skill>/scripts/i18n.mjs format --apply       # 统一键顺序 + 注释压缩为单行 + 统一序列化
```
> 主文件行数不一致的历史根因（已归因）：①各语言注释跨行数不同（en-US 注释 13 行、其余 7 行）
> ②顶层块顺序各语言不同（如 resourceSort 位置差 170 行）③个别长值写成多行拼接。
> 三者都**不含语义**，但会掩盖真正的语义检查，所以用格式化掰平，C6 相应改用 AST 等价判据。
>
> ⚠️ **每次 port_trunk.sh 端口完 locales/ 后必须重跑 `--apply`**：端口会把格式化状态覆盖回上游原文。
>   校验方式别看行数近似值，用 format 预演的 exit code（`wc -l` 五个文件必须逐个相等，
>   7802/7796/7796/7796/7798 这种「看着差不多」就是没格式化）。

```bash
# 生成 / 校验（--verify 默认拿「当前 locales/」当企业原版，叠加层生成后恒真 → 必须带 --ent-rev）
node <skill>/scripts/i18n.mjs overlay --verify --ent-rev <改造前的企业rev>
node <skill>/scripts/i18n.mjs overlay --apply --port-trunk     # 重新生成叠加层并端口主文件

# 键集对齐（补齐各语言未生效的企业术语，见下）
node <skill>/scripts/i18n.mjs align                            # 预演
node <skill>/scripts/i18n.mjs align --apply --fill-equal \
    --todo-out .workbuddy/outputs/i18n-overlay-align-todo.csv  # 写入（含同值占位）
node <skill>/scripts/i18n.mjs align --apply --prune-equal      # 逆操作：清掉同值条目
```
> `--todo-out` 的产物是**每次生成的临时文件**，放 gitignore 的 `.workbuddy/outputs/`，不入库。

- 叠加层 = 企业独有键（837）+ 值级覆盖（zh-CN 297 / en-US 251 / ja-JP 84 / ko-KR 154 / ru-RU 163）
- 生成脚本自带校验：**深合并(上游, 叠加层) 必须与企业原版逐键一致**，否则退出 1
- 一次消灭约 4 万行差异，5 个大文件回到整文件端口档位

#### 键集对齐（叠加层五语言键数不齐时必做）

叠加层键数不齐**不是生成脚本漏了**，而是「企业该语言当时与上游同值」——典型后果是中文已把
「空间→租户」改掉，英文仍 `workspace`、日文仍 `ワークスペース`，企业术语只在中先生效。
`i18n.mjs align` 从已有覆盖反推各语言术语表，再把术语应用到缺失键的上游值：

| 语言 | 主术语 | 补齐前 → 后（键数） | 剩余缺口 |
|---|---|---|---|
| zh-CN | 空间→租户 | 1134 → 1135 | 9 |
| en-US | workspace→tenant / Workspace→Tenant | 1088 → 1105 | 39 |
| ja-JP | ワークスペース→テナント（+子串 スペース） | 921 → 1114 | 30 |
| ko-KR | 워크스페이스→テナント / 공간→테넌트（+子串 스페이스） | 991 → 1124 | 20 |
| ru-RU | пространств→тенант | 1000 → 1111 | 33 |

术语判定门槛（防把「整句改写」当术语泛化）：
1. 覆盖频次 ≥3 —— n=2 多是语境限定改写（ja `招待→追加` 只用于「添加成员」按钮，泛化会把
   「再次邀请加入」也改成「再次添加」，实测误伤过）
2. 上游语料频次 ≥3 —— 挡住整句改写（ru `Delete this workspace`）
3. 同一 from 的主 to 占比 ≥0.7 —— 否则判歧义整批跳过（WeKnora → 平台/Agentic/@:{brand.name}）
4. to 含 `@:`（i18n 链接语法/品牌引用）不泛化
5. **子串扩展**只对非 ASCII 术语生效（ja スペース / ko 스페이스），且需跨语言语境确认：
   该变体证据键的 zh-CN 企业值必须含「租户」。英文 `space` 是通用词（语料 300+ 处，
   可能命中 "storage space"），一律不做子串扩展，留人工。

剩余无法自动判断的（整句改写、上游无此键）导出 CSV 交人工。

**三个坑**：
1. **不要运行 `regeneratePrunedLocales.ts`**。剪枝器只处理 `locales/`、按源码使用键重写主文件，
   会破坏「主文件 == 上游」不变式，C6 随即报漂移。overlay 模式下企业键不在主文件，剪枝器也管不到。
2. **`--verify` 会假绿**：它拿当前 `locales/` 当企业原版，叠加层生成后 overlay 算出来是空、
   深合并自等，永远 OK。要真校验必须 `--ent-rev <改造前的企业rev>`。
3. **C6 语义已变**。叠加层存在时 `i18n.mjs check` 自动切换为三项检查：
   主文件是否漂移（硬）、叠加层与上游路径冲突（硬）、上游改动且被覆盖的键（报告）。
   旧的「缺键/回退」在叠加层模式下恒为 0，形同虚设。自检：`--self-test`。

> 历史注记（**已推翻，勿再用**）：曾把主 `locales/*.ts` 五语言行数差 6 行判为「上游自身形态、
> 不是缺陷」。实测归因是注释跨行数 + 顶层块顺序 + 长值拼接三项**纯格式**差异，
> `format` 掰平后 AST 零变化、行数即可对齐。**判据不变：三个目录 × 五语言行数必须完全一致，
> 不一致就是缺陷。**「行数不齐是上游形态」不是可接受的解释。

### 5. 验收（必跑）

```bash
cd <weknora仓库>
<skill>/scripts/upstream_sync_check.sh --old <OLD_UP> --new <NEW_UP> --base <企业基线>
```

也可 `--repo <路径>` 或设 `WEKNORA_REPO`。不带参数 = 增量（NEW 取 `upstream/master`，OLD 取上次合并的第二父）；显式 `--old <更早基线>` = 全量体检。`--skip i18n,config` 可跳过。

| | 检查 | 门槛 |
|---|---|---|
| C1 | 映射时效性：上游改过但 fork 仍等于旧上游（覆盖 internal/frontend/website-docs 三条映射） | **硬** |
| C2 | 映射缺失（分测试/非测试，含 website-docs→apps/docs 缺口） | 报告 |
| C3 | `apps/` 冲突标记残留 | **硬** |
| C4 | env 全集差集 | **硬** |
| C5 | 配置变体：模板文件集 + 键路径 | **硬** |
| C6 | i18n 四方比对：缺键 + 值级回退 | **硬** |
| C7 | docs 侧四子项：根 docs/ 混入、影子目录一致性、文档站缺口清单、上游改动语义跟进提示 | 报告 |
| C8 | migrations | 报告 |

C6 由同目录 `scripts/i18n.mjs check` 执行，能区分「回退」与「企业有意定制」；确认为有意保留的用 `--allow-reg <key>` 豁免。

**脚本之外还要跑**：

```bash
go build ./apps/app-core/... ./cmd/app-core/...
go build -tags anydoc ./apps/app-core/...          # 上游动过 anydoc 时
bash <skill>/scripts/drift_report.sh --deep           # app-core 漂移，硬门槛
cd apps/frontend && npx vue-tsc --build --force
npx tsx src/i18n/localeGapScan.ts                  # missing referenced 应为 0
```

`drift_report.sh` 查的是「两侧现状差异」，**发现不了「两侧都停在旧版本」**——C1 就是补这个位，两者都要跑。

### 6. 提交

按主题拆：`fix(app-core): 回灌上游 <版本> 的 <能力>` / `chore(frontend): 回灌 N 个滞留文件` / `chore(i18n): ...` / `chore(env): ...`。同步类与日常业务改动分开提。

## 三侧要点

**app-core**：Go 端口后归一化 import 与上游逐字节比对；`apps/backend`、`apps/manager` 属禁止改动区，发现死代码也只能报告；上游升级 anydoc 后必须 `bash scripts/build-anydoc-lib.sh`。

**frontend**：端口后检查新文件引用的 `@/...` 模块与 i18n 键是否都存在；改 i18n 值**必须栈式路径定位**（`description` 单文件出现 108 次、`desc` 154 次，按叶子名替换必错）；五语言键路径/顺序/行数须一致，以 `zh-CN` 为准；上游 `locales/workspaceTerminology.test.ts` **禁止出现「租户」**，与企业术语相反，不可直引。

**docs**：四份文档四种归属——根 `docs/`（上游 Swagger/README 领地，自动跟随，禁混入企业文件）与 `website-docs/`（上游文档站，企业同名影子目录，应与上游逐字节一致）都属轨道 A；**`apps/docs/` 是 `website-docs/` 的企业 fork（轨道 B）**，深度定制（93/97 文件），未定制文件整文件端口（C1 管辖）、定制文件语义移植、上游新增整块由业务定夺；移植时必须术语适配。

## 已知陷阱

| 陷阱 | 说明 |
|---|---|
| merge 绿 ≠ 同步完 | 必须跑 C1 |
| 品牌替换不能碰协议头 | `X-WeKnora-Signature` 等硬编码常量 |
| `go.mod` / `go.sum` | 企业就地改的上游文件，合并后第一个查 |
| anydoc 静态库 | 上游升级后必须重跑构建脚本，否则 Undefined symbols |
| `service` 包 `go test` 编不过 | 既有问题（fake 缺 `GetMindmap` 桩），非本次回归 |
| macOS grep 不支持 `\|` | 交替会静默返回空，多关键词用内置检索工具 |
| zsh 不做变量分词 | `for f in $FILES` 会当成一个文件名，用 `while IFS= read -r` |
| 写检查脚本必须反向验证 | 在「未修复」的 rev 上跑一遍确认能报出问题，否则不知道它是否有效 |
| **模板字符串引用不被 i18n 剪枝器识别** | `` t(`datasource.syncError.${e.code}`) `` 这类动态键，必须在 `i18n/localeKeyAudit.ts` 的 `EXTRA_PREFIXES` 显式登记前缀，否则剪枝器判「无引用」——`localeKeyAudit.test.ts` 的钉钉断言就是这样失败的。同步该文件时注意上下游 `EXTRA_PREFIXES` 差集 |
| **grep 查组件内 i18n 键会漏** | 有的键写在 `<template>` 的三元表达式或模板字符串里。判断键是否真被引用，用 `localeKeyAudit` 的剪枝结果或直接读文件，别只 grep 变量名 |

完整流程、映射表、四类冲突规则与三侧细节见 `references/sync-playbook.md`。
