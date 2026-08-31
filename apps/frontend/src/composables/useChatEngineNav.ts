import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ChatEngine, useChatEngineStore } from '@/stores/chatEngine'
import { useChatThreadsStore } from '@harness/stores/chatThreads'
import { isNewChatRouteName } from './chatEngineRoutes'

export { isNewChatRouteName } from './chatEngineRoutes'

export function useChatEngineNav() {
  const store = useChatEngineStore()
  const route = useRoute()
  const router = useRouter()

  const isRuntimeChatRoute = computed(() =>
    route.path === '/platform/harness/chat' || route.path.startsWith('/platform/harness/chat/'),
  )

  const isPlatformChatRoute = computed(() => {
    const name = route.name
    return name === 'chat' || name === 'globalCreatChat' || name === 'kbCreatChat'
  })

  const isChatSurface = computed(() => isRuntimeChatRoute.value || isPlatformChatRoute.value)
  const isNewChatRoute = computed(() => isNewChatRouteName(route.name))

  const syncFromRoute = () => {
    if (isRuntimeChatRoute.value) {
      store.setEngine('runtime')
      const threadId = route.params.thread_id
      if (typeof threadId === 'string' && threadId) {
        store.setLastRuntimeThreadId(threadId)
      }
      return
    }
    if (isPlatformChatRoute.value) {
      store.setEngine('platform')
      const chatId = route.params.chatid
      if (typeof chatId === 'string' && chatId) {
        store.setLastPlatformChatId(chatId)
      }
    }
  }

  const goToEngine = (engine: ChatEngine) => {
    const alreadyOnEngine = engine === 'runtime' ? isRuntimeChatRoute.value : isPlatformChatRoute.value
    store.setEngine(engine)
    if (alreadyOnEngine) return
    if (engine === 'runtime') {
      const threadId = store.lastRuntimeThreadId
      if (threadId) {
        void router.push({ name: 'harnessChat', params: { thread_id: threadId } })
        return
      }
      void router.push({ name: 'harnessCreatChat' })
      return
    }
    const chatId = store.lastPlatformChatId
    void router.push(chatId ? `/platform/chat/${chatId}` : '/platform/creatChat')
  }

  const goToNewChat = () => {
    const useRuntime = isRuntimeChatRoute.value || (!isPlatformChatRoute.value && store.engine === 'runtime')
    if (useRuntime) {
      store.setEngine('runtime')
      store.setLastRuntimeThreadId('')
      useChatThreadsStore().setCurrentThreadId(null)
      void router.push({ name: 'harnessCreatChat' })
      return
    }
    store.setEngine('platform')
    store.setLastPlatformChatId('')
    void router.push('/platform/creatChat')
  }

  const setHistoryEngine = (engine: ChatEngine) => {
    if (isChatSurface.value) {
      goToEngine(engine)
      return
    }
    if (store.engine === engine) return
    store.setEngine(engine)
  }

  return {
    engine: computed(() => store.engine),
    isRuntime: computed(() => store.engine === 'runtime'),
    isChatSurface,
    isRuntimeChatRoute,
    isPlatformChatRoute,
    isNewChatRoute,
    syncFromRoute,
    goToEngine,
    goToNewChat,
    setHistoryEngine,
  }
}
