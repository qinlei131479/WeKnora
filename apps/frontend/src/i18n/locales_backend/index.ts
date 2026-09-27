/** 后端错误文案入口，按界面语言与前端语言包分开维护。 */
import enUS from './en-US.ts'
import jaJP from './ja-JP.ts'
import koKR from './ko-KR.ts'
import ruRU from './ru-RU.ts'
import zhCN from './zh-CN.ts'

export const backendMessages = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ru-RU': ruRU,
  'ko-KR': koKR,
  'ja-JP': jaJP,
} as const

type FrontendMessages = {
  error?: Record<string, unknown>
}

/** 把后端错误文案挂到 error.kb，供现有 error.kb.* 键继续使用。 */
export function attachBackendMessages<T extends FrontendMessages>(
  frontend: T,
  backend: { error: { kb: Record<string, string> } },
) {
  return {
    ...frontend,
    error: {
      ...frontend.error,
      kb: backend.error.kb,
    },
  }
}
