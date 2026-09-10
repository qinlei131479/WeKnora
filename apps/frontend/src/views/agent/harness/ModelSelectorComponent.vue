<template>
  <div v-if="resolvedSize !== 'nano'" class="runtime-model-selector-select">
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
  <t-popup
    v-else
    class="runtime-model-selector"
    trigger="click"
    placement="bottom-left"
    :visible="dropdownOpen"
    :disabled="props.disabled"
    :destroy-on-close="false"
    overlay-class-name="runtime-model-selector-popup"
    overlay-inner-class-name="runtime-model-selector-popup-inner"
    attach="body"
    @visible-change="handleOpenChange"
  >
    <div class="model-select" :class="modelSelectClasses">
      <div class="model-select-content">
        <div class="model-info">
          <span class="model-text text" :title="displayModelTitle">{{ displayModelText }}</span>
          <button
            v-if="props.clearable && props.model_spec && !props.disabled"
            type="button"
            class="model-clear-btn"
            :title="t('agent.runtimeManage.modelSelector.clear')"
            @mousedown.prevent.stop
            @click.stop="handleClear"
          >
            <X :size="14" />
          </button>
        </div>
      </div>
    </div>
    <template #content>
      <div class="model-dropdown" @click.stop>
        <div class="model-search">
          <t-input
            v-model="modelSearchKeyword"
            :placeholder="t('agent.runtimeManage.modelSelector.searchPlaceholder')"
            clearable
            autocomplete="off"
            autocapitalize="none"
            autocorrect="off"
            spellcheck="false"
            @keydown.stop
          >
            <template #suffix>
              <button
                type="button"
                :disabled="props.disabled || state.refreshingCache"
                :title="
                  state.refreshingCache
                    ? t('agent.runtimeManage.modelSelector.refreshingCache')
                    : t('agent.runtimeManage.modelSelector.refreshCache')
                "
                class="cache-refresh-button"
                @mousedown.prevent.stop
                @click.stop="refreshCache"
              >
                <RefreshCw :size="13" :class="{ spin: state.refreshingCache }" />
              </button>
            </template>
          </t-input>
        </div>
        <div class="scrollable-menu">
          <div v-if="loadingV2Models" class="model-menu-status">
            {{ t('agent.runtimeManage.modelSelector.loading') }}
          </div>
          <div v-else-if="!hasFilteredModels" class="model-menu-status">
            {{ t('agent.runtimeManage.modelSelector.empty') }}
          </div>
          <template v-else>
            <div
              v-for="(providerData, providerId) in filteredV2Models"
              :key="`v2-${providerId}`"
              class="model-provider-group"
            >
              <div class="model-provider-title" :title="providerId">
                {{ getProviderDisplayName(providerId, providerData) }}
              </div>
              <button
                v-for="model in providerData.models"
                :key="model.spec"
                type="button"
                class="model-option-item"
                :class="{ selected: model.spec === props.model_spec }"
                @click="handleSelectV2Model(model.spec)"
              >
                <div class="model-option">
                  <span class="model-option-name">{{ model.display_name }}</span>
                  <div class="model-option-signals">
                    <t-tooltip
                      v-if="getModelInfo(model).vision"
                      :content="t('agent.runtimeManage.modelSelector.vision')"
                    >
                      <span
                        class="model-signal-icon"
                        role="img"
                        :aria-label="t('agent.runtimeManage.modelSelector.vision')"
                      >
                        <Eye :size="13" />
                      </span>
                    </t-tooltip>
                    <t-tooltip
                      v-if="getModelInfo(model).isOneMillionContext"
                      :content="t('agent.runtimeManage.modelSelector.oneMillionContext')"
                    >
                      <span class="model-context-badge">1M</span>
                    </t-tooltip>
                  </div>
                </div>
              </button>
            </div>
          </template>
        </div>
        <div
          v-if="!modelMetadataNoticeDismissed && ((userStore.isAdmin && !weknoraManaged) || hasModelMetadata)"
          class="model-metadata-source"
        >
          <div class="model-metadata-source-content">
            <template v-if="userStore.isAdmin && !weknoraManaged">
              {{ t('agent.runtimeManage.modelSelector.noModelHint') }}
              <RouterLink :to="{ path: '/platform/agents', query: { surface: 'runtime' } }" @click.stop>
                {{ t('agent.runtimeManage.modelSelector.configureModels') }}
              </RouterLink>
            </template>
            <template v-if="hasModelMetadata">
              <span v-if="userStore.isAdmin"> </span>
              {{ t('agent.runtimeManage.modelSelector.metadataPrefix') }}
              <a href="https://models.dev" target="_blank" rel="noreferrer" @click.stop
                >models.dev</a
              >
              {{ t('agent.runtimeManage.modelSelector.metadataSuffix') }}
            </template>
          </div>
          <button
            type="button"
            class="model-metadata-source-close"
            :title="t('agent.runtimeManage.modelSelector.dismissNotice')"
            :aria-label="t('agent.runtimeManage.modelSelector.closeNotice')"
            @click.stop="dismissModelMetadataNotice"
          >
            <X :size="13" />
          </button>
        </div>
      </div>
    </template>
  </t-popup>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import { modelProviderApi } from '@harness/apis/system_api'
