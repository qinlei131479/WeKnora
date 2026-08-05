# Jenkins 部署（App / UI）— agent-middle / kjsc

同机：用 `scripts/build_images_kjsc.sh` 本地构建镜像后，以 `docker-compose-kjsc.yml` 更新容器。**不要 pull 自研镜像**（无私有仓时会盖掉本地 `kjsc/agent-middle-*`）。

## 命名约定

| 类型 | 值 |
|------|-----|
| Compose | `docker-compose-kjsc.yml` |
| 网络 | `agent-middle-network` |
| 容器 | `agent-middle-<角色>` |
| 自研镜像 | `kjsc/agent-middle-{ui,app,docreader,sandbox,...}` |
| 前端源码 | `apps/frontend` |

第三方依赖（redis / postgres 等）继续使用公共镜像。

## 文件

| 路径 | Job Script Path |
|------|-----------------|
| `app/Jenkinsfile` | `scripts/kjsc/jenkins/app/Jenkinsfile` |
| `ui/Jenkinsfile` | `scripts/kjsc/jenkins/ui/Jenkinsfile` |

## 前置

- 仓库根目录有 `.env.kjsc.example`（已入库）；部署时若无 `.env` 会自动 `cp .env.kjsc.example .env`
- `postgres` / `redis` / `docreader` 已常驻
- Jenkins 用户在 `docker` 组

首次可手工：

```bash
cp .env.kjsc.example .env   # 按需修改后再部署
sh scripts/build_images_kjsc.sh -a
docker compose -f docker-compose-kjsc.yml up -d --pull never
```

健康检查端口（与 `.env` 保持一致）：

- App：`APP_PORT=9988` → `http://127.0.0.1:9988/health`
- UI：`FRONTEND_PORT=9980` → `http://127.0.0.1:9980/`

## 参数

- `SKIP_BUILD`：跳过构建，只重启容器

建议有 API 变更时：先 App，后 UI。

## 超时

流水线 `timeout` 为 **30 分钟**（测试用）。生产构建偏慢时可再调大。
