import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const docsRoot = path.resolve(siteRoot, '..')

/**
 * 智能体中台文档
 * - 产品 / 开发 分目录展示（rewrite，不搬迁上游 wiki 文件）
 * - API 侧栏二级分类
 * - 功能迭代 / 覆盖内容在 docs/site/kjsc/
 * - 站点工程在 docs/site，上游正文在上级 docs/
 */
export default defineConfig({
  title: '智能体中台文档',
  titleTemplate: ':title | 智能体中台文档',
  description: '智能体中台产品文档与开发指南',
  lang: 'zh-CN',
  srcDir: '..',
  cleanUrls: true,
  ignoreDeadLinks: true,
  // srcDir 在工程根之外时，强制从 site/node_modules 解析 Vue SSR
  vite: {
    server: {
      fs: { allow: [docsRoot, siteRoot] },
    },
    resolve: {
      alias: {
        vue: path.resolve(siteRoot, 'node_modules/vue'),
        'vue/server-renderer': path.resolve(
          siteRoot,
          'node_modules/vue/server-renderer',
        ),
      },
    },
  },
  rewrites: {
    // API 概览用 kjsc 覆盖（隐藏数据源导入）
    'site/kjsc/api/README.md': 'api/index.md',
    // 产品
    'site/kjsc/wiki/Home.md': 'product/index.md',
    'site/kjsc/wiki/项目概述/版本路线图.md': 'product/项目概述/版本路线图.md',
    // 功能迭代页保持 /kjsc/* URL
    'site/kjsc/:path': 'kjsc/:path',
    'wiki/核心功能/:page': 'product/核心功能/:page',
    'wiki/安全认证/:page': 'product/安全认证/:page',
    // 开发（目录名用 develop，避免与上游 docs/dev 测试目录冲突）
    'wiki/集成扩展/:page': 'develop/集成扩展/:page',
    'wiki/开发部署/:page': 'develop/开发部署/:page',
    'wiki/运维排障/:page': 'develop/运维排障/:page',
    'wiki/API参考/:page': 'develop/API参考/:page',
  },
  srcExclude: [
    // 收录 site/kjsc，排除站点工程文件
    'site/node_modules/**',
    'site/.vitepress/**',
    'site/Dockerfile',
    'site/nginx.conf',
    'site/package.json',
    'site/package-lock.json',
    'site/README.md',
    '**/docs.go',
    '**/swagger.json',
    '**/swagger.yaml',
    '**/node_modules/**',
    'dev/**',
    'cloud-image/**',
    'LITE.md',
    'wiki/项目概述/Lite与标准版区别.md',
    // 数据源导入：产品站隐藏
    'wiki/集成扩展/数据源导入开发.md',
    '数据源导入开发文档.md',
    'api/README.md',
    'wiki/Home.md',
    'wiki/项目概述/版本路线图.md',
  ],
  themeConfig: {
    siteTitle: '智能体中台文档',
    nav: [
      { text: '产品', link: '/product/' },
      { text: '开发', link: '/develop/' },
      { text: 'API', link: '/api/' },
      { text: '功能迭代', link: '/kjsc/' },
    ],
    sidebar: {
      '/product/': [
        {
          text: '产品指南',
          items: [{ text: '首页', link: '/product/' }],
        },
        {
          text: '项目概述',
          items: [
            { text: '版本路线图', link: '/product/项目概述/版本路线图' },
          ],
        },
        {
          text: '核心功能',
          collapsed: false,
          items: [
            { text: '知识图谱', link: '/product/核心功能/知识图谱' },
            { text: '开启知识图谱', link: '/product/核心功能/开启知识图谱功能' },
            { text: 'MCP 使用说明', link: '/product/核心功能/MCP功能使用说明' },
            { text: '内置 MCP 服务', link: '/product/核心功能/内置MCP服务管理' },
            { text: '内置模型管理', link: '/product/核心功能/内置模型管理' },
            { text: 'Agent 技能系统', link: '/product/核心功能/Agent技能系统' },
          ],
        },
        {
          text: '安全与协作',
          collapsed: false,
          items: [
            { text: 'OIDC 认证', link: '/product/安全认证/OIDC认证调用流程' },
            { text: 'RBAC 说明', link: '/product/安全认证/RBAC说明' },
            { text: '共享空间', link: '/product/安全认证/共享空间说明' },
          ],
        },
      ],
      '/develop/': [
        {
          text: '开发指南',
          items: [{ text: '首页', link: '/develop/' }],
        },
        {
          text: '集成扩展',
          collapsed: false,
          items: [
            { text: 'IM 集成开发', link: '/develop/集成扩展/IM集成开发' },
            { text: '网络搜索引擎', link: '/develop/集成扩展/添加网络搜索引擎' },
            { text: '向量数据库', link: '/develop/集成扩展/集成向量数据库' },
          ],
        },
        {
          text: '开发与部署',
          collapsed: false,
          items: [
            { text: '开发指南', link: '/develop/开发部署/开发指南' },
            { text: '快速开发模式', link: '/develop/开发部署/快速开发模式' },
          ],
        },
        {
          text: '运维排障',
          collapsed: true,
          items: [{ text: '常见问题', link: '/develop/运维排障/常见问题' }],
        },
        {
          text: 'API 入口',
          collapsed: true,
          items: [
            { text: 'API 参考', link: '/api/' },
            { text: 'API 文档索引', link: '/develop/API参考/API文档概览' },
          ],
        },
      ],
      '/api/': [
        {
          text: '概览',
          items: [{ text: 'API 说明', link: '/api/' }],
        },
        {
          text: '认证与空间',
          collapsed: false,
          items: [
            { text: '认证', link: '/api/auth' },
            { text: '空间', link: '/api/tenant' },
            { text: '组织', link: '/api/organization' },
          ],
        },
        {
          text: '知识库',
          collapsed: false,
          items: [
            { text: '知识库', link: '/api/knowledge-base' },
            { text: '知识', link: '/api/knowledge' },
            { text: '知识搜索', link: '/api/knowledge-search' },
            { text: '分块', link: '/api/chunk' },
            { text: '标签', link: '/api/tag' },
            { text: 'FAQ', link: '/api/faq' },
          ],
        },
        {
          text: '对话与智能体',
          collapsed: true,
          items: [
            { text: '智能体', link: '/api/agent' },
            { text: '会话', link: '/api/session' },
            { text: '消息', link: '/api/message' },
            { text: '聊天', link: '/api/chat' },
            { text: 'Skills', link: '/api/skill' },
          ],
        },
        {
          text: '模型与检索',
          collapsed: true,
          items: [
            { text: '模型', link: '/api/model' },
            { text: '向量存储', link: '/api/vector-store' },
            { text: '网络搜索', link: '/api/web-search' },
            { text: '初始化', link: '/api/initialization' },
          ],
        },
        {
          text: '系统与扩展',
          collapsed: true,
          items: [
            { text: '系统', link: '/api/system' },
            { text: 'MCP 服务', link: '/api/mcp-service' },
            { text: '存储后端', link: '/api/storage-backend' },
            { text: '评估', link: '/api/evaluation' },
          ],
        },
      ],
      '/kjsc/': [
        {
          text: '功能迭代',
          items: [
            { text: '说明', link: '/kjsc/' },
            { text: '覆盖约定', link: '/kjsc/overlay' },
            { text: '文档站部署', link: '/kjsc/deploy' },
          ],
        },
      ],
    },
    socialLinks: [],
    outline: { label: '本页目录', level: [2, 3] },
    docFooter: { prev: '上一篇', next: '下一篇' },
    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索', buttonAriaLabel: '搜索文档' },
          modal: {
            noResultsText: '无结果',
            resetButtonTitle: '清除',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' },
          },
        },
      },
    },
  },
})
