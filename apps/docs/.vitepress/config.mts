import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type DefaultTheme } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import './theme-config.d.ts'
import { repoVersionLabel } from './version'

const root = resolve(import.meta.dirname, '..')

const sections: { dir: string; label: string }[] = [
  { dir: '00-product', label: '产品手册' },
  { dir: '01-getting-started', label: '快速开始' },
  { dir: '02-architecture', label: '架构' },
  { dir: '03-features', label: '功能模块' },
  { dir: '04-api', label: 'API 参考' },
  { dir: '05-clients', label: '客户端' },
  { dir: '06-development', label: '开发指南' },
]

/**
 * 业务默认未开放的文档（与 apps/frontend weknoraFeatures 对齐）。
 * 文件保留便于日后放开；从构建与侧栏排除即可。
 */
const HIDDEN_DOC_FILES = new Set([
  '03-features/10-datasource.md',
  '04-api/02-api-org.md',
  '05-clients/02-cli.md',
  '05-clients/03-go-sdk.md',
  '05-clients/04-miniprogram.md',
  '05-clients/05-desktop.md',
  '05-clients/06-chrome-extension.md',
  '05-clients/07-claw-skill.md',
])

/** 侧边栏条目文字：取正文一级标题，去掉冗余前后缀 */
function itemText(dir: string, file: string): string {
  const raw = readFileSync(resolve(root, dir, file), 'utf-8')
  const heading = raw.match(/^#\s+(.+)$/m)?.[1] ?? file.replace(/\.md$/, '')
  return heading
    .replace(/^API 参考[:：]\s*/, '')
    .replace(/\s*[（(][^（()）]*[)）]\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function itemsOf(dir: string): DefaultTheme.SidebarItem[] {
  return readdirSync(resolve(root, dir))
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !HIDDEN_DOC_FILES.has(`${dir}/${f}`))
    .sort()
    .map((f) => ({
      text: itemText(dir, f),
      link: `/${dir}/${f.replace(/\.md$/, '')}`,
    }))
}

const productSidebar: DefaultTheme.SidebarItem[] = [
  {
    text: '产品手册',
    collapsed: false,
    items: itemsOf('00-product'),
  },
]

const techSidebar: DefaultTheme.SidebarItem[] = sections
  .filter((s) => s.dir !== '00-product')
  .map((s) => ({
    text: s.label,
    collapsed: false,
    items: itemsOf(s.dir),
  }))

/** 两套互不混入的侧栏：进产品只看产品，进研发只看 01–06 */
const sidebar: DefaultTheme.Sidebar = {
  '/00-product/': productSidebar,
  '/01-getting-started/': techSidebar,
  '/02-architecture/': techSidebar,
  '/03-features/': techSidebar,
  '/04-api/': techSidebar,
  '/05-clients/': techSidebar,
  '/06-development/': techSidebar,
}

const landingNav: DefaultTheme.NavItem[] = [
  { text: '产品手册', link: '/00-product/01-overview', activeMatch: '/00-product/' },
  { text: '研发手册', link: '/01-getting-started/01-introduction', activeMatch: '/01-getting-started/|/02-architecture/|/03-features/|/04-api/|/05-clients/|/06-development/' },
]

const productNav: DefaultTheme.NavItem[] = [
  { text: '产品概述', link: '/00-product/01-overview' },
  { text: '功能说明', link: '/00-product/02-capability-map' },
  { text: '应用场景', link: '/00-product/03-scenarios' },
  { text: '操作指南', link: '/00-product/04-user-guide' },
  { text: '角色与权限', link: '/00-product/05-roles-delivery' },
  { text: '常见问题', link: '/00-product/06-faq' },
  { text: '研发手册', link: '/01-getting-started/01-introduction' },
]

const techNav: DefaultTheme.NavItem[] = [
  { text: '产品手册', link: '/00-product/01-overview' },
  { text: '快速开始', link: '/01-getting-started/01-introduction', activeMatch: '/01-getting-started/' },
  { text: '架构', link: '/02-architecture/01-overview', activeMatch: '/02-architecture/' },
  { text: '功能', link: '/03-features/01-tenant-auth', activeMatch: '/03-features/' },
  { text: 'API', link: '/04-api/01-api-overview', activeMatch: '/04-api/' },
  { text: '客户端', link: '/05-clients/01-frontend', activeMatch: '/05-clients/' },
  { text: '开发', link: '/06-development/01-dev-guide', activeMatch: '/06-development/' },
]

const tokenize = (text: string): string[] => {
  const tokens: string[] = []
  for (const part of text.split(/[\s\n\r#%*,=/:;?[\]{}()&+\-!'"$·、，。：；？！（）【】《》…—]+/)) {
    if (!part) continue
    if (/[\u4e00-\u9fa5]/.test(part)) {
      tokens.push(part, ...part.split(''))
    } else {
      tokens.push(part)
    }
  }
  return tokens
}

/** 旧 URL 兼容：无 md 页时由中间件 301 到安装部署（dev / preview） */
function redirectRemovedDeployGuide() {
  const fromPaths = new Set([
    '/docs/01-getting-started/00-deploy-guide',
    '/docs/01-getting-started/00-deploy-guide/',
    '/docs/01-getting-started/00-deploy-guide.html',
  ])
  const to = '/docs/01-getting-started/02-installation'
  const middleware = (
    req: { url?: string },
    res: { statusCode: number; setHeader: (k: string, v: string) => void; end: () => void },
    next: () => void,
  ) => {
    const path = req.url?.split('?')[0] ?? ''
    if (!fromPaths.has(path)) {
      next()
      return
    }
    res.statusCode = 301
    res.setHeader('Location', to)
    res.end()
  }
  return {
    name: 'redirect-removed-deploy-guide',
    configureServer(server: { middlewares: { use: (fn: typeof middleware) => void } }) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server: { middlewares: { use: (fn: typeof middleware) => void } }) {
      server.middlewares.use(middleware)
    },
  }
}

export default withMermaid(
  defineConfig({
    title: '智能体中台2.0',
    titleTemplate: ':title · 智能体中台2.0 文档',
    description: '智能体中台2.0 文档：产品手册与研发手册',
    lang: 'zh-CN',
    base: '/docs/',
    cleanUrls: true,
    lastUpdated: true,
    srcExclude: ['README.md', ...[...HIDDEN_DOC_FILES]],
    metaChunk: true,

    vite: {
      plugins: [redirectRemovedDeployGuide()],
    },

    head: [
      ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
      ['meta', { name: 'theme-color', content: '#ffffff' }],
      ['meta', { property: 'og:type', content: 'website' }],
      ['meta', { property: 'og:title', content: '智能体中台2.0' }],
      [
        'meta',
        {
          property: 'og:description',
          content: '把 PDF、Word、网页与飞书 / Notion / 语雀的资料收进知识库，做成答案带出处的问答系统',
        },
      ],
    ],

    markdown: {
      theme: { light: 'github-light', dark: 'github-dark' },
      lineNumbers: false,
      toc: { level: [2, 3] },
      config(md) {
        // 表格外面包一层滚动容器。默认主题把 <table> 本身设成 display:block 来做
        // 横向滚动，副作用是表格按内容收缩——列少的表比正文列窄一截，页面里宽窄不一。
        // 把滚动交给包裹层后，表格可以恢复 display:table + width:100%，统一撑满正文列。
        md.renderer.rules.table_open = () => '<div class="wk-table">\n<table>\n'
        md.renderer.rules.table_close = () => '</table>\n</div>\n'
      },
    },

    themeConfig: {
      logo: { light: '/logo-mark.svg', dark: '/logo-mark-dark.svg', alt: '智能体中台2.0' },
      siteTitle: '智能体中台2.0',

      nav: landingNav,
      landingNav,
      productNav,
      techNav,

      weknoraVersion: repoVersionLabel,

      sidebar,

      outline: { level: [2, 3], label: '本页目录' },

      docFooter: { prev: '上一篇', next: '下一篇' },
      returnToTopLabel: '回到顶部',
      sidebarMenuLabel: '目录',
      darkModeSwitchLabel: '外观',
      lightModeSwitchTitle: '切换到浅色',
      darkModeSwitchTitle: '切换到深色',

      lastUpdated: {
        text: '最后更新',
        formatOptions: { dateStyle: 'medium', timeStyle: undefined },
      },

      search: {
        provider: 'local',
        options: {
          translations: {
            button: { buttonText: '搜索文档', buttonAriaLabel: '搜索文档' },
            modal: {
              displayDetails: '展开详情',
              resetButtonTitle: '清除',
              backButtonTitle: '返回',
              noResultsText: '没有找到结果',
              footer: {
                selectText: '选择',
                navigateText: '切换',
                closeText: '关闭',
              },
            },
          },
          miniSearch: {
            options: { tokenize },
            searchOptions: {
              fuzzy: 0.2,
              prefix: true,
              boost: { title: 4, text: 2, titles: 1 },
            },
          },
        },
      },

      footer: {
        message: `基于智能体中台 ${repoVersionLabel} 整理`,
        copyright: '内部文档',
      },
    },

    mermaid: {
      theme: 'base',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
      themeVariables: {
        primaryColor: '#f5f5f7',
        primaryTextColor: '#1d1d1f',
        primaryBorderColor: '#d2d2d7',
        lineColor: '#86868b',
        secondaryColor: '#ffffff',
        tertiaryColor: '#e8e8ed',
        fontSize: '14px',
      },
    },
  }),
)
