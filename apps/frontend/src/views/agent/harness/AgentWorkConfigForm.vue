<template>
  <div class="agent-work-config-form">
    <div class="work-config-content">
      <div v-if="selectedAgent" class="agent-info">
        <div v-if="props.showSegmented && !isEmptyConfig" class="config-segment">
          <t-radio-group
            :value="currentSegment"
            class="config-segmented"
            @update:value="(value) => currentSegment = value"
          >
            <t-radio-button
              v-for="option in segmentOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </t-radio-button>
          </t-radio-group>
        </div>

        <t-alert
          v-if="isEmptyConfig"
          theme="warning"
          :message="t('agent.workManage.form.emptyConfig')"
          class="config-alert"
        />
        <t-empty v-else-if="isCurrentSegmentEmpty" :description="t('common.noData')" class="config-empty" />

        <div
          v-else-if="selectedAgentId && configurableItems"
          class="settings-group"
          :class="{ 'is-readonly': isReadOnlyConfig }"
        >
          <nav
            v-if="promptEntries.length > 1"
            class="prompts-outline"
            :aria-label="t('agentEditor.promptNav.ariaLabel')"
          >
            <button
              v-for="[promptKey, promptItem] in promptEntries"
              :key="promptKey"
              type="button"
              class="prompts-outline__pill"
              :class="{ 'prompts-outline__pill--active': activePromptKey === promptKey }"
              @click="activePromptKey = promptKey"
            >
              {{ getConfigLabel(promptKey, promptItem) }}
            </button>
          </nav>

          <template v-for="(value, key) in filteredConfigurableItems" :key="key">
            <div v-if="value.kind === 'llm'" class="setting-row">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <ModelSelectorComponent
                  :model_spec="agentConfig[key] || ''"
                  :disabled="isReadOnlyConfig"
                  clearable
                  @select-model="(spec) => handleModelChange(key, spec)"
                />
              </div>
            </div>

            <div
              v-else-if="value.kind === 'prompt'"
              v-show="promptEntries.length <= 1 || activePromptKey === key"
              class="setting-row setting-row-vertical prompts-panel__pane"
            >
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control setting-control-full">
                <div class="textarea-with-template">
                  <t-textarea
                    :value="agentConfig[key] || ''"
                    :disabled="isReadOnlyConfig"
                    :placeholder="getPlaceholder(key, value)"
                    :autosize="{ minRows: 10, maxRows: 25 }"
                    class="system-prompt-textarea"
                    @update:value="(val) => updateConfigValue(key, val)"
                  />
                  <PromptTemplateSelector
                    v-if="!isReadOnlyConfig"
                    :type="key === 'system_prompt' ? 'agentSystemPrompt' : 'systemPrompt'"
                    position="corner"
                    :has-knowledge-base="isResourceEnabled(agentConfig.knowledges)"
                    :show-template-picker="key === 'system_prompt'"
                    @select="(template) => applyPromptTemplate(key, template)"
                    @reset-default="restorePromptDefault(key)"
                  />
                </div>
              </div>
            </div>

            <template v-else-if="isScopeResourceKind(value.kind)">
              <div class="setting-row">
                <div class="setting-info">
                  <label>{{ getResourceModeLabel(value.kind) }}</label>
                  <p class="desc">{{ getResourceModeDesc(value.kind, value) }}</p>
                </div>
                <div class="setting-control">
                  <t-radio-group
                    :value="getResourceMode(key)"
                    :disabled="isReadOnlyConfig"
                    @update:value="(mode) => setResourceMode(key, mode)"
                  >
                    <t-radio-button value="all">{{ getResourceAllLabel() }}</t-radio-button>
                    <t-radio-button value="selected">{{ getResourceSelectedLabel() }}</t-radio-button>
                    <t-radio-button value="none">{{ getResourceNoneLabel() }}</t-radio-button>
                  </t-radio-group>
                </div>
              </div>

              <div
                v-if="getResourceMode(key) === 'selected' && getConfigOptions(value).length > 0"
                class="setting-row"
                :class="{ 'setting-row-vertical': isCardResourceKind(value.kind) }"
              >
                <div v-if="value.kind !== 'skills'" class="setting-info">
                  <label>{{ getResourceSelectLabel(value.kind) }}</label>
                  <p class="desc">{{ getResourceSelectDesc(value.kind) }}</p>
                </div>
                <div
                  class="setting-control"
                  :class="{ 'setting-control-full': isCardResourceKind(value.kind) }"
                >
                  <t-checkbox-group
                    v-if="isCardResourceKind(value.kind)"
                    :value="ensureArray(key)"
                    :disabled="isReadOnlyConfig"
                    class="skills-checkbox-group"
                    @change="(vals) => updateConfigValue(key, vals)"
                    @update:value="(vals) => updateConfigValue(key, vals)"
                  >
                    <t-checkbox
                      v-for="option in getConfigOptions(value)"
                      :key="getOptionValue(option)"
                      :value="getOptionValue(option)"
                      class="skill-checkbox-item"
                    >
                      <div class="skill-item-content" :class="{ 'skill-item-content--skill': value.kind === 'skills' }">
                        <div v-if="value.kind === 'skills'" class="skill-item-badge" aria-hidden="true">
                          <t-icon :name="SKILL_ICON" size="16px" />
                        </div>
                        <div class="skill-item-text">
                          <span class="skill-name" :title="getLocalizedOptionLabel(key, option)">{{ getLocalizedOptionLabel(key, option) }}</span>
                          <span
                            v-if="getLocalizedOptionDescription(key, option)"
                            class="skill-desc"
                            :class="{ 'is-clamped': value.kind === 'skills' }"
                            :title="getLocalizedOptionDescription(key, option)"
                          >
                            {{ getLocalizedOptionDescription(key, option) }}
                          </span>
                        </div>
                      </div>
                    </t-checkbox>
                  </t-checkbox-group>
                  <t-select
                    v-else
                    :value="ensureArray(key)"
                    multiple
                    filterable
                    :min-collapsed-num="3"
                    :disabled="isReadOnlyConfig"
                    :placeholder="getResourceSelectLabel(value.kind)"
                    @change="(vals) => updateConfigValue(key, vals)"
                    @update:value="(vals) => updateConfigValue(key, vals)"
                  >
                    <t-option
                      v-for="option in getConfigOptions(value)"
                      :key="getOptionValue(option)"
                      :value="getOptionValue(option)"
                      :label="getLocalizedOptionLabel(key, option)"
                    />
                  </t-select>
                </div>
              </div>

              <div
                v-else-if="getResourceMode(key) === 'selected' && getConfigOptions(value).length === 0"
                class="setting-row"
              >
                <p class="desc empty-hint">{{ getResourceEmptyLabel(value.kind) }}</p>
              </div>

              <div v-if="shouldShowKnowledgeSkillWarning(key)" class="knowledge-skill-warning">
                <t-icon name="error-circle" />
                <span>{{ t('agent.workManage.form.knowledgeSkillWarning') }}</span>
              </div>
            </template>

            <template v-else-if="value.kind === 'tools'">
            <div class="setting-row setting-row-vertical">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control setting-control-full">
                <t-checkbox-group
                  :value="ensureArray(key)"
                  :disabled="isReadOnlyConfig"
                  class="tool-groups"
                  @change="(vals) => updateConfigValue(key, vals)"
                  @update:value="(vals) => updateConfigValue(key, vals)"
                >
                  <section
                    v-for="group in groupedToolOptions(value)"
                    :key="group.key"
                    :class="['tool-group', `tool-group--${group.key}`]"
                  >
                    <header class="tool-group-header">
                      <span class="tool-group-bar" />
                      <span class="tool-group-title">{{ group.label }}</span>
                      <span class="tool-group-count">{{ group.tools.length }}</span>
                    </header>
                    <div class="tool-grid">
                      <t-checkbox
                        v-for="option in group.tools"
                        :key="getOptionValue(option)"
                        :value="getOptionValue(option)"
                        class="tool-card"
                      >
                        <div class="tool-card-body">
                          <div class="tool-card-head">
                            <span class="tool-card-name" :title="getOptionLabel(option)">{{ getOptionLabel(option) }}</span>
                          </div>
                          <span
                            v-if="getOptionDescription(option)"
                            class="tool-card-desc"
                            :title="getOptionDescription(option)"
                          >
                            {{ getOptionDescription(option) }}
                          </span>
                        </div>
                      </t-checkbox>
                    </div>
                  </section>
                </t-checkbox-group>
              </div>
            </div>
            <div class="setting-row setting-row-vertical">
              <div class="setting-info">
                <label>{{ t('agentEditor.tools.effectiveLabel') }}</label>
                <p class="desc">{{ t('agentEditor.tools.effectiveDesc') }}</p>
              </div>
              <div class="setting-control setting-control-full">
                <div class="effective-tools">
                  <div v-if="getEffectiveTools(key, value).length === 0" class="effective-tools-empty">
                    {{ t('agentEditor.tools.effectiveEmpty') }}
                  </div>
                  <span
                    v-for="item in getEffectiveTools(key, value)"
                    :key="item.value"
                    class="effective-chip"
                  >
                    <span class="effective-chip-label">{{ item.label }}</span>
                  </span>
                </div>
              </div>
            </div>
            </template>

            <div v-else-if="typeof agentConfig[key] === 'boolean'" class="setting-row">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <t-switch
                  :value="agentConfig[key]"
                  :disabled="isReadOnlyConfig"
                  @update:value="(val) => updateConfigValue(key, val)"
                />
              </div>
            </div>

            <div v-else-if="isSingleSelectAgentConfig(value)" class="setting-row">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <t-select
                  :value="agentConfig[key]"
                  :disabled="isReadOnlyConfig"
                  @update:value="(val) => updateConfigValue(key, val)"
                >
                  <t-option
                    v-for="option in getConfigOptions(value)"
                    :key="getOptionValue(option)"
                    :value="getOptionValue(option)"
                    :label="getLocalizedOptionLabel(key, option)"
                  />
                </t-select>
              </div>
            </div>

            <div v-else-if="isListConfig(key, value)" class="setting-row setting-row-vertical">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control setting-control-full">
                <t-checkbox-group
                  :value="ensureArray(key)"
                  :disabled="isReadOnlyConfig"
                  class="skills-checkbox-group"
                  @change="(vals) => updateConfigValue(key, vals)"
                  @update:value="(vals) => updateConfigValue(key, vals)"
                >
                  <t-checkbox
                    v-for="option in getConfigOptions(value)"
                    :key="getOptionValue(option)"
                    :value="getOptionValue(option)"
                    class="skill-checkbox-item"
                  >
                    <div class="skill-item-content">
                      <span class="skill-name">{{ getLocalizedOptionLabel(key, option) }}</span>
                      <span v-if="getLocalizedOptionDescription(key, option)" class="skill-desc">
                        {{ getLocalizedOptionDescription(key, option) }}
                      </span>
                    </div>
                  </t-checkbox>
                </t-checkbox-group>
              </div>
            </div>

            <div
              v-else-if="value?.type === 'number' || value?.type === 'int' || value?.type === 'float'"
              class="setting-row"
            >
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <t-input-number
                  :value="agentConfig[key]"
                  :disabled="isReadOnlyConfig"
                  theme="column"
                  :placeholder="getPlaceholder(key, value)"
                  @update:value="(val) => updateConfigValue(key, val)"
                />
              </div>
            </div>

            <div v-else-if="value?.type === 'slider'" class="setting-row">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <div class="slider-wrapper">
                  <t-slider
                    :value="agentConfig[key]"
                    :disabled="isReadOnlyConfig"
                    :min="value.min"
                    :max="value.max"
                    :step="value.step"
                    @update:value="(val) => updateConfigValue(key, val)"
                  />
                  <span class="slider-value">{{ agentConfig[key] }}</span>
                </div>
              </div>
            </div>

            <div v-else class="setting-row">
              <div class="setting-info">
                <label>{{ getConfigLabel(key, value) }}</label>
                <p v-if="getConfigDescription(key, value)" class="desc">{{ getConfigDescription(key, value) }}</p>
              </div>
              <div class="setting-control">
                <t-input
                  :value="agentConfig[key]"
                  :disabled="isReadOnlyConfig"
                  :placeholder="getPlaceholder(key, value)"
                  @update:value="(val) => updateConfigValue(key, val)"
                />
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import PromptTemplateSelector from '@/components/PromptTemplateSelector.vue'
import ModelSelectorComponent from './ModelSelectorComponent.vue'
import { SKILL_ICON } from '@/types/mention'
import { useAgentStore } from '@/stores/harness/agent'
import { toolApi } from '@/api/chat-work/tool'
import {
  getAgentConfigOptionDescription as getOptionDescription,
  getAgentConfigOptionLabel as getOptionLabel,
  getAgentConfigOptions as getSchemaConfigOptions,
  getAgentConfigOptionValue as getOptionValue,
  isDefaultAllAgentResourceKind,
  isSingleSelectAgentConfig
} from '@/utils/harness/agentConfigUtils'

