import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

export type ChatEngine = 'platform' | 'runtime'

const ENGINE_KEY = 'weknora_chat_engine'
const PLATFORM_CHAT_KEY = 'weknora_last_platform_chat'
const RUNTIME_THREAD_KEY = 'weknora_last_runtime_thread'

function readEngine(): ChatEngine {
  return localStorage.getItem(ENGINE_KEY) === 'runtime' ? 'runtime' : 'platform'
}

export const useChatEngineStore = defineStore('chatEngine', () => {
  const engine = ref<ChatEngine>(readEngine())
  const lastPlatformChatId = ref(localStorage.getItem(PLATFORM_CHAT_KEY) || '')
  const lastRuntimeThreadId = ref(localStorage.getItem(RUNTIME_THREAD_KEY) || '')

  const isRuntime = computed(() => engine.value === 'runtime')

  const setEngine = (next: ChatEngine) => {
    engine.value = next
    localStorage.setItem(ENGINE_KEY, next)
  }

  const setLastPlatformChatId = (id: string) => {
    lastPlatformChatId.value = id
    if (id) localStorage.setItem(PLATFORM_CHAT_KEY, id)
    else localStorage.removeItem(PLATFORM_CHAT_KEY)
  }

  const setLastRuntimeThreadId = (id: string) => {
    lastRuntimeThreadId.value = id
    if (id) localStorage.setItem(RUNTIME_THREAD_KEY, id)
    else localStorage.removeItem(RUNTIME_THREAD_KEY)
  }

  return {
    engine,
    isRuntime,
    lastPlatformChatId,
    lastRuntimeThreadId,
    setEngine,
    setLastPlatformChatId,
    setLastRuntimeThreadId,
  }
})
