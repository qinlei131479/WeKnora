# 配置详解

企业配置以 KJSC 变体和 `.env.kjsc.example` 为准。官方配置只作为同步代码时的回退与对照，不作为企业部署文档的主线。

## 配置入口

| 类型 | 位置 | 说明 |
| --- | --- | --- |
| 主配置 | `config/config_kjsc.yaml` | 企业服务入口的结构化配置 |
| 内置智能体 | `config/builtin_agents_kjsc.yaml` | 企业内置平台智能体定义 |
| 提示词模板 | `config/prompt_templates_kjsc/` | 企业提示词模板目录 |
| 环境变量模板 | `.env.kjsc.example` | 数据库、Redis、模型、存储、沙箱和端口等部署变量 |
| 标准编排 | `docker-compose-kjsc.yml` | Linux 与标准 Docker 环境 |
| macOS 编排 | `docker-compose-mac.yml` | macOS 本机部署 |
| 脚本 | `scripts/kjsc/` | 初始化、迁移、构建、开发和部署辅助 |
| 数据库迁移 | `migrations/version_kjsc/` | 企业表结构唯一正式入口 |

企业服务入口启动时优先读取 `config_kjsc.yaml`；文件缺失时才回退官方 `config.yaml`。内置智能体同样优先 `builtin_agents_kjsc.yaml`，提示词目录优先 `prompt_templates_kjsc/`。同步官方代码后必须确认这三处优先级没有被改回官方默认。

## 配置优先级

1. 运行时系统设置中已保存并生效的值。
2. `.env` 与容器环境变量。
3. `config_kjsc.yaml` 中的显式配置。
4. 企业变体缺失时的官方回退配置。
5. 代码内置默认值。

修改配置后先确认该能力是否支持运行时设置；支持时应优先在界面维护，避免数据库值与环境变量表现不一致。

## 环境变量展开

`config_kjsc.yaml` 支持在配置值中引用环境变量：

```yaml
external_url: ${PUBLIC_HOST}
timeout: ${REQUEST_TIMEOUT:-30}
```

规则：

- `${VAR}` 读取指定环境变量。
- `${VAR:-default}` 在变量未设置或为空时使用默认值。
- 密钥、连接串和公网地址优先通过环境变量注入，不提交到仓库。
- 修改环境变量后必须重启对应服务；容器内固定监听端口与宿主机映射端口不能混淆。

## 编排配置

Compose 文件负责挂载 KJSC 配置、数据卷、Docker Socket、Runtime 代码目录和环境文件。常用变量分为五组：

| 分组 | 代表变量 | 说明 |
| --- | --- | --- |
| 端口 | `FRONTEND_PORT`、`APP_PORT`、`HARNESS_PORT`、`DOCS_PORT` | 宿主机访问端口 |
| 数据 | `DB_HOST`、`DB_PORT`、`DB_USER`、`DB_PASSWORD`、`DB_NAME`、`REDIS_*` | 企业服务与 Runtime 共用连接入口 |
| 模型 | 模型 Provider、API Key、基础 URL、超时 | 平台问答、Embedding、重排和视觉能力 |
| 存储 | `MINIO_*` 或对象存储连接 | 知识文件与 Runtime 工作区对象 |
| Runtime | 沙箱后端、沙箱镜像、网络与超时 | 工作模式执行环境 |

新增或调整配置时，应同批检查 `.env.kjsc.example`、两份 KJSC Compose、启动脚本和实际配置加载代码，避免只改一个入口。

## 未交付能力配置

当前前端未交付的能力，不进入可见产品文档，也不在部署文档中提供启用指引。若后续能力正式开放，必须同批确认：

1. 前端路由、菜单和入口。
2. 企业服务或 Runtime API。
3. 权限、租户隔离和审计。
4. 数据库迁移与回滚。
5. KJSC 配置和 `.env.kjsc.example`。
6. 文档站隐藏清单、侧边栏、正文和链接。

## 变更流程

1. 在 `apps/` 对应模块实现代码或配置变更。
2. 表结构变更在 `migrations/version_kjsc/` 新增成对迁移。
3. 更新 `.env.kjsc.example`、KJSC Compose 和 `scripts/kjsc/` 中受影响的入口。
4. 按模块边界更新架构、功能、API 和部署文档。
5. 运行前端、后端、Runtime 和文档站检查。
6. 记录升级、回滚和配置迁移注意事项。
