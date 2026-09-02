# Agent-Harness：从 Bubble-Weave/Yuxi 迁入的 Python LangGraph 运行时。

源码来自独立仓库 Bubble-Weave，第一阶段保持接口独立：

- 后端：本目录（FastAPI + LangGraph + ARQ）
- 临时前端：`apps/agent-web`
- 部署：`docker-compose-mac.yml` 或 `docker-compose-kjsc.yml` 的 `--profile harness`

## 启动

```bash
# 1. 补齐 JWT / Sandbox Token（复用仓库根已有 .env，不覆盖 WeKnora 键）
./scripts/dev_kjsc.sh init

# 2. 启动（只起自身，不拉基础设施；milvus 需自行 docker 启动）
make dev-kjsc-harness     # api + worker
make dev-kjsc-sandbox     # sandbox-provisioner（单独起）
```

访问 `http://localhost:5174`。

默认账号：

- 超管 `zwj` / `zwj12138`
- 其他用户密码 `yuxi123456`

不要对整份 compose 加 `--remove-orphans`。首次建库 / seed 请直接用 docker compose 或脚本，不经过 Makefile。

## 数据隔离

| 资源 | WeKnora | Agent-Harness |
|------|---------|---------------|
| PostgreSQL | `DB_NAME`（默认 `agent-middle`） | `AGENT_HARNESS_DB_NAME`（默认 `agent_harness`） |
| Redis | DB 0 | DB 2 |
| MinIO | 同一实例，账号仍用 `MINIO_ACCESS_KEY_ID` | 同一 `minio` 服务 |
| 认证 | `JWT_SECRET` | `JWT_SECRET_KEY` |

## Make 目标

- `make dev-kjsc-harness`（api + worker）
- `make dev-kjsc-sandbox`（sandbox-provisioner）
- `COMPOSE_FILE=docker-compose-kjsc.yml` 可换 kjsc 编排
- 首次环境：`./scripts/dev_kjsc.sh init`