const props = defineProps({
  segment: {
    type: String,
    default: 'model'
  },
  showSegmented: {
    type: Boolean,
    default: true
  }
})

const { t, te } = useI18n()
const agentStore = useAgentStore()
const {
  selectedAgent,
  selectedAgentId,
  agentConfig,
  configurableItems,
  availableKnowledgeBases,
  availableMcps,
  availableSkills,
  agents
} = storeToRefs(agentStore)
const resourceModeOverride = reactive({})
const availableToolCatalog = ref([])

const currentSegment = ref('model')
const activePromptKey = ref('')
const CLASSIFIED_CONFIG_KINDS = new Set([
  'llm',
  'prompt',
  'tools',
  'knowledges',
  'mcps',
  'skills',
  'subagents'
])
const SCOPE_RESOURCE_KINDS = new Set(['knowledges', 'mcps', 'skills', 'subagents'])
const CARD_RESOURCE_KINDS = new Set(['skills', 'subagents'])
const KNOWLEDGE_BASE_SKILL_SLUG = 'knowledge-base'
const segmentOptions = computed(() => [
  { label: t('agent.editor.modelConfig'), value: 'model' },
  { label: t('agent.editor.promptsConfig'), value: 'prompt' },
  { label: t('agent.editor.knowledgeConfig'), value: 'knowledges' },
  { label: t('agent.editor.toolsConfig'), value: 'tools' },
  { label: t('agentEditor.mcp.label'), value: 'mcps' },
  { label: t('agent.editor.skillsConfig'), value: 'skills' },
  { label: t('agent.workManage.editor.subagents'), value: 'subagents' },
  { label: t('agent.workManage.editor.navAdvanced'), value: 'advanced' }
])

