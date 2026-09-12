<template>
  <div class="tools-cards-page extension-page-root">
    <PageShoulder :search-placeholder="t('ext.tools.searchPlaceholder')" v-model:search="searchQuery">
      <template #filters>
        <t-select
          v-model="selectedCategory"
          style="width: 120px"
          :placeholder="t('ext.tools.allCategories')"
          clearable
        >
          <t-option value="" :label="t('ext.tools.allCategories')" />
          <t-option v-for="cat in categories" :key="cat" :value="cat" :label="categoryLabels[cat] || cat" />
        </t-select>
      </template>
    </PageShoulder>

    <div class="extension-page-body">
    <div v-if="filteredTools.length === 0" class="extension-card-grid-empty-state">
      <t-empty :description="searchQuery ? t('ext.tools.emptySearch') : t('ext.tools.empty')" />
    </div>

    <ExtensionCardGrid v-else :min-width="240" :gap="12">
      <InfoCard
        v-for="tool in filteredTools"
        :key="getToolSlug(tool)"
        layout="kb"
        :title="formatExtensionCardTitle(tool.name)"
        :subtitle="getToolSlug(tool)"
        :description="tool.description || t('ext.tools.noDescription')"
        :default-icon="getToolIcon(getToolSlug(tool)) || WrenchIcon"
        :tags="toolTags(tool)"
        @click="selectTool(tool)"
      >
      </InfoCard>
    </ExtensionCardGrid>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="detailVisible && currentTool" class="tool-detail-overlay" @click.self="closeDetail">
          <div class="tool-detail-modal" role="dialog" aria-modal="true">
            <button type="button" class="close-btn" :aria-label="t('general.close')" @click="closeDetail">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              </svg>
            </button>

            <div class="tool-detail-body">
              <div class="section-header">
                <h2>{{ formatExtensionCardTitle(currentTool.name) || t('ext.tools.detail') }}</h2>
                <p class="section-description">
                  {{ formatToolRichText(currentTool.description) || t('ext.tools.noDescription') }}
                </p>
              </div>

              <div class="settings-group">
                <div v-if="currentTool.config_guide" class="setting-row setting-row--stack">
                  <div class="setting-info">
                    <label>{{ t('ext.tools.configGuide') }}</label>
                    <p class="desc config-guide">{{ currentTool.config_guide }}</p>
                  </div>
                </div>

                <div class="setting-row">
                  <div class="setting-info">
                    <label>{{ t('ext.tools.category') }}</label>
                  </div>
                  <div class="setting-control wk-chip-row">
                    <t-tag theme="success" size="small" variant="light-outline" class="wk-chip">
                      {{ categoryLabels[currentTool.category] || currentTool.category }}
                    </t-tag>
                  </div>
                </div>

                <div class="setting-row">
                  <div class="setting-info">
                    <label>{{ t('ext.tools.tags') }}</label>
                  </div>
                  <div class="setting-control wk-chip-row">
                    <t-tag
                      v-for="tag in currentTool.tags"
                      :key="tag"
                      size="small"
                      variant="light-outline"
                      class="wk-chip"
                    >{{ tag }}</t-tag>
                    <span v-if="!currentTool.tags?.length" class="setting-empty">{{ t('ext.tools.none') }}</span>
                  </div>
                </div>

                <div v-if="currentTool.args?.length" class="setting-row setting-row--stack">
                  <div class="setting-info">
                    <label>{{ t('ext.tools.args') }}</label>
                  </div>
                  <t-table
                    :data="currentTool.args"
                    :columns="argColumns"
                    row-key="name"
                    size="small"
                    :pagination="false"
                    bordered
                    class="args-table"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { Wrench } from 'lucide-vue-next'
import { toolApi } from '@/api/chat-work/tool'
import { getToolIcon } from '@harness/components/ToolCallingResult/toolRegistry'
import ExtensionCardGrid from '@harness/components/extensions/ExtensionCardGrid.vue'
import InfoCard from '@harness/components/shared/InfoCard.vue'
import PageShoulder from '@harness/components/shared/PageShoulder.vue'
import { formatExtensionCardTitle } from '@harness/utils/extensionDisplayName'

const WrenchIcon = Wrench
const { t } = useI18n()

const emit = defineEmits(['loading-change'])

const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const tools = ref([])
const currentTool = ref(null)
const detailVisible = ref(false)

