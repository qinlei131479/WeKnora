# MCP 管理

平台包含两套 MCP 数据：**平台 MCP** 服务于平台智能体与平台对话，**Runtime MCP** 服务于工作模式智能体。两套配置各自存储、各自授权、各自测试，不能通过同名服务自动同步。

| | 平台 MCP | Runtime MCP |
| --- | --- | --- |
| 服务模块 | `apps/app-core` | `apps/agent-harness` |
| API 前缀 | `/api/v1/mcp-services` | `/api/system/mcp-servers` |
| 使用场景 | 平台智能体、平台对话、嵌入页中的平台 Agent 交互 | 工作模式 Runtime 智能体 |
| 数据归属 | 租户级平台资源 | Runtime 管理资源 |
| 权限模型 | Viewer 可读，Admin 可写 | 普通用户只看脱敏基础信息，Admin 可管理 |

平台提供 MCP 接入、授权、审批和工具使用能力。当前交付不包含独立 MCP Server 发布包，也不承诺 Claude Desktop、VS Code 等外部客户端集成。

## 平台 MCP

平台 MCP 路由注册在 `apps/app-core/router/routes_infra.go`，用于把外部 MCP 服务注册为平台智能体可调用的工具来源。

### 管理接口

| 操作 | 方法与路径 | 最低角色 |
| --- | --- | --- |
| 创建服务 | `POST /api/v1/mcp-services` | Admin |
| 服务列表 | `GET /api/v1/mcp-services` | Viewer |
| 服务详情 | `GET /api/v1/mcp-services/:id` | Viewer |
| 更新服务 | `PUT /api/v1/mcp-services/:id` | Admin |
| 删除服务 | `DELETE /api/v1/mcp-services/:id` | Admin |
| 测试连接 | `POST /api/v1/mcp-services/:id/test` | Admin |
| 工具列表 | `GET /api/v1/mcp-services/:id/tools` | Viewer |
| 元数据 | `GET /api/v1/mcp-services/:id/metadata` | Viewer |
| 刷新元数据 | `POST /api/v1/mcp-services/:id/metadata/refresh` | Viewer |
| 生成使用说明 | `POST /api/v1/mcp-services/:id/usage-instructions/generate` | Admin |
| 资源列表 | `GET /api/v1/mcp-services/:id/resources` | Viewer |
| 凭据写入 | `PUT /api/v1/mcp-services/:id/credentials` | Admin |
| 删除凭据字段 | `DELETE /api/v1/mcp-services/:id/credentials/:field` | Admin |
| 审批策略列表 | `GET /api/v1/mcp-services/:id/tool-approvals` | Viewer |
| 设置审批策略 | `PUT /api/v1/mcp-services/:id/tool-approvals/:tool_name` | Admin |

元数据刷新按调用者保存 OAuth 快照；静态认证服务的租户级快照由 Admin 操作。这样普通成员可以完成自己的 OAuth 授权，而不会影响其他成员的令牌。

### OAuth

平台支持按用户发起 OAuth 授权：

- `POST /api/v1/mcp-services/:id/oauth/authorize-url`
- `GET /api/v1/mcp-services/:id/oauth/status`
- `DELETE /api/v1/mcp-services/:id/oauth/token`
- `GET /api/v1/mcp-oauth/callback`

回调路由本身不带平台登录态，由一次性 state 关联原始授权请求。回调完成后令牌写入平台侧凭据存储，前端再通过 Resolution 接口恢复被暂停的智能体运行。

### 人工审批

对可能产生副作用的外部工具，可配置为执行前需要确认。会话内审批接口为：

- `POST /api/v1/agent/tool-approvals/:pending_id`
- `POST /api/v1/agent/mcp-oauth-resolutions/:pending_id`
- `POST /api/v1/agent/mcp-oauth-resolutions/:pending_id/cancel`

审批决议只作用于对应 pending 记录。通过后执行器继续当前 run；拒绝后按失败或中止语义返回事件，不会静默重试。

