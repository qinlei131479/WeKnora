# 智能体中台2.0 文档维护说明

`apps/docs` 是企业产品文档站，面向产品使用、部署、配置、API 与二次开发。它不是上游开源文档的镜像：文档主线以 `apps/frontend`、`apps/app-core`、`apps/agent-harness`、KJSC 部署入口和 `migrations/version_kjsc` 的现状为准。

## 产品定位

智能体中台2.0 面向企业内的知识问答、工作模式执行、技能工具与智能体管理。产品能力以当前前端路由、菜单和已交付入口为准；较深的实现文档继续保留，供研发定位问题与二次开发。

### 模块边界

| 模块 | 位置 | 职责边界 |
| --- | --- | --- |
| 企业前端 | `apps/frontend` | 平台对话、工作模式、知识库、智能体、技能、工具、MCP、工作区、数据总览与设置入口 |
| 企业服务入口 | `apps/app-core` | 企业 REST API、知识库与检索问答、模型、平台 Agent、平台 MCP、租户身份与权限 |
| Runtime | `apps/agent-harness` | 工作模式对话、Runtime 智能体、Runtime 技能与工具、Runtime MCP、工作区、文件系统与沙箱执行 |

必须保持以下边界：

1. 平台对话与工作模式对话是两套会话体系，不合并。
2. 平台 Agent 与 Runtime 智能体是两套对象，不合并。
3. 平台 MCP 与 Runtime MCP 是两套数据，不合并。
4. 知识库统一使用企业知识库体系；Runtime 只做适配和调用，不另建知识库管理面。
5. 术语默认使用「租户」，不把租户能力表述为「空间」。

## 文档站构建

```bash
cd apps/docs
npm install
npm run dev
npm run build
npm run check
```

构建产物位于 `.vitepress/dist`。主题与排版入口在 `.vitepress/theme/`；侧边栏由 `.vitepress/config.mts` 按目录和 Markdown 一级标题自动生成。

## 隐藏文档机制

隐藏清单由 `.vitepress/config.mts` 的 `HIDDEN_DOC_FILES` 定义，并通过同一文件的 `srcExclude: ['README.md', ...[...HIDDEN_DOC_FILES]]` 从 VitePress 构建中排除。隐藏页源文件保留，不删除；它们不进入构建产物、侧边栏和本地搜索索引。

当前隐藏清单共 12 项，文件位置如下：

```text
03-features/10-datasource.md
03-features/09-knowledge-graph.md
04-api/02-api-org.md
05-clients/02-cli.md
05-clients/03-go-sdk.md
05-clients/04-miniprogram.md
05-clients/05-desktop.md
05-clients/06-chrome-extension.md
05-clients/07-claw-skill.md
03-features/23-memory.md
04-api/02-api-memory.md
05-clients/08-deepseek-harness.md
```

`README.md` 本身也由 `srcExclude` 排除，只用于维护文档体系，不作为站点页面发布。

| 隐藏原因 | 文件位置 |
| --- | --- |
| 知识图谱入口不在当前前端交付范围 | `03-features/09-knowledge-graph.md` |
| 数据源导入入口不在当前前端交付范围 | `03-features/10-datasource.md` |
| 组织能力与当前前端交付范围不一致 | `04-api/02-api-org.md` |
| 长期记忆与当前前端交付范围不一致 | `03-features/23-memory.md` |
| 长期记忆 API 与当前前端交付范围不一致 | `04-api/02-api-memory.md` |
| CLI 不随企业前端交付 | `05-clients/02-cli.md` |
| Go SDK 不随企业前端交付 | `05-clients/03-go-sdk.md` |
| 小程序不随企业前端交付 | `05-clients/04-miniprogram.md` |
| 桌面端不随企业前端交付 | `05-clients/05-desktop.md` |
| 浏览器扩展入口不在当前前端交付范围 | `05-clients/06-chrome-extension.md` |
| 外部技能入口不在当前前端交付范围 | `05-clients/07-claw-skill.md` |
| 独立插件客户端不作为企业能力交付 | `05-clients/08-deepseek-harness.md` |

维护要求：

- 新增或移除隐藏页时，`HIDDEN_DOC_FILES`、`srcExclude` 生成规则和本清单必须同批更新。
- 可见 Markdown 不得链接隐藏页；README 中的目录也不得列出隐藏页。
- 隐藏页不作为产品能力宣传，不提供操作入口，也不得被新文档引用。
- 前端入口或可见范围变化时，先审查上表，再审查侧边栏、正文、链接和搜索索引。

## 目录说明

| 目录 | 定位 |
| --- | --- |
| `01-getting-started` | 产品定位、部署、快速上手与企业配置 |
| `02-architecture` | 企业模块架构、服务设计、文档处理、检索问答与异步任务 |
| `03-features` | 用户可见功能与管理能力；与当前前端交付范围保持一致 |
| `04-api` | 企业路由驱动的 API 参考；不以上游文档为准 |
| `05-clients` | 当前仅保留 Web 前端；未交付客户端页隐藏 |
| `06-development` | 开发指南、数据库迁移和扩展点；保留较深研发内容 |

