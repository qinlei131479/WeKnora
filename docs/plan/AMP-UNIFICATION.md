# Harness 能力与 amp 表统一执行计划

本计划以 `feat/amp-unification` 相对 `develop` 尚未推送的代码为准。表复制、用量回填和旧表删除都在 `migrations/version_kjsc/000008_amp_unification` 一次完成，不再拆成 `000009`、`000010`。

已经落地的结构不再回退到本文作废的设计。

## 1. 目标与边界

目标不变：Harness 的技能、MCP、内置工具收到统一管理入口，主数据落在 app-core 已有能力表；Harness 活跃运行表使用 `amp_` 物理表名。

当前边界：

- 平台对话与 Runtime 对话、平台 Agent 与 Runtime 智能体仍然是两套对象。会话、消息、运行继续用 `amp_sessions`、`amp_messages`、`amp_agent_runs`，不并入平台 `sessions`、`messages`。
- 技能和 MCP 已经共用 app-core 物理表。区分方式是 `tenant_id` 和 `source_type` / `is_builtin`，不再另建 Harness 主表。
- `apps/app-core` 允许为这次统一补字段、目录同步和只读展示。表结构只通过 `migrations/version_kjsc/` 变更，Go 模型与迁移列保持一致。接口 path、method、请求体和 SSE 事件字段保持不变。
- Python 改动落在 `apps/agent-harness`。前端只改 Harness 技能、MCP、工具管理页，以及对话工作技能所需的接口封装。
- 上游 `frontend/`、`internal/`，以及 `apps/manager` 不动。`apps/backend` 只改 Dashboard 查询，改为读取 `amp_` 表。
- 写 app-core 能力数据时保留租户和权限边界。`tenant_id = 0` 表示内置目录，当前空间可以读取，不能把它当成当前租户的私有数据改写。
- 统计不伪造消息或会话。遥测写入、历史回填和看板读数都随本次迁移完成。

## 2. 已落地的数据归属

| 能力 | 主数据 | 当前实现 |
| --- | --- | --- |
| MCP | `mcp_services` | Harness 直接读写该表，以及 `mcp_tool_approvals`、`mcp_metadata`、`mcp_oauth_clients`、`mcp_oauth_tokens`。运行标识是服务 `id`。 |
| Skill | `tenant_skill_catalog` | 扩展字段直接加在目录表。安装记录仍用 `tenant_skills`。 |
| 内置工具 | `amp_builtin_tools` | 只读目录。`chat` 由 app-core 启动同步，`work` 由 Harness 启动同步。 |
| 智能体、会话、消息、运行 | `amp_agents`、`amp_sessions`、`amp_messages`、`amp_agent_runs` 等 | 从对应 `h_` 表复制结构和数据，ORM 已切到 `amp_` 物理表。 |
| 统计 | `amp_agent_usage_events`、`amp_tool_usage_events`、`amp_token_usage_events`、`amp_agent_usage_daily` | 遥测事实和日聚合已接入，看板读事实表或日聚合。 |

### 2.1 技能字段

`tenant_skill_catalog` 已增加这些列，不再使用 `amp_skill_runtime`：

| 列 | 规则 |
| --- | --- |
| `name` | 稳定标识，等同原 Harness slug。 |
| `source_type` | 使用侧，只允许 `chat`、`work`、`common`。`chat` 对话，`work` 工作，`common` 两侧通用。 |
| `tenant_id = 0` | 内置技能。内置不写进 `source_type`。 |
| `tool_dependencies`、`mcp_dependencies`、`skill_dependencies` | JSON 数组，默认 `[]`。 |
| `share_config` | 默认全局可读。 |
| `enabled` | 目录启用状态，默认 true。 |
| `created_by`、`updated_by` | 操作人。内置同步写 `builtin-system`。 |
| `source_mtime` | 内置源目录最后修改时间。 |
| `version`、`bundle_sha256`、`bundle_ref`、`instructions` | 继续用目录表原字段。 |

目录路径不入库。内置为 `skills/{slug}`，租户技能为 `skills/t{tenant_id}/{slug}`。`SkillRuntime` 只是内存视图。

若库里曾经有 `amp_skill_runtime`，`000008` 会把扩展列拷回目录表后删除该表。

内置技能分两类：

