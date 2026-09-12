import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ChatEngine = 'platform' | 'chat-work'

const ENGINE_KEY = 'weknora_chat_engine'
const PLATFORM_CHAT_KEY = 'weknora_last_platform_chat'
const CHAT_WORK_THREAD_KEY = 'weknora_last_chat_work_thread'
const LEGACY_RUNTIME_THREAD_KEY = 'weknora_last_runtime_thread'

function readEngine(): ChatEngine {
  const raw = localStorage.getItem(ENGINE_KEY)
  return raw === 'chat-work' || raw === 'runtime' ? 'chat-work' : 'platform'
}

function readLastChatWorkThreadId(): string {
  return localStorage.getItem(CHAT_WORK_THREAD_KEY) || localStorage.getItem(LEGACY_RUNTIME_THREAD_KEY) || ''
}

export const useChatEngineStore = defineStore('chatEngine', () => {
  const engine = ref<ChatEngine>(readEngine())
  const lastPlatformChatId = ref(localStorage.getItem(PLATFORM_CHAT_KEY) || '')
  const lastChatWorkThreadId = ref(readLastChatWorkThreadId())

  const isChatWork = computed(() => engine.value === 'chat-work')

  const setEngine = (next: ChatEngine) => {
    engine.value = next
    localStorage.setItem(ENGINE_KEY, next)
  }

  const setLastPlatformChatId = (id: string) => {
    lastPlatformChatId.value = id
    if (id) localStorage.setItem(PLATFORM_CHAT_KEY, id)
    else localStorage.removeItem(PLATFORM_CHAT_KEY)
  }

  const setLastChatWorkThreadId = (id: string) => {
    lastChatWorkThreadId.value = id
    localStorage.removeItem(LEGACY_RUNTIME_THREAD_KEY)
    if (id) localStorage.setItem(CHAT_WORK_THREAD_KEY, id)
    else localStorage.removeItem(CHAT_WORK_THREAD_KEY)
  }

  return {
    engine,
    isChatWork,
    lastPlatformChatId,
    lastChatWorkThreadId,
    setEngine,
    setLastPlatformChatId,
    setLastChatWorkThreadId,
  }
})
