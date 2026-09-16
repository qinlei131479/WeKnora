# Jenkins 部署（App-core / Frontend / Docs / Harness / Sandbox）— agent-middle / kjsc

同机：用 `scripts/kjsc/build_images.sh` 本地构建镜像后，以 `docker-compose-kjsc.yml` 更新容器。**不要 pull 自研镜像**（无私有仓时会盖掉本地 `kjsc/agent-middle-*`）。

## 命名约定

| 类型 | 值 |
|------|-----|
| Compose | `docker-compose-kjsc.yml` |
| 网络 | `agent-middle-network`（compose 中 `name:` 固定，不随目录/Jenkins 工作区变化） |
| 容器 | `agent-middle-<角色>` |
| 自研镜像 | `kjsc/agent-middle-{ui,app,docs,docreader,sandbox,harness,...}` |
| 前端源码 | `apps/frontend` |
| 文档站源码 | `apps/docs/`（VitePress；由 `website-docs` fork，部署只构建本目录） |
| 镜像定义 | `docker/Dockerfile.{frontend,docs,agent-harness}`；nginx 在 `docker/config/`；入口脚本在 `scripts/kjsc/` |

第三方依赖（redis / postgres 等）继续使用公共镜像。

Jenkins：网络不存在则创建 `agent-middle-network`，再删同名容器并 `compose up`。旧的带前缀网络（如 `*_agent-middle-network`）可在容器迁到新网络后手动删掉。

## 文件

| 路径 | Job Script Path |
|------|-----------------|
| `app-core/Jenkinsfile` | `scripts/kjsc/jenkins/app-core/Jenkinsfile` |
| `frontend/Jenkinsfile` | `scripts/kjsc/jenkins/frontend/Jenkinsfile` |
| `docs/Jenkinsfile` | `scripts/kjsc/jenkins/docs/Jenkinsfile` |
| `harness/Jenkinsfile` | `scripts/kjsc/jenkins/harness/Jenkinsfile` |
| `sandbox/Jenkinsfile` | `scripts/kjsc/jenkins/sandbox/Jenkinsfile` |

## 前置

- 仓库根目录有 `.env.kjsc.example`（已入库）；部署时若无 `.env` 会自动 `cp .env.kjsc.example .env`
- `postgres` / `redis` / `docreader` 已常驻（Docs 流水线**不依赖**这些服务）
- Jenkins 用户在 `docker` 组（能执行 `docker info` / `docker compose`）
- App Job 需要 Docker BuildKit，构建节点预留至少 5 GB 可用磁盘；`WITH_ANYDOC=1` 时首次构建会在容器内安装 Rust stable 并编译静态库，不应在 Jenkins 宿主机额外安装 Cargo。
- App Job 构建节点需要能访问 Rustup、Crates.io（或 `RUSTUP_DIST_SERVER` / `RUSTUP_UPDATE_ROOT` 指定的镜像）以及 `build-anydoc-lib.sh` 使用的 crate 下载地址。若网络受限，在 `.env` 中配置镜像后再构建。
- **App Job**：Jenkins 全局工具需配置 Go，**Name 必须为** `go1.26.0`（与 `tools { go 'go1.26.0' }` 一致）。
- **UI Job**：Jenkins 全局工具需配置 NodeJS，**Name 必须为** `node20.20.2`（版本 20.20.2；与 `manager/Web-Jenkinsfile` 的 `tools { nodejs '...' }` 用法相同）。Docs **不依赖**上述工具。

首次可手工：

```bash
cp .env.kjsc.example .env   # 按需修改后再部署
sh scripts/kjsc/build_images.sh -a
docker compose -f docker-compose-kjsc.yml up -d --pull never
```

仅文档站：

```bash
sh scripts/kjsc/build_images.sh --docs
docker compose -f docker-compose-kjsc.yml --profile docs up -d --no-deps --pull never docs
```

> `docs` 挂了 `profiles: [docs]`，普通 `docker compose -f docker-compose-kjsc.yml up -d` **不会**启动文档站，必须加 `--profile docs`。

健康检查端口（与 `.env` 保持一致）：

- App：`APP_PORT=9980` → `http://localhost:9980/health`
- UI：`FRONTEND_PORT=9988` → `http://localhost:9988/`
- Docs：`DOCS_PORT=9900` → `http://localhost:9900/docs/`
- Harness：`HARNESS_PORT=9990` → `http://localhost:9990/api/system/health`
- Sandbox-provisioner：`SANDBOX_PROVISIONER_PORT=8002` → `http://localhost:8002/health`

## 参数

- `SKIP_BUILD`：跳过构建，只重启容器
- `WITH_ANYDOC`（App-core）：默认开启。关闭时企业 app 镜像不链接 anydoc；首次开启构建可能需要额外数分钟。
- `RUSTUP_DIST_SERVER` / `RUSTUP_UPDATE_ROOT`（App-core）：可选 Rust 工具链镜像。留空时读取 `.env`，未配置则使用 Rust 官方源。
- `OVERWRITE_ENV`（App-core / Frontend / Harness / Sandbox）：勾选后强制 `cp .env.kjsc.example .env`；覆盖前自动备份为 `.env.bak.<时间戳>`。适用于仓库更新了 example（如 SSRF 白名单）但 Jenkins 工作区仍保留旧 `.env` 的场景。**会覆盖**工作区内手工修改的密码、端口等，请谨慎勾选

建议有 API 变更时：先 App-core，后 Frontend。Docs 与业务服务解耦，可单独构建部署。Harness 依赖已常驻的 postgres/redis/minio，以及可访问的 WeKnora App（`WEKNORA_BASE_URL`）；现网必须 `--profile harness --profile minio` 且 `--no-deps`，不要把 postgres/minio 拉起来。

Harness Job **只**起 `api` + `worker`。sandbox-provisioner 用独立 Job。

仅 Harness：

```bash
sh scripts/kjsc/build_images.sh --harness
docker compose -f docker-compose-kjsc.yml --profile harness --profile minio \
  up -d --no-deps --pull never api worker
```

仅 sandbox-provisioner：

```bash
sh scripts/kjsc/build_images.sh --sandbox-provisioner
docker compose -f docker-compose-kjsc.yml --profile harness --profile minio \
  up -d --no-deps --pull never sandbox-provisioner
```

## 超时

App-core 与 Harness 流水线 `timeout` 为 **60 分钟**，Frontend / Docs / Sandbox 为 30 分钟。`WITH_ANYDOC=1` 的冷缓存 App 构建通常明显慢于旧版本，生产构建偏慢时可再调大。
