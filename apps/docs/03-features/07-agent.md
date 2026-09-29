# 智能体

智能体中台2.0提供两类智能体：**平台智能体**用于知识问答的产品配置与发布，**Runtime 智能体**用于工作模式中的任务执行、工具调用与事件流。两类智能体分别管理配置、权限和运行状态。

| | 平台智能体 | Runtime 智能体 |
| --- | --- | --- |
| 产品入口 | 平台智能体管理页 | 工作模式智能体管理页 |
| 服务模块 | `apps/app-core` | `apps/agent-harness` |
| API 前缀 | `/api/v1/agents` | `/api/agent` |
| 会话体系 | 平台对话 | 工作模式对话 |
| 主要职责 | 智能体资料、预设、建议问题、渠道绑定配置 | 执行编排、请求排队、工具与技能调用、事件流 |
| 存储与权限 | 租户资源，按平台 RBAC 管理 | Runtime 记录，按创建者和内置标记管理 |

## 能力边界

平台智能体面向知识问答与渠道发布，配置内容包括基础资料、模型、提示词、建议问题和嵌入渠道。它不直接描述 Runtime 的执行图，也不负责工作模式的请求队列。

Runtime 智能体面向工作模式执行。前端正式入口是 `/platform/chat-work` 与 `/platform/agents`；`/platform/harness/*` 仅用于兼容旧书签和旧集成，新入口统一使用正式路径。

知识库统一使用平台知识库体系。Runtime 可以按智能体配置调用知识库检索，但不另建知识库管理面，也不把知识库对象复制为 Runtime 对象。

## 平台智能体

平台智能体支持创建、编辑、列表、详情、复制和删除。创建者可维护自己创建的智能体；租户 Admin 及以上角色可维护任意智能体。复制会生成调用者拥有的新对象，适合从内置或共享模板派生。

| 操作 | 方法与路径 | 最低角色 |
| --- | --- | --- |
| 占位符定义 | `GET /api/v1/agents/placeholders` | Viewer |
| 类型预设 | `GET /api/v1/agents/type-presets` | Viewer |
| 创建 | `POST /api/v1/agents` | Contributor |
| 列表 | `GET /api/v1/agents` | Viewer |
| 详情 | `GET /api/v1/agents/:id` | Viewer |
| 编辑 | `PUT /api/v1/agents/:id` | 创建者或 Admin |
| 删除 | `DELETE /api/v1/agents/:id` | 创建者或 Admin |
| 复制 | `POST /api/v1/agents/:id/copy` | Contributor |
| 建议问题 | `GET /api/v1/agents/:id/suggested-questions` | Viewer |

类型预设用于前端编辑器收敛可选形态，占位符用于提示词模板中的动态字段。建议问题来自智能体配置，可在对话入口和嵌入页展示；接口按智能体维度返回，不把不同智能体的开场问题混在一个列表中。

内置智能体配置优先读取 `config/builtin_agents_kjsc.yaml`，文件不存在时才回退官方默认文件。企业自定义预设应只改 KJSC 变体，避免官方同步覆盖。

### 配置字段

平台智能体的自定义类型定义在 `apps/app-core/types/custom_agent.go`，路由注册在 `apps/app-core/router/routes_agent.go`。常见配置包括：

- 基础信息：名称、描述、图标、类型、可见性；
- 模型与提示词：对话模型、系统提示词、温度等生成参数；
- 知识范围：可检索的知识库与检索策略；
- 交互增强：建议问题、追问、开场内容；
- 渠道绑定：嵌入渠道、IM 渠道等发布入口。

模型凭证和外部服务凭证由平台统一管理，智能体配置只保存引用，不在智能体对象中复制明文密钥。

## Runtime 智能体

Runtime 智能体由 `apps/agent-harness/server/routers/agent_router.py` 提供，实际路由前缀为 `/api/agent`。它负责创建可执行智能体、提交运行请求、跟踪排队状态和消费事件流。

### 对象管理

