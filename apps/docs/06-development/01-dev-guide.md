# 开发指南

企业产品线由 `apps/frontend`、`apps/app-core`、`apps/agent-harness` 和 `apps/docs` 组成。开发与验证以 KJSC 入口为主线，默认顺序为 `init → infra → migrate → app / frontend → harness`；上游开源目录只作为同步来源，不作为日常修改入口。

## 模块边界

| 模块 | 位置 | 开发职责 |
| --- | --- | --- |
| 企业前端 | `apps/frontend` | Vue 3 + TDesign 界面、平台与 Runtime API 代理、前端交付范围、五语言文案 |
| 企业服务入口 | `cmd/app-core` + `apps/app-core` | 企业 REST API、租户与权限、知识库问答、模型、平台 Agent、平台 MCP |
| Runtime | `apps/agent-harness` | 工作模式对话、Runtime 智能体、技能、工具、Runtime MCP、工作区与沙箱 |
| 文档站 | `apps/docs` | VitePress 文档、产品边界说明、API 与研发文档 |

修改前先确认边界：

1. 平台对话与工作模式对话是两套会话体系，不共用会话对象。
2. 平台 Agent 与 Runtime 智能体是两套对象，接口和存储不合并。
3. 平台 MCP 与 Runtime MCP 是两套数据，管理入口和 API 前缀不合并。
4. Runtime 只适配和调用企业知识库，不新增知识库管理面。
5. 企业代码修改只落在 `apps/` 与 `cmd/app-core`；`frontend/`、`internal/`、`cmd/server/` 和其它产品线目录不改。

## 环境要求

| 工具 | 版本或入口 | 用途 |
| --- | --- | --- |
| Go | 1.26.0+ | app-core 与根模块测试 |
| Node.js | 22 系以上 | 企业前端与文档站 |
| Python | 3.12 至 3.13 | Runtime 与测试 |
| uv | 当前稳定版 | Runtime 依赖、Ruff 与 pytest |
| Docker Compose | v2 | 基础设施、沙箱供应器与整包部署验证 |
| migrate | golang-migrate v4 | `migrations/version_kjsc` 执行与创建 |

首次准备 `.env` 时从 `.env.kjsc.example` 复制，再按环境补齐数据库、Redis、对象存储、JWT 密钥、平台 API 地址和沙箱令牌。`.env.local` 可覆盖 `.env`，仅用于本机调试，不提交。

## 启动与端口

### 初始化

```bash
make -f Makefile.kjsc init
```

`scripts/kjsc/dev.sh init` 会创建或补齐 `.env`，生成本地沙箱令牌，并检查构建所需镜像。不要手工散落配置到多个环境文件；后续调整优先改 `.env.kjsc.example`，本机差异写 `.env.local`。

### 基础设施

```bash
make -f Makefile.kjsc infra
```

该目标启动 PostgreSQL、Redis、docreader、MinIO 和 sandbox-provisioner。基础组件足以支撑日常开发；需要远程基础设施时，在 `.env.local` 中指定远程地址，脚本会做基础连通性检查。

### 数据库迁移

```bash
make -f Makefile.kjsc migrate
```

首次启动 app-core 前必须执行企业迁移；后续每次拉取包含 `migrations/version_kjsc` 的代码后，也先执行迁移再启动服务。

### 应用与前端

```bash
make -f Makefile.kjsc app
make -f Makefile.kjsc frontend
```

两个命令分别在独立终端运行。app-core 优先使用 Air 热重载，未安装 Air 时使用 `go run` 启动 `cmd/app-core`；前端由 Vite 启动，并把平台与 Runtime API 代理到本机服务。

| 进程 | 默认地址 | 说明 |
| --- | --- | --- |
| app-core | `http://localhost:9980` | 本机开发端口 |
| 企业前端 | `http://localhost:9988` | Vite 开发服务器 |
| Runtime API | `http://localhost:9990` | uvicorn API，worker 同步启动 |
| 文档站 | `http://localhost:9900` | VitePress 开发服务器 |
| sandbox-provisioner | `http://localhost:8002` | 沙箱供应器，容器内服务 |

app 容器内部固定监听 `8080`；`APP_PORT` 只影响宿主机映射和本机开发进程。Runtime 容器内部与本机默认都使用 `9990`。

### Runtime 与沙箱

```bash
make -f Makefile.kjsc harness
make -f Makefile.kjsc sandbox
```

`harness` 在本机同时启动 API 与 arq worker，适合调试 Python 代码。`sandbox` 单独启动 sandbox-provisioner，适合排查沙箱网络、容器创建和技能执行问题。

### 文档站

```bash
cd apps/docs
npm install
npm run dev
```

文档修改后按“官方代码与文档同步规则”检查隐藏清单、可见链接、产品边界和旧品牌残留。

