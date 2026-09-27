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
        <t-select
          v-model="selectedSource"
          style="width: 120px"
          :placeholder="t('ext.tools.allSources')"
          clearable
        >
          <t-option value="" :label="t('ext.tools.allSources')" />
          <t-option v-for="source in sources" :key="source" :value="source" :label="sourceLabels[source] || source" />
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

    <SettingDrawer
      v-model:visible="detailVisible"
      :title="currentTool ? formatExtensionCardTitle(currentTool.name) : t('ext.tools.detail')"
      storage-key="setting-drawer:width:builtin-tool"
      width="720px"
      hide-footer
    >
      <template #headerIcon>
        <component :is="detailIcon" :size="18" />
      </template>
      <template v-if="currentTool" #subtitle>
        <span>{{ getToolSlug(currentTool) }}</span>
      </template>
      <template v-if="currentTool">
        <section class="setting-drawer__section">
          <p class="tool-detail-desc">
            {{ formatToolRichText(currentTool.description) || t('ext.tools.noDescription') }}
          </p>
        </section>

        <section v-if="currentTool.config_guide" class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('ext.tools.configGuide') }}</h4>
          <p class="tool-detail-desc config-guide">{{ currentTool.config_guide }}</p>
        </section>

        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('ext.tools.category') }}</h4>
          <div class="wk-chip-row">
            <t-tag theme="success" size="small" variant="light-outline" class="wk-chip">
              {{ categoryLabels[currentTool.category] || currentTool.category }}
            </t-tag>
          </div>
        </section>

        <section class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('ext.tools.tags') }}</h4>
          <div class="wk-chip-row">
            <t-tag
              v-for="tag in currentTool.tags"
              :key="tag"
              size="small"
              variant="light-outline"
              class="wk-chip"
            >{{ tag }}</t-tag>
            <span v-if="!currentTool.tags?.length" class="setting-empty">{{ t('ext.tools.none') }}</span>
          </div>
        </section>

        <section v-if="currentTool.args?.length" class="setting-drawer__section">
          <h4 class="setting-drawer__section-title">{{ t('ext.tools.args') }}</h4>
          <t-table
            :data="currentTool.args"
            :columns="argColumns"
            row-key="name"
            size="small"
            bordered
            class="args-table"
          />
        </section>
      </template>
    </SettingDrawer>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { Wrench } from 'lucide-vue-next'
import { toolApi } from '@/api/chat-work/tool'
import { getToolIcon } from '@/components/harness/ToolCallingResult/toolRegistry'
import ExtensionCardGrid from '@/components/harness/extensions/ExtensionCardGrid.vue'
import InfoCard from '@/components/harness/shared/InfoCard.vue'
import PageShoulder from '@/components/harness/shared/PageShoulder.vue'
import SettingDrawer from '@/components/settings/SettingDrawer.vue'
import { formatExtensionCardTitle } from '@/utils/harness/extensionDisplayName'

const WrenchIcon = Wrench
const { t } = useI18n()

const emit = defineEmits(['loading-change'])

const loading = ref(false)
const searchQuery = ref('')
const selectedCategory = ref('')
const selectedSource = ref('')
const tools = ref([])
const currentTool = ref(null)
const detailVisible = ref(false)

watch(loading, (v) => emit('loading-change', v), { immediate: true })

const categories = ['buildin', 'knowledge', 'wiki', 'database']
const sources = ['chat', 'work']
const categoryLabels = computed(() => ({
  buildin: t('ext.tools.catBuiltin'),
  knowledge: t('ext.tools.catKnowledge'),
  wiki: t('ext.tools.catWiki'),
  database: t('ext.tools.catDatabase')
}))
const sourceLabels = computed(() => ({
  chat: t('ext.tools.sourceChat'),
  work: t('ext.tools.sourceWork')
}))
const getToolSlug = (tool) => tool?.slug || tool?.id || ''
const detailIcon = computed(() => getToolIcon(getToolSlug(currentTool.value)) || Wrench)

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

const fetchTools = async () => {
  loading.value = true
  try {
    const result = await toolApi.getTools(
      selectedCategory.value || null,
      selectedSource.value || null
    )
    tools.value = result?.data || []
  } catch {
    MessagePlugin.error(t('ext.tools.loadFailed'))
  } finally {
    loading.value = false
  }
}

watch([selectedCategory, selectedSource], () => {
  fetchTools()
})

onMounted(() => {
  fetchTools()
})

defineExpose({ fetchTools, loading })
</script>

<style lang="less" scoped>
@import '@/assets/harness/css/extensions.less';

.tool-detail-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--td-text-color-secondary);
  white-space: pre-wrap;
  word-break: break-word;
}

.config-guide {
  white-space: pre-line;
}

.setting-empty {
  font-size: 13px;
  color: var(--td-text-color-placeholder);
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
</style>
