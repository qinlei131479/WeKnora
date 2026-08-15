<template>
  <div
    class="theme-toggle"
    role="radiogroup"
    :aria-label="t('theme.theme')"
    :title="t('theme.theme')"
  >
    <span class="theme-toggle-slider" :class="{ 'is-dark': isDark }" />
    <button
      type="button"
      role="radio"
      :aria-checked="!isDark"
      :class="{ active: !isDark }"
      @click="selectTheme('light')"
    >
      {{ t('theme.light') }}
    </button>
    <button
      type="button"
      role="radio"
      :aria-checked="isDark"
      :class="{ active: isDark }"
      @click="selectTheme('dark')"
    >
      {{ t('theme.dark') }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTheme, type ThemeMode } from '@/composables/useTheme'

const { t } = useI18n()
const { currentTheme, setTheme } = useTheme()

const isDark = computed(() => {
  if (currentTheme.value === 'dark') return true
  if (currentTheme.value === 'light') return false
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-color-scheme: dark)').matches
})

const selectTheme = (mode: ThemeMode) => {
  if (mode === currentTheme.value) return
  setTheme(mode)
}
</script>

<style lang="less" scoped>
.theme-toggle {
  position: relative;
  display: inline-flex;
  align-items: stretch;
  height: 32px;
  padding: 2px;
  border-radius: 8px;
  background: var(--td-bg-color-secondarycontainer);
  flex-shrink: 0;
  user-select: none;
}

.theme-toggle-slider {
  position: absolute;
  top: 2px;
  left: 2px;
  width: calc(50% - 2px);
  height: calc(100% - 4px);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  pointer-events: none;

  &.is-dark {
    transform: translateX(100%);
  }
}

button {
  position: relative;
  z-index: 1;
  min-width: 44px;
  padding: 0 10px;
  border: none;
  background: transparent;
  color: var(--td-text-color-secondary);
  font-size: 12px;
  font-family: var(--app-font-family);
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;

  &.active {
    color: var(--td-text-color-primary);
    font-weight: 600;
  }
}
</style>
