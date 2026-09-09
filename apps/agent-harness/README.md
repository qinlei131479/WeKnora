# Agent-Harness：从 Bubble-Weave/Yuxi 迁入的 Python LangGraph 运行时。

源码来自独立仓库 Bubble-Weave，第一阶段保持接口独立：

- 后端：本目录（FastAPI + LangGraph + ARQ）
- 临时前端：`apps/agent-web`
- 部署：`docker-compose-mac.yml` 或 `docker-compose-kjsc.yml` 的 `--profile harness`

## 启动

```bash
# 1. 补齐 JWT / Sandbox Token（复用仓库根已有 .env，不覆盖 WeKnora 键）
./scripts/kjsc/dev.sh init

# 2. 启动（本机进程连当前 .env / .env.local；不拉 Docker api/worker）
make dev-kjsc-harness     # 本机 uvicorn + arq
make dev-kjsc-sandbox     # sandbox-provisioner（仍走 Docker）
```

访问 `http://localhost:5174`。

本机 PG/Redis 请用 `.env.local` 覆盖 Compose 主机名，例如：

```text
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agent-middle
REDIS_ADDR=localhost:6379
```

默认账号：

- 超管 `zwj` / `zwj12138`
- 其他用户密码 `yuxi123456`

不要对整份 compose 加 `--remove-orphans`。首次建库 / seed 请直接用 docker compose 或脚本，不经过 Makefile。

## 数据隔离

| 资源 | WeKnora | Agent-Harness |
|------|---------|---------------|
| PostgreSQL | `DB_NAME`（默认 `agent-middle`） | 同库，业务表 `h_` 前缀 |
| Redis | DB 0 | DB 2 |
| MinIO | 同一实例，账号仍用 `MINIO_ACCESS_KEY_ID` | 同一 `minio` 服务 |
| 认证 | `JWT_SECRET` | `JWT_SECRET` |

## Make 目标

- `make dev-kjsc-harness`（本机 api + worker，不启 Docker）
- `make dev-kjsc-sandbox`（sandbox-provisioner，Docker）
- 首次环境：`./scripts/kjsc/dev.sh init`
- Docker 编排仍可用：`docker compose -f docker-compose-mac.yml --profile harness up -d api worker`
