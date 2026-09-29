# Web 前端

企业前端位于 `apps/frontend`，是一个基于 Vue 3、TypeScript、Vite 和 TDesign 的单页应用。它同时承载平台对话和工作模式两套体验，并通过统一登录、租户上下文和权限控制连接企业服务入口与 Runtime。

## 技术栈

| 类别 | 选型 |
| --- | --- |
| 框架 | Vue 3 Composition API |
| 语言与构建 | TypeScript、Vite |
| UI | TDesign Vue Next、lucide / TDesign 图标 |
| 状态 | Pinia |
| 路由 | Vue Router |
| 国际化 | vue-i18n |
| HTTP 与流式 | axios、fetch-event-source |
| 富文本 | Markdown、公式、代码高亮、图表渲染 |
| 安全 | DOMPurify 消毒、Token 刷新、租户请求头 |

前端修改必须保持现有 TDesign 体系，不引入新的 Ant Design 依赖；用户可见文案必须同步补齐全部语言文件。

## 目录结构

| 路径 | 职责 |
| --- | --- |
| `src/router/` | 正式路由、兼容重定向、登录与租户守卫 |
| `src/views/` | 平台布局、对话、工作模式、知识库、智能体、技能、工具、MCP、工作区、数据总览与设置 |
| `src/stores/` | 认证、租户、菜单、会话资源、设置和界面状态 |
| `src/api/` | 企业服务入口与 Runtime API 封装 |
| `src/utils/` | 请求、流式处理、Markdown 渲染、安全消毒与功能开关 |
| `src/i18n/` | 主应用与后端错误文案语言包 |
| `src/assets/theme/` | 浅色、深色主题与 TDesign token |
| `src/components/` | 跨页面通用组件 |

## 正式路由

| 路由 | 能力 |
| --- | --- |
| `/platform/creatChat` | 新建平台对话 |
| `/platform/chat/:chatid` | 继续平台对话 |
| `/platform/chat-work` | 新建工作模式线程 |
| `/platform/chat-work/:thread_id` | 继续工作模式线程 |
| `/platform/knowledge-bases` | 知识库列表 |
| `/platform/knowledge-bases/:kbId` | 知识库详情 |
| `/platform/agents` | 平台智能体与 Runtime 智能体 |
| `/platform/skills`、`/platform/skills/:slug` | Runtime 技能列表与详情 |
| `/platform/tools` | Runtime 工具 |
| `/platform/mcp`、`/platform/mcp/:slug` | Runtime MCP 列表与详情 |
| `/platform/workspace` | 工作区 |
| `/platform/dashboard` | 数据总览 |
| `/platform/settings` | 租户、成员、模型、集成与系统设置 |
| `/login`、`/register`、`/onboarding/workspace` | 登录、邀请注册与租户引导 |

`/platform/harness/*` 只保留历史重定向；新文档、外链和运营入口必须使用正式路由。`/join` 与 `/knowledgeBase` 也是兼容入口，不作为新能力入口。

## 交付范围

前端默认只呈现当前交付的入口和设置分区。组织、数据源导入、共享管理、知识图谱、长期记忆、浏览器扩展、外部技能、云解析引擎和未交付客户端不在当前前端范围；向量库、存储、搜索、模型等 Provider 选项也按当前交付范围展示。

当前界面语言入口为中文和英文；源码仍按五语言资源结构维护，避免后续放开语言时出现 key 或文案缺口。

## 请求与身份

- 登录后前端持有访问令牌和刷新令牌，并维护当前租户上下文。
- 请求统一附加认证头、语言头、请求 ID 和租户 ID。
- 401 响应触发单次刷新，失败后清理本地会话。
- 平台对话请求代理到企业服务入口，工作模式请求代理到 Runtime API。
- SSE 连接关闭缓冲，保持回答、执行状态和文件结果的流式展示。

前端可见性只用于改善导航，权限的最终判定在企业服务入口与 Runtime 服务端。

## 构建与部署

开发入口位于 `apps/frontend/package.json`。常用命令：

```bash
npm install
npm run dev
npm run build
```

生产镜像由 `docker/Dockerfile.frontend` 构建，输出静态资源并由 Nginx 托管。Compose 中的 `frontend` 服务会注入后端地址、Runtime 地址、上传大小限制和默认语言，并将 API、文件和 SSE 请求代理到对应服务。

升级前端时需要同时验证：

1. 正式路由与兼容重定向。
2. 平台对话和工作模式互斥导航。
3. 当前交付菜单和设置入口。
4. 当前语言入口及五语言资源一致性。
5. 深色模式、上传限制和 SSE 输出。
