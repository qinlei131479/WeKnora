# Jenkins 部署（App / UI / Docs）— agent-middle / kjsc

同机：用 `scripts/build_images_kjsc.sh` 本地构建镜像后，以 `docker-compose-kjsc.yml` 更新容器。**不要 pull 自研镜像**（无私有仓时会盖掉本地 `kjsc/agent-middle-*`）。

## 命名约定

| 类型 | 值 |
|------|-----|
| Compose | `docker-compose-kjsc.yml` |
| 网络 | `agent-middle-network`（compose 中 `name:` 固定，不随目录/Jenkins 工作区变化） |
| 容器 | `agent-middle-<角色>` |
| 自研镜像 | `kjsc/agent-middle-{ui,app,docs,docreader,sandbox,...}` |
| 前端源码 | `apps/frontend` |
| 文档站源码 | `docs/`（VitePress） |

第三方依赖（redis / postgres 等）继续使用公共镜像。

Jenkins：网络不存在则创建 `agent-middle-network`，再删同名容器并 `compose up`。旧的带前缀网络（如 `*_agent-middle-network`）可在容器迁到新网络后手动删掉。

## 文件

| 路径 | Job Script Path |
|------|-----------------|
| `app/Jenkinsfile` | `scripts/kjsc/jenkins/app/Jenkinsfile` |
| `ui/Jenkinsfile` | `scripts/kjsc/jenkins/ui/Jenkinsfile` |
| `docs/Jenkinsfile` | `scripts/kjsc/jenkins/docs/Jenkinsfile` |

## 前置

- 仓库根目录有 `.env.kjsc.example`（已入库）；部署时若无 `.env` 会自动 `cp .env.kjsc.example .env`
- `postgres` / `redis` / `docreader` 已常驻（Docs 流水线**不依赖**这些服务）
- Jenkins 用户在 `docker` 组（能执行 `docker info` / `docker compose`）
- **App Job**：Jenkins 全局工具需配置 Go，**Name 必须为** `go1.26.0`（与 `tools { go 'go1.26.0' }` 一致）。
- **UI Job**：Jenkins 全局工具需配置 NodeJS，**Name 必须为** `node20.20.2`（版本 20.20.2；与 `manager/Web-Jenkinsfile` 的 `tools { nodejs '...' }` 用法相同）。Docs **不依赖**上述工具。

首次可手工：

```bash
cp .env.kjsc.example .env   # 按需修改后再部署
sh scripts/build_images_kjsc.sh -a
docker compose -f docker-compose-kjsc.yml up -d --pull never
```

仅文档站：

```bash
sh scripts/build_images_kjsc.sh --docs
docker compose -f docker-compose-kjsc.yml up -d --no-deps --pull never docs
```

健康检查端口（与 `.env` 保持一致）：

- App：`APP_PORT=9988` → `http://127.0.0.1:9988/health`
- UI：`FRONTEND_PORT=9980` → `http://127.0.0.1:9980/`
- Docs：`DOCS_PORT=9900` → `http://127.0.0.1:9900/`

## 参数

- `SKIP_BUILD`：跳过构建，只重启容器

建议有 API 变更时：先 App，后 UI。Docs 与业务服务解耦，可单独构建部署。

## 超时

流水线 `timeout` 为 **30 分钟**（测试用）。生产构建偏慢时可再调大。