import { Eye, RefreshCw, X } from 'lucide-vue-next'
import { useUserStore } from '@harness/stores/user'
import { useUIStore } from '@/stores/ui'
import { loadModelMetadataCatalog, resolveModelDisplayMetadata } from '@harness/utils/modelMetadata'

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
const userStore = useUserStore()
const uiStore = useUIStore()
const ADD_MODEL_VALUE = '__add_model__'
const placeholderText = computed(
  () => props.placeholder || t('agent.runtimeManage.modelSelector.placeholder')
)
const MODEL_METADATA_NOTICE_DISMISSED_KEY = 'yuxi_model_metadata_notice_dismissed'

// v2 模型数据：每次展开下拉时实时从后端拉取
const v2Models = ref({})
const weknoraManaged = ref(false)
const loadingV2Models = ref(false)
const dropdownOpen = ref(false)
const modelSearchKeyword = ref('')
const modelMetadataBySpec = ref({})
const modelMetadataNoticeDismissed = ref(
  localStorage.getItem(MODEL_METADATA_NOTICE_DISMISSED_KEY) === 'true'
)
let fetchV2ModelsPromise = null

const dismissModelMetadataNotice = () => {
  modelMetadataNoticeDismissed.value = true
  localStorage.setItem(MODEL_METADATA_NOTICE_DISMISSED_KEY, 'true')
}

const filteredV2Models = computed(() => {
  const keyword = modelSearchKeyword.value.trim().toLowerCase()
  if (!keyword) return v2Models.value

  return Object.entries(v2Models.value).reduce((result, [providerId, providerData]) => {
    const models = (providerData.models || []).filter((model) => {
      return [
        providerId,
        getProviderDisplayName(providerId, providerData),
        model.spec,
        model.model_id,
        model.name,
        model.display_name
      ].some((value) =>
        String(value || '')
          .toLowerCase()
          .includes(keyword)
      )
    })

    if (models.length) {
      result[providerId] = { ...providerData, models }
    }

    return result
  }, {})
})

const hasFilteredModels = computed(() => {
  return Object.values(filteredV2Models.value).some((providerData) => providerData.models?.length)
})

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

const hasModelMetadata = computed(() => Object.keys(modelMetadataBySpec.value).length > 0)

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

const getProviderDisplayName = (providerId, providerData = {}) => {
  return (
    providerData.provider_display_name ||
    providerData.display_name ||
    providerData.name ||
    providerId
  )
}

