<template>
  <div v-if="resolvedSize !== 'nano'" class="work-model-selector-select">
    <t-select
      :value="props.model_spec || undefined"
      :placeholder="placeholderText"
      :disabled="props.disabled"
      :loading="loadingV2Models"
      :clearable="props.clearable"
      filterable
      style="width: 100%"
      @change="handleFormModelChange"
      @popup-visible-change="handleSelectPopupVisible"
    >
      <t-option
        v-for="model in flatV2Models"
        :key="model.spec"
        :value="model.spec"
        :label="modelSelectLabel(model)"
      >
        <div class="select-model-option">
          <t-icon name="check-circle-filled" class="select-model-icon" />
          <span class="select-model-name">{{ modelSelectLabel(model) }}</span>
          <span v-if="modelSelectRawName(model)" class="select-model-raw">{{ modelSelectRawName(model) }}</span>
        </div>
      </t-option>
      <t-option
        v-if="!props.disabled"
        :value="ADD_MODEL_VALUE"
        :label="t('model.addModelInSettings')"
        class="add-model-option"
      >
        <div class="select-model-option add">
          <t-icon name="add" class="select-add-icon" />
          <span class="select-model-name">{{ t('model.addModelInSettings') }}</span>
        </div>
      </t-option>
    </t-select>
  </div>
  <div v-else class="work-model-selector">
    <div
      ref="modelButtonRef"
      class="model-select"
      :class="[modelSelectClasses, { open: dropdownOpen }]"
      @click.stop="toggleNanoDropdown"
    >
      <div class="model-select-content">
        <div class="model-info">
          <span class="model-text text" :title="displayModelTitle">{{ displayModelText }}</span>
          <ChevronDown :size="12" class="model-dropdown-arrow" :class="{ rotate: dropdownOpen }" />
          <button
            v-if="props.clearable && props.model_spec && !props.disabled"
            type="button"
            class="model-clear-btn"
            :title="t('agent.workManage.modelSelector.clear')"
            @mousedown.prevent.stop
            @click.stop="handleClear"
          >
            <X :size="14" />
          </button>
        </div>
      </div>
    </div>
    <Teleport to="body">
      <div v-if="dropdownOpen" class="model-selector-overlay" @click="dropdownOpen = false">
        <div class="model-selector-dropdown" :style="modelDropdownStyle" @click.stop>
          <div class="model-selector-header">
            <span>{{ t('conversationSettings.models.chatGroupLabel') }}</span>
            <button class="model-selector-add" type="button" @click="handleAddModel">
              <span class="add-icon">+</span>
              <span class="add-text">{{ t('input.addModel') }}</span>
            </button>
          </div>
          <div class="model-selector-content">
            <div v-if="loadingV2Models" class="model-option empty">
              {{ t('agent.workManage.modelSelector.loading') }}
            </div>
            <template v-else>
              <div
                v-for="model in flatV2Models"
                :key="model.spec"
                class="model-option"
                :class="{ selected: model.spec === props.model_spec }"
                @click="handleSelectV2Model(model.spec)"
              >
                <div class="model-option-left">
                  <div class="model-option-icon">
                    <t-icon name="chat" size="14px" />
                  </div>
                  <div class="model-option-name-wrap">
                    <span class="model-option-name">{{ modelSelectLabel(model) }}</span>
                    <span v-if="model.display_name" class="model-option-raw-name">{{ model.name }}</span>
                  </div>
                </div>
              </div>
              <div v-if="!flatV2Models.length" class="model-option empty">
                {{ t('input.noModel') }}
              </div>
            </template>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { modelProviderApi } from '@harness/apis/system_api'
import { ChevronDown, X } from 'lucide-vue-next'
import { useUIStore } from '@/stores/ui'
import { getRootZoom, rectToCssPx, cssViewportSize } from '@/utils/zoom'