## 写作约定

- 首段说明功能、适用范围和结果；操作步骤、参数、权限和限制紧跟相关场景。
- 源码路径写企业侧路径，优先指向 `apps/`、`docker-compose-kjsc.yml`、`docker-compose-mac.yml`、`scripts/kjsc/`、`.env.kjsc.example` 和 `migrations/version_kjsc/`。
- API 以 `apps/app-core/router` 与 `apps/agent-harness/server/routers` 实际注册为准；数据库结构以 `migrations/version_kjsc` 为准。
- 未开放、已隐藏或仅上游存在的能力，不写入可见产品文档；确需保留研发说明时先加入隐藏清单。
- 涉及界面操作的页面优先使用 `<Screenshot>` 组件，截图放在 `public/screenshots/`。
- 用户可见文案与接口错误仍遵循前端五语言和后端错误码规范；本文档站只描述这些规范，不代替实现检查。

## 内容分层与检查

| 文档层 | 写作范围 | 隐藏能力处理 |
| --- | --- | --- |
| `01-getting-started`、`03-features`、`04-api`、`05-clients` | 当前可交付的产品入口、接口、权限和限制 | 不写成产品能力，不提供启用步骤，不链接隐藏页 |
| `02-architecture`、`06-development` | 内部实现、扩展点、数据流和排障资料 | 可以解释底层能力，但必须标明内部实现，不得表现为已开放入口 |

### 当前交付边界

| 范围 | 当前交付 |
| --- | --- |
| 产品入口 | 平台对话、工作模式、知识库、平台与 Runtime 智能体、Runtime 技能与工具、Runtime MCP、工作区、数据总览、租户与系统设置 |
| 界面语言 | 中文、英文 |
| IM | 企业微信、飞书、钉钉 |
| 向量引擎 | Elasticsearch、PostgreSQL、Milvus、Qdrant、Weaviate |
| 存储后端 | local、MinIO、OSS、COS |
| 搜索提供商 | DuckDuckGo、百度、Tavily、Bing |
| 远程模型厂商 | 阿里云、DeepSeek、腾讯混元、OpenAI、Anthropic、Gemini、MIMO、Moonshot、智谱、千帆、MiniMax、火山引擎、硅基流动、自定义 OpenAI 兼容服务 |
| 不交付入口 | 组织与共享管理、数据源导入、知识图谱、长期记忆、浏览器扩展、外部技能、云解析引擎及未交付客户端 |

每次同步后至少检查：

1. 前端路由、菜单和设置分区是否与当前交付范围一致。
2. 企业 API 和 Runtime API 是否存在已隐藏但仍被产品文档宣传的接口。
3. 向量库、存储、模型、搜索、IM、解析引擎和语言选项是否超出当前允许范围。
4. 隐藏页是否仅保留在 `HIDDEN_DOC_FILES` 中，是否被可见正文或侧边栏引用。
5. 构建产物是否不包含隐藏页、隐藏页链接和未交付客户端入口。

## 官方代码与文档同步规则

1. 官方代码或文档同步后，先做差异审计，再改文档。审计范围包括前端路由与菜单、前端功能开关、`apps/app-core/router`、`apps/agent-harness/server/routers`、`migrations/version_kjsc`、KJSC 配置、部署入口和现有文档。
2. 企业未启用或当前前端未交付的能力不得作为产品能力写入可见文档；能力放开时必须确认代码入口、权限、配置、迁移与文档同批可用。
3. 前端入口或可见范围变化时，同批审查 `HIDDEN_DOC_FILES`、本 README 的隐藏清单、sidebar、可见正文、文内链接和搜索索引。
4. 配置说明以 `config/config_kjsc.yaml`、`config/builtin_agents_kjsc.yaml`、`config/prompt_templates_kjsc/`、`.env.kjsc.example`、`docker-compose-kjsc.yml` 和 `scripts/kjsc/` 为准。
5. `config_kjsc.yaml` 支持 `${VAR:-default}` 展开；同步官方配置后必须回归验证该能力。
6. 官方新增配置先补 KJSC 变体，不改官方 `config/`、`internal/`、`cmd/server/`；同步后逐项检查 KJSC 变体的加载顺序、挂载和默认值。
7. API 契约以企业路由为准，数据库结构以企业迁移为准；上游文档只能作为线索，不能作为契约依据。
8. 功能代码、迁移、配置、前端文案和文档应在同一变更批次内闭环；跨模块能力先写清边界，再描述操作。
9. 平台与 Runtime 的会话、智能体、MCP、技能和工作区边界发生变化时，先更新架构与功能页，再更新 API 页。
10. 每次同步后运行 `npm run build`、`npm run check`，并按“内容分层与检查”逐项审计可见 Markdown 和构建产物。