| 操作 | 方法与路径 | 行为 |
| --- | --- | --- |
| 后端列表 | `GET /api/agent/backends` | 返回可用执行后端及其基础描述 |
| 默认智能体 | `GET /api/agent/default` | 返回固定默认智能体的完整配置 |
| 创建 | `POST /api/agent` | 创建者拥有该智能体 |
| 列表 | `GET /api/agent` | 按用户可见性返回，可包含子智能体定义 |
| 详情 | `GET /api/agent/:agent_id` | 路径参数实际使用 slug |
| 编辑 | `PUT /api/agent/:agent_id` | 仅创建者可编辑 |
| 删除 | `DELETE /api/agent/:agent_id` | 仅创建者可删除；内置项返回 409 |

默认智能体固定为内置智能助手。创建请求携带 `set_default=true` 会返回 422；这避免了多个用户或租户争夺全局默认值。普通用户访问不可见智能体时返回 404，不泄露对象存在性。

### 运行请求

`POST /api/agent/runs` 是工作模式执行入口。请求包含：

| 字段 | 说明 |
| --- | --- |
| `query` | 用户输入 |
| `agent_slug` | 目标 Runtime 智能体 |
| `thread_id` | 工作模式会话线程 |
| `meta` | 追踪信息，可携带 `request_id` |
| `image_content` | 可选图片输入 |
| `model_spec` | 会话级模型覆盖 |
| `tool_approval_mode` | 本次运行的工具审批模式覆盖 |
| `resume` | 恢复已有执行状态时的输入载荷 |
| `queue_policy` | `enqueue`、`reject` 或 `steer` |

普通请求会先写入请求与消息记录，再立即派发或进入同线程队列。`enqueue` 保留请求顺序；`reject` 在运行中直接拒绝新请求；`steer` 优先接替当前请求。恢复执行只支持 `enqueue`，否则返回 422。

运行侧配套接口包括：

- `GET /api/agent/requests/:request_id`：查询请求；
- `GET /api/agent/thread/:thread_id/requests`：获取线程排队快照；
- `POST /api/agent/thread/:thread_id/requests/continue`：继续派发；
- `POST /api/agent/requests/:request_id/cancel`：取消排队请求；
- `POST /api/agent/requests/:request_id/steer`：转向排队请求；
- `GET /api/agent/requests/:request_id/events`：消费请求事件流；
- `GET /api/agent/runs/:run_id`、`/result`、`/events`：查看运行详情、结果与事件流；
- `POST /api/agent/runs/:run_id/cancel`：取消运行。

事件流是工作模式前端的恢复依据。刷新页面后应先取线程排队快照，再按 request 或 run 的当前状态重连对应事件流，不能假设浏览器内存中的旧连接仍然有效。

## 工具与审批

Runtime 智能体可调用内置工具、Runtime 技能和 Runtime MCP。执行器在调用外部工具前按工具策略判断是否需要人工确认；审批卡片属于发起会话的用户，Resolution 路由要求用户属于同一租户。

平台 MCP 的交互审批与 OAuth Resolution 挂在 `/api/v1/agent` 下：

- `POST /api/v1/agent/tool-approvals/:pending_id`
- `POST /api/v1/agent/mcp-oauth-resolutions/:pending_id`
- `POST /api/v1/agent/mcp-oauth-resolutions/:pending_id/cancel`

这些接口服务平台对话中的交互流程；工作模式 Runtime 有自己的运行事件与审批状态，不应跨体系复用 pending ID。

## 前端与配置入口

- 平台智能体页面：`apps/frontend/src/views/platform` 下的智能体管理模块；
- 工作模式页面：`apps/frontend/src/views/platform` 下的工作模式模块；
- 平台路由：`apps/app-core/router/routes_agent.go`；
- Runtime 路由：`apps/agent-harness/server/routers/agent_router.py`；
- Runtime 内置智能体与技能：`apps/agent-harness/package/yuxi/agents/`；
- KJSC 内置智能体配置：`config/builtin_agents_kjsc.yaml`。

排查智能体问题时先确认对象体系：平台智能体的配置问题查 `apps/app-core` 与平台数据库；工作模式执行问题查 `apps/agent-harness`、请求队列表、run 事件和工具日志。两边名称相同不代表是同一条记录。
