import type { ComputedRef, Ref } from 'vue'

/**
 * `chatWork.js` 是纯 JS Store（历史遗留，内部依赖的 `@harness/*` 目录被
 * tsconfig 排除在类型检查之外），这里只补充被 `.ts` 文件消费到的最小类型，
 * 避免 `useChatEngineNav.ts` 等 TS 文件在 `vue-tsc` 下报 TS7016
 * （隐式 any / 找不到模块声明）。内部实现细节仍以 chatWork.js 为准。
 */
export interface ChatWorkThread {
  id: string
  title?: string
  is_pinned?: boolean
  agent_id?: string
  [key: string]: unknown
}

export function useChatThreadsStore(): {
  threads: Ref<ChatWorkThread[]>
  currentThreadId: Ref<string | null>
  currentThread: ComputedRef<ChatWorkThread | null>
  hasMoreThreads: Ref<boolean>
  isLoadingMoreThreads: Ref<boolean>
  setCurrentThreadId: (threadId: string | null) => void
  upsertThread: (thread: ChatWorkThread) => void
  loadThreads: (agentId?: string | null) => Promise<ChatWorkThread[]>
  loadMoreThreads: (agentId?: string | null) => Promise<void>
  createThread: (
    agentId: string,
    title?: string,
    metadata?: Record<string, unknown>
  ) => Promise<ChatWorkThread | null>
  deleteThread: (threadId: string) => Promise<void>
  updateThread: (
    threadId: string,
    title?: string | null,
    isPinned?: boolean,
    toolApprovalMode?: string
  ) => Promise<ChatWorkThread | undefined>
}