const props = defineProps({
  model_spec: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'small',
    validator: (value) => ['nano', 'small', 'middle', 'large'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  clearable: {
    type: Boolean,
    default: false
  },
  displayName: {
    type: String,
    default: 'full',
    validator: (value) => ['full', 'short', 'mini'].includes(value)
  }
})

const emit = defineEmits(['select-model'])
const { t } = useI18n()
const uiStore = useUIStore()
const ADD_MODEL_VALUE = '__add_model__'
const placeholderText = computed(
  () => props.placeholder || t('agent.workManage.modelSelector.placeholder')
)
// v2 模型数据：每次展开下拉时实时从后端拉取
const v2Models = ref({})
const loadingV2Models = ref(false)
const dropdownOpen = ref(false)
const modelButtonRef = ref(null)
const modelDropdownStyle = ref({})
let fetchV2ModelsPromise = null

const flatV2Models = computed(() => {
  const list = []
  for (const [providerId, providerData] of Object.entries(v2Models.value || {})) {
    for (const model of providerData.models || []) {
      if (!model?.spec) continue
      list.push({
        ...model,
        providerId
      })
    }
  }
  return list
})

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const isUuidLike = (value) => UUID_RE.test(String(value || '').trim())

const modelSelectLabel = (model) => {
  const alias = String(model.display_name || '').trim()
  const name = String(model.name || '').trim()
  if (alias && !isUuidLike(alias)) return alias
  if (name && !isUuidLike(name)) return name
  return alias || name || ''
}

const modelSelectRawName = (model) => {
  const alias = String(model.display_name || '').trim()
  const name = String(model.name || '').trim()
  if (!alias || !name || isUuidLike(name) || name === alias) return ''
  return name
}

// spec -> 展示名映射。WeKnora 管理模式下 model.spec 是模型 UUID（保证可以精确
// 解析到唯一模型，见 resolve_weknora_model），不再是可读的 "provider:model"
// 字符串。UUID 本身不能用来展示，必须回查一次拉到的模型列表拿 display_name，
// 否则用户选完模型后，输入框里显示的就是一串 UUID（look 一眼完全不知道选的是
// 什么模型）。
const specDisplayNameMap = computed(() => {
  const map = {}
  for (const providerData of Object.values(v2Models.value)) {
    for (const model of providerData.models || []) {
      if (model?.spec) {
        map[model.spec] = modelSelectLabel(model) || model.spec
      }
    }
  }
  return map
})

const fetchV2Models = async () => {
  if (fetchV2ModelsPromise) return fetchV2ModelsPromise

  loadingV2Models.value = true
  fetchV2ModelsPromise = (async () => {
    try {
      const response = await modelProviderApi.getV2Models('chat')
      if (response.success) {
        v2Models.value = response.data || {}
      }
    } catch (error) {
      console.warn('Failed to load v2 models:', error)
    } finally {
      loadingV2Models.value = false
      fetchV2ModelsPromise = null
    }
  })()

  return fetchV2ModelsPromise
}

const toggleNanoDropdown = async () => {
  if (props.disabled) return
  if (dropdownOpen.value) {
    dropdownOpen.value = false
    return
  }
  await fetchV2Models()
  if (props.disabled) return
  dropdownOpen.value = true
}

const handleAddModel = () => {
  dropdownOpen.value = false
  uiStore.openSettings('models', 'llm')
}

const updateModelDropdownPosition = () => {
  const anchor = modelButtonRef.value
  if (!anchor) return
  const zoom = getRootZoom()
  const rect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: vw, height: vh } = cssViewportSize(zoom)
  const dropdownWidth = 280
  const offsetY = 8
  let left = Math.floor(rect.left)
  left = Math.max(16, Math.min(Math.max(16, vw - dropdownWidth - 16), left))
  const preferredDropdownHeight = 280
  const minDropdownHeight = 160
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  if (spaceBelow >= minDropdownHeight + offsetY) {
    modelDropdownStyle.value = {
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
  modelDropdownStyle.value = {
    position: 'fixed',
    width: `${dropdownWidth}px`,
    left: `${left}px`,
    bottom: `${vh - rect.top + offsetY}px`,
    maxHeight: `${availableHeight >= preferredDropdownHeight ? preferredDropdownHeight : Math.max(minDropdownHeight, availableHeight)}px`,
    zIndex: '10001'
  }
}

watch(dropdownOpen, (open) => {
  if (!open) return
  nextTick(() => {
    updateModelDropdownPosition()
    requestAnimationFrame(() => updateModelDropdownPosition())
  })
})

const handleSelectPopupVisible = (visible) => {
  if (visible) fetchV2Models()
}

const handleFormModelChange = (value) => {
  if (props.disabled) return
  if (value === ADD_MODEL_VALUE) {
    uiStore.openSettings('models', 'llm')
    return
  }
  emit('select-model', typeof value === 'string' ? value : '')
}

const resolvedSize = computed(() => props.size || 'small')
const modelSelectClasses = computed(() => ({
  'model-select--nano': resolvedSize.value === 'nano',
  'model-select--middle': resolvedSize.value === 'middle',
  'model-select--large': resolvedSize.value === 'large',
  'model-select--disabled': props.disabled
}))

const extractModelName = (spec) => {
  const separatorIndex = spec.indexOf(':')
  return separatorIndex >= 0 ? spec.slice(separatorIndex + 1) : spec
}

const displayModelText = computed(() => {
  const spec = props.model_spec
  if (!spec) return placeholderText.value

  // 优先用已拉取的模型列表把 spec 换成人类可读的 display_name。命中即用，
  // 不再区分 full/short/mini —— UUID 没有可切分的 "provider:model" 结构，
  // 展示模式差异只对旧式字符串 spec 有意义（见下面的兜底分支）。
  const knownName = specDisplayNameMap.value[spec]
  if (knownName) {
    if (props.displayName === 'mini') {
      return knownName.includes('/') ? knownName.split('/').pop() : knownName
    }
    return knownName
  }

  // 兜底：尚未拉到模型列表，或者是遗留的 "provider:model" 风格 spec（非
  // WeKnora 管理模式）。这种情况下 spec 本身是可读的，按原逻辑裁剪展示。
  const modelName = extractModelName(spec)
  if (props.displayName === 'mini') {
    return modelName.includes('/') ? modelName.split('/').pop() : modelName
  }
  if (props.displayName === 'short') return modelName
  return spec
})

// 悬浮提示保留原始 spec（UUID 或 provider:model），方便复制/核对，展示文案
// 走 displayModelText。
const displayModelTitle = computed(() => props.model_spec || placeholderText.value)

// 预取一次模型列表，这样即使用户还没点开下拉框，已保存的 model_spec（如
// agent 配置里存的 WeKnora UUID）也能立刻显示成可读名称，而不是等到下次
// 打开下拉框才补上映射。
onMounted(() => {
  fetchV2Models()
})

// 选择 v2 模型的方法
const handleSelectV2Model = (spec) => {
  if (props.disabled) return
  emit('select-model', spec)
  dropdownOpen.value = false
}

// 清空选择
const handleClear = () => {
  if (props.disabled) return
  emit('select-model', '')
  dropdownOpen.value = false
}
</script>

<style lang="less" scoped>
@import '@harness/assets/css/model-selector-common.less';

.work-model-selector-select {
  width: 100%;
}

.select-model-option {
  display: flex;
  align-items: center;
  gap: 8px;

  .select-model-icon {
    font-size: 14px;
    color: var(--td-brand-color);
  }

  .select-add-icon {
    font-size: 14px;
    color: var(--td-brand-color);
  }

  .select-model-name {
    flex: 0 1 auto;
    min-width: 0;
    font-size: 13px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .select-model-raw {
    flex: 1;
    min-width: 0;
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &.add {
    .select-model-name {
      color: var(--td-brand-color);
      font-weight: 500;
    }
  }
}

.work-model-selector {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

.model-select--nano {
  max-width: 100%;
  height: 30px;
  padding: 6px 8px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1;
  color: var(--gray-600);
  background: transparent;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    color: var(--gray-900);
    background: var(--gray-50);
  }

  .model-text {
    color: currentColor;
  }
}

.model-dropdown-arrow {
  flex-shrink: 0;
  color: var(--td-text-color-placeholder, #999);
  transition: transform 0.12s;

  &.rotate {
    transform: rotate(180deg);
  }
}

.model-clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--gray-400);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--gray-700);
    background: var(--gray-100);
  }
}

.model-select--disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

</style>

<style lang="less">
.model-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: transparent;
  touch-action: none;
}

