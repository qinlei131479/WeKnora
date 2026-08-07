# 文档站部署

独立文档服务，不依赖业务应用与前端容器。

站点工程在 `docs/site/`，正文仍在 `docs/`。

## 本地预览

```bash
cd docs/site
npm install
npm run docs:dev
```

浏览器打开文档站首页即可（开发服务默认监听本机文档站端口）。

## Docker

```bash
# 构建镜像
./scripts/build_images_kjsc.sh --docs

# 或仅 compose build
docker compose -f docker-compose-kjsc.yml build docs

# 启动（须加 profile）
docker compose -f docker-compose-kjsc.yml --profile docs up -d docs
```

访问文档站首页（映射端口见环境变量 `DOCS_PORT`）。

## 镜像与容器

| 项 | 值 |
|----|-----|
| 镜像 | `kjsc/agent-middle-docs` |
| 容器 | `agent-middle-docs` |
| 构建 context | `docs/` |
| Dockerfile | `docs/site/Dockerfile` |
