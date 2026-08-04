# 通用智能体中台 — Web

Vue 3 管理前端，基于 **Vue 3 + Vite + TypeScript + Element Plus** 构建，为 **通用智能体中台**提供后台管理能力，涵盖智能体大脑、交互终端、知识库、资源仓与数据服务等模块。智能体对话由渠道侧经 `iptv-channel` 接入；Python 侧能力通过 `VITE_APP_PY_SERVER` 指向 `apps/agent`（`:8000/v1`）。

## 技术栈

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.5+ | 渐进式前端框架 |
| TypeScript | 5.x | 类型安全的 JavaScript |
| Vite | 6.x | 前端构建工具 |
| Element Plus | 2.13+ | Vue 3 UI 组件库 |
| Pinia | - | Vue 3 状态管理 |
| Vue Router | 4 | 路由管理 |
| Axios | - | HTTP 请求库 |
| ECharts | - | 数据可视化图表 |
| SCSS / Less | - | CSS 预处理器 |

## 环境要求

- **Node.js** >= 18
- **npm** >= 8（或使用 pnpm）

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务 (默认端口 80)
npm run dev

# 生产环境构建
npm run build:prod

# 预发环境构建
npm run build:stage

# 预览构建产物
npm run preview
```

## 目录结构

```
apps/web/
├── public/                 # 静态公共资源
├── src/
│   ├── api/                # 接口请求 (按模块组织)
│   ├── assets/             # 静态资源 (图片、图标等)
│   ├── components/         # 全局公共组件
│   ├── directive/          # 自定义指令
│   ├── layout/             # 页面布局框架
│   ├── plugins/            # 插件注册
│   ├── router/             # 路由配置
│   ├── store/              # Pinia 状态管理 (按功能域拆分)
│   ├── types/              # TypeScript 类型定义
│   ├── utils/              # 工具函数
│   ├── views/              # 页面视图 (按路由模块组织)
│   ├── App.vue             # 根组件
│   ├── main.ts             # 应用入口
│   ├── permission.ts       # 路由权限控制
│   └── settings.ts         # 全局配置
├── vite/                   # Vite 插件配置
│   └── plugins/                # auto-import / svg-icons / compression
├── vite.config.ts          # Vite 主配置
├── .env.production         # 生产环境变量
├── .env.staging            # 预发环境变量
└── package.json
```

## Vite 配置说明

### 路径别名

| 别名 | 映射 |
|------|------|
| `@` | `./src` |
| `~` | 项目根目录 |

### 开发代理

开发模式下通过 Vite proxy 代理后端 API：
- `VITE_APP_BASE_API` → 后端网关服务
- `VITE_APP_STATIC_API` → 静态资源服务

代理目标在 `.env.*` 环境文件中配置。

### 构建输出

- 产物输出至 `dist/` 目录
- 资源命名: `static/js/`、`static/css/` 等
- 生产不生成 sourcemap

## 开发规范

- 使用 `<script setup lang="ts">` Composition API
- 组件命名 PascalCase，文件名与组件名一致
- TypeScript strict 模式，避免 `any`
- API 调用统一使用 `src/utils/request.ts` 封装的 Axios 实例
- 样式使用 `<style scoped>`，遵循 Element Plus 设计规范
- 详细规范参见 `.cursor/rules/vue3-web.mdc`

## 部署

通过 Jenkins 流水线自动构建与部署：

```bash
npm install
npm run build:stage    # 或 build:prod
```

构建产物部署至 Nginx 静态服务器。流水线配置：`script/jenkins/web/`