.model-selector-dropdown {
  position: fixed !important;
  z-index: 10000;
  background: var(--td-bg-color-container);
  border: 0.5px solid var(--td-component-border);
  border-radius: 10px;
  box-shadow: var(--td-shadow-2);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  margin: 0 !important;
  padding: 0 !important;
  transform: none !important;
  transform-origin: top left;
  animation: modelSelectorFadeIn 0.15s ease-out;
}

@keyframes modelSelectorFadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.model-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-bottom: 0.5px solid var(--td-component-stroke);
  background: var(--td-bg-color-container);
  font-size: 12px;
  font-weight: 500;
  color: var(--td-text-color-secondary);
}

.model-selector-content {
  flex: 1;
  min-height: 0;
  max-height: 260px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 6px 8px;
}

.model-selector-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 6px;
  border: 0.5px solid transparent;
  background: transparent;
  color: var(--td-brand-color);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;

  .add-icon {
    font-size: 14px;
    line-height: 1;
    font-weight: 400;
  }

  &:hover {
    color: var(--td-brand-color-hover);
    background: var(--td-bg-color-secondarycontainer);
  }
}

.model-selector-dropdown .model-option {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 6px;
  margin-bottom: 4px;

  &:last-child {
    margin-bottom: 0;
  }

  &:hover,
  &.selected {
    background: var(--td-bg-color-secondarycontainer);
  }

  &.empty {
    color: var(--td-text-color-placeholder);
    cursor: default;
    text-align: center;
    padding: 20px 8px;
    font-size: 12px;

    &:hover {
      background: transparent;
    }
  }
}

.model-option-left {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.model-option-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--td-text-color-secondary);
}

.model-option-name-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  flex: 1;
}

.model-option-name {
  font-size: 12px;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.4;
}

.model-option-raw-name {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  flex-shrink: 0;
}
</style>
