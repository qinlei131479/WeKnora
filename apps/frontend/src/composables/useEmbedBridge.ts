import { onMounted, onUnmounted, ref, type Ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  createEmbedSession,
  embedChatSessionStorageKey,
  exchangeEmbedSession,
  getEmbedConfig,
  getEmbedMessageList,
  getOrCreateEmbedVisitorId,
  isEmbedSessionToken,
  onEmbedHostContext,
  onEmbedHostLocale,
  onEmbedHostToken,
  parseEmbedTokenFromLocation,
  postEmbedBootstrapRequest,
  postEmbedReady,
  registerEmbedTokenRefresher,
  type EmbedChannelPublicConfig,
} from '@/api/embed'
import { applyEmbedLocale, readEmbedLocaleFromUrl, syncEmbedLocaleFromUrl } from '@/i18n/embed'

// 会话 Token 续期检查间隔。只有在剩余有效期不足一半时才会真正换取新 Token，
// 因此实际换新频率约为「有效期的一半」一次，多数检查点会直接跳过。
const EMBED_TOKEN_CHECK_INTERVAL_MS = 10 * 60 * 1000
// 后端未返回 expires_in 时按 30 分钟（与 embedSessionTTL 一致）推算。
const DEFAULT_EMBED_TOKEN_EXPIRES_IN = 1800

// Persist the chat session id per channel so a page refresh resumes the same
// conversation (and its history) instead of silently starting a new session.
interface StoredSession {
  id: string
  sig: string
  /** Agent bound when the session was created; mismatch forces a new session. */
  agentId?: string
}

function readStoredSession(channelId: string): StoredSession | null {
  try {
    const raw = window.localStorage.getItem(embedChatSessionStorageKey(channelId))
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed.id === 'string' && typeof parsed.sig === 'string' && parsed.id) {
      const agentId = typeof parsed.agentId === 'string' ? parsed.agentId.trim() : ''
      return {
        id: parsed.id,
        sig: parsed.sig,
        ...(agentId ? { agentId } : {}),
      }
    }
  } catch {
    // Malformed / legacy (plain-string) entry: ignore so a fresh signed
    // session is created below.
  }
  return null
}

function writeStoredSession(channelId: string, session: StoredSession | null) {
  try {
    if (session?.id) {
      window.localStorage.setItem(embedChatSessionStorageKey(channelId), JSON.stringify(session))
    } else {
      window.localStorage.removeItem(embedChatSessionStorageKey(channelId))
    }
  } catch {
    // localStorage may be unavailable (private mode / disabled cookies).
    // Persistence is best-effort; the session still works for this load.
  }
}

// A stored session may have been deleted/expired server-side, or its signed
// handle invalidated by a channel token rotation. Probe it cheaply (limit=1)
// with the stored signature before reusing — the backend rejects stale/foreign
// ids and bad signatures with 4xx, which surfaces here as a thrown error.
async function isStoredSessionValid(
  channelId: string,
  apiToken: string,
  session: StoredSession,
): Promise<boolean> {
  try {
    await getEmbedMessageList(channelId, apiToken, session.id, 1, undefined, session.sig)
    return true
  } catch {
    return false
  }
}

/** 识别嵌入接口的限流响应（HTTP 429 或后端原文）。 */
export function isEmbedRateLimitError(error: unknown): boolean {
  const err = error as { message?: string; status?: number; error?: string } | null
  if (!err) return false
  if (err.status === 429) return true
  const msg = String(err.message || err.error || '')
  return /rate limit|daily request limit/i.test(msg)
}