const activeSegment = computed(() => (props.showSegmented ? currentSegment.value : props.segment))
const isEmptyConfig = computed(
  () => !selectedAgentId.value || Object.keys(configurableItems.value).length === 0
)
const canManageCurrentAgent = computed(() => !!selectedAgent.value?.can_manage)
const isReadOnlyConfig = computed(() => !canManageCurrentAgent.value)

const segmentConfigKeys = computed(() => {
  const keys = Object.keys(configurableItems.value)
  const byKind = (kind) => keys.filter((key) => configurableItems.value[key]?.kind === kind)
  const advanced = keys.filter(
    (key) => !CLASSIFIED_CONFIG_KINDS.has(configurableItems.value[key]?.kind)
  )
  return {
    model: byKind('llm'),
    prompt: byKind('prompt'),
    tools: byKind('tools'),
    knowledges: byKind('knowledges'),
    mcps: byKind('mcps'),
    skills: byKind('skills'),
    subagents: byKind('subagents'),
    advanced,
    other: advanced
  }
})

const filteredConfigurableItems = computed(() => {
  if (isEmptyConfig.value) return {}
  const keys = segmentConfigKeys.value[activeSegment.value] || []
  const filtered = {}
  keys.forEach((key) => {
    filtered[key] = configurableItems.value[key]
  })
  return filtered
})

