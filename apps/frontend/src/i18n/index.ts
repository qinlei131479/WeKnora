import { createI18n } from 'vue-i18n'
import zhCN from './locales/zh-CN.ts'
import ruRU from './locales/ru-RU.ts'
import enUS from './locales/en-US.ts'
import koKR from './locales/ko-KR.ts'
import jaJP from './locales/ja-JP.ts'
// 企业叠加层：主 locales/*.ts 与上游逐字节一致（同步时整文件端口），
// 企业独有键与值级覆盖全部放在 locales_kjsc/*.ts，运行时深合并。
// 生成工具：scripts/kjsc/gen_i18n_overlay.mjs
import kjscZhCN from './locales_kjsc/zh-CN.ts'
import kjscRuRU from './locales_kjsc/ru-RU.ts'
import kjscEnUS from './locales_kjsc/en-US.ts'
import kjscKoKR from './locales_kjsc/ko-KR.ts'
import kjscJaJP from './locales_kjsc/ja-JP.ts'
import backendZhCN from './locales_backend/zh-CN.ts'
import backendRuRU from './locales_backend/ru-RU.ts'
import backendEnUS from './locales_backend/en-US.ts'
import backendKoKR from './locales_backend/ko-KR.ts'
import backendJaJP from './locales_backend/ja-JP.ts'
import { BUILT_IN_DEFAULT, resolveDefaultLocale } from './resolveDefaultLocale.ts'

type FrontendMessages = {
  error?: Record<string, unknown>
}

type LocaleTree = Record<string, unknown>

/** 深合并：overlay 覆盖 base，两者都是对象时递归，否则以 overlay 为准。 */
function deepMerge(base: unknown, overlay: unknown): unknown {
  if (overlay === null || overlay === undefined) return base
  const baseIsObj = base !== null && typeof base === 'object' && !Array.isArray(base)
  const overlayIsObj = typeof overlay === 'object' && !Array.isArray(overlay)
  if (!baseIsObj || !overlayIsObj) return overlay
  const out: LocaleTree = { ...(base as LocaleTree) }
  for (const key of Object.keys(overlay as LocaleTree)) {
    out[key] = deepMerge(out[key], (overlay as LocaleTree)[key])
  }
  return out
}

const kjscMessages = {
  'zh-CN': kjscZhCN,
  'en-US': kjscEnUS,
  'ru-RU': kjscRuRU,
  'ko-KR': kjscKoKR,
  'ja-JP': kjscJaJP,
} as const

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
  'zh-CN': attachBackendMessages(
    deepMerge(zhCN, kjscMessages['zh-CN']) as typeof zhCN,
    backendMessages['zh-CN'],
  ),
  'en-US': attachBackendMessages(
    deepMerge(enUS, kjscMessages['en-US']) as typeof enUS,
    backendMessages['en-US'],
  ),
  'ru-RU': attachBackendMessages(
    deepMerge(ruRU, kjscMessages['ru-RU']) as typeof ruRU,
    backendMessages['ru-RU'],
  ),
  'ko-KR': attachBackendMessages(
    deepMerge(koKR, kjscMessages['ko-KR']) as typeof koKR,
    backendMessages['ko-KR'],
  ),
  'ja-JP': attachBackendMessages(
    deepMerge(jaJP, kjscMessages['ja-JP']) as typeof jaJP,
    backendMessages['ja-JP'],
  ),
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
