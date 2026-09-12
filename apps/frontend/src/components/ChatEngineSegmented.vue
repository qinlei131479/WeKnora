<template>
  <div
    class="chat-engine-segmented"
    :class="{ 'is-compact': size === 'compact', 'is-disabled': disabled }"
    role="tablist"
    :aria-label="t('chatEngine.switchLabel')"
    :aria-disabled="disabled ? 'true' : undefined"
    :title="disabled ? t('chatEngine.lockedHint') : undefined"
  >
    <button
      v-for="item in items"
      :key="item.value"
      type="button"
      role="tab"
      class="chat-engine-segmented__item"
      :class="{ 'is-active': modelValue === item.value }"
      :aria-selected="modelValue === item.value"
      :disabled="disabled"
      @click="onSelect(item.value)"
    >
      <t-icon :name="item.icon" :size="size === 'compact' ? '13px' : '15px'" />
      <span>{{ item.label }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ChatEngine } from '@/stores/chatEngine'

const props = defineProps<{
  modelValue: ChatEngine
  size?: 'default' | 'compact'
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: ChatEngine]
}>()

const { t } = useI18n()

const items = computed(() => [
  { value: 'platform' as const, label: t('chatEngine.platform'), icon: 'chat' },
  { value: 'chat-work' as const, label: t('chatEngine.chatWork'), icon: 'tools' },
])

const onSelect = (value: ChatEngine) => {
  if (props.disabled || value === props.modelValue) return
  emit('update:modelValue', value)
}
</script>

<style scoped lang="less">
.chat-engine-segmented {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  box-sizing: border-box;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  border-radius: 999px;
}

.chat-engine-segmented__item {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-height: 30px;
  height: 30px;
  gap: 6px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--td-text-color-primary);
  font-family: var(--app-font-family);
  font-size: 13px;
  font-weight: 500;
  line-height: 18px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  :deep(.t-icon) {
    flex-shrink: 0;
  }

  &:hover:not(.is-active):not(:disabled) {
    background: var(--td-bg-color-container-hover);
  }

  &.is-active {
    background: color-mix(in srgb, var(--td-brand-color) 12%, var(--td-bg-color-container));
    border-color: color-mix(in srgb, var(--td-brand-color) 45%, transparent);
    color: var(--td-brand-color);
  }

  &:disabled {
    cursor: not-allowed;
  }
}

.is-compact {
  display: flex;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  padding: 2px;
  background: var(--td-bg-color-secondarycontainer);

  .chat-engine-segmented__item {
    flex: 1;
    min-width: 0;
    min-height: 28px;
    height: 28px;
    justify-content: center;
    gap: 4px;
    padding: 0 6px;
    font-size: 12px;
    font-weight: 500;
    line-height: 16px;

    span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
}

.is-disabled {
  opacity: 0.72;
}
</style>
