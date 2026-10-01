import MarkdownIt from 'markdown-it'
import markdownItKatex from '@vscode/markdown-it-katex'
import taskLists from 'markdown-it-task-lists'
import DOMPurify from 'dompurify'
import { createHighlighter, type Highlighter } from 'shiki'
import yaml from 'js-yaml'
import { escapeHtml } from '@/utils/harness/html'
import { normalizeCodeLanguage } from '@/utils/harness/file_preview'
import { renderSvgBlocks } from './svgRenderer'
import { renderHtmlPreviewBlocks } from './htmlPreviewRenderer'

const markdownKatexPlugin =
  (markdownItKatex as unknown as { default?: typeof markdownItKatex }).default || markdownItKatex
const FRONTMATTER_MARKER = '---'
const LEGACY_MINIO_PUBLIC_URL_RE = /https?:\/\/[^/\s)]+:9000\/public\//gi

let highlighterPromise: Promise<Highlighter> | undefined
const getHighlighter = (): Promise<Highlighter> => {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: ['plaintext']
    }).catch((error) => {
      highlighterPromise = undefined
      throw error
    })
  }
  return highlighterPromise
}

const normalizeHtmlTagQuotes = (content: unknown): string => {
  const source = String(content || '')
  if (!/[“”]/.test(source)) return source
  return source.replace(/<[^>]+>/g, (tag: string) => tag.replaceAll('“', '"').replaceAll('”', '"'))
}

export const normalizeLegacyMinioPublicUrls = (content: unknown): string =>
  String(content || '').replace(LEGACY_MINIO_PUBLIC_URL_RE, '/minio/public/')

const renderFrontmatterValue = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value.map((item) => `<span class="fm-tag">${escapeHtml(item)}</span>`).join('')
  }

  if (value instanceof Date) {
    return escapeHtml(value.toISOString().slice(0, 10))
  }

  if (typeof value === 'object' && value !== null) {
    return `<pre class="fm-json">${escapeHtml(JSON.stringify(value, null, 2))}</pre>`
  }

  return escapeHtml(value)
}

const renderFrontmatterField = (key: string, value: unknown): string => {
  if (key === 'title') {
    return `<strong class="fm-doc-title">${escapeHtml(value)}</strong>`
  }

  if (key === 'date') {
    return `<time>${renderFrontmatterValue(value)}</time>`
  }

  if (key === 'tags' && Array.isArray(value)) {
    return value.map((tag) => `<span class="fm-tag">#${escapeHtml(tag)}</span>`).join('')
  }

  return renderFrontmatterValue(value)
}

const getMarkdownLine = (
  state: { bMarks: number[]; tShift: number[]; eMarks: number[]; src: string },
  line: number
): string => {
  const start = state.bMarks[line] + state.tShift[line]
  const end = state.eMarks[line]
  return state.src.slice(start, end)
}

const renderFrontmatterCard = (data: Record<string, unknown>): string => {
  const rows = Object.entries(data)
    .map(
      ([key, value]) => `
        <div class="fm-row">
          <div class="fm-key">${escapeHtml(key)}</div>
          <div class="fm-value">${renderFrontmatterField(key, value)}</div>
        </div>`
    )
    .join('')

  return `<section class="frontmatter-card">
    <div class="fm-body">${rows || '<div class="fm-empty">无 frontmatter 信息</div>'}</div>
  </section>`
}

const markdownItFrontmatterCard = (md: MarkdownIt): void => {
  md.block.ruler.before('table', 'frontmatter_card', (state, startLine, endLine, silent) => {
    if (startLine !== 0 || getMarkdownLine(state, startLine).trim() !== FRONTMATTER_MARKER) {
      return false
    }

    let nextLine = startLine + 1
    while (nextLine < endLine && getMarkdownLine(state, nextLine).trim() !== FRONTMATTER_MARKER) {
      nextLine += 1
    }

    if (nextLine >= endLine) return false

    const rawYaml = Array.from({ length: nextLine - startLine - 1 }, (_, index) =>
      getMarkdownLine(state, startLine + index + 1)
    ).join('\n')
    let data

    try {
      data = yaml.load(rawYaml) || {}
    } catch {
      return false
    }

    if (!data || typeof data !== 'object' || Array.isArray(data)) return false
    if (silent) return true

    const token = state.push('frontmatter_card', 'section', 0)
    token.block = true
    token.map = [startLine, nextLine + 1]
    token.meta = { data }
    state.line = nextLine + 1
    return true
  })

  md.renderer.rules.frontmatter_card = (tokens, idx) => renderFrontmatterCard(tokens[idx].meta.data)
}

