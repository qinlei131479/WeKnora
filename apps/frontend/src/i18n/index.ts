import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.ts'
import ruRU from './locales/ru-RU.ts'
import enUS from './locales/en-US.ts'
import koKR from './locales/ko-KR.ts'
import jaJP from './locales/ja-JP.ts'
import backendZhCN from './locales_backend/zh-CN.ts'
import backendRuRU from './locales_backend/ru-RU.ts'
import backendEnUS from './locales_backend/en-US.ts'
import backendKoKR from './locales_backend/ko-KR.ts'
import backendJaJP from './locales_backend/ja-JP.ts'
import { BUILT_IN_DEFAULT, resolveDefaultLocale } from './resolveDefaultLocale.ts'

type FrontendMessages = {
  error?: Record<string, unknown>
}

type BackendErrorMessages = {
  error: {
    kb: Record<string, string>
    skill: Record<string, string>
  }
}

const backendMessages = {
  'zh-CN': backendZhCN,
  'en-US': backendEnUS,
  'ru-RU': backendRuRU,
  'ko-KR': backendKoKR,
  'ja-JP': backendJaJP,
} as const

/** 把后端错误文案挂到 error.kb、error.skill，供 error.<领域>.* 键继续使用。 */
function attachBackendMessages<T extends FrontendMessages>(
  frontend: T,
  backend: BackendErrorMessages,
) {
  return {
    ...frontend,
    error: {
      ...frontend.error,
      kb: backend.error.kb,
      skill: backend.error.skill,
    },
  }
}

const messages = {
  'zh-CN': attachBackendMessages(zhCN, backendMessages['zh-CN']),
  'en-US': attachBackendMessages(enUS, backendMessages['en-US']),
  'ru-RU': attachBackendMessages(ruRU, backendMessages['ru-RU']),
  'ko-KR': attachBackendMessages(koKR, backendMessages['ko-KR']),
  'ja-JP': attachBackendMessages(jaJP, backendMessages['ja-JP']),
}

const savedLocale = localStorage.getItem('locale') || resolveDefaultLocale(
  window.__RUNTIME_CONFIG__?.DEFAULT_LOCALE,
  import.meta.env.VITE_DEFAULT_LOCALE,
)

const i18n = createI18n({
  legacy: false,
  locale: savedLocale,
  fallbackLocale: BUILT_IN_DEFAULT,
  globalInjection: true,
  // Some translations intentionally embed `<strong>` markup (e.g. agent step summaries).
  // We render them via v-html with our own sanitization, so silence vue-i18n's HTML warning
  // to avoid flooding the console and slowing renders during history loads.
  warnHtmlMessage: false,
  messages
})

export default i18n
