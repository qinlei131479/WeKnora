# 上游同步 Checklist（internal → apps/app-core）

> **状态：持续维护** — 本文为流程清单，每次 `internal/` 更新后按步骤执行；无固定完成态。

适用场景：`internal/`（上游腾讯开源）发生更新后，把能力端口到 `apps/app-core/`（企业 fork）。两侧是手工同步的平行分支，**没有工具链自动回灌**，本文 + `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh` 是唯一的兜底。

## 第 0 步：跑漂移检测

```bash
.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh            # 快速：文件清单 + 注册点断言（漂移时退出码 1）
.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh --deep     # 慢（1-2 分钟）：区分「仅 import 路径差异」与「实质差异」
```

- **退出码 1 = 有能力漏端口**，按第 1 节清单逐项补齐后再继续。
- `--deep` 里「实质差异」的文件才是需要人工比对的范围；「仅 import 路径差异」与上游语义一致，不要动。
- 建议在 Jenkins app-core Job 构建前加一步 `sh .workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh`，漂移即 fail-fast（脚本无外部依赖，仅需 bash）。

## 第 1 节：四个注册点（漏一个 = 功能静默缺失）

历史上真实的漏项：gitlab / ima 连接器、exa / metaso / bocha / brave 搜索 provider——文件都复制了，注册没补，功能不可见且无报错。同步上游后**必须逐项核对**：

| # | 注册点 | 文件 | 核对方法 |
|---|---|---|---|
| 1 | **依赖装配总入口** | `apps/app-core/container/container.go` | 与 `internal/container/container.go` 逐段 diff：`Provide` / `Invoke` 调用、import 列表。上游新增任何 `must(container.Provide(...))` 都要有对应行 |
| 2 | **数据源连接器** | 同上 `initConnectorRegistry()` | 上游新增 connector 包后：import 别名 + `registry.Register(xxxConnector.NewConnector())` 缺一不可 |
| 3 | **网络搜索 provider** | 同上 `registerWebSearchProviders()` | 字符串键集合必须与上游一致（脚本 2a 已自动断言） |
| 4 | **检索引擎工厂** | `apps/app-core/container/engine_factory.go` | 与上游 diff：上游新增向量库 / 引擎类型时，`createEngineServiceFromStore` 的分派要同步 |

### 已知盲区（脚本抓不到，必须人工）

- **chat pipeline 插件**：上游在 container.go 装配段按顺序 `Invoke` 各 `NewPlugin*`，注册顺序即插件执行顺序。新增插件或调整顺序时 import 检查不报（包名相同）。人工核对：
  ```bash
  diff <(grep -n "Plugin" internal/container/container.go) <(grep -n "Plugin" apps/app-core/container/container.go)
  ```
- **models provider**：`models/provider/` 多数厂商在各自文件 `func init()` 自注册，复制文件即生效；但 `provider.go` 的常量清单、`DetectProvider` URL 探测规则需人工 diff。
- **`types/` 接口与实体**：上游改 `types/interfaces/*` 契约时，两侧要同批改，否则编译期才会暴露。

## 第 2 节：配置体系核对

- `apps/app-core/config/config.go` 与 `internal/config/config.go` diff：上游新增配置项、env 覆盖函数（`applyXxxEnvOverrides`）要端口。
- 上游新增 `config/*.yaml` 配置项时：**先补 KJSC 变体**（`config_kjsc.yaml`），不改官方 `config/config.yaml`。
- 加载优先级链不得回退：`config_kjsc` → `config`；`prompt_templates_kjsc/` → `prompt_templates/`；`builtin_agents_kjsc.yaml` → `builtin_agents.yaml`。
- `config_kjsc.yaml` 的 `${VAR:-default}` 展开能力不得简化。

## 第 3 节：企业侧维护入口同步检查

同步官方代码后逐项确认以下文件仍指向 KJSC 变体（这些是企业侧唯一可改的入口）：

- [ ] `docker-compose-kjsc.yml` / `docker-compose-mac.yml`：`app` 服务仍构建 `docker/Dockerfile.app-core`、挂载 `*_kjsc*` 配置
- [ ] `scripts/kjsc/*`：`dev.sh` 的 ldflags 仍把 `internal/handler` 替换为 `apps/app-core/handler`
- [ ] `.env.kjsc.example`：上游新增 env 变量同批补入（注意放占位符，不放假真凭据）
- [ ] `Makefile.kjsc` / `.air.appcore.toml`：目标仍指向 `cmd/app-core`
- [ ] `migrations/version_kjsc/`：企业迁移编号从现有最大号顺延，`.up`/`.down` 成对

## 第 4 节：验收

```bash
go build ./cmd/app-core          # 必须通过
.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh   # 必须退出码 0
```

涉及前端的能力端口另行核对 `apps/frontend`（上游 `frontend/` 的对应改动），i18n 五语言同批补齐（`zh-CN` 为基准，五文件键路径/行数一致）。

## 附：企业侧有意不端口的差异（白名单）

同步时如果判断某项**刻意不端口**（如已禁用的 Local 沙箱），写入 `.workbuddy/skills/weknora-upstream-sync/scripts/drift_report.sh` 顶部的 `WIRING_WHITELIST` 并注明原因，不要靠记忆。

当前已知的企业独有接线（app-core 有、internal 无，属预期，无需处理）：

- `service.NewTenantAddUserService` / `handler.NewTenantAddUserHandler`（租户直加用户）
- `handler` 层的思维导图、模型代理、internal_parse 等企业端点
