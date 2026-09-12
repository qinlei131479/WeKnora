<script setup>
import { onMounted, onBeforeMount, onUnmounted, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@harness/stores/user'
import { useAgentStore } from '@harness/stores/agent'
import { useChatThreadsStore } from '@/stores/chatWork'
import { useThemeStore } from '@harness/stores/theme'
import { useDatabaseStore } from '@harness/stores/database'
import { useConfigStore } from '@harness/stores/config'
import { useInfoStore } from '@harness/stores/info'
import { useTaskerStore } from '@harness/stores/tasker'
import TaskCenterDrawer from '@harness/components/TaskCenterDrawer.vue'

const HARNESS_THEME_CLASS = 'harness-theme'
const HARNESS_DARK_CLASS = 'harness-dark'

const router = useRouter()
const userStore = useUserStore()
const agentStore = useAgentStore()
const chatThreadsStore = useChatThreadsStore()
const themeStore = useThemeStore()
const databaseStore = useDatabaseStore()
const configStore = useConfigStore()
const infoStore = useInfoStore()
const taskerStore = useTaskerStore()
const booting = ref(true)

const rootClass = computed(() => ({
  'harness-root': true,
  dark: themeStore.isDark
}))

const syncOverlayTheme = () => {
  document.body.classList.add(HARNESS_THEME_CLASS)
  document.body.classList.toggle(HARNESS_DARK_CLASS, !!themeStore.isDark)
}

onBeforeMount(syncOverlayTheme)
watch(() => themeStore.isDark, syncOverlayTheme)

onUnmounted(() => {
  document.body.classList.remove(HARNESS_THEME_CLASS, HARNESS_DARK_CLASS)
})

onMounted(async () => {
  try {
    userStore.syncToken()
    if (!userStore.token) {
      router.replace({ path: '/login', query: { redirect: window.location.pathname + window.location.search } })
      return
    }
    await userStore.getCurrentUser()
    await Promise.all([
      infoStore.loadInfoConfig().catch(() => {}),
      databaseStore.loadDatabases().catch(() => {}),
      configStore.refreshConfig().catch(() => {})
    ])
    if (!agentStore.isInitialized) {
      await agentStore.initialize().catch(() => {})
    }
    await chatThreadsStore.loadThreads().catch(() => {})
    if (userStore.isAdmin) {
      taskerStore.loadTasks()
    }
  } finally {
    booting.value = false
  }
})
</script>

<template>
  <div class="harness-shell">
    <div :class="rootClass">
      <div v-if="booting" class="harness-root-body" />
      <div v-else-if="!userStore.token" class="harness-root-body" />
      <template v-else>
        <div class="harness-root-body">
          <slot />
        </div>
        <TaskCenterDrawer />
      </template>
    </div>
  </div>
</template>

<style>
.harness-shell,
.harness-root {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
.harness-root-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.harness-root-body > * {
  flex: 1;
  min-height: 0;
}
</style>
