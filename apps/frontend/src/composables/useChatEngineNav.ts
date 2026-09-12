import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { type ChatEngine, useChatEngineStore } from '@/stores/chatEngine'
import { useChatThreadsStore } from '@/stores/chatWork'
import { isNewChatRouteName } from './chatEngineRoutes'

export { isNewChatRouteName } from './chatEngineRoutes'

export function useChatEngineNav() {
  const store = useChatEngineStore()
  const route = useRoute()
  const router = useRouter()

  const isChatWorkRoute = computed(() =>
    route.path === '/platform/chat-work' ||
    route.path.startsWith('/platform/chat-work/') ||
    route.path === '/platform/work-chat' ||
    route.path.startsWith('/platform/work-chat/') ||
    route.path === '/platform/harness/chat' ||
    route.path.startsWith('/platform/harness/chat/'),
  )

  const isPlatformChatRoute = computed(() => {
    const name = route.name
    return name === 'chat' || name === 'globalCreatChat' || name === 'kbCreatChat'
  })

  const isChatSurface = computed(() => isChatWorkRoute.value || isPlatformChatRoute.value)
  const isNewChatRoute = computed(() => isNewChatRouteName(route.name))

  const syncFromRoute = () => {
    if (isChatWorkRoute.value) {
      store.setEngine('chat-work')
      const threadId = route.params.thread_id
      if (typeof threadId === 'string' && threadId) {
        store.setLastChatWorkThreadId(threadId)
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
    const alreadyOnEngine = engine === 'chat-work' ? isChatWorkRoute.value : isPlatformChatRoute.value
    store.setEngine(engine)
    if (alreadyOnEngine) return
    if (engine === 'chat-work') {
      const threadId = store.lastChatWorkThreadId
      if (threadId) {
        void router.push({ name: 'chatWork', params: { thread_id: threadId } })
        return
      }
      void router.push({ name: 'chatWorkCreat' })
      return
    }
    const chatId = store.lastPlatformChatId
    void router.push(chatId ? `/platform/chat/${chatId}` : '/platform/creatChat')
  }

  const goToNewChat = () => {
    const useChatWork = isChatWorkRoute.value || (!isPlatformChatRoute.value && store.engine === 'chat-work')
    if (useChatWork) {
      store.setEngine('chat-work')
      store.setLastChatWorkThreadId('')
      useChatThreadsStore().setCurrentThreadId(null)
      void router.push({ name: 'chatWorkCreat' })
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
    isChatWork: computed(() => store.engine === 'chat-work'),
    isChatSurface,
    isChatWorkRoute,
    isPlatformChatRoute,
    isNewChatRoute,
    syncFromRoute,
    goToEngine,
    goToNewChat,
    setHistoryEngine,
  }
}