const isCurrentSegmentEmpty = computed(
  () => !isEmptyConfig.value && Object.keys(filteredConfigurableItems.value).length === 0
)

const promptEntries = computed(() =>
  Object.entries(filteredConfigurableItems.value).filter(([, item]) => item?.kind === 'prompt')
)

watch(
  promptEntries,
  (entries) => {
    if (!entries.find(([key]) => key === activePromptKey.value)) {
      activePromptKey.value = entries[0]?.[0] || ''
    }
  },
  { immediate: true }
)

const isScopeResourceKind = (kind) => SCOPE_RESOURCE_KINDS.has(kind)
const isCardResourceKind = (kind) => CARD_RESOURCE_KINDS.has(kind)

const toResourceOption = (item) => {
  if (!item || typeof item !== 'object') return null
  const key = item.slug || item.key || item.id || item.kb_id || item.agent_id
  if (!key) return null
  return {
    key: String(key),
    name: item.name || String(key),
    description: item.description || ''
  }
}

const mergeResourceOptions = (schemaOptions, extraOptions) => {
  const merged = []
  const seen = new Set()
  for (const option of [...schemaOptions, ...extraOptions]) {
    const value = String(getOptionValue(option) || '')
    if (!value || seen.has(value)) continue
    seen.add(value)
    merged.push(option)
  }
  return merged
}

const KNOWN_KNOWLEDGE_TOOL_SLUGS = [
  'list_kbs',
  'get_mindmap',
  'query_kb',
  'open_kb_document',
  'find_kb_document',
  'search_file',
  'download_kb_file'
]

const knowledgeFallbackOptions = () =>
  KNOWN_KNOWLEDGE_TOOL_SLUGS.map((slug) => ({
    key: slug,
    name: slug,
    description: '',
    category: 'knowledge',
    tags: ['知识库']
  }))

const catalogBySlug = computed(() => {
  const map = new Map()
  for (const item of availableToolCatalog.value) {
    const slug = item?.slug || item?.key
    if (slug) map.set(String(slug), item)
  }
  return map
})

