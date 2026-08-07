# 文档站服务（VitePress）

本目录包含文档站**站点壳**与本产品的**文档覆盖**（`kjsc/`）。

| 改什么 | 去哪 |
|--------|------|
| 主题、侧栏、构建、nginx、npm 依赖 | `docs/site/` |
| 产品向覆盖 / 功能迭代文档 | `docs/site/kjsc/` |
| 上游正文、wiki、图片 | `docs/`（本目录以外） |
| Swagger 生成物 | `docs/docs.go` 等（Go 包路径不变） |

## 本地预览

```bash
cd docs/site
npm install
npm run docs:dev
```

内容根目录为上级 `docs/`（`srcDir: '..'`），无需软链；`kjsc` 覆盖经 `rewrites` 映射到站点 URL。

## Docker

构建 context 为 `docs/`，dockerfile 为本目录下的 `Dockerfile`：

```bash
./scripts/build_images_kjsc.sh --docs
docker compose -f docker-compose-kjsc.yml --profile docs up -d docs
```
