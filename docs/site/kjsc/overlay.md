# 文档覆盖约定

## 原则

1. **默认不改** 上游业务 Markdown（`docs/wiki/`、`docs/api/*.md`、根目录业务长文）。
2. VitePress 只做站点壳与 **路径引用**；正文以仓库现有文件为准。
3. 仅当某文件需要面向本产品调整时，才复制到 `docs/site/kjsc/`。

## 操作步骤

1. 将上游文件复制到 `docs/site/kjsc/` 下，保持可读的相对结构，例如：  
   `wiki/开发部署/快速开发模式.md` → `site/kjsc/wiki/开发部署/快速开发模式.md`
2. 在 `docs/site/.vitepress/config.ts` 中通过 `rewrites` 或 sidebar 的 `link` 指向 kjsc 路径。
3. 在下方「已覆盖列表」中登记，便于合并时对照。

## 已覆盖列表

| 上游路径 | kjsc 路径 | 说明 |
|----------|-----------|------|
| `wiki/Home.md` | `site/kjsc/wiki/Home.md` → `/product/` | 产品首页（参考 README 扩充），隐藏 Lite |
| `wiki/项目概述/版本路线图.md` | → `/product/项目概述/版本路线图` | 去掉 Lite 相关条目 |
| `api/README.md` | `site/kjsc/api/README.md` → `/api/` | API 概览；去掉数据源导入 |
| `wiki/集成扩展/数据源导入开发.md` 等 | （排除，不收录） | 数据源导入模块隐藏 |

## 不放进本目录的内容

- Swagger 产物（`docs.go` / `swagger.json` / `swagger.yaml`）— 站点已排除
- 与产品无关的临时笔记