const toCatalogToolOption = (item) => {
  if (!item || typeof item !== 'object') return null
  const slug = item.slug || item.key
  if (!slug) return null
  return {
    key: String(slug),
    name: item.name || String(slug),
    description: item.description || '',
    category: item.category || 'buildin',
    tags: Array.isArray(item.tags) ? item.tags : []
  }
}

const enrichToolOption = (option) => {
  const slug = String(getOptionValue(option) || '')
  const meta = catalogBySlug.value.get(slug)
  if (!meta) {
    return {
      ...option,
      key: slug || getOptionValue(option),
      category: option?.category || option?.group || 'buildin',
      tags: option?.tags || []
    }
  }
  return {
    ...option,
    key: slug,
    name: option?.name || meta.name || slug,
    description: option?.description || meta.description || '',
    category: option?.category || option?.group || meta.category || 'buildin',
    tags: option?.tags || meta.tags || []
  }
}

const storeOptionsForKind = (kind) => {
  if (kind === 'knowledges') {
    return (availableKnowledgeBases.value || []).map(toResourceOption).filter(Boolean)
  }
  if (kind === 'mcps') {
    const selected = new Set((agentConfig.value?.mcps || []).map(String))
    return (availableMcps.value || [])
      .filter((item) => {
        const option = toResourceOption(item)
        if (!option) return false
        if (item.enabled === false && !selected.has(option.key)) return false
        return true
      })
      .map(toResourceOption)
      .filter(Boolean)
  }
  if (kind === 'skills') {
    return (availableSkills.value || [])
      .filter((item) => item?.source_type === 'work' || item?.source_type === 'common')
      .map(toResourceOption)
      .filter(Boolean)
  }
  if (kind === 'subagents') {
    return (agents.value || [])
      .filter((item) => item?.is_subagent)
      .map(toResourceOption)
      .filter(Boolean)
  }
  return []
}

const getConfigOptions = (value) => {
  const schemaOptions = getSchemaConfigOptions(value)
  const kind = value?.kind
  if (kind === 'tools') {
    const catalogOptions = (availableToolCatalog.value || [])
      .filter((item) => !item?.source || item.source === 'work')
      .map(toCatalogToolOption)
      .filter(Boolean)
    const hasKnowledge = catalogOptions.some((option) => option.category === 'knowledge')
    return mergeResourceOptions(schemaOptions.map(enrichToolOption), [
      ...catalogOptions,
      ...(hasKnowledge ? [] : knowledgeFallbackOptions())
    ])
  }
  if (!SCOPE_RESOURCE_KINDS.has(kind)) return schemaOptions
  if (kind === 'skills') return storeOptionsForKind(kind)
  return mergeResourceOptions(schemaOptions, storeOptionsForKind(kind))
}

watch(selectedAgentId, () => {
  Object.keys(resourceModeOverride).forEach((key) => {
    delete resourceModeOverride[key]
  })
})

const loadToolCatalog = async () => {
  try {
    // 工作智能体只展示工作来源工具，对话侧内置工具不进入这个列表。
    const res = await toolApi.getTools(null, 'work')
    const data = res?.data
    const items = Array.isArray(data) ? data : []
    availableToolCatalog.value = items.filter((item) => !item?.source || item.source === 'work')
  } catch {
    availableToolCatalog.value = []
  }
}

onMounted(() => {
  agentStore.fetchMentionResources()
  loadToolCatalog()
})

const isListConfig = (key, value) => {
  const isDefaultAllKind = isDefaultAllAgentResourceKind(value?.kind)
  const isList = value?.type === 'list'
  return isDefaultAllKind || isList || key === 'skills' || key === 'subagents'
}

const isDefaultEnabledResourceValue = (value) => value === null || value === undefined

const isResourceEnabled = (value) => {
  if (Array.isArray(value)) return value.length > 0
  return isDefaultEnabledResourceValue(value)
}

const isKnowledgeBaseSkillEnabled = computed(() => {
  const skills = agentConfig.value?.skills
  if (Array.isArray(skills)) return skills.includes(KNOWLEDGE_BASE_SKILL_SLUG)
  return isDefaultEnabledResourceValue(skills)
})

const shouldShowKnowledgeSkillWarning = (key) => {
  if (key !== 'knowledges') return false
  return isResourceEnabled(agentConfig.value?.knowledges) && !isKnowledgeBaseSkillEnabled.value
}

const inferredResourceMode = (key) => {
  const value = agentConfig.value?.[key]
  if (value === null || value === undefined) return 'all'
  if (Array.isArray(value) && value.length === 0) return 'none'
  return 'selected'
}

const getResourceMode = (key) => resourceModeOverride[key] || inferredResourceMode(key)

