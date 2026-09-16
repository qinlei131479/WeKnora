<template>
  <div class="font-size-select">
    <button
      ref="triggerRef"
      type="button"
      :title="t('font.fontSize')"
      :aria-label="t('font.fontSize')"
      @click.stop="toggleMenu"
    >
      <span class="link-text">{{ currentLabel }}</span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>

    <Teleport to="body">
      <div
        v-if="menuVisible"
        class="font-size-dropdown"
        :style="dropdownStyle"
        @click.stop
      >
        <div
          v-for="option in sizeOptions"
          :key="option.value"
          class="font-size-option"
          :class="{ active: currentSize === option.value }"
          @click="selectSize(option.value)"
        >
          <span class="font-size-label">{{ option.label }}</span>
          <span v-if="currentSize === option.value" class="check-icon">✓</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useFont, type FontSizeKey } from '@/composables/useFont'
import { cssViewportSize, getRootZoom, rectToCssPx } from '@/utils/zoom'

const { t } = useI18n()
const { currentSize, setFontSize } = useFont()
const menuVisible = ref(false)
const triggerRef = ref<HTMLButtonElement | null>(null)
const dropdownStyle = ref<Record<string, string>>({})

const sizeOptions = computed(() => [
  { value: 'small' as const, label: t('font.size.small') },
  { value: 'normal' as const, label: t('font.size.normal') },
  { value: 'large' as const, label: t('font.size.large') },
])

const currentLabel = computed(() =>
  sizeOptions.value.find((option) => option.value === currentSize.value)?.label
  ?? t('font.size.normal'),
)

const positionDropdown = () => {
  const element = triggerRef.value
  if (!element) return
  const zoom = getRootZoom()
  const rect = rectToCssPx(element.getBoundingClientRect(), zoom)
  const { width: viewportWidth } = cssViewportSize(zoom)
  dropdownStyle.value = {
    position: 'fixed',
    top: `${Math.round(rect.bottom + 8)}px`,
    right: `${Math.round(viewportWidth - rect.right)}px`,
    zIndex: '10000',
  }
}

const toggleMenu = () => {
  menuVisible.value = !menuVisible.value
  if (menuVisible.value) {
    nextTick(positionDropdown)
  }
}

const selectSize = (size: FontSizeKey) => {
  if (size !== currentSize.value) {
    setFontSize(size)
  }
  menuVisible.value = false
}

const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (!target.closest('.font-size-select') && !target.closest('.font-size-dropdown')) {
    menuVisible.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  window.addEventListener('resize', positionDropdown)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
  window.removeEventListener('resize', positionDropdown)
})
</script>

<style lang="less" scoped>
.font-size-select {
  position: relative;
  flex-shrink: 0;
  z-index: 110;
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
  position: fixed;
  min-width: 120px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 10000;
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
    font-size: 14px;
    font-weight: 700;
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
