<template>
  <div class="font-size-select">
    <button
      type="button"
      :title="t('font.fontSize')"
      :aria-label="t('font.fontSize')"
      @click="toggleMenu"
    >
      <span class="link-text">{{ currentLabel }}</span>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
        stroke-linecap="round">
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <div v-if="menuVisible" class="font-size-dropdown">
      <div
        v-for="opt in sizeOptions"
        :key="opt.value"
        class="font-size-option"
        :class="{ active: currentSize === opt.value }"
        @click="selectSize(opt.value)"
      >
        <span class="font-size-label">{{ opt.label }}</span>
        <span v-if="currentSize === opt.value" class="check-icon">✓</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFont, type FontSizeKey } from '@/composables/useFont'

const { t } = useI18n()
const { currentSize, setFontSize } = useFont()
const menuVisible = ref(false)

const sizeOptions = computed(() => ([
  { value: 'small' as const, label: t('font.size.small') },
  { value: 'normal' as const, label: t('font.size.normal') },
  { value: 'large' as const, label: t('font.size.large') },
]))

const currentLabel = computed(() =>
  sizeOptions.value.find((opt) => opt.value === currentSize.value)?.label
  ?? t('font.size.normal'),
)

const toggleMenu = () => {
  menuVisible.value = !menuVisible.value
}

const selectSize = (size: FontSizeKey) => {
  if (size !== currentSize.value) {
    setFontSize(size)
  }
  menuVisible.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.font-size-select')) {
    menuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="less" scoped>
.font-size-select {
  position: relative;
  flex-shrink: 0;
}

button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 32px;
  padding: 0 8px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--td-text-color-secondary);
  font-size: 13px;
  font-family: var(--app-font-family);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  .link-text {
    line-height: 1;
  }

  svg:last-child {
    flex-shrink: 0;
  }

  &:hover {
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-primary);
  }
}

.font-size-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 1000;
}

.font-size-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: pointer;
  font-size: 13px;
  font-family: var(--app-font-family);
  color: var(--td-text-color-primary);

  .font-size-label {
    flex: 1;
  }

  .check-icon {
    color: var(--td-success-color);
    font-weight: 700;
    font-size: 14px;
    flex-shrink: 0;
  }

  &:hover {
    background: var(--td-bg-color-secondarycontainer);
  }

  &.active {
    background: var(--td-success-color-light);
    color: var(--td-brand-color-active);
  }
}
</style>

<style lang="less">
html[theme-mode="dark"] {
  .font-size-dropdown {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
}
</style>
