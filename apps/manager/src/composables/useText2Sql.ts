import { computed, ref } from 'vue'
import { cancelStream, streamChat } from '@/api/text2sql'
import type { ChatMessage, ChatSession } from '@/types/text2sql'
import { TEXT2SQL_CLIENT_OPTIONS } from '@/types/text2sql'
import { generateConversationId, generateRequestId } from '@/utils/conversationId'
import { lightCleanAssistantResponse } from '@/utils/formatAssistantResponse'
import { getUniqId } from '@/utils/utils'

const SESSIONS_KEY = 'hb_agent_sessions'
const ACTIVE_KEY = 'hb_agent_active_session'
const CLIENT_KEY = 'hb_agent_client_token'
const DEFAULT_CLIENT_TOKEN = TEXT2SQL_CLIENT_OPTIONS[0]?.clientToken ?? ''

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSIONS_KEY)
    return raw ? (JSON.parse(raw) as ChatSession[]) : []
  } catch {
    return []
  }
}

function loadActiveId(): string | null {
  return localStorage.getItem(ACTIVE_KEY)
}

function loadSelectedClientToken(): string {
  const raw = localStorage.getItem(CLIENT_KEY)
  const token = raw || DEFAULT_CLIENT_TOKEN
  return TEXT2SQL_CLIENT_OPTIONS.some((o) => o.clientToken === token) ? token : DEFAULT_CLIENT_TOKEN
}

function persist(sessions: ChatSession[], activeId: string | null) {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
  if (activeId) localStorage.setItem(ACTIVE_KEY, activeId)
}

function deriveSessionTitle(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return '新会话'
  return trimmed.length > 20 ? `${trimmed.slice(0, 20)}…` : trimmed
}

