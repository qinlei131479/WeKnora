import MessageProcessor, { type Message } from '@/utils/harness/messageProcessor'
import { enrichTaskToolCalls } from '@/components/harness/ToolCallingResult/toolRegistry'

interface DisplayMessageItem {
  type: 'message'
  key: string
  message: Message
  sourceIndex: number
}

interface DisplayToolGroupItem {
  type: 'tool-group'
  key: string
  toolCalls: unknown[]
}

type DisplayItem = DisplayMessageItem | DisplayToolGroupItem

const hasVisibleAssistantBody = (message: Message | null | undefined): boolean => {
  if (!message || message.type !== 'ai') return true

  const { content, reasoningContent } = MessageProcessor.parseAssistantMessageBody(message)
  return Boolean(
    content ||
    reasoningContent ||
    message.error_type ||
    message.extra_metadata?.error_type ||
    message.isStoppedByUser
  )
}

const defaultEnrichToolCalls = (message: Message | null | undefined): unknown[] =>
  enrichTaskToolCalls(message?.tool_calls) as unknown[]

// 将 AI 消息拆成“正文块”和“工具块”，再跨消息合并相邻工具块。
export const getConversationDisplayItems = (
  conv: { messages: Message[] } | null | undefined,
  { enrichToolCalls = defaultEnrichToolCalls }: { enrichToolCalls?: (message: Message) => unknown[] } = {}
): DisplayItem[] => {
  if (!Array.isArray(conv?.messages) || conv.messages.length === 0) return []

  const items: DisplayItem[] = []
  let pendingToolGroup: DisplayToolGroupItem | null = null

  const flushToolGroup = (): void => {
    if (pendingToolGroup && pendingToolGroup.toolCalls.length > 0) {
      items.push(pendingToolGroup)
    }
    pendingToolGroup = null
  }

  conv.messages.forEach((message, index) => {
    if (message.type !== 'ai') {
      flushToolGroup()
      items.push({
        type: 'message',
        key: message.id || `message-${index}`,
        message,
        sourceIndex: index
      })
      return
    }

    if (hasVisibleAssistantBody(message)) {
      flushToolGroup()
      items.push({
        type: 'message',
        key: message.id || `message-${index}`,
        message,
        sourceIndex: index
      })
    }

    const toolCalls = enrichToolCalls(message)
    if (toolCalls.length === 0) return

    if (!pendingToolGroup) {
      pendingToolGroup = {
        type: 'tool-group',
        key: `tool-group-${message.id || index}`,
        toolCalls: []
      }
    }
    pendingToolGroup.toolCalls.push(...toolCalls)
  })

  flushToolGroup()
  return items
}