- 工作内置：代码登记在 `yuxi.agents.skills.buildin.BUILTIN_SKILLS`，版本写在规格里。`mysql-reporter`、`quote`、`pdf`、`docx` 等使用侧为 `common`，其余默认为 `work`。
- 对话内置：`skills/preloaded/` 下每个含 `SKILL.md` 的目录。使用侧固定 `chat`，版本取目录内最新文件修改时间，格式 `YYYY.MM.DD.HHMMSS`。`iptv-movie-recommender-demo` 和 `project-manager` 已从预置目录删除。

app-core 列出当前租户目录时，会并入 `tenant_id = 0` 且当前空间没有同名行的内置技能。新建目录行默认 `source_type = chat`。

### 2.2 MCP 字段

不建 `amp_mcp_runtime`。字段落在现有 MCP 表：

| 原 Harness 概念 | 当前落点 |
| --- | --- |
| slug | `mcp_services.id`。内存视图的 slug 缺省回退到这个 id。 |
| name、description、enabled、url | `mcp_services` 同名字段。 |
| transport | `transport_type`：`sse`、`http-streamable`、`stdio`。 |
| headers、env、stdio、timeout | `headers`、`env_vars`、`stdio_config`、`advanced_config`。 |
| 禁用工具、工具审批 | `mcp_tool_approvals.enabled`、`require_approval`。 |
| 工具清单 | `mcp_metadata`。 |
| OAuth | `mcp_oauth_clients`、`mcp_oauth_tokens`。 |
| 内置 | `is_builtin = true`，共享目录使用 `tenant_id = 0`。 |

内置图表服务 `mcp-server-chart` 由迁移写入：stdio，命令 `npx -y @antv/mcp-server-chart`。已存在同一 id 时跳过。内置服务接口不回传地址、请求头、环境变量和认证；stdio 回传库里的启动命令，供页面展示。

### 2.3 内置工具

`amp_builtin_tools.source` 只允许 `chat`、`work`。`capability_key` 为 `{source}:{tool_slug}`。代码注册表是定义源，表只用于预览、依赖解析和统计，没有第二套编辑入口。

## 3. 已落地的表迁移

迁移文件是 `migrations/version_kjsc/000008_amp_unification.up.sql` 和同名 `.down.sql`。它接在 `000007_user_account` 之后。同一次上线完成复制、用量回填和旧表删除。`scripts/kjsc/migrate.sh up` 只前进到版本 8。

已从 `h_` 复制为 `amp_` 并拷贝数据：

| 当前表 | 目标表 |
| --- | --- |
| `h_agents` | `amp_agents` |
| `h_conversations` | `amp_sessions` |
| `h_messages` | `amp_messages` |
| `h_tool_calls` | `amp_tool_calls` |
| `h_agent_runs` | `amp_agent_runs` |
| `h_agent_run_requests` | `amp_agent_run_requests` |
| `h_subagent_threads` | `amp_subagent_threads` |
| `h_operation_logs` | `amp_audit_logs` |

复制后使用独立序列，补齐中文表注释、字段注释和索引说明。ORM 已去掉动态表前缀。复制和用量回填都写完后，同一事务删除旧 `h_` 表。删除前对仍存在的旧表加访问排他锁，避免迁移过程中还有新行写进即将删除的表。

同批已删除的 Harness 代码：用户配置、配置项、消息反馈相关服务和路由。`h_tasks` 的 ORM、task service、task repository 和 `/tasks` 路由已在 Phase B 删除，不另建 `amp_tasks`。知识库本地写接口也已删除。

## 4. 作废的设计

以下条目以当前代码为准，不再执行：

- 不建 `amp_skill_runtime`、`amp_mcp_runtime`。
- `source_type` 不是 `builtin` / `upload` / `remote`。来源差异用 `tenant_id = 0` 和目录内容表达，使用侧只用 `chat` / `work` / `common`。
- 技能编辑不按“注册新版本再删旧 catalog 行”作为唯一路径；目录行就地更新 bundle、版本和扩展列。
- MCP 管理不是只做 app-core HTTP 适配层。Harness 直接读写 `mcp_services` 及关联表，并保留 Harness 路由。
- 不把 Go 侧改动再撤掉。`tenant_skill_catalog` 新列、内置工具目录同步、内置 MCP stdio 回传已经在 app-core 中。
- 迁移编号不是 `000007`。本需求的结构变更固定为 `000008`；后续新结构从现有最大编号顺延，且同一需求不再拆成多个迁移。

## 5. 阶段记录

### Phase A：遥测接入

