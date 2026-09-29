# 网页嵌入

网页嵌入用于把平台智能体发布到官网、帮助中心或业务系统。每个嵌入渠道绑定一个智能体，并提供独立的公开会话、引用查看、事件回调和访问控制能力。访客不需要平台账号。

企业前端提供独立嵌入页，宿主系统可以用平台生成的接入代码嵌入，也可以直接通过 iframe 集成。推荐使用短效会话令牌模式，让长效发布令牌只保存在业务服务端。

## 产品边界

| 能力 | 说明 |
| --- | --- |
| 渠道管理 | 按智能体创建、编辑、停用和删除渠道 |
| 访问控制 | Origin 白名单、渠道开关、发布令牌轮换 |
| 匿名会话 | 为访客创建嵌入会话并用签名绑定会话归属 |
| 对话能力 | 知识库问答、平台智能体问答、建议问题、引用片段 |
| 交互闭环 | MCP OAuth Resolution 与工具审批可转发到嵌入页 |
| 事件通知 | Webhook 推送访客提问与回复完成事件 |
| 运营统计 | 渠道维度会话与消息统计 |

网页嵌入仍使用平台智能体和平台对话能力，不会把工作模式会话暴露给匿名访客。嵌入渠道绑定的知识范围、工具和审批策略来自所绑定的平台智能体。

## 配置渠道

在控制台的网页嵌入设置中创建渠道，主要配置包括：

| 配置 | 说明 |
| --- | --- |
| 名称与标题 | 控制台展示名、嵌入页标题、面板标题模式 |
| 绑定智能体 | 决定问答对象、知识范围和可用工具 |
| 启用状态 | 关闭后公开接口全部拒绝访问 |
| Origin 白名单 | 至少一项；支持精确 Origin 与子域名通配 |
| 主题与布局 | 主题色、位置、欢迎语、建议问题开关 |
| 访客能力 | 联网搜索、文件上传等开关 |
| 限流 | 单 IP 每分钟、渠道全局每分钟、渠道每日总量 |
| Webhook | HTTPS 回调地址与签名密钥 |

生产环境不允许空白名单和全通配 Origin。`https://www.example.com` 只匹配该 Origin，`*.example.com` 可匹配子域名；通配配置不应包含路径。

## 接入方式

### 安全模式

业务系统提供一个换票接口，服务端保存渠道发布令牌，并调用平台换票：

```http
POST /api/v1/embed/{channel_id}/exchange
Authorization: Embed <publish_token>
```

响应包含短效会话令牌和过期秒数：

```json
{
  "success": true,
  "data": {
    "session_token": "ems_...",
    "expires_in": 1800
  }
}
```

宿主页向业务系统请求该令牌后传给嵌入页。发布令牌不出现在浏览器 HTML、localStorage 或业务日志中；令牌临近过期时由前端自动换新。

### 静态令牌模式

低敏感内部站点可以把发布令牌直接配置在页面中。该令牌对访客可见，轮换时必须同步更新所有宿主页面。只要页面被复制或缓存，令牌就可能泄露，不建议用于互联网公开站点。

### 直接 iframe

业务系统也可以直接嵌入 `/embed/{channel_id}`。这种方式仍需向嵌入页传递有效令牌，并确保宿主页面的 CSP、Referrer 策略和消息监听逻辑与嵌入页一致。平台生成的接入代码已处理这些细节，优先使用生成的接入方式。

## 鉴权与会话

嵌入公开接口统一挂在 `/api/v1/embed/:channel_id` 下，请求头为：

```http
Authorization: Embed <publish_token 或 session_token>
```

服务依次校验渠道存在、令牌归属、渠道启用状态、请求 Origin 和限流。会话类接口还要求：

```http
X-Embed-Session: <session_signature>
```

创建匿名会话时返回会话 ID 和签名。签名由渠道发布令牌对渠道与会话 ID 计算，后续访问会话消息、停止会话和消息建议时必须携带。轮换发布令牌后，旧会话签名立即失效。

### 限流

| 层级 | 默认或规则 |
| --- | --- |
| 单 IP | 每分钟不超过 `rate_limit_per_minute`，默认 30 |
| 渠道全局 | 每分钟不超过单 IP 限流的 20 倍，且不低于 120 |
| 渠道每日 | 每日不超过 `rate_limit_per_day`，默认 10000 |

全局分钟限流用于防止攻击者轮换 IP 绕过单 IP 限额。调整限额前先评估模型费用和外部工具调用量。

## 公开 API

公开接口均经过嵌入鉴权：