export function useText2Sql() {
  const sessions = ref<ChatSession[]>(loadSessions())
  const activeId = ref<string | null>(loadActiveId())
  const selectedClientToken = ref(loadSelectedClientToken())
  const sending = ref(false)

  const clientOptions = TEXT2SQL_CLIENT_OPTIONS

  const selectedClient = computed(
    () => clientOptions.find((o) => o.clientToken === selectedClientToken.value) ?? clientOptions[0],
  )

  function setSelectedClientToken(clientToken: string) {
    selectedClientToken.value = clientToken
    localStorage.setItem(CLIENT_KEY, clientToken)
  }

  let abortController: AbortController | null = null
  let activeStream: { sessionId: string; assistantId: string; requestId: string } | null = null
  let stopped = false

  const activeSession = computed(
    () => sessions.value.find((s) => s.id === activeId.value) ?? null,
  )

  function touchSession(id: string) {
    const session = sessions.value.find((s) => s.id === id)
    if (!session) return
    session.updatedAt = new Date().toISOString()
    sessions.value.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    persist(sessions.value, activeId.value)
  }

  function createSession(): ChatSession {
    const now = new Date().toISOString()
    const session: ChatSession = {
      id: generateConversationId(),
      title: '新会话',
      createdAt: now,
      updatedAt: now,
      messages: [],
    }
    sessions.value.unshift(session)
    activeId.value = session.id
    persist(sessions.value, activeId.value)
    return session
  }

  function ensureActiveSession(): ChatSession {
    if (!sessions.value.length) return createSession()
    if (!activeId.value || !sessions.value.some((s) => s.id === activeId.value)) {
      activeId.value = sessions.value[0].id
      persist(sessions.value, activeId.value)
    }
    return sessions.value.find((s) => s.id === activeId.value)!
  }

  function selectSession(id: string) {
    activeId.value = id
    persist(sessions.value, activeId.value)
  }

  function deleteSession(id: string) {
    const idx = sessions.value.findIndex((s) => s.id === id)
    if (idx < 0) return
    sessions.value.splice(idx, 1)
    if (activeId.value === id) {
      if (sessions.value.length) {
        activeId.value = sessions.value[0].id
      } else {
        createSession()
      }
    }
    persist(sessions.value, activeId.value)
  }

  function appendMessage(sessionId: string, message: ChatMessage) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    session.messages.push(message)
    touchSession(sessionId)
  }

  function updateMessage(sessionId: string, messageId: string, patch: Partial<ChatMessage>) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const msg = session.messages.find((m) => m.id === messageId)
    if (!msg) return
    Object.assign(msg, patch)
    touchSession(sessionId)
  }

  function renameOnFirstMessage(sessionId: string, content: string) {
    const session = sessions.value.find((s) => s.id === sessionId)
    if (!session) return
    const userMsgs = session.messages.filter((m) => m.role === 'user')
    if (userMsgs.length === 1 && session.title === '新会话') {
      session.title = deriveSessionTitle(content)
      persist(sessions.value, activeId.value)
    }
  }

  function init() {
    if (!sessions.value.length) createSession()
    else ensureActiveSession()
  }

  async function send(content: string) {
    const text = content.trim()
    if (!text || sending.value) return

    const client = selectedClient.value
    if (!client) return

    const session = ensureActiveSession()
    const conversationId = session.id

    appendMessage(conversationId, {
      id: getUniqId(),
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    })
    renameOnFirstMessage(conversationId, text)

    const assistantId = getUniqId()
    const requestId = generateRequestId()
    appendMessage(conversationId, {
      id: assistantId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      streaming: true,
    })

    sending.value = true
    stopped = false
    abortController = new AbortController()
    activeStream = { sessionId: conversationId, assistantId, requestId }

    try {
      await streamChat(
        {
          query: text,
          conversationId,
          requestId,
          clientToken: client.clientToken,
        },
        (ev) => {
          if (stopped) return
          if (ev.type === 'text' && ev.text) {
            const current = activeSession.value?.messages.find((m) => m.id === assistantId)
            const prev = current?.content ?? ''
            updateMessage(conversationId, assistantId, {
              content: prev + lightCleanAssistantResponse(ev.text),
              streaming: true,
            })
          }
          if (ev.type === 'skill' && ev.skill) {
            const current = activeSession.value?.messages.find((m) => m.id === assistantId)
            const prev = current?.content ?? ''
            if (!prev.includes('正在读取技能书')) {
              updateMessage(conversationId, assistantId, {
                content: prev + `\n\n> 正在读取技能书：${ev.skill}\n\n`,
                streaming: true,
              })
            }
          }
          if (ev.type === 'end') {
            const current = activeSession.value?.messages.find((m) => m.id === assistantId)
            const prev = current?.content ?? ''
            updateMessage(conversationId, assistantId, {
              // END 携带 harness 规范化全文；Web 只做 Unicode 轻清理并覆盖流式累积文本。
              content: ev.text?.trim()
                ? lightCleanAssistantResponse(ev.text)
                : lightCleanAssistantResponse(prev),
              streaming: false,
            })
          }
        },
        abortController.signal,
      )
      if (!stopped) {
        updateMessage(conversationId, assistantId, { streaming: false })
      }
    } catch (e) {
      if (!stopped && (e as Error).name !== 'AbortError') {
        const errMsg = (e as Error).message || '请求失败，请重试'
        updateMessage(conversationId, assistantId, {
          content: errMsg,
          streaming: false,
        })
      }
    } finally {
      sending.value = false
      abortController = null
      activeStream = null
    }
  }

  async function stop() {
    if (!sending.value) return
    stopped = true

    if (activeStream) {
      cancelStream(activeStream.sessionId, activeStream.requestId).catch(() => {})
    }

    abortController?.abort()
    abortController = null

    if (activeStream) {
      const { sessionId, assistantId } = activeStream
      const msg = activeSession.value?.messages.find((m) => m.id === assistantId)
      const content = msg?.content?.trim() ? msg.content : '已停止生成'
      updateMessage(sessionId, assistantId, {
        content,
        streaming: false,
      })
      activeStream = null
    }
    sending.value = false
  }

  return {
    sessions,
    activeId,
    activeSession,
    sending,
    clientOptions,
    selectedClientToken,
    selectedClient,
    setSelectedClientToken,
    init,
    createSession,
    selectSession,
    deleteSession,
    send,
    stop,
  }
}