已接入并提交。

- run 开始和结束写入 `amp_agent_usage_events`。结束事件类型为 `succeed`、`fail`、`cancel`。
- 工具结果写入 `amp_tool_usage_events`。`mcp__` 前缀为 `mcp`，`skill__` 或 `skill:` 前缀为 `skill`，其余为 `builtin`。
- 助手消息写入 `amp_token_usage_events`。模型名取 `model_name` / `model` / `model_id`，token 优先取模型真实 `usage_metadata`、`response_metadata.token_usage` 等字段；没有真实用量时使用消息上持久化的估算快照，再回退旧 `token_count`。
- `event_metadata.token_source` 标记 `provider`、`estimated`、`stored` / `stored_count`，便于区分真实用量、估算值和旧存储计数。
- 模型中间件在无真实 usage 时同时估算输入和输出 token，并把快照写入 assistant 消息的 `additional_kwargs.token_usage`，让遥测能随消息落库。
- 会话数和消息数累加到 `amp_agent_usage_daily`。运行、工具和 token 按当天事实重算，并写入 `score`。
- Dashboard 基础统计、用户活跃、工具、智能体和时间序列改读事实表或日聚合。
- `/stats/agents` 支持 `start`、`end`（`YYYY-MM-DD`），默认近 30 天。TOP 5 按 `score` 合计排序。满意度占位已去掉。
- 遥测写入失败只记日志，不阻断对话。
- 历史统计由 `000008` 从刚复制的 `amp_sessions`、`amp_messages`、`amp_tool_calls`、`amp_agent_runs` 回填，不另建迁移。事件带 `source=historical_backfill`，重复执行不插第二份；回填前会删除旧 historical token 事件并重建。
- 历史 token 只处理 assistant 消息，真实 usage 多路径优先；没有真实 usage 时按消息内容、工具调用元数据和同会话历史消息近似估算，有旧 `token_count` 时优先拆成输入 / 输出。`token_source` 同样标记来源。
- 调用统计的小时、天、周桶按 `Asia/Shanghai` 格式化，查询起点对齐完整小时或自然日，不再在 timestamptz 上再加 8 小时。
- 模型图例用 `models.display_name`。Token 消耗按模型拆成输入和输出，并在时间点响应的 `models` 字段中返回模型明细。

### Phase B：知识库写链路与旧任务

已执行，并收进尚未推送的统一提交。

保留 WeKnora 只读适配、检索，以及 `/workspace/knowledge/tree`、`/workspace/knowledge/file`、`/workspace/knowledge/download`。知识库查询、思维导图读取和生成、示例问题、库信息更新仍在。

已删除：

- 旧通用知识库的上传、解析、入库、文档删除、移动、建目录和 query params 写入。
- 本地 ingest / parse / index 任务提交。
- `h_tasks` 的 ORM、task service、task repository、`/tasks` 路由，以及启动时的任务队列。表由 `000008` 与其它旧 `h_` 表一起删除，不另建 `amp_tasks`，也不再改名归档。
- 写链路删掉后失去调用方的 URL 抓取、扩展名判断、思维导图删节点、内容哈希、同名文件检查，以及按状态列文件 ID。知识库写方法三层保留。
- Dashboard 知识库统计已读 WeKnora `knowledge_bases`，没有再读本地 `h_knowledge_*`。

`h_tasks` 不改名为 `amp_tasks`。以后若有新的后台任务，另建新表。

### Phase C：退役确认

代码核对已完成。`apps/frontend` 与 `apps/agent-harness` 对下列表没有读写引用。`000008` 在复制和回填之后删除这些旧表。正式数据留在 `amp_` 表。不再另做第二次复制，也不再保留 `amp_retired_h_*`。若库里曾经留下归档表，同一次删除会把它们一起去掉。

删除清单：

`h_agent_envs`、`h_agent_run_requests`、`h_agent_runs`、`h_agents`、`h_config_options`、`h_conversation_stats`、`h_conversations`、`h_mcp_servers`、`h_message_feedbacks`、`h_messages`、`h_operation_logs`、`h_skills`、`h_subagent_threads`、`h_tasks`、`h_tool_calls`、`h_user_config`。

执行 `000008` 前必须完成两项检查，并停掉仍写 `h_` 表的旧进程：