## 配置加载

企业入口固定使用 KJSC 变体：

1. `config/config_kjsc.yaml`
2. `config/builtin_agents_kjsc.yaml`
3. `config/prompt_templates_kjsc/`

以上文件存在时优先加载；缺失时才回退官方配置。`config_kjsc.yaml` 支持 `${VAR:-default}` 展开，调整加载器或默认值时必须保留该语义。

整包部署验证使用：

```bash
docker compose -f docker-compose-kjsc.yml --profile harness --profile minio up -d
```

macOS 本机可使用 `docker-compose-mac.yml`。同步官方代码后，必须逐项检查两个 compose 文件、`.env.kjsc.example`、`scripts/kjsc/` 和配置加载器是否仍指向 KJSC 变体；镜像统一使用 `kjsc/agent-middle-*` 命名，不在文档中誊写内部版本变量名。

## 数据库迁移

企业迁移目录为 `migrations/version_kjsc`，执行记录写入独立的企业迁移表。常用命令：

```bash
./scripts/kjsc/migrate.sh up
./scripts/kjsc/migrate.sh version
./scripts/kjsc/migrate.sh force <version>
./scripts/kjsc/migrate.sh create <migration_name>
```

迁移要求：

1. 表、字段、索引、约束和注释变更必须新增迁移，从现有最大编号顺延。
2. 同一需求的多个结构调整合并到同一个编号，不按调试轮次拆分。
3. 每个编号必须同时提供 `.up.sql` 与 `.down.sql`；不可完全回退时，回滚文件写明不可逆部分、人工核对项和补偿步骤。
4. 禁止用 ORM 自动建表、临时 SQL 或手工执行记录代替迁移。
5. 脚本当前不提供 `down` 执行入口；回滚前先阅读对应 `.down.sql`，再由数据库负责人在变更窗口执行。

## 测试与检查

### app-core

```bash
go test ./apps/app-core/...
go test ./cmd/app-core/...
```

涉及根模块公共类型或启动逻辑时，再按变更范围补充执行相关 Go 包测试。数据库结构变更必须同时验证迁移 up/down 文件可读、编号连续、语句与文档一致。

### Runtime

```bash
cd apps/agent-harness
uv run ruff check .
uv run --group test pytest -m unit
```

修改 API 契约、SSE 事件字段、任务队列或沙箱执行时，至少补充对应单元测试；涉及真实外部服务的集成测试只按需执行，不作为默认本机门槛。

### 前端

```bash
cd apps/frontend
npm run type-check
npm test
npm run check-i18n
npm run build
```

用户可见文案必须同步维护 `zh-CN`、`en-US`、`ko-KR`、`ja-JP`、`ru-RU` 五种语言，且界面文案与后端错误文案分别放在对应语言包中。

### 文档站

```bash
cd apps/docs
npm run build
npm run check
```

构建后检查 `.vitepress/dist`：不包含隐藏页、隐藏页链接、旧品牌词或未交付客户端入口。

## 调试路径

| 问题 | 优先检查 |
| --- | --- |
| app 启动失败 | `.env` 基础项、数据库连通性、企业迁移版本、app-core 日志 |
| 前端接口 404 | Vite 平台代理、Runtime 代理、app-core 路由注册、Runtime 路由注册 |
| 登录或跨服务鉴权失败 | JWT 密钥一致性、平台 API 地址、Runtime 身份适配 |
| 工作模式不可用 | Runtime API、worker、Redis、沙箱供应器与沙箱令牌 |
| 技能执行失败 | sandbox-provisioner 日志、沙箱容器网络、技能声明与变量 |
| 文档解析失败 | docreader 日志、文件大小限制、解析引擎配置与对象存储 |
| 部署行为与本机不一致 | `docker-compose-kjsc.yml`、`docker-compose-mac.yml`、`.env.kjsc.example` |

本机开发时，`scripts/kjsc/dev.sh` 会把 Compose 内的服务地址替换为 localhost。排查配置差异时先确认命令是否加载了 `.env` 与 `.env.local`，再检查容器内地址和宿主机地址是否混用。

## 变更收尾

1. 对照产品边界检查是否引入平台与 Runtime 的对象合并或入口混用。
2. 后端接口契约默认不改；确需调整时先评估兼容性、前端调用、文档和回滚方案。
3. 前端请求 URL 保持不变；移动或封装 API 时只调整位置与类型。
4. 配置变更同步补齐 KJSC 变体、`.env.kjsc.example` 和部署说明。
5. 数据库变更保留成对迁移文件，并在文档中更新影响面。
6. 文档只描述当前交付能力；隐藏能力必须进入 `HIDDEN_DOC_FILES` 与 README 隐藏清单。
7. 提交前按模块执行测试，`git diff --check` 确认无空白错误，再人工复核变更范围。
