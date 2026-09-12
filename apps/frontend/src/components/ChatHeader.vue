<template>
  <header class="chat-header" :class="{ 'is-editing': titleEditing, 'is-docked': hasReferencesPanel }">
    <form
      v-if="titleEditing"
      class="chat-header__edit"
      @submit.prevent="submitTitleEdit"
      @click.stop
    >
      <input
        ref="titleInputRef"
        v-model="titleDraft"
        class="chat-header__edit-input"
        :maxlength="SESSION_TITLE_MAX_LENGTH"
        :disabled="busyAction === 'rename'"
        :placeholder="t('chatHeader.renamePlaceholder')"
        @keydown.esc.prevent="cancelTitleEdit"
        @blur="submitTitleEdit"
      />
    </form>
    <h1
      v-else
      class="chat-header__title"
      :title="displayTitle"
      @dblclick="startTitleEdit"
    >
      <t-icon v-if="session?.is_pinned" name="pin" size="12px" class="chat-header__pin" />
      <span class="chat-header__title-text">{{ displayTitle }}</span>
    </h1>
  </header>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { renameSession } from './sessionMutations'
import { normalizeSessionTitleDraft, SESSION_TITLE_MAX_LENGTH } from './sessionTitleEdit'

interface ChatHeaderSession {
  id: string
  title?: string
  description?: string
  tenant_id?: number | string
  is_pinned?: boolean
}

const props = defineProps<{
  session: ChatHeaderSession | null
  hasReferencesPanel?: boolean
}>()

const { t } = useI18n()
const busyAction = ref('')
const titleEditing = ref(false)
const titleDraft = ref('')
const titleInputRef = ref<HTMLInputElement | null>(null)

const displayTitle = computed(() => props.session?.title?.trim() || t('menu.newSession'))

function startTitleEdit(): void {
  if (!props.session || busyAction.value) return
  titleDraft.value = props.session.title || ''
  titleEditing.value = true
  nextTick(() => {
    titleInputRef.value?.focus()
    titleInputRef.value?.select()
  })
}

function cancelTitleEdit(): void {
  titleEditing.value = false
  titleDraft.value = ''
}

async function submitTitleEdit(): Promise<void> {
  // Enter 会先触发 form submit，随后 input blur 再进一次；必须同步退出编辑态防重入。
  if (!titleEditing.value || busyAction.value) return
  const session = props.session
  if (!session) {
    cancelTitleEdit()
    return
  }

  const title = normalizeSessionTitleDraft(titleDraft.value)
  const currentTitle = normalizeSessionTitleDraft(session.title || '')
  titleEditing.value = false
  titleDraft.value = ''
  if (!title || title === currentTitle) return

  busyAction.value = 'rename'
  try {
    await renameSession(session.id, title, session.description || '')
    MessagePlugin.success(t('menu.renameSessionSuccess'))
  } catch {
    MessagePlugin.error(t('menu.renameSessionFailed'))
  } finally {
    busyAction.value = ''
  }
}
</script>

<style scoped lang="less">
.chat-header {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 6;
  display: inline-flex;
  align-items: center;
  gap: 2px;
  max-width: min(280px, calc(100% - 24px));
  min-width: 0;
  padding: 2px 2px 2px 8px;
  border-radius: 8px;
  box-sizing: border-box;
  background: color-mix(in srgb, var(--td-bg-color-container) 88%, transparent);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  pointer-events: auto;

  &.is-editing {
    max-width: min(360px, calc(100% - 24px));
    padding: 2px;
  }

  @media (min-width: 960px) {
    &.is-docked {
      position: relative;
      top: auto;
      left: auto;
      align-self: stretch;
      z-index: 5;
      flex-shrink: 0;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 10px 12px;
      border-radius: 0;
      border-bottom: 1px solid var(--td-component-stroke);
      background: var(--td-bg-color-container);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-sizing: border-box;
      transition: border-color 0.3s cubic-bezier(0.22, 0.61, 0.36, 1);

      &.is-editing {
        max-width: none;
        padding: 8px 12px;
      }
    }
  }
}

.chat-header__edit {
  flex: 1 1 auto;
  min-width: 0;
  width: 240px;
  max-width: 100%;
}

.chat-header__edit-input {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--td-brand-color);
  border-radius: 5px;
  color: var(--td-text-color-primary);
  background: var(--td-bg-color-container);
  font-size: 14px;
  line-height: 26px;
  outline: none;
  box-sizing: border-box;
  box-shadow: 0 0 0 2px var(--td-brand-color-light);

  &:disabled {
    opacity: 0.7;
  }
}

.chat-header__title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  margin: 0;
  padding: 0;
  color: var(--td-text-color-secondary);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  cursor: default;
}

.chat-header__title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header__pin {
  flex: 0 0 auto;
  color: var(--td-text-color-placeholder);
}
</style>