watch(loading, (v) => emit('loading-change', v), { immediate: true })

const categories = ['buildin', 'knowledge', 'mysql', 'debug']
const categoryLabels = computed(() => ({
  buildin: t('ext.tools.catBuiltin'),
  knowledge: t('ext.tools.catKnowledge'),
  mysql: t('ext.tools.catMysql'),
  debug: t('ext.tools.catDebug')
}))
const getToolSlug = (tool) => tool?.slug || tool?.id || ''

const formatToolRichText = (text) => {
  if (!text) return ''
  return String(text)
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n')
}

const toolTags = (tool) => {
  const tags = []
  if (tool.category) {
    tags.push({
      name: categoryLabels.value[tool.category] || tool.category,
      color: 'success'
    })
  }
  ;(tool.tags || []).slice(0, 2).forEach((name) => tags.push({ name }))
  return tags
}

const argColumns = computed(() => [
  { title: t('ext.tools.argName'), colKey: 'name', width: 160, ellipsis: true },
  { title: t('ext.tools.argType'), colKey: 'type', width: 80 },
  { title: t('ext.tools.argDesc'), colKey: 'description' }
])

const filteredTools = computed(() => {
  let result = tools.value
  if (selectedCategory.value) {
    result = result.filter((t) => t.category === selectedCategory.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        getToolSlug(t).toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.config_guide?.toLowerCase().includes(q)
    )
  }
  return result
})

const selectTool = (tool) => {
  currentTool.value = tool
  detailVisible.value = true
}

const closeDetail = () => {
  detailVisible.value = false
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && detailVisible.value) {
    closeDetail()
  }
}

const fetchTools = async () => {
  loading.value = true
  try {
    const result = await toolApi.getTools()
    tools.value = result?.data || []
  } catch {
    MessagePlugin.error(t('ext.tools.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTools()
  window.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleEscape)
})

defineExpose({ fetchTools, loading })
</script>

<style lang="less" scoped>
@import '@harness/assets/css/extensions.less';

.tool-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  backdrop-filter: blur(4px);
}

.tool-detail-modal {
  position: relative;
  width: 100%;
  max-width: 1080px;
  height: 780px;
  max-height: calc(100vh - 40px);
  background: var(--td-bg-color-container);
  border-radius: 12px;
  box-shadow: 0 6px 28px rgba(15, 23, 42, 0.08);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-primary);
  }
}

.tool-detail-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  width: 100%;
  max-width: none;
  padding: 40px 48px;
  box-sizing: border-box;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: var(--td-bg-color-container);
  }

  &::-webkit-scrollbar-thumb {
    background: var(--td-gray-color-5);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--td-gray-color-6);
  }
}

.section-header {
  margin-bottom: 32px;
  padding-right: 32px;

  h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--td-text-color-primary);
    margin: 0 0 8px 0;
  }

  .section-description {
    font-size: 14px;
    color: var(--td-text-color-secondary);
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
    word-break: break-word;
  }
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.setting-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid var(--td-component-stroke);

  &:last-child {
    border-bottom: none;
  }

  &--stack {
    flex-direction: column;
    gap: 12px;

    .setting-info {
      max-width: none;
      padding-right: 0;
    }

    .args-table {
      width: 100%;
    }
  }
}

.setting-info {
  flex: 1;
  min-width: 0;
  padding-right: 24px;

  label {
    font-size: 15px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    display: block;
    margin-bottom: 4px;
  }

  .desc {
    font-size: 13px;
    color: var(--td-text-color-secondary);
    margin: 0;
    line-height: 1.5;
  }
}

.setting-control {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.setting-empty {
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}

.config-guide {
  white-space: pre-line;
}

.wk-chip-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

:deep(.t-tag.wk-chip) {
  margin: 0;
}

.args-table {
  width: 100%;

  :deep(.t-table) {
    font-size: 13px;
    table-layout: fixed;
  }

  :deep(th),
  :deep(td) {
    white-space: normal;
    word-break: break-word;
    color: var(--td-text-color-primary);
  }

  :deep(th) {
    color: var(--td-text-color-secondary);
    font-weight: 500;
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .tool-detail-modal,
.modal-leave-active .tool-detail-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .tool-detail-modal,
.modal-leave-to .tool-detail-modal {
  transform: scale(0.95);
  opacity: 0;
}
</style>