const rendererCache = new Map<string, Promise<MarkdownIt>>()
const renderedHtmlCache = new Map<string, string>()
const MAX_RENDER_CACHE_SIZE = 100
const CODE_FENCE_RE = /(^|\n) {0,3}(```|~~~)/
const CODE_FENCE_LANGUAGE_RE = /(^|\n) {0,3}(```+|~~~+)[ \t]*([^\s:,`]*)/g

const normalizeTheme = (theme: string): string =>
  theme === 'github-dark' ? 'github-dark' : 'github-light'
const hasCodeFence = (content: string): boolean => CODE_FENCE_RE.test(content)

const sanitizeHtmlPreviewSrcdoc = (html: string): string =>
  DOMPurify.sanitize(html, {
    WHOLE_DOCUMENT: true,
    ADD_TAGS: ['html', 'head', 'body', 'style', 'link'],
    FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'textarea', 'select'],
    FORBID_ATTR: ['srcdoc', 'sandbox']
  })

const collectCodeFenceLanguages = (content: unknown): string[] => {
  const languages = new Set<string>()
  for (const match of String(content || '').matchAll(CODE_FENCE_LANGUAGE_RE)) {
    const language = normalizeCodeLanguage(match[3])
    if (language) languages.add(language)
  }
  return [...languages]
}

const ensureLanguages = async (highlighter: Highlighter, languages: string[]): Promise<void> => {
  const loaded = new Set(highlighter.getLoadedLanguages())
  await Promise.all(
    languages
      .filter((language) => !loaded.has(language))
      .map((language) => {
        try {
          return highlighter.loadLanguage(language as Parameters<typeof highlighter.loadLanguage>[0]).catch(() => null)
        } catch {
          return null
        }
      })
  )
}

const createRenderer = ({
  themeName,
  highlighter
}: {
  themeName: string
  highlighter?: Highlighter
}): MarkdownIt =>
  new MarkdownIt({
    html: true,
    breaks: true,
    linkify: true,
    typographer: true,
    highlight: highlighter
      ? (code, lang) => {
          const language = normalizeCodeLanguage(lang)
          const loadedLanguages = highlighter.getLoadedLanguages()
          const targetLanguage = loadedLanguages.includes(language) ? language : 'plaintext'
          return highlighter.codeToHtml(code, { lang: targetLanguage, theme: themeName })
        }
      : undefined
  })
    .use(markdownKatexPlugin, { throwOnError: false, errorColor: '#cc0000', trust: false })
    .use(taskLists, { enabled: false, label: false, labelAfter: false })
    .use(markdownItFrontmatterCard)

const getRenderer = async (theme: string, needsHighlight: boolean): Promise<MarkdownIt> => {
  const themeName = normalizeTheme(theme)
  const cacheKey = needsHighlight ? themeName : 'plain'
  const cached = rendererCache.get(cacheKey)
  if (cached) return cached

  const rendererPromise = needsHighlight
    ? getHighlighter().then((highlighter) => createRenderer({ themeName, highlighter }))
    : Promise.resolve(createRenderer({ themeName }))
  rendererCache.set(cacheKey, rendererPromise)
  return rendererPromise
}

const getCachedHtml = (cacheKey: string): string | undefined => renderedHtmlCache.get(cacheKey)
const setCachedHtml = (cacheKey: string, html: string): void => {
  if (renderedHtmlCache.size >= MAX_RENDER_CACHE_SIZE) {
    renderedHtmlCache.delete(renderedHtmlCache.keys().next().value as string)
  }
  renderedHtmlCache.set(cacheKey, html)
}

const unwrapTableLinks = (tableHtml: string): string =>
  tableHtml.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1')

const wrapMarkdownTables = (html: string): string => {
  if (!html || !html.includes('<table')) return html
  return html.replace(
    /<table\b[\s\S]*?<\/table>/gi,
    (tableHtml) => `<div class="chat-markdown-table">${unwrapTableLinks(tableHtml)}</div>`
  )
}

export const renderMarkdown = async (
  content: unknown,
  { theme = 'github-light' }: { theme?: string } = {}
): Promise<string> => {
  try {
    const normalizedContent = normalizeHtmlTagQuotes(normalizeLegacyMinioPublicUrls(content))
    const htmlPreviewContent = renderHtmlPreviewBlocks(normalizedContent, {
      sanitizeHtml: sanitizeHtmlPreviewSrcdoc
    })
    const svgContent = renderSvgBlocks(htmlPreviewContent)
    const themeName = normalizeTheme(theme)
    const needsHighlight = hasCodeFence(svgContent)
    const cacheKey = `${needsHighlight ? themeName : 'plain'}\u0000${svgContent}`
    const cachedHtml = getCachedHtml(cacheKey)
    if (cachedHtml !== undefined) return cachedHtml

    if (needsHighlight) {
      const highlighter = await getHighlighter()
      await ensureLanguages(highlighter, collectCodeFenceLanguages(svgContent))
    }

    const md = await getRenderer(themeName, needsHighlight)
    const html = wrapMarkdownTables(
      DOMPurify.sanitize(md.render(svgContent), {
        ADD_TAGS: ['input'],
        ADD_ATTR: [
          'class',
          'style',
          'target',
          'rel',
          'type',
          'checked',
          'disabled',
          'source',
          'colspan',
          'rowspan'
        ]
      })
    )
    setCachedHtml(cacheKey, html)
    return html
  } catch (error) {
    console.error('Failed to render markdown:', error)
    return `<pre>${escapeHtml(content)}</pre>`
  }
}