## Runtime MCP

Runtime MCP 路由注册在 `apps/agent-harness/server/routers/mcp_router.py`，管理路由为 `/api/system/mcp-servers`。它只接受远程服务：

- `sse`
- `http-streamable`

历史 `stdio` 配置会被标记为需要迁移并强制禁用。Runtime 部署形态不承诺在容器内启动本地命令进程，历史配置应迁移到远程 MCP 服务后再启用。

### 管理行为

| 操作 | 方法与路径 | 权限 |
| --- | --- | --- |
| 列表 | `GET /api/system/mcp-servers` | 登录用户 |
| 创建 | `POST /api/system/mcp-servers` | Admin |
| 详情 | `GET /api/system/mcp-servers/:slug` | Admin |
| 更新 | `PUT /api/system/mcp-servers/:slug` | Admin |
| 删除 | `DELETE /api/system/mcp-servers/:slug` | Admin |
| 按表单测试连接 | `POST /api/system/mcp-servers/test-connection` | Admin |
| 测试已保存服务 | `POST /api/system/mcp-servers/:slug/test` | Admin |
| 服务启停 | `PUT /api/system/mcp-servers/:slug/status` | Admin |
| 工具目录 | `GET /api/system/mcp-servers/:slug/tools` | Admin |
| 工具启停 | `PUT /api/system/mcp-servers/:slug/tools/:tool_name/toggle` | Admin |
| 写入凭据 | `PUT /api/system/mcp-servers/:slug/credentials` | Admin |
| 删除凭据字段 | `DELETE /api/system/mcp-servers/:slug/credentials/:field` | Admin |
| 发起 OAuth | `POST /api/system/mcp-servers/:slug/oauth/authorize-url` | Admin |
| OAuth 状态 | `GET /api/system/mcp-servers/:slug/oauth/status` | Admin |
| 撤销 OAuth 令牌 | `DELETE /api/system/mcp-servers/:slug/oauth/token` | Admin |
| OAuth 回调 | `GET /api/system/mcp-servers/oauth/callback` | 无登录态，按一次性 state 校验 |

普通用户列表只返回 slug、名称、描述、图标、启用状态和标签，不返回 URL、请求头或认证配置。内置 Runtime MCP 不可删除，避免基础工作模式能力被误删。

创建和更新请求使用 `transport_type` 表示传输类型；兼容字段仍接受 `streamable_http`，规范化后按 `http-streamable` 处理。配置请求头和凭据时应使用独立字段，不把敏感值写入描述或使用说明。

## 配置与运维

1. 先在对应体系内创建 MCP 服务并测试连接；
2. 刷新工具元数据，确认工具数量与命名符合预期；
3. 对高风险工具设置人工审批策略；
4. 在对应智能体中启用 MCP 或工具依赖；
5. 用一次最小化任务验证工具调用、审批和事件流；
6. 保存凭据轮换与故障回滚方案。

测试连接会产生出站请求，可能触发外部服务审计或费用。生产环境应使用只读工具或专用测试工具先行验证。

## 故障排查

| 现象 | 优先检查 |
| --- | --- |
| 平台智能体看不到工具 | 平台 MCP 是否启用、工具元数据是否刷新、智能体是否绑定 |
| 工作模式看不到工具 | Runtime MCP 是否启用、是否仍需 stdio 迁移、技能依赖是否声明 |
| OAuth 回调后未继续执行 | pending Resolution 是否成功、事件流是否重连 |
| 工具调用等待用户 | 审批策略、会话用户与 pending 归属 |
| 连接测试失败 | 出站网络、代理、凭据有效期、服务端 allowlist |
| 修改配置后仍调用旧工具 | Runtime 或平台缓存、智能体会话中的旧执行计划 |

平台 MCP 与 Runtime MCP 的服务 ID、slug、工具名没有全局唯一性约束。跨体系迁移时必须重新创建配置、重新授权并回归测试，不能只同步数据库行。