const setResourceMode = (key, mode) => {
  if (isReadOnlyConfig.value) return
  const next = typeof mode === 'string' ? mode : mode?.value
  if (next !== 'all' && next !== 'selected' && next !== 'none') return
  resourceModeOverride[key] = next
  if (next === 'all') {
    agentStore.updateAgentConfig({ [key]: null })
    return
  }
  if (next === 'none') {
    agentStore.updateAgentConfig({ [key]: [] })
    return
  }
  const current = agentConfig.value?.[key]
  if (Array.isArray(current) && current.length > 0) return
  agentStore.updateAgentConfig({ [key]: [] })
}

const getResourceModeLabel = (kind) => {
  if (kind === 'knowledges') return t('agent.editor.knowledgeBases')
  if (kind === 'mcps') return t('agentEditor.mcp.label')
  if (kind === 'skills') return t('agent.editor.skillsSelection')
  if (kind === 'subagents') return t('agent.workManage.editor.subagentsSelection')
  return kind
}

const getResourceModeDesc = (kind, value) => {
  if (kind === 'knowledges') return t('agentEditor.desc.kbScope')
  if (kind === 'mcps') return t('agentEditor.mcp.desc')
  if (kind === 'skills') return t('agent.editor.skillsSelectionDesc')
  if (kind === 'subagents') return t('agent.workManage.editor.subagentsSelectionDesc')
  return value?.description || ''
}

const getResourceAllLabel = () => t('agentEditor.selection.all')

const getResourceSelectedLabel = () => t('agentEditor.selection.selected')

const getResourceNoneLabel = () => t('agentEditor.selection.disabled')

const getResourceSelectLabel = (kind) => {
  if (kind === 'knowledges') return t('agent.editor.selectKnowledgeBases')
  if (kind === 'mcps') return t('agentEditor.mcp.selectLabel')
  if (kind === 'subagents') return t('agent.workManage.editor.subagentsSelect')
  return t('common.add')
}

const getResourceSelectDesc = (kind) => {
  if (kind === 'knowledges') return t('agent.editor.selectKnowledgeBasesDesc')
  if (kind === 'mcps') return t('agentEditor.mcp.selectDesc')
  if (kind === 'subagents') return t('agent.workManage.editor.subagentsSelectDesc')
  return ''
}

const getResourceEmptyLabel = (kind) => {
  if (kind === 'skills') return t('agent.editor.noSkillsAvailable')
  if (kind === 'subagents') return t('agent.workManage.editor.noSubagentsAvailable')
  return t('common.noData')
}

const TOOL_GROUP_ORDER = ['buildin', 'knowledge']

const getToolGroupKey = (option) => {
  const raw =
    option?.category || option?.group || (Array.isArray(option?.tags) ? option.tags[0] : '') || 'buildin'
  if (raw === 'builtin') return 'buildin'
  return String(raw)
}

const getToolGroupLabel = (groupKey) => {
  if (groupKey === 'buildin' || groupKey === 'builtin') {
    return t('agent.workManage.editor.builtinTools')
  }
  const i18nKey = `agent.workManage.toolCategories.${groupKey}`
  if (te(i18nKey)) return t(i18nKey)
  return groupKey
}

