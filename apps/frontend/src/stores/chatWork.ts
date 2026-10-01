import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { threadApi } from '@/api/chat-work/agent'
import { handleChatError } from '@/utils/harness/errorHandler'

const PAGE_SIZE = 100

interface ChatThread {
  id: string
  title?: string
  is_pinned?: boolean
  tool_approval_mode?: string
  [key: string]: unknown
}

// 按 id 去重，保留首次出现的顺序。后端分页会重复返回置顶项，
// 且列表与「加载更多」可能并发写入，这里统一保证 threads 内 id 唯一。
const dedupeById = (list: ChatThread[]): ChatThread[] => {
  const seen = new Set<string>()
  return list.filter((item) => {
    if (!item?.id || seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

export const useChatThreadsStore = defineStore('chatThreads', () => {
  const threads = ref<ChatThread[]>([])
  const currentThreadId = ref<string | null>(null)
  const hasMoreThreads = ref(true)
  const isLoadingMoreThreads = ref(false)

  const currentThread = computed<ChatThread | null>(() => {
    if (!currentThreadId.value) return null
    return threads.value.find((thread) => thread.id === currentThreadId.value) || null
  })

  const setCurrentThreadId = (threadId: string | null | undefined) => {
    currentThreadId.value = threadId || null
  }

  const upsertThread = (thread: ChatThread) => {
    if (!thread?.id) return
    const index = threads.value.findIndex((item) => item.id === thread.id)
    if (index >= 0) {
      threads.value[index] = { ...threads.value[index], ...thread }
      return
    }
    threads.value = [thread, ...threads.value]
  }

  const loadThreads = async (agentId: string | null = null): Promise<ChatThread[]> => {
    try {
      const fetchedThreads = (await threadApi.getThreads(
        agentId,
        PAGE_SIZE,
        0
      )) as ChatThread[] | null
      // 整体替换前先按 id 去重，避免后端返回重复置顶项时列表出现重复 key。
      threads.value = fetchedThreads ? dedupeById(fetchedThreads) : []
      hasMoreThreads.value = Boolean(fetchedThreads && fetchedThreads.length >= PAGE_SIZE)
      if (
        currentThreadId.value &&
        !threads.value.find((thread) => thread.id === currentThreadId.value)
      ) {
        currentThreadId.value = null
      }
      return threads.value
    } catch (error) {
      console.error('Failed to fetch threads:', error)
      handleChatError(error as Error, 'fetch')
      throw error
    }
  }

  const loadMoreThreads = async (agentId: string | null = null) => {
    if (isLoadingMoreThreads.value || !hasMoreThreads.value) return

    isLoadingMoreThreads.value = true
    try {
      const fetchedThreads = (await threadApi.getThreads(
        agentId,
        PAGE_SIZE,
        threads.value.length
      )) as ChatThread[] | null
      if (fetchedThreads && fetchedThreads.length > 0) {
        // 后端分页会重复返回置顶项，这里只追加列表中尚不存在的线程。
        const existingIds = new Set(threads.value.map((thread) => thread.id))
        const newThreads = fetchedThreads.filter((thread) => !existingIds.has(thread.id))
        threads.value = dedupeById([...threads.value, ...newThreads])
        hasMoreThreads.value = newThreads.length >= PAGE_SIZE
      } else {
        hasMoreThreads.value = false
      }
    } catch (error) {
      console.error('Failed to load more chats:', error)
      handleChatError(error as Error, 'fetch')
    } finally {
      isLoadingMoreThreads.value = false
    }
  }

  const createThread = async (
    agentId: string,
    title = '新的对话',
    metadata: Record<string, unknown> = {}
  ) => {
    if (!agentId) return null

    try {
      const thread = (await threadApi.createThread(agentId, title, metadata)) as ChatThread | null
      if (thread) {
        threads.value = [thread, ...threads.value.filter((item) => item.id !== thread.id)]
      }
      return thread
    } catch (error) {
      console.error('Failed to create thread:', error)
      handleChatError(error as Error, 'create')
      throw error
    }
  }

  const deleteThread = async (threadId: string) => {
    if (!threadId) return

    try {
      await threadApi.deleteThread(threadId)
      threads.value = threads.value.filter((thread) => thread.id !== threadId)
      if (currentThreadId.value === threadId) {
        currentThreadId.value = null
      }
    } catch (error) {
      console.error('Failed to delete thread:', error)
      handleChatError(error as Error, 'delete')
      throw error
    }
  }

  const updateThread = async (
    threadId: string,
    title: string | null,
    isPinned: boolean | undefined,
    toolApprovalMode: string | undefined
  ) => {
    if (!threadId) return

    const normalizedTitle = title ? String(title).replace(/\s+/g, ' ').trim().slice(0, 255) : null
    if (title && !normalizedTitle) return
    if (!normalizedTitle && isPinned === undefined && toolApprovalMode === undefined) return

    try {
      const updatedThread = (await threadApi.updateThread(
        threadId,
        normalizedTitle,
        isPinned,
        toolApprovalMode
      )) as ChatThread
      upsertThread(updatedThread)
      return updatedThread
    } catch (error) {
      console.error('Failed to update thread:', error)
      handleChatError(error as Error, 'update')
      throw error
    }
  }

  return {
    threads,
    currentThreadId,
    currentThread,
    hasMoreThreads,
    isLoadingMoreThreads,
    setCurrentThreadId,
    upsertThread,
    loadThreads,
    loadMoreThreads,
    createThread,
    deleteThread,
    updateThread
  }
})