1. 旧 Dashboard 已改读 `amp_sessions`、`amp_messages`、`amp_tool_calls`、`amp_agents`。这些表由 `LIKE` 复制，时间列仍是 `timestamp without time zone`，SQL 里的 `+ INTERVAL '8 hours'` 保持不变。消息反馈不再建 `amp_message_feedbacks`，满意度查询固定返回空结果。
2. 尚未执行过本迁移的库，用下面的语句确认旧表行都能在即将写入的目标里找到。脚本自己会在锁表后复制当时的全部行，再回填用量，再删除旧表，中间不会另开迁移。本地 `agent-middle` 早先拆开执行时多出来的消息 50 行、工具调用 57 行、运行 5 行已经在 `amp_` 表里，旧表也已删除。这台库的 `schema_migrations_kjsc` 固定为版本 8，不能再记 9 或 10。

下列缺口检查只适用于还没执行 `000008` 的库。只允许 `amp_missing_in_h` 大于 0，它表示切换后的新写入：

```sql
SELECT 'sessions_missing_in_amp' AS check_name, count(*) AS rows
FROM h_conversations h LEFT JOIN amp_sessions a ON a.id = h.id WHERE a.id IS NULL
UNION ALL
SELECT 'messages_missing_in_amp', count(*)
FROM h_messages h LEFT JOIN amp_messages a ON a.id = h.id WHERE a.id IS NULL
UNION ALL
SELECT 'tool_calls_missing_in_amp', count(*)
FROM h_tool_calls h LEFT JOIN amp_tool_calls a ON a.id = h.id WHERE a.id IS NULL
UNION ALL
SELECT 'agent_runs_missing_in_amp', count(*)
FROM h_agent_runs h LEFT JOIN amp_agent_runs a ON a.id = h.id WHERE a.id IS NULL
UNION ALL
SELECT 'run_requests_missing_in_amp', count(*)
FROM h_agent_run_requests h LEFT JOIN amp_agent_run_requests a ON a.id = h.id WHERE a.id IS NULL
UNION ALL
SELECT 'amp_sessions_missing_in_h', count(*)
FROM amp_sessions a LEFT JOIN h_conversations h ON h.id = a.id WHERE h.id IS NULL
UNION ALL
SELECT 'amp_messages_missing_in_h', count(*)
FROM amp_messages a LEFT JOIN h_messages h ON h.id = a.id WHERE h.id IS NULL;
```

`h_skills`、`h_mcp_servers` 删除前另核对 `tenant_skill_catalog` 与 `mcp_services` 的目录内容。

## 6. 回滚

`000008` 删除旧 `h_` 表后不能自动恢复。需要旧表时，只能从执行该迁移之前的整库备份还原。

`000008 down` 不删除 `amp_agents`、`amp_sessions`、`amp_messages`、`amp_tool_calls`、`amp_agent_runs`、`amp_agent_run_requests`、`amp_subagent_threads`、`amp_audit_logs`。这些表是唯一运行副本。down 会撤回技能目录新列、内置图表插入和遥测表。上线脚本 `scripts/kjsc/migrate.sh` 没有 down 命令，只执行 up。

人工核对：备份中的 `h_conversations`、`h_messages`、`h_tool_calls`、`h_agent_runs` 与现库对应 `amp_` 表的行数。确认备份可用之前，不要手工删除 `amp_` 业务表。

技能和 MCP 已经没有独立 Harness 主表可切回。回滚时恢复 `000008` 之前的目录列和 MCP 代码路径，不恢复 `amp_skill_runtime`、`amp_mcp_runtime`。

知识库本地写接口在 Phase B 删除后不恢复。

## 7. 验收与后续提交

已提交范围的验收：

- 核心对话读写 `amp_sessions`、`amp_messages`、`amp_agent_runs`，不再访问动态 `h_` 表名。
- 技能列表能同时看到当前租户目录和 `tenant_id = 0` 的内置技能；预置目录技能使用侧为 `chat`，版本随目录修改时间变化。
- MCP 创建、更新、测试、工具开关走 `mcp_services` 及关联表；`mcp-server-chart` 不重复插入。
- 内置工具目录能区分 `chat` 与 `work`，没有编辑入口。
- `migrations/version_kjsc` 在 `000007` 之后只有 `000008`。`migrate.sh up` 在仍有 `h_` 表的库上复制、回填并删除旧表；已经完成这些步骤的库版本停在 8，不再执行 9 或 10。

未收到明确提交指令时，不执行 `git add` 或 `git commit`。