const groupedToolOptions = (value) => {
  const groups = new Map()
  for (const option of getConfigOptions(value)) {
    const groupKey = getToolGroupKey(option)
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        key: groupKey,
        label: getToolGroupLabel(groupKey),
        tools: []
      })
    }
    groups.get(groupKey).tools.push(option)
  }
  return [...groups.values()].sort((a, b) => {
    const ia = TOOL_GROUP_ORDER.indexOf(a.key)
    const ib = TOOL_GROUP_ORDER.indexOf(b.key)
    if (ia === -1 && ib === -1) return a.label.localeCompare(b.label)
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
}

const getEffectiveTools = (key, value) => {
  const selected = new Set(ensureArray(key).map(String))
  return getConfigOptions(value)
    .filter((option) => selected.has(String(getOptionValue(option))))
    .map((option) => ({
      value: String(getOptionValue(option)),
      label: getOptionLabel(option)
    }))
}

const updateConfigValue = (key, value) => {
  if (isReadOnlyConfig.value) return
  agentStore.updateAgentConfig({
    [key]: value
  })
}

const tx = (key, fallback, params) => (te(key) ? t(key, params) : fallback)

const getConfigLabel = (key, value) =>
  tx(`agent.workManage.fields.${key}.name`, value?.name || key)

const getConfigDescription = (key, value) =>
  tx(`agent.workManage.fields.${key}.desc`, value?.description || '', {
    default: value?.default,
    messages: '{messages}'
  })

const getLocalizedOptionLabel = (configKey, option) => {
  const optVal = getOptionValue(option)
  if (optVal == null || optVal === '') return getOptionLabel(option)
  const fieldOptKey = `agent.workManage.fields.${configKey}.options.${optVal}`
  if (te(fieldOptKey)) return t(fieldOptKey)
  return getOptionLabel(option)
}

const getLocalizedOptionDescription = (configKey, option) => getOptionDescription(option)

const getPlaceholder = (_key, value) => {
  if (value?.default === undefined || value?.default === null || value.default === '') return ''
  return t('agent.workManage.form.defaultPlaceholder', { value: value.default })
}

const handleModelChange = (key, spec) => {
  if (isReadOnlyConfig.value) return
  if (typeof spec !== 'string') return
  agentStore.updateAgentConfig({
    [key]: spec
  })
}

const applyPromptTemplate = (key, template) => {
  if (isReadOnlyConfig.value) return
  const content = typeof template === 'string' ? template : template?.content
  if (typeof content !== 'string') return
  agentStore.updateAgentConfig({ [key]: content })
}

const restorePromptDefault = (key) => {
  if (isReadOnlyConfig.value) return
  const item = configurableItems.value[key]
  const defaultValue = item && Object.prototype.hasOwnProperty.call(item, 'default') ? item.default : ''
  agentStore.updateAgentConfig({ [key]: defaultValue == null ? '' : String(defaultValue) })
}

const ensureArray = (key) => {
  const config = agentConfig.value || {}
  const configItem = configurableItems.value[key]
  if (config[key] === null && isDefaultAllAgentResourceKind(configItem?.kind)) {
    const options = getConfigOptions(configItem)
    if (configItem?.kind === 'tools') {
      return options
        .filter((option) => getToolGroupKey(option) === 'buildin')
        .map((option) => getOptionValue(option))
    }
    return options.map((option) => getOptionValue(option))
  }
  if (!config[key] || !Array.isArray(config[key])) return []
  const validValues = new Set(
    getConfigOptions(configItem).map((option) => String(getOptionValue(option)))
  )
  if (validValues.size === 0) return config[key]
  return config[key].filter((value) => validValues.has(String(value)))
}

const validateAndFilterConfig = () => {
  const validatedConfig = { ...agentConfig.value }
  const configItems = configurableItems.value

  Object.keys(configItems).forEach((key) => {
    const configItem = configItems[key]
    const currentValue = validatedConfig[key]

    if (
      Array.isArray(currentValue) &&
      (configItem.kind === 'tools' || configItem.type === 'list')
    ) {
      const options = getConfigOptions(configItem)
      const validValues = new Set(options.map((opt) => String(getOptionValue(opt))))
      if (validValues.size === 0) return

      validatedConfig[key] = currentValue.filter((value) => validValues.has(String(value)))
    }
  })

  return validatedConfig
}

defineExpose({ validateAndFilterConfig })
</script>

<style lang="less" scoped>
.agent-work-config-form {
  background: transparent;
}

.work-config-content {
  min-width: 0;
}

.config-segment {
  margin-bottom: 16px;
}

.config-segmented {
  display: flex;
  width: 100%;
  flex-wrap: wrap;

  :deep(.t-radio-button) {
    flex: 1 0 auto;
    min-width: 0;
  }
}

.config-alert,
.config-empty {
  margin: 12px 0;
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
  gap: 24px;
  padding: 16px 0;
  border-bottom: 1px solid var(--td-component-stroke);
  min-width: 0;

  &:last-child {
    border-bottom: none;
  }

  &.setting-row-vertical {
    flex-direction: column;
    gap: 12px;

    .setting-info {
      max-width: 100%;
    }
  }
}

.setting-info {
  flex: 1 1 0;
  max-width: none;
  min-width: 0;

  label {
    display: block;
    margin-bottom: 4px;
    font-size: 15px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .desc {
    margin: 0;
    font-size: 13px;
    line-height: 1.5;
    color: var(--td-text-color-secondary);
  }
}

.setting-control {
  flex: 0 0 240px;
  width: 240px;
  min-width: 0;
  max-width: 240px;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;

  :deep(.t-select),
  :deep(.t-input),
  :deep(.t-textarea),
  :deep(.work-model-selector),
  :deep(.work-model-selector .model-select),
  :deep(.work-model-selector-select),
  :deep(.t-radio-group) {
    width: 100%;
    min-width: 0;
  }

  :deep(.t-radio-group) {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  &.setting-control-full {
    flex: 1 1 100%;
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    justify-content: flex-start;
  }
}

.slider-wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;

  :deep(.t-slider) {
    flex: 1;
  }
}

.slider-value {
  width: 40px;
  text-align: right;
  font-family: var(--app-font-family-mono);
  font-size: 14px;
  color: var(--td-text-color-primary);
}

.textarea-with-template {
  position: relative;
  width: 100%;
}

.system-prompt-textarea {
  width: 100%;
  font-family: var(--app-font-family-mono);
  font-size: 13px;

  :deep(textarea) {
    resize: vertical !important;
    min-height: 200px;
  }
}

.prompts-outline {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 8px;

  &__pill {
    display: inline-flex;
    align-items: center;
    padding: 5px 12px;
    border: none;
    border-radius: 6px;
    background: var(--td-bg-color-secondarycontainer);
    font: inherit;
    font-size: 13px;
    line-height: 1.4;
    color: var(--td-text-color-secondary);
    cursor: pointer;

    &--active {
      background: color-mix(in srgb, var(--td-brand-color) 12%, transparent);
      color: var(--td-brand-color);
      font-weight: 500;
    }
  }
}

.tool-groups {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tool-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-group-bar {
  display: inline-block;
  width: 3px;
  height: 14px;
  border-radius: 2px;
  background: var(--td-brand-color);
}

.tool-group--buildin .tool-group-bar,
.tool-group--builtin .tool-group-bar {
  background: var(--td-brand-color);
}

.tool-group--knowledge .tool-group-bar {
  background: var(--td-success-color, #2ba471);
}

.tool-group--debug .tool-group-bar {
  background: var(--td-gray-color-6, #a0a7ab);
}

.tool-group-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.tool-group-count {
  min-width: 20px;
  padding: 0 6px;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border-radius: 999px;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
}

.tool-card {
  margin: 0;
  padding: 12px 14px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
  border: 1px solid var(--td-component-stroke);
  overflow: hidden;
  cursor: pointer;

  &:hover {
    border-color: var(--td-brand-color);
    background: var(--td-brand-color-1, rgba(7, 192, 95, 0.06));
  }

  :deep(.t-checkbox__input) {
    margin-top: 2px;
    flex-shrink: 0;
  }

  :deep(.t-checkbox__label) {
    flex: 1;
    min-width: 0;
    padding-left: 10px;
  }

  &.t-is-checked {
    border-color: var(--td-brand-color);
    background: var(--td-brand-color-1, rgba(7, 192, 95, 0.08));
  }
}

.tool-card-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.tool-card-head {
  display: flex;
  align-items: center;
  min-width: 0;
}

.tool-card-name,
.tool-card-desc {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  min-width: 0;
  overflow: hidden;
  word-break: break-word;
}

.tool-card-name {
  color: var(--td-text-color-primary);
  font-size: 13.5px;
  font-weight: 500;
  line-height: 1.4;
}

.tool-card-desc {
  color: var(--td-text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.effective-tools {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 12px;
  background: var(--td-bg-color-container);
  border-radius: 8px;
  border: 1px dashed var(--td-component-stroke);
  min-height: 52px;
  align-items: flex-start;
}

.effective-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 12px;
  line-height: 18px;
  color: var(--td-brand-color);
  background: color-mix(in srgb, var(--td-brand-color) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--td-brand-color) 22%, transparent);
  border-radius: 999px;
  max-width: 100%;
}

.effective-chip-label {
  font-weight: 500;
}

.effective-tools-empty {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
  font-style: italic;
}

.skills-checkbox-group {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  width: 100%;
}

.skill-checkbox-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 16px;
  background: var(--td-bg-color-secondarycontainer);
  border-radius: 8px;
  border: 1px solid var(--td-component-stroke);

  &:hover {
    border-color: var(--td-brand-color);
  }

  :deep(.t-checkbox__input) {
    margin-top: 2px;
  }

  :deep(.t-checkbox__label) {
    flex: 1;
    min-width: 0;
  }
}

.skill-item-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.skill-item-content--skill {
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}

.skill-item-badge {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--td-brand-color) 12%, transparent);
  color: var(--td-brand-color);
}

.skill-item-text {
  flex: 1;
  min-width: 0;
}

.skill-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
}

.skill-item-content--skill .skill-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-desc {
  font-size: 12px;
  line-height: 1.45;
  color: var(--td-text-color-secondary);

  &.is-clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    overflow: hidden;
    word-break: break-word;
  }
}

.empty-hint {
  margin: 0;
  color: var(--td-text-color-placeholder);
}

.knowledge-skill-warning {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin: 8px 0 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--td-warning-color-1, rgba(237, 118, 20, 0.08));
  color: var(--td-warning-color);
  font-size: 13px;
  line-height: 1.5;
}
</style>
