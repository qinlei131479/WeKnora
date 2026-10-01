// 为缺少类型声明的第三方模块补充最小声明，供 markdown_preview.ts 使用。
declare module 'markdown-it' {
  interface Token {
    block?: boolean
    map?: number[] | null
    meta?: any
    info?: string
    content?: string
    [key: string]: any
  }

  interface StateBlock {
    src: string
    bMarks: number[]
    eMarks: number[]
    tShift: number[]
    line: number
    push(type: string, tag: string, nesting: number): Token
  }

  type RulerRule = (
    state: StateBlock,
    startLine: number,
    endLine: number,
    silent: boolean
  ) => boolean

  type RendererRule = (tokens: Token[], idx: number) => string

  interface MarkdownItOptions {
    html?: boolean
    breaks?: boolean
    linkify?: boolean
    typographer?: boolean
    highlight?: (code: string, lang: string) => string
  }

  class MarkdownIt {
    constructor(options?: MarkdownItOptions)
    use(plugin: unknown, ...options: unknown[]): this
    render(src: string): string
    block: {
      ruler: {
        before(name: string, altName: string, rule: RulerRule): void
      }
    }
    renderer: {
      rules: Record<string, RendererRule>
    }
  }

  export default MarkdownIt
}

declare module 'js-yaml' {
  const yaml: {
    load(input: string): unknown
  }
  export default yaml
}

declare module 'markdown-it-task-lists' {
  const taskLists: unknown
  export default taskLists
}
