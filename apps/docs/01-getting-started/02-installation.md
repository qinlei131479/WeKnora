# 安装部署

企业部署以 `docker-compose-kjsc.yml` 和 `docker-compose-mac.yml` 为准。两者都挂载 KJSC 配置变体，并通过 profile 控制文档站和 Runtime；默认启动不包含文档站，启用工作模式时需要同时启用 Runtime 与 MinIO。

## 部署入口

| 文件 | 适用环境 | 说明 |
| --- | --- | --- |
| `docker-compose-kjsc.yml` | Linux / 标准 Docker 环境 | 企业主部署入口，镜像统一使用 `kjsc/agent-middle-*` |
| `docker-compose-mac.yml` | macOS 本机环境 | 兼容 macOS 的镜像版本与挂载配置 |
| `.env.kjsc.example` | 环境变量模板 | 复制为 `.env` 后按环境修改，不在文档中硬编码密钥 |
| `scripts/kjsc/` | 部署与开发脚本 | 提供迁移、构建、开发和 Jenkins 辅助入口 |
| `migrations/version_kjsc/` | 企业数据库迁移 | 表和字段变更的唯一正式入口 |

## 准备环境

1. 安装 Docker 20.10+ 与 Docker Compose v2。
2. 确认 PostgreSQL、Redis、模型服务和对象存储的连接信息可达。
3. 从模板生成环境文件，并修改数据库、Redis、认证密钥、模型和存储配置。
4. 若启用 Docker 沙箱，确认挂载 Docker Socket 的风险与网络策略；生产环境优先使用受控沙箱后端。

环境文件示例：

```bash
cp .env.kjsc.example .env
```

## 启动服务

标准环境启动平台与 Runtime：

```bash
docker compose -f docker-compose-kjsc.yml --profile harness --profile minio up -d
```

macOS 环境使用：

```bash
docker compose -f docker-compose-mac.yml --profile harness --profile minio up -d
```

只启动平台时不加 `harness` profile；工作模式、Runtime 技能、工具、MCP、工作区和相关数据总览不可用。

### 核心服务

| 服务 | 镜像或组件 | 默认端口 | 健康检查 | 职责 |
| --- | --- | --- | --- | --- |
| `frontend` | `kjsc/agent-middle-ui` | `${FRONTEND_PORT:-80}` | 容器 HTTP 服务 | 企业前端与反向代理 |
| `app` | `kjsc/agent-middle-app` | `${APP_PORT:-8080}` | `GET /health` | 企业服务入口 |
| `docreader` | `kjsc/agent-middle-docreader` | 容器内 `50051` | gRPC 健康检查 | 文档解析 |
| `api` | `kjsc/agent-middle-harness` | `${HARNESS_PORT:-9990}` | `GET /api/system/health` | Runtime API |
| `worker` | `kjsc/agent-middle-harness` | 不发布 | 进程守护 | Runtime 异步任务 |
| `sandbox-provisioner` | `sandbox-provisioner` | `127.0.0.1:${SANDBOX_PROVISIONER_PORT:-8002}` | `GET /health` | Runtime 沙箱供给 |
| `postgres` | ParadeDB / PostgreSQL | 容器内 `5432` | `pg_isready` | 业务数据与混合检索 |
| `redis` | Redis | 容器内 `6379` | 进程健康检查 | 队列、流与缓存 |
| `minio` | MinIO | `${MINIO_PORT:-9000}` | MinIO 健康检查 | Runtime 对象存储 |

`app` 与 Runtime 共用企业数据库连接，但业务对象和表边界不同。平台会话、工作线程、两类智能体和两类 MCP 数据分别存储、分别授权。

## 启动文档站

文档站独立挂载 `docs` profile：

```bash
docker compose -f docker-compose-kjsc.yml --profile docs up -d docs
```

镜像为 `kjsc/agent-middle-docs`，默认访问地址是 `http://<host>:9900/docs/`。普通 `up` 不会启动文档站。

## 数据库迁移

企业表结构变更必须落在 `migrations/version_kjsc/`，并成对提供 `.up.sql` 与 `.down.sql`。容器默认可执行自动迁移；需要人工执行时使用：

```bash
./scripts/kjsc/migrate.sh up
./scripts/kjsc/migrate.sh version
```

迁移前先备份数据库。多批结构调整必须合并到同一个迁移编号，不允许按调试轮次拆分。

## 升级与回滚

1. 确认目标镜像版本和环境变量兼容性。
2. 备份 PostgreSQL、Redis 和对象存储数据。
3. 拉取镜像并执行数据库迁移。
4. 先升级企业服务入口，确认 `/health` 正常。
5. 再升级 Runtime API、Worker 和沙箱供给服务，确认 `/api/system/health` 正常。
6. 最后升级前端和文档站，并用浏览器验证平台对话与工作模式。

现网只更新 Runtime 相关容器时，可按运维预案使用 `--no-deps`，避免依赖服务被意外重建。

## 排查

| 现象 | 检查项 |
| --- | --- |
| 前端无法登录 | `app` 健康检查、认证密钥、数据库连接和前端代理配置 |
| 平台问答失败 | 模型连接、知识库解析状态、检索引擎和对象存储 |
| 工作模式不可用 | `harness` 与 `minio` profile、Runtime API、Worker、Redis 和数据库初始化任务 |
| 技能执行失败 | 沙箱供给服务、沙箱镜像、网络策略和技能安装日志 |
| 文档站不可用 | `docs` profile、`9900` 端口映射和文档镜像版本 |
