<template>
  <div class="chat-work-history-nav">
    <div class="session-list-row session-list-row--flat timeline_header">
      <span class="session-list-row__body timeline_header-label">{{ t('harness.history.recent') }}</span>
    </div>
    <div v-if="!sortedChats.length" class="submenu_empty">{{ t('harness.history.empty') }}</div>
    <div
      v-for="chat in sortedChats"
      :key="chat.id"
      class="submenu_item_p session-chat-row"
      :class="{ 'session-chat-row--active': chat.id === activeChatId }"
    >
      <div class="session-list-row session-list-row--flat">
        <div class="session-list-row__body">
          <SessionSidebarRow
            :item="rowItem(chat)"
            :batch-mode="false"
            :active-path="activePath"
            :selected-ids="[]"
            :menu-options="menuOptions(chat)"
            @navigate="handleSelectChat(chat.id)"
            @menu-click="handleMenuClick($event, chat)"
            @rename-submit="handleRenameChat(chat.id, $event.title)"
          />
        </div>
      </div>
    </div>
    <div v-if="hasMoreThreads" class="session-list-loading session-list-row session-list-row--flat">
      <span class="session-list-row__body">
        <t-button variant="text" size="small" :loading="isLoadingMoreThreads" @click="handleLoadMore">
          {{ isLoadingMoreThreads ? t('common.loading') : t('harness.history.loadMore') }}
        </t-button>
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Icon as TIcon } from 'tdesign-icons-vue-next'
import SessionSidebarRow from '@/components/SessionSidebarRow.vue'
import { useChatThreadsStore } from '@/stores/chatWork'
import { parseToShanghai } from '@/utils/harness/time'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()
const chatThreadsStore = useChatThreadsStore()
const { threads, currentThreadId, hasMoreThreads, isLoadingMoreThreads } = storeToRefs(chatThreadsStore)

onMounted(async () => {
  if (!threads.value.length) {
    await chatThreadsStore.loadThreads().catch(() => {})
  }
})

const sortedChats = computed(() => {
  return [...threads.value].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1
    const dateA = parseToShanghai(a.created_at)
    const dateB = parseToShanghai(b.created_at)
    if (!dateA || !dateB) return 0
    return dateB.diff(dateA)
  })
})

const activeChatId = computed(() => {
  if (route.name !== 'chatWork') return null
  return currentThreadId.value || route.params.thread_id || null
})

const activePath = computed(() => {
  const id = activeChatId.value
  return id ? `/platform/chat-work/${id}` : ''
})

const rowItem = (chat) => ({
  id: chat.id,
  title: chat.title || t('menu.newSession'),
  path: `/platform/chat-work/${chat.id}`,
  is_pinned: !!chat.is_pinned,
})

const menuOptions = (chat) => [
  chat.is_pinned
    ? { content: t('menu.unpin'), value: 'unpin', prefixIcon: () => h(TIcon, { name: 'pin-filled', size: '16px' }) }
    : { content: t('menu.pin'), value: 'pin', prefixIcon: () => h(TIcon, { name: 'pin', size: '16px' }) },
  { content: t('menu.renameSession'), value: 'rename', prefixIcon: () => h(TIcon, { name: 'edit-1', size: '16px' }) },
  { content: t('upload.deleteRecord'), value: 'delete', theme: 'error', prefixIcon: () => h(TIcon, { name: 'delete', size: '16px' }) },
]

const handleSelectChat = (threadId) => {
  if (!threadId) return
  chatThreadsStore.setCurrentThreadId(threadId)
  router.push({ name: 'chatWork', params: { thread_id: threadId } })
}

const handleDeleteChat = async (threadId) => {
  if (!threadId) return
  await chatThreadsStore.deleteThread(threadId)
  if (route.params.thread_id === threadId) {
    await router.replace({ name: 'chatWorkCreat' })
  }
}

const handleRenameChat = async (chatId, title) => {
  await chatThreadsStore.updateThread(chatId, title)
}

const handleTogglePinChat = async (threadId) => {
  const thread = threads.value.find((item) => item.id === threadId)
  if (!thread) return
  await chatThreadsStore.updateThread(threadId, null, !thread.is_pinned)
  await chatThreadsStore.loadThreads()
}

const handleMenuClick = ({ value }, chat) => {
  if (value === 'pin' || value === 'unpin') {
    void handleTogglePinChat(chat.id)
    return
  }
  if (value === 'delete') {
    void handleDeleteChat(chat.id)
  }
}

const handleLoadMore = () => chatThreadsStore.loadMoreThreads()
</script>