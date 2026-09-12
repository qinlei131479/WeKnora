<template>
  <button
    ref="triggerRef"
    type="button"
    class="input-action-btn config-dropdown-trigger"
    :class="{ 'is-trusted': modelValue === 'always_trust', active: open }"
    :aria-label="currentOption.label"
    aria-haspopup="menu"
    :aria-expanded="open"
    @click.stop="toggleOpen"
  >
    <component
      :is="currentOption.icon"
      :size="16"
      class="config-dropdown-compact-icon"
      aria-hidden="true"
    />
    <span class="hide-text config-dropdown-text">{{ currentOption.label }}</span>
    <ChevronDown :size="15" class="config-dropdown-chevron" />
  </button>

  <Teleport to="body">
    <div v-if="open" class="agent-selector-overlay" @click="open = false">
      <div
        ref="panelRef"
        class="agent-selector-dropdown"
        :style="dropdownStyle"
        role="menu"
        :aria-label="t('agent.workManage.fields.tool_approval_mode.name')"
        @click.stop
      >
        <div class="agent-selector-header">
          <span>{{ t('agent.workManage.fields.tool_approval_mode.name') }}</span>
        </div>
        <div class="agent-selector-content">
          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            role="menuitemradio"
            :aria-checked="modelValue === option.value"
            class="agent-option"
            :class="{ selected: modelValue === option.value }"
            @click="selectMode(option.value)"
          >
            <component
              :is="option.icon"
              :size="15"
              class="agent-option-action-icon"
              :class="{ trusted: option.value === 'always_trust' }"
            />
            <span class="agent-option-name">{{ option.label }}</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, Hand, ShieldAlert } from 'lucide-vue-next'
import { getRootZoom, rectToCssPx, cssViewportSize } from '@/utils/zoom'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: String, default: 'default' }
})

const emit = defineEmits(['update:modelValue'])
const options = computed(() => [
  {
    value: 'default',
    label: t('agent.workManage.fields.tool_approval_mode.options.default'),
    icon: Hand
  },
  {
    value: 'always_trust',
    label: t('agent.workManage.fields.tool_approval_mode.options.always_trust'),
    icon: ShieldAlert
  }
])

const open = ref(false)
const triggerRef = ref(null)
const panelRef = ref(null)
const dropdownStyle = ref({})
const currentOption = computed(
  () => options.value.find((option) => option.value === props.modelValue) || options.value[0]
)

const updateDropdownPosition = () => {
  const anchor = triggerRef.value
  if (!anchor) return
  const zoom = getRootZoom()
  const rect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: vw, height: vh } = cssViewportSize(zoom)
  const dropdownWidth = 220
  const offsetY = 6
  let left = Math.floor(rect.left)
  left = Math.max(16, Math.min(Math.max(16, vw - dropdownWidth - 16), left))
  const preferredDropdownHeight = 200
  const minDropdownHeight = 80
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  if (spaceBelow >= minDropdownHeight + offsetY) {
    dropdownStyle.value = {
      position: 'fixed',
      width: `${dropdownWidth}px`,
      left: `${left}px`,
      top: `${Math.floor(rect.bottom + offsetY)}px`,
      maxHeight: `${Math.min(preferredDropdownHeight, spaceBelow - offsetY - 16)}px`,
      zIndex: '10001'
    }
    return
  }
  const availableHeight = spaceAbove - offsetY - 20
  dropdownStyle.value = {
    position: 'fixed',
    width: `${dropdownWidth}px`,
    left: `${left}px`,
    bottom: `${vh - rect.top + offsetY}px`,
    maxHeight: `${availableHeight >= preferredDropdownHeight ? preferredDropdownHeight : Math.max(minDropdownHeight, availableHeight)}px`,
    zIndex: '10001'
  }
}

const toggleOpen = () => {
  open.value = !open.value
}

watch(open, (visible) => {
  if (!visible) return
  nextTick(() => {
    updateDropdownPosition()
    requestAnimationFrame(() => updateDropdownPosition())
  })
})

const selectMode = (mode) => {
  emit('update:modelValue', mode)
  open.value = false
}
</script>

<style scoped lang="less">
.config-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: min(180px, calc(100vw - 160px));
  height: 28px;
  padding: 0 10px;
  gap: 4px;
  border: 0.5px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
  background: transparent;
  color: var(--td-text-color-secondary, #666);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover,
  &.active {
    background: var(--td-bg-color-secondarycontainer-hover, #e6e6e6);
  }

  &.is-trusted {
    color: var(--color-warning-700);
  }
}

.config-dropdown-trigger :deep(svg) {
  color: currentColor;
}

.config-dropdown-text {
  min-width: 0;
  overflow: hidden;
  color: currentColor;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.config-dropdown-chevron {
  flex-shrink: 0;
  color: currentColor;
}

.config-dropdown-compact-icon {
  display: none;
  flex-shrink: 0;
}

@container (max-width: 640px) {
  .config-dropdown-trigger {
    width: 30px;
    padding-inline: 0;
  }

  .config-dropdown-compact-icon {
    display: block;
  }

  .config-dropdown-text,
  .config-dropdown-chevron {
    display: none;
  }
}

.agent-option-action-icon.trusted {
  color: var(--color-warning-700);
}
</style>

<style lang="less">
.agent-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: transparent;
  touch-action: none;
}

.agent-selector-dropdown {
  position: fixed !important;
  background: var(--td-bg-color-container);
  border: 0.5px solid var(--td-component-border);
  border-radius: 8px;
  box-shadow: var(--td-shadow-2);
  display: flex;
  flex-direction: column;
  z-index: 10001;
  overflow: hidden;
  overflow-x: hidden;
  box-sizing: border-box;
}

.agent-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 36px;
  padding: 8px 12px;
  border-bottom: 0.5px solid var(--td-component-stroke);
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.agent-selector-content {
  min-width: 0;
  overflow-x: hidden;
  padding: 6px 4px 8px;
}

.agent-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  margin: 0 4px;
  padding: 6px 8px;
  border: none;
  box-sizing: border-box;
  width: calc(100% - 8px);
  max-width: calc(100% - 8px);
  min-width: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 5px;
  text-align: left;

  &:hover,
  &.selected {
    background: var(--td-bg-color-secondarycontainer);
  }
}

.agent-option-name {
  font-size: 12px;
  color: var(--td-text-color-primary);
  flex: 1;
  line-height: 22px;
}

.agent-option-action-icon {
  flex-shrink: 0;
  color: var(--td-text-color-secondary);
}
</style>
