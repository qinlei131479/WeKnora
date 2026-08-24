# Agent-Harness：从 Bubble-Weave/Yuxi 迁入的 Python LangGraph 运行时。

源码来自独立仓库 Bubble-Weave，第一阶段保持接口独立：

- 后端：本目录（FastAPI + LangGraph + ARQ）
- 临时前端：`apps/agent-web`
- 部署：`docker-compose-mac.yml` 或 `docker-compose-kjsc.yml` 的 `--profile harness`

## 启动

```bash
# 1. 补齐 JWT / Sandbox Token（复用仓库根已有 .env，不覆盖 WeKnora 键）
make harness-init

# 2. 启动（api/web/worker 均只起自身，不拉基础设施；milvus 需自行 docker 启动）
make harness-api          # 仅 api
make harness-web          # 仅 web
make harness-up           # api + worker + web + sandbox-provisioner

# 3. 首次写入演示用户（需 api 已 healthy）
make harness-seed
```

访问 `http://localhost:5174`。

默认账号：

- 超管 `zwj` / `zwj12138`
- 其他用户密码 `yuxi123456`

停止只停 harness 容器，不动 postgres/app/frontend：`make harness-down`。不要加 `--remove-orphans`。

## 数据隔离

| 资源 | WeKnora | Agent-Harness |
|------|---------|---------------|
| PostgreSQL | `DB_NAME`（默认 `agent-middle`） | `AGENT_HARNESS_DB_NAME`（默认 `agent_harness`） |
| Redis | DB 0 | DB 2 |
| MinIO | 同一实例，账号仍用 `MINIO_ACCESS_KEY_ID` | 同一 `minio` 服务 |
| 认证 | `JWT_SECRET` | `JWT_SECRET_KEY` |

## Make 目标

- `make harness-init`
- `make harness-api` / `harness-worker` / `harness-web`
- `make harness-up` / `harness-down` / `harness-logs`
- `make harness-seed`
- `make harness-up-lite`（`LITE_MODE=true`，仅拉起 postgres/redis/minio，跳过 neo4j；milvus 自行启动）
- `COMPOSE_FILE=docker-compose-kjsc.yml` 可换 kjsc 编排
