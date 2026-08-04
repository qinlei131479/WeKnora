export type MessageRole = 'user' | 'assistant'

/** H5 对话可选的智能体终端 */
export interface Text2SqlClientOption {
  clientToken: string
  label: string
}

export const TEXT2SQL_CLIENT_OPTIONS: Text2SqlClientOption[] = [
  { clientToken: "e974dd97-104a-46e4-94aa-984c9984f7cf", label: '测试H5（误删）-2' },
  { clientToken: "2950d6f7-48ea-448e-8049-44a345bee4b6", label: '泽大哥的H5页面对话-22' },
  { clientToken: "6b191ac0-d288-4428-aa9a-42d83a38452e", label: '融媒体数字智能体机器人-23' },
]

export interface ChatMessage {
  id: string
  role: MessageRole
  content?: string
  createdAt: string
  streaming?: boolean
}

export interface ChatSession {
  /** 会话 ID，即 API 的 conversationId，同一会话内保持不变 */
  id: string
  title: string
  createdAt: string
  updatedAt: string
  messages: ChatMessage[]
}

export type SseEvent =
  | { type: 'text'; text: string }
  | { type: 'tool'; tool: string }
  | { type: 'skill'; skill: string }
  | { type: 'stats'; stats: Record<string, unknown> }
  /** end 可携带 harness 规范化后的完整正文 */
  | { type: 'end'; text?: string }
