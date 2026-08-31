<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useChatThreadsStore } from '@harness/stores/chatThreads'
import ConversationNavSection from '@harness/components/ConversationNavSection.vue'

const router = useRouter()
const route = useRoute()
const chatThreadsStore = useChatThreadsStore()
const { threads, currentThreadId, hasMoreThreads, isLoadingMoreThreads } = storeToRefs(chatThreadsStore)

onMounted(async () => {
  if (!threads.value.length) {
    await chatThreadsStore.loadThreads().catch(() => {})
  }
})

const handleSelectChat = (threadId) => {
  if (!threadId) return
  chatThreadsStore.setCurrentThreadId(threadId)
  router.push({ name: 'harnessChat', params: { thread_id: threadId } })
}

const handleDeleteChat = async (threadId) => {
  if (!threadId) return
  await chatThreadsStore.deleteThread(threadId)
  if (route.params.thread_id === threadId) {
    await router.replace({ name: 'harnessCreatChat' })
  }
}

const handleRenameChat = async ({ chatId, title }) => {
  await chatThreadsStore.updateThread(chatId, title)
}

const handleTogglePinChat = async (threadId) => {
  const thread = threads.value.find((item) => item.id === threadId)
  if (!thread) return
  await chatThreadsStore.updateThread(threadId, null, !thread.is_pinned)
  await chatThreadsStore.loadThreads()
}

const handleLoadMore = () => chatThreadsStore.loadMoreThreads()

const activeChatId = computed(() => {
  if (route.name !== 'harnessChat') return null
  return currentThreadId.value || route.params.thread_id || null
})
</script>

<template>
  <ConversationNavSection
    :chats-list="threads"
    :current-chat-id="activeChatId"
    :has-more-chats="hasMoreThreads"
    :is-loading-more="isLoadingMoreThreads"
    :show-history="true"
    :collapsed="false"
    @select-chat="handleSelectChat"
    @delete-chat="handleDeleteChat"
    @rename-chat="handleRenameChat"
    @toggle-pin="handleTogglePinChat"
    @load-more-chats="handleLoadMore"
  />
</template>
