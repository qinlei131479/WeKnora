# 管理端开发规范

## 范围与实现

- 仅适用于 `apps/manager`。
- 代码侧只允许改动 `apps/` 下的企业产品线代码；其它目录一律不动。
- 其它产品线 `apps/agent-harness`、`apps/app-core`、`apps/backend`、`apps/docs`、`apps/frontend`，禁止修改。
- 实际技术栈为 Vue 3、TypeScript、Element Plus、vue-i18n，图表使用 ECharts；沿用现有组件、布局和主题，不另引 UI 框架。
- 非用户明确要求，不自动提交 Git。
- API 请求使用 `.then/.catch/.finally`；请求和应答对象定义与接口命名保持一致；DTO 不含 `deletedAt` 和 `delFlag`，只有 VO 可含。

## 国际化

- 管理端目前只支持 `zh-CN`、`en-US`，资源统一放在 `src/i18n/messages/`，不新增其他语言或组件内翻译字典。
- 资源 JSON 采用分层和扁平混合 key 格式。
- 所有用户可见文案必须使用全局 i18n：模板用 `$t`，脚本从 `@/i18n` 引入 `t`。

## 页面约定

- 使用 `<page-name>`、`<page-content>`；前者不手写 `title`，分页放在后者的 `footer` 插槽。
- 搜索区域使用 `<div class="search-bar">` 和 Element Plus 控件。保留初始化查询；选项变化不自动查列表；重置恢复条件后仅查询一次第一页，翻页也仅查询一次。
- 列宽按 14px 字号估算中英文，向上取整到 10 的倍数后加 10px，与已有默认宽度取较大值；具体页面明确要求优先。
