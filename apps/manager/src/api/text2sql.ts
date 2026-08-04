import type { SseEvent } from '@/types/text2sql'
import { getToken } from '@/utils/auth'

const BASE_API = import.meta.env.VITE_APP_BASE_API || ''
const STREAM_URL = `${BASE_API}/channel/web/conversation/chat-stream`
const CANCEL_URL = `${BASE_API}/channel/web/conversation/stream/cancel`

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = getToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const SERVICE_UNAVAILABLE_MSG = '智能体执行服务暂不可用，请稍后重试'

function parseSseBlock(block: string): SseEvent | null {
  const lines = block.split('\n')
  let event = 'text'
  let data = ''
  for (const line of lines) {
    if (line.startsWith('event:')) event = line.slice(6).trim()
    if (line.startsWith('data:')) data = line.slice(5).trim()
  }
  if (data === '[DONE]') return { type: 'end' }
  if (!data) return null
  try {
    if (event === 'end') {
      const parsed = JSON.parse(data) as { text?: string }
      return { type: 'end', text: parsed.text }
    }
    if (event === 'text' || event === 'error') {
      const parsed = JSON.parse(data) as { text?: string }
      return { type: 'text', text: parsed.text ?? '' }
    }
    if (event === 'tool') {
      const parsed = JSON.parse(data) as { tool?: string }
      return { type: 'tool', tool: parsed.tool ?? '' }
    }
    if (event === 'skill') {
      const parsed = JSON.parse(data) as { skill?: string }
      return { type: 'skill', skill: parsed.skill ?? '' }
    }
    if (event === 'stats') {
      const parsed = JSON.parse(data) as Record<string, unknown>
      return { type: 'stats', stats: parsed }
    }
  } catch {
    return event === 'end' ? { type: 'end' } : null
  }
  return null
}

export interface StreamChatParams {
  query: string
  conversationId: string
  requestId: string
  clientToken: string
}

export async function streamChat(
  params: StreamChatParams,
  onEvent: (ev: SseEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const resp = await fetch(STREAM_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(params),
    signal,
  })
  if (!resp.ok || !resp.body) {
    const message = await resolveStreamHttpError(resp)
    throw new Error(message)
  }
  const reader = resp.body.getReader()
  const decoder = new TextDecoder()
  let buf = ''
  let receivedContent = false
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buf += decoder.decode(value, { stream: true })
    const blocks = buf.split('\n\n')
    buf = blocks.pop() ?? ''
    for (const block of blocks) {
      const ev = parseSseBlock(block.trim())
      if (ev) {
        if (ev.type === 'text' && ev.text) receivedContent = true
        onEvent(ev)
      }
    }
  }
  if (!receivedContent) {
    onEvent({ type: 'text', text: SERVICE_UNAVAILABLE_MSG })
    onEvent({ type: 'end' })
  }
}

async function resolveStreamHttpError(resp: Response): Promise<string> {
  if (resp.status >= 500 || resp.status === 503) {
    return SERVICE_UNAVAILABLE_MSG
  }
  const contentType = resp.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    try {
      const body = (await resp.json()) as { msg?: string; message?: string }
      const msg = body.msg ?? body.message
      if (msg) return msg
    } catch {
      // ignore parse failure
    }
  }
  return `流式请求失败 (${resp.status})`
}

export async function cancelStream(conversationId: string, requestId: string): Promise<void> {
  await fetch(CANCEL_URL, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ conversationId, requestId }),
  })
}