// 拉取 v2 模型列表
const fetchV2Models = async () => {
  if (fetchV2ModelsPromise) return fetchV2ModelsPromise

  loadingV2Models.value = true
  fetchV2ModelsPromise = (async () => {
    try {
      const catalogRequest = loadModelMetadataCatalog().catch((error) => {
        console.warn('Failed to load model metadata catalog:', error)
        return null
      })
      const response = await modelProviderApi.getV2Models('chat')
      if (response.success) {
        v2Models.value = response.data || {}
        weknoraManaged.value = Boolean(response.weknora_managed)
        const catalog = await catalogRequest
        modelMetadataBySpec.value = catalog
          ? buildModelMetadataBySpec(v2Models.value, catalog.providers)
          : {}
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

const buildModelMetadataBySpec = (modelsByProvider, providers) => {
  return Object.entries(modelsByProvider).reduce((result, [providerId, providerData]) => {
    for (const model of providerData.models || []) {
      const info = resolveModelDisplayMetadata(providers, providerId, model)
      if (info.matched) result[model.spec] = info
    }
    return result
  }, {})
}

const getModelInfo = (model) => modelMetadataBySpec.value[model.spec] || {}

// 下拉展开前先刷新模型列表，避免弹层打开后再因数据加载发生高度跳变。
const handleOpenChange = async (open) => {
  if (props.disabled) {
    dropdownOpen.value = false
    return
  }

  if (!open) {
    dropdownOpen.value = false
    return
  }

  await fetchV2Models()
  if (!props.disabled) {
    dropdownOpen.value = true
  }
}

// 强制刷新缓存
const refreshCache = async () => {
  if (props.disabled || state.refreshingCache) return
  state.refreshingCache = true
  try {
    await modelProviderApi.refreshModelCache()
    // 刷新后重新拉取模型列表
    await fetchV2Models()
  } catch (error) {
    console.error('Failed to refresh cache:', error)
  } finally {
    state.refreshingCache = false
  }
}

// 状态管理
const state = reactive({
  refreshingCache: false
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

.runtime-model-selector-select {
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

.runtime-model-selector {
  display: inline-block;
  max-width: 100%;
  vertical-align: middle;
}

// 缓存刷新按钮
.cache-refresh-button {
  font-size: 12px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background-color: transparent;
  border: none;
  outline: none;
  color: var(--gray-400);
  cursor: pointer;
  transition: color 0.15s ease;

  &:hover:not(:disabled) {
    color: var(--gray-600);
  }
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
}

.model-select--nano:hover {
  color: var(--gray-900);
  background: var(--gray-50);
}

.model-select--nano .model-text {
  color: currentColor;
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

.model-dropdown {
  width: min(360px, calc(100vw - 24px));
  padding: 8px 0;
  overflow: hidden;
  background: var(--gray-0);
  border-radius: 8px;
  box-shadow: 0 0 18px rgba(0, 0, 0, 0.1);
}

.model-search {
  padding: 8px;
}

.model-search :deep(.t-input) {
  border-color: var(--gray-0);
  background: var(--gray-25);
}

.scrollable-menu {
  max-height: 260px;
  overflow-y: auto;
}

.model-menu-status {
  padding: 10px 12px;
  color: var(--gray-500);
  font-size: 13px;
}

.model-provider-group {
  padding: 4px 0;
}

.model-provider-title {
  padding: 6px 12px 4px;
  overflow: hidden;
  color: var(--gray-500);
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-option-item {
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--gray-50);
  }

  &.selected {
    color: var(--gray-1000);
    background: var(--main-50);
  }
}

.model-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
}

.model-option-name {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: var(--gray-1000);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-option-signals {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
  color: var(--gray-500);
}

.model-context-badge {
  display: inline-flex;
  align-items: center;
  height: 17px;
  padding: 0 5px;
  border-radius: 4px;
  color: var(--gray-600);
  background: var(--gray-100);
  font-size: 10px;
  font-weight: 600;
}

.model-signal-icon {
  display: inline-flex;
  align-items: center;
}

.model-metadata-source {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 7px 10px;
  border-top: 1px solid var(--gray-100);
  color: var(--gray-500);
  background: var(--gray-25);
  font-size: 11px;
  line-height: 16px;

  a {
    color: var(--main-600);
  }
}

.model-metadata-source-content {
  flex: 1;
  min-width: 0;
}

.model-metadata-source-close {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin: -2px -3px 0 0;
  padding: 0;
  border: none;
  border-radius: 4px;
  color: var(--gray-500);
  background: transparent;
  cursor: pointer;
  transition:
    color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    color: var(--gray-800);
    background: var(--gray-100);
  }

  &:focus-visible {
    outline: 2px solid var(--main-400);
    outline-offset: 1px;
  }
}
</style>

<style lang="less">
.runtime-model-selector-popup-inner.t-popup__content,
.runtime-model-selector-popup-inner {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>