export function useEmbedBridge(channelId: Ref<string>) {
  const { locale: activeLocale, t } = useI18n()
  const route = useRoute()

  const token = ref('')
  const config = ref<EmbedChannelPublicConfig | null>(null)
  const sessionId = ref('')
  const sessionSig = ref('')
  const visitorId = ref('')
  const loadError = ref('')
  // 限流时仍展示聊天壳，只禁用发送；不走空白 loadError 页。
  const rateLimited = ref(false)
  const awaitingToken = ref(false)
  const bootstrapping = ref(false)
  const hostContext = ref<Record<string, unknown>>({})

  let removeHostListener: (() => void) | null = null
  let removeLocaleListener: (() => void) | null = null
  let removeTokenListener: (() => void) | null = null
  let bootstrapped = false
  let hostLocalePinned = false

  // 会话 Token 续期状态。publishToken 仅在页面持有发布 Token 时非空（iframe
  // 直接嵌入、浮窗 static 模式）；安全模式下页面只有会话 Token，无法自行续期。
  let tokenRefreshTimer: number | null = null
  let publishToken = ''
  let tokenIssuedAt = 0
  let tokenExpiresIn = DEFAULT_EMBED_TOKEN_EXPIRES_IN
  let refreshInFlight: Promise<string> | null = null
  if (typeof window !== 'undefined') {
    hostLocalePinned = Boolean(readEmbedLocaleFromUrl())
    if (hostLocalePinned) {
      syncEmbedLocaleFromUrl(activeLocale)
    }
  }

  // 保证返回的会话 Token 仍然新鲜：剩余有效期不足一半（force 时无条件）就用
  // 发布 Token 重新换取。安全模式下没有发布 Token，直接返回当前值，行为不变。
  const ensureFreshToken = async (
    targetChannelId: string,
    force = false,
  ): Promise<string> => {
    const id = targetChannelId || channelId.value
    const current = token.value
    if (!id || !publishToken) return current
    if (!force && Date.now() - tokenIssuedAt < (tokenExpiresIn * 1000) / 2) return current
    if (refreshInFlight) {
      // 等待在途换取结束再取结果，避免并发重复 exchange；force 场景下在途的
      // 可能是「未过期直接返回」的结果，必须等它结束后继续换新。
      await refreshInFlight.catch(() => undefined)
      const issuedAt = tokenIssuedAt
      if (!force && Date.now() - issuedAt < (tokenExpiresIn * 1000) / 2) return token.value
    }
    refreshInFlight = (async () => {
      try {
        const res = await exchangeEmbedSession(id, publishToken)
        const next = res?.data?.session_token
        if (!next) return current
        token.value = next
        tokenIssuedAt = Date.now()
        const expiresIn = Number(res?.data?.expires_in)
        tokenExpiresIn = expiresIn > 0 ? expiresIn : DEFAULT_EMBED_TOKEN_EXPIRES_IN
        return next
      } catch {
        // 换取失败（网络抖动 / 发布 Token 已被轮换）保持静默，下次检查再试。
        return current
      } finally {
        refreshInFlight = null
      }
    })()
    return refreshInFlight
  }

  // 定时兜底：页面长时间停留时，在会话 Token 到期前完成换新。
  const startTokenRefreshTimer = () => {
    if (tokenRefreshTimer || !publishToken) return
    tokenRefreshTimer = window.setInterval(() => {
      void ensureFreshToken(channelId.value)
    }, EMBED_TOKEN_CHECK_INTERVAL_MS)
  }

  const bootstrap = async (embedToken: string) => {
    const id = channelId.value
    if (!id || !embedToken || bootstrapped) return
    bootstrapped = true
    awaitingToken.value = false
    bootstrapping.value = true
    token.value = embedToken
    visitorId.value = getOrCreateEmbedVisitorId(id)

    try {
      let apiToken = embedToken
      // Secure mode: the host already handed us a short-lived session token
      // (minted server-side from the publish token). Use it directly — the
      // exchange endpoint only accepts publish tokens and would reject this.
      if (!isEmbedSessionToken(embedToken)) {
        try {
          const exchangeRes = await exchangeEmbedSession(id, embedToken)
          if (exchangeRes?.data?.session_token) {
            apiToken = exchangeRes.data.session_token
            const expiresIn = Number(exchangeRes.data.expires_in)
            if (expiresIn > 0) tokenExpiresIn = expiresIn
          } else if (!import.meta.env.DEV) {
            // Fail closed in production: a missing session token must not silently
            // fall back to the long-lived publish token.
            throw new Error('embed session exchange returned no token')
          }
        } catch (exchangeErr) {
          // In production we refuse to downgrade to the publish token; only the
          // dev build keeps the convenience fallback for local testing.
          if (!import.meta.env.DEV) {
            throw exchangeErr
          }
        }
      }

      const res = await getEmbedConfig(id, apiToken)
      if (!res?.success || !res.data) {
        loadError.value = t('embedPublish.invalidChannel')
        return
      }
      config.value = res.data

      if (res.data.default_locale && !hostLocalePinned) {
        applyEmbedLocale(res.data.default_locale, activeLocale)
      }

      // Resume a persisted session when still valid and still bound to the same
      // agent; otherwise create a fresh one (e.g. after rebinding the channel).
      const configAgentId = String(res.data.agent_id || '').trim()
      let resolved: StoredSession | null = null
      const stored = readStoredSession(id)
      const agentMatches = !stored?.agentId || !configAgentId || stored.agentId === configAgentId
      if (stored && agentMatches && (await isStoredSessionValid(id, apiToken, stored))) {
        resolved = { ...stored, agentId: configAgentId || stored.agentId }
      } else {
        const sessionRes = await createEmbedSession(id, apiToken)
        const newId = sessionRes?.data?.id || ''
        if (newId) {
          resolved = { id: newId, sig: sessionRes?.data?.sig || '', agentId: configAgentId }
        }
      }
      if (!resolved) {
        loadError.value = t('embedPublish.sessionFailed')
        return
      }
      sessionId.value = resolved.id
      sessionSig.value = resolved.sig
      writeStoredSession(id, resolved)
      token.value = apiToken
      // 持有发布 Token 时登记续期状态；安全模式下留空，续期逻辑自动失效。
      publishToken = isEmbedSessionToken(embedToken) ? '' : embedToken
      tokenIssuedAt = Date.now()
      startTokenRefreshTimer()
      postEmbedReady(id)
    } catch (e: unknown) {
      bootstrapped = false
      const msg = String((e as { message?: string })?.message || '')
      if (isEmbedRateLimitError(e)) {
        // 限流：保留已拿到的配置/会话，页面继续展示，发送侧另行禁用。
        rateLimited.value = true
        loadError.value = ''
      } else if (msg.includes('disabled')) {
        loadError.value = t('embedPublish.channelDisabled')
      } else if (msg.includes('failed to create session')) {
        loadError.value = t('embedPublish.sessionFailed')
      } else {
        loadError.value = msg || t('embedPublish.loadError')
      }
    } finally {
      bootstrapping.value = false
    }
  }

  const markRateLimited = () => {
    rateLimited.value = true
    loadError.value = ''
  }

  // Discard the current conversation and start a fresh signed session. Backing
  // the "新建对话" affordance — also the privacy escape hatch on shared devices.
  const startNewSession = async () => {
    const id = channelId.value
    const apiToken = token.value
    if (!id || !apiToken) return
    try {
      const sessionRes = await createEmbedSession(id, apiToken)
      const newId = sessionRes?.data?.id || ''
      if (!newId) return
      const agentId = String(config.value?.agent_id || '').trim()
      const next: StoredSession = { id: newId, sig: sessionRes?.data?.sig || '', agentId }
      sessionSig.value = next.sig
      sessionId.value = next.id
      writeStoredSession(id, next)
    } catch {
      // Non-fatal: keep the current session if creating a new one fails.
    }
  }

  const start = async () => {
    removeHostListener = onEmbedHostContext((payload) => {
      hostContext.value = { ...hostContext.value, ...payload }
    })

    removeLocaleListener = onEmbedHostLocale((locale) => {
      hostLocalePinned = true
      applyEmbedLocale(locale, activeLocale)
    })

    removeTokenListener = onEmbedHostToken((providedToken, providedChannelId) => {
      if (providedChannelId && providedChannelId !== channelId.value) return
      bootstrap(providedToken)
    })

    if (!channelId.value) {
      loadError.value = t('embedPublish.missingChannel')
      return
    }

    const initialToken = String(route.query.token || '') || parseEmbedTokenFromLocation()
    if (initialToken) {
      await bootstrap(initialToken)
      return
    }

    if (window.parent !== window) {
      awaitingToken.value = true
      postEmbedBootstrapRequest(channelId.value)
      return
    }

    loadError.value = t('embedPublish.missingChannel')
  }

  // 注册后，api/embed 的每个会话请求都能在 Token 失效时自行换新并重试。
  registerEmbedTokenRefresher(ensureFreshToken)

  onMounted(() => {
    start()
  })

  onUnmounted(() => {
    removeHostListener?.()
    removeLocaleListener?.()
    removeTokenListener?.()
    if (tokenRefreshTimer) {
      clearInterval(tokenRefreshTimer)
      tokenRefreshTimer = null
    }
    registerEmbedTokenRefresher(null)
  })

  return {
    token,
    config,
    sessionId,
    sessionSig,
    visitorId,
    loadError,
    rateLimited,
    awaitingToken,
    bootstrapping,
    hostContext,
    startNewSession,
    markRateLimited,
  }
}