| 能力 | 方法与路径 |
| --- | --- |
| 换取短效令牌 | `POST /api/v1/embed/:channel_id/exchange` |
| 公开配置 | `GET /api/v1/embed/:channel_id/config` |
| 建议问题 | `GET /api/v1/embed/:channel_id/suggested-questions` |
| 引用片段 | `GET /api/v1/embed/:channel_id/chunks/:chunk_id` |
| 创建匿名会话 | `POST /api/v1/embed/:channel_id/sessions` |
| 知识库问答 | `POST /api/v1/embed/:channel_id/knowledge-chat/:session_id` |
| 智能体问答 | `POST /api/v1/embed/:channel_id/agent-chat/:session_id` |
| 加载消息 | `GET /api/v1/embed/:channel_id/messages/:session_id/load` |
| 停止生成 | `POST /api/v1/embed/:channel_id/sessions/:session_id/stop` |
| 消息建议 | `GET/POST .../messages/:message_id/suggestions` |
| 建议事件 | `POST .../sessions/:session_id/suggestion-events` |
| 事件转发 | `POST .../sessions/:session_id/events` |
| MCP OAuth 授权 | `POST .../sessions/:session_id/mcp-services/:id/oauth/authorize-url` |
| OAuth 状态 | `GET .../sessions/:session_id/mcp-services/:id/oauth/status` |
| OAuth 决议 | `POST .../sessions/:session_id/mcp-oauth-resolutions/:pending_id` |
| 取消 OAuth | `POST .../sessions/:session_id/mcp-oauth-resolutions/:pending_id/cancel` |
| 工具审批 | `POST .../sessions/:session_id/tool-approvals/:pending_id` |
| 渠道文件 | `GET /api/v1/embed/:channel_id/files` |

公开配置只包含渲染所需字段和已开启能力，不返回发布令牌、Webhook 地址或签名密钥。访客图片和文件通过渠道维度代理访问，仍受渠道与租户资源校验约束。

## 管理 API

| 操作 | 方法与路径 | 权限 |
| --- | --- | --- |
| 创建渠道 | `POST /api/v1/agents/:id/embed-channels` | Admin |
| 智能体渠道列表 | `GET /api/v1/agents/:id/embed-channels` | Viewer |
| 租户渠道列表 | `GET /api/v1/embed-channels` | Viewer |
| 渠道详情 | `GET /api/v1/embed-channels/:channel_id` | Viewer |
| 更新渠道 | `PUT /api/v1/embed-channels/:channel_id` | Admin |
| 删除渠道 | `DELETE /api/v1/embed-channels/:channel_id` | Admin |
| 轮换发布令牌 | `POST /api/v1/embed-channels/:channel_id/rotate-token` | Admin |
| 预览会话令牌 | `POST /api/v1/embed-channels/:channel_id/preview-session` | Viewer |
| 统计 | `GET /api/v1/embed-channels/:channel_id/stats` | Viewer |

创建响应和轮换响应会返回一次发布令牌明文；列表和普通详情不回显。轮换后应立即更新业务服务端配置，并确认旧页面不再使用静态令牌。

## Webhook

配置 Webhook 后，以下事件会异步推送到业务系统：

| 事件 | 触发时机 |
| --- | --- |
| `message_sent` | 访客发出提问 |
| `message_received` | 助手回复完成 |

要求与语义：

1. 回调地址必须是 HTTPS，并通过出站地址安全校验；
2. 重定向逐跳校验，内网、链路本地和元数据地址会被拒绝；
3. 配置签名密钥后，业务系统必须校验 HMAC-SHA256 签名头；
4. 投递为 best-effort，失败记录日志但不重试，业务侧应幂等处理；
5. 前端也可通过会话事件接口显式转发事件，用于补充埋点。

## 安全清单

- 生产渠道必须配置明确 Origin 白名单；
- 互联网站点使用短效令牌模式，不把发布令牌写入页面；
- 上线前设置分钟和日限额；
- 高风险智能体保持工具人工审批；
- Webhook 使用 HTTPS、签名密钥和幂等消费；
- 定期轮换发布令牌，并监控异常会话量；
- 删除渠道前先确认外部系统已移除入口，避免宿主页面持续报错。

## 实现参考

- 路由注册：`apps/app-core/router/routes_agent.go`
- 渠道与公开接口：`apps/app-core/handler/embed_channel.go`
- 渠道数据结构：`apps/app-core/types/embed_channel.go`
- 渠道、匿名会话与 Webhook 服务：`apps/app-core/application/service/embed_*`
- 嵌入鉴权：`apps/app-core/middleware/embed_auth.go`
- 嵌入页入口：`apps/frontend/src/embed-main.ts`
- 嵌入页面：`apps/frontend/src/views/embed/EmbedPage.vue`
