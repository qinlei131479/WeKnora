# 技能与工作沙箱

平台提供两类技能相关能力：**Runtime 技能**由 `apps/agent-harness` 管理，包含工作模式可调用的说明、脚本、工具依赖和 MCP 依赖；**平台沙箱配置**由 `apps/app-core` 管理，提供工作区策略和外部沙箱供应商配置。两类能力分别管理，服务不同的执行链路。

## Runtime 技能

Runtime 技能源码位于 `apps/agent-harness/server/routers/skill_router.py`，内置技能目录为 `apps/agent-harness/package/yuxi/agents/skills/buildin/`。当前内置技能包括：

| 技能 | 用途 |
| --- | --- |
| `deep-research` | 多步资料检索与研究报告 |
| `docx` | Word 文档生成与处理 |
| `html-preview` | HTML 内容预览 |
| `image-gen` | 图片生成 |
| `knowledge-base` | 企业知识库检索与引用 |
| `mysql-reporter` | MySQL 查询与报告生成 |
| `pdf` | PDF 文档处理 |
| `pptx` | PPT 生成与处理 |
| `quote` | 引用整理 |
| `xlsx` | Excel 表格生成与处理 |

内置技能通过租户 `tenant_id=0` 识别，所有租户共用定义；启用状态和使用权限仍按管理配置过滤。当前产品包含平台统一维护的技能目录，不包含个人技能上传入口。

### 管理接口

Runtime 管理面挂在 `/api/system/skills`：

| 操作 | 方法与路径 |
| --- | --- |
| 可管理技能列表 | `GET /api/system/skills` |
| 依赖选项 | `GET /api/system/skills/dependency-options` |
| 启停技能 | `PUT /api/system/skills/:slug/enabled` |
| 文件树 | `GET /api/system/skills/:slug/tree` |
| 读取文件 | `GET /api/system/skills/:slug/file` |
| 创建文件或目录 | `POST /api/system/skills/:slug/file` |
| 更新文件 | `PUT /api/system/skills/:slug/file` |
| 更新依赖 | `PUT /api/system/skills/:slug/dependencies` |
| 导出压缩包 | `GET /api/system/skills/:slug/export` |
| 删除技能 | `DELETE /api/system/skills/:slug` |

读取类操作要求用户对技能有管理可读权限；启停、文件写入、依赖修改、导出和删除要求可管理权限。内置技能的删除与破坏性修改由服务层限制，不能通过接口把基础能力移除。

依赖分三类：

- `tool_dependencies`：依赖的内置工具；
- `mcp_dependencies`：依赖的 Runtime MCP 服务；
- `skill_dependencies`：依赖的其他 Runtime 技能。

依赖声明用于执行前的能力检查和失败提示。未声明的运行时能力不应依赖偶然可用；发现缺失依赖时应先补配置，再让智能体继续执行。

### 用户侧接口

普通用户侧挂在 `/api/skills`：

| 操作 | 方法与路径 | 说明 |
| --- | --- | --- |
| 技能卡片 | `GET /api/skills` | 返回用户可见技能与访问级别 |
| 沙箱看板 | `GET /api/skills/sandbox-board` | 查看技能安装与运行状态概览 |
| 配置技能列表 | `GET /api/skills/sandbox-configs/:sandbox_config_id/skills` | 查看平台沙箱配置内技能 |
| 安装消息 | `GET /api/skills/sandbox-configs/:sandbox_config_id/skills/:skill_id/messages` | 读取安装过程信息 |
| 执行记录 | `GET /api/skills/sandbox-configs/:sandbox_config_id/skills/:skill_id/transcript` | 读取技能安装或执行片段 |
| 安装草稿确认 | `POST /api/skills/install-drafts/:draft_id/confirm` | 确认批量安装结果 |

对沙箱配置内技能的启停、重装、停止和删除属于管理操作，要求 Runtime Admin。上传与远端安装先进入准备或草稿阶段，再由管理员确认，避免把未审查内容直接写入运行环境。

## 平台沙箱配置

平台侧提供 `/api/v1/sandbox-configs`，定义平台执行可用的外部沙箱和工作区策略。它保存供应商凭据、网络策略、工作区限制和关联技能，不属于 Runtime 技能定义本身。

主要能力：

- 查询与创建沙箱配置；
- 设置租户或工作区策略；
- 查询供应商模板与库存；
- 管理配置内技能安装、重装、停止和删除；
- 查看安装事件、执行片段和安装指引。

沙箱配置包含外部服务凭据，读列表虽然对 Viewer 开放，但写入、测试、库存查询和技能镜像内容管理均要求 Admin 及以上权限。凭据字段应通过专用接口维护，不进入普通详情响应。

### 权限边界

| 能力 | 模块 | API |
| --- | --- | --- |
| Runtime 技能定义与文件 | `apps/agent-harness` | `/api/system/skills` |
| Runtime 用户技能卡片 | `apps/agent-harness` | `/api/skills` |
| 平台技能目录 | `apps/app-core` | `/api/v1/skills/catalog` |
| 平台可用技能 | `apps/app-core` | `/api/v1/skills` |
| 平台沙箱配置 | `apps/app-core` | `/api/v1/sandbox-configs` |

平台技能目录主要用于平台侧安装与治理；工作模式智能体实际调用的是 Runtime 技能。排查时先确认调用发生在哪个前端入口，再查对应模块的 API 和日志。

## 安全要求

1. 技能文件具有执行潜力，修改后必须走测试和最小化验证；
2. 技能依赖的 MCP 必须显式声明，不能在运行时探测并调用未授权服务；
3. 外部沙箱凭据只保存在平台沙箱配置中，不写入技能文件；
4. 涉及文件生成、数据库查询、外部请求或支出的技能应配置人工审批；
5. 导出包可能包含业务规则，按敏感资料管理；
6. 删除技能前先检查智能体依赖和调用历史，确认没有生产任务仍依赖该技能。

## 实现参考

- Runtime 技能路由：`apps/agent-harness/server/routers/skill_router.py`
- Runtime 内置技能：`apps/agent-harness/package/yuxi/agents/skills/buildin/`
- 平台技能与沙箱路由：`apps/app-core/router/routes_infra.go`
- 平台技能目录处理：`apps/app-core/handler/skill_catalog.go`
- 平台可用技能处理：`apps/app-core/handler/skill_handler.go`
- 平台沙箱技能处理：`apps/app-core/handler/sandbox_skill.go`
- 平台沙箱处理：`apps/app-core/handler/sandbox_config.go`
- 前端技能与工作模式入口：`apps/frontend/src/views`
