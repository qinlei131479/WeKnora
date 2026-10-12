<script setup>
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { RefreshCw, Upload } from 'lucide-vue-next'

import { userApi } from '@/api/harness/user_api'
import AgentWorkConfigForm from './AgentWorkConfigForm.vue'
import FallbackAvatar from '@/components/harness/common/FallbackAvatar.vue'
import { isBuiltinAgent, useAgentStore } from '@/stores/harness/agent'
import { generatePixelAvatar } from '@/utils/harness/pixelAvatar'
import { MAX_IMAGE_UPLOAD_SIZE_BYTES, MAX_IMAGE_UPLOAD_SIZE_MB } from '@/utils/harness/upload_limits'

const props = defineProps({
  backendOptions: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved'])

const { t } = useI18n()
const agentStore = useAgentStore()

const DEFAULT_AGENT_BACKEND_ID = 'ChatbotAgent'
const SUB_AGENT_BACKEND_ID = 'SubAgentBackend'
const DEFAULT_GLOBAL_SHARE_CONFIG = {
  version: 2,
  read_scope: { access_level: 'global', department_ids: [], user_uids: [] },
  manage_scope: null
}

const TAB_TO_SEGMENT = {
  model: 'model',
  prompts: 'prompt',
  knowledge: 'knowledges',
  tools: 'tools',
  mcp: 'mcps',
  skills: 'skills',
  subagents: 'subagents',
  advanced: 'advanced'
}

const showAgentModal = ref(false)
const editingAgentId = ref(null)
const canEditOpenedAgent = ref(true)
const agentModalActiveTab = ref('basic')
const agentIconUploading = ref(false)
const saving = ref(false)
const runtimeConfigFormRef = ref(null)
const agentIconInputRef = ref(null)
const agentShareConfig = ref(cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG))
const agentForm = reactive({
  slug: '',
  name: '',
  backend_id: DEFAULT_AGENT_BACKEND_ID,
  description: '',
  icon: ''
})

const originalAgentForm = ref({ name: '', description: '', icon: '' })

function cloneShareConfig(share) {
  if (!share) return cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG)
  const cloneScope = (scope) =>
    scope
      ? {
          access_level: scope.access_level,
          department_ids: [...(scope.department_ids || [])],
          user_uids: [...(scope.user_uids || [])]
        }
      : null
  return {
    version: share.version,
    read_scope: cloneScope(share.read_scope),
    manage_scope: cloneScope(share.manage_scope)
  }
}

const snapshotAgentForm = () => ({
  name: (agentForm.name || '').trim(),
  description: (agentForm.description || '').trim(),
  icon: (agentForm.icon || '').trim()
})

const hasProfileChanges = computed(() => {
  if (!editingAgentId.value) return false
  const currentForm = snapshotAgentForm()
  const baselineForm = originalAgentForm.value
  return (
    currentForm.name !== baselineForm.name ||
    currentForm.description !== baselineForm.description ||
    currentForm.icon !== baselineForm.icon
  )
})

const captureProfileBaseline = () => {
  originalAgentForm.value = snapshotAgentForm()
}

const normalizeAgent = (agent) => {
  const agentId = agent?.agent_id || agent?.slug || agent?.id
  return agentId
    ? { ...agent, id: agentId, agent_id: agentId, slug: agent?.slug || agentId }
    : agent
}

const runtimeConfigTabs = [
  { key: 'model', icon: 'control-platform', labelKey: 'agent.editor.modelConfig', descKey: 'agent.editor.modelConfigDesc' },
  { key: 'prompts', icon: 'file-paste', labelKey: 'agent.editor.promptsConfig', descKey: 'agent.editor.promptsConfigDesc' },
  { key: 'knowledge', icon: 'folder', labelKey: 'agent.editor.knowledgeConfig', descKey: 'agent.editor.knowledgeConfigDesc' },
  { key: 'tools', icon: 'tools', labelKey: 'agent.editor.toolsConfig', descKey: 'agent.editor.toolsConfigDesc' },
  { key: 'mcp', icon: 'server', labelKey: 'agentEditor.mcp.label', descKey: 'agentEditor.mcp.desc' },
  { key: 'skills', icon: 'lightbulb', labelKey: 'agent.editor.skillsConfig', descKey: 'agent.editor.skillsConfigDesc' },
  { key: 'advanced', icon: 'setting', labelKey: 'agent.workManage.editor.advanced', descKey: 'agent.workManage.editor.advancedDesc' },
  { key: 'subagents', icon: 'usergroup', labelKey: 'agent.workManage.editor.subagents', descKey: 'agent.workManage.editor.subagentsDesc' }
]

const agentModalNavGroups = computed(() => {
  const basicItem = { key: 'basic', icon: 'info-circle', label: t('agent.editor.basicInfo') }
  if (!editingAgentId.value) {
    return [{ key: 'basic', label: t('agentEditor.navGroups.basic'), items: [basicItem] }]
  }
  const itemMap = Object.fromEntries(
    runtimeConfigTabs.map((item) => [
      item.key,
      { key: item.key, icon: item.icon, label: t(item.labelKey) }
    ])
  )
  return [
    {
      key: 'basic',
      label: t('agentEditor.navGroups.basic'),
      items: [basicItem, itemMap.model, itemMap.prompts]
    },
    {
      key: 'knowledge',
      label: t('agentEditor.navGroups.knowledge'),
      items: [itemMap.knowledge]
    },
    {
      key: 'capability',
      label: t('agentEditor.navGroups.capability'),
      items: [itemMap.tools, itemMap.mcp, itemMap.skills]
    },
    {
      key: 'advanced',
      label: t('agent.workManage.editor.navAdvanced'),
      items: [itemMap.advanced, itemMap.subagents]
    }
  ]
})

const runtimeSectionMeta = computed(() => runtimeConfigTabs.find((item) => item.key === agentModalActiveTab.value))
const isWorkAgentModalTab = (key) => Boolean(TAB_TO_SEGMENT[key])
const runtimeConfigSegment = computed(() => TAB_TO_SEGMENT[agentModalActiveTab.value] || 'model')

const getDefaultBackendId = () => {
  const values = (props.backendOptions || []).map((backend) => backend.value)
  if (values.includes(DEFAULT_AGENT_BACKEND_ID)) return DEFAULT_AGENT_BACKEND_ID
  return values[0] || DEFAULT_AGENT_BACKEND_ID
}

const isSubAgentBackend = (backendId) => backendId === SUB_AGENT_BACKEND_ID

const backendRadioOptions = computed(() => {
  const labelFor = (value, fallback) => {
    if (value === DEFAULT_AGENT_BACKEND_ID) return t('agent.workManage.editor.backendAssistant')
    if (value === SUB_AGENT_BACKEND_ID) return t('agent.workManage.editor.backendSubagent')
    return fallback || value
  }
  const seen = new Set()
  const options = []
  const push = (value, fallback) => {
    if (!value || seen.has(value)) return
    seen.add(value)
    options.push({ value, label: labelFor(value, fallback) })
  }
  const api = props.backendOptions || []
  const apiMap = new Map(api.map((backend) => [backend.value, backend.label]))
  if (api.length) {
    if (apiMap.has(DEFAULT_AGENT_BACKEND_ID)) {
      push(DEFAULT_AGENT_BACKEND_ID, apiMap.get(DEFAULT_AGENT_BACKEND_ID))
    }
    if (apiMap.has(SUB_AGENT_BACKEND_ID)) {
      push(SUB_AGENT_BACKEND_ID, apiMap.get(SUB_AGENT_BACKEND_ID))
    }
    for (const backend of api) push(backend.value, backend.label)
  } else {
    push(DEFAULT_AGENT_BACKEND_ID)
    push(SUB_AGENT_BACKEND_ID)
  }
  push(agentForm.backend_id)
  return options
})

const selectedBackendDesc = computed(() => {
  if (agentForm.backend_id === SUB_AGENT_BACKEND_ID) {
    return t('agent.workManage.editor.backendDescSubagent')
  }
  if (agentForm.backend_id === DEFAULT_AGENT_BACKEND_ID) {
    return t('agent.workManage.editor.backendDescAssistant')
  }
  return t('agent.workManage.editor.backendDesc')
})

const getInitialShareConfig = () => cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG)

const normalizeShareConfigForPayload = () => {
  if (isBuiltinAgent({ id: editingAgentId.value })) {
    return cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG)
  }
  if (!editingAgentId.value) return cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG)
  return cloneShareConfig(agentShareConfig.value || DEFAULT_GLOBAL_SHARE_CONFIG)
}

const agentModalTitle = computed(() =>
  editingAgentId.value ? t('agent.editor.editTitle') : t('agent.editor.createTitle')
)
const agentPreviewDefaultIcon = computed(() => {
  const seed = agentForm.name || editingAgentId.value
  return seed ? generatePixelAvatar(seed) : ''
})
const agentPreviewName = computed(
  () => agentForm.name || editingAgentId.value || t('agent.title')
)

const generateDefaultAgentProfile = () => {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  return {
    name: t('agent.workManage.editor.defaultName'),
    slug: `agent-${stamp}`
  }
}

const resetAgentForm = () => {
  const defaults = editingAgentId.value ? {} : generateDefaultAgentProfile()
  Object.assign(agentForm, {
    slug: '',
    name: '',
    backend_id: getDefaultBackendId(),
    description: '',
    icon: '',
    ...defaults
  })
  agentShareConfig.value = getInitialShareConfig()
}

const openCreate = () => {
  editingAgentId.value = null
  canEditOpenedAgent.value = true
  agentModalActiveTab.value = 'basic'
  resetAgentForm()
  agentStore.resetAgentConfig()
  showAgentModal.value = true
}

const openEdit = async (agent) => {
  const agentId = typeof agent === 'string' ? agent : agent?.id
  if (!agentId) return

  let detail
  try {
    detail = await agentStore.fetchAgentDetail(agentId, true)
  } catch (error) {
    MessagePlugin.error(error.message || t('agent.workManage.loadFailed'))
    return
  }
  if (!detail?.id) return

  canEditOpenedAgent.value = !!detail.can_manage
  editingAgentId.value = detail.id
  agentModalActiveTab.value = 'basic'
  Object.assign(agentForm, {
    slug: detail.id || detail.slug || '',
    name: detail.name || '',
    backend_id: detail.backend_id || DEFAULT_AGENT_BACKEND_ID,
    description: detail.description || '',
    icon: detail.icon || ''
  })
  agentShareConfig.value = isBuiltinAgent(detail)
    ? cloneShareConfig(DEFAULT_GLOBAL_SHARE_CONFIG)
    : cloneShareConfig(detail.share_config || DEFAULT_GLOBAL_SHARE_CONFIG)
  await agentStore.selectAgent(detail.id, { allowSubagent: true })
  captureProfileBaseline()
  showAgentModal.value = true
}

const restoreChatAgentSelectionIfNeeded = async () => {
  if (!agentStore.selectedAgent?.is_subagent) return
  const fallbackAgentId = (agentStore.agents || []).find((agent) => !agent.is_subagent)?.id
  if (fallbackAgentId) await agentStore.selectAgent(fallbackAgentId)
}

const closeAgentModal = async () => {
  if (saving.value || agentIconUploading.value) return
  showAgentModal.value = false
  await restoreChatAgentSelectionIfNeeded()
}

const triggerAgentIconUpload = () => {
  if (!canEditOpenedAgent.value || agentIconUploading.value) return
  agentIconInputRef.value?.click()
}

const onAgentIconFileChange = (event) => {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (file) beforeAgentIconUpload(file)
}

const beforeAgentIconUpload = (file) => {
  if (!file.type.startsWith('image/')) {
    MessagePlugin.error(t('agent.workManage.editor.iconUploadType'))
    return false
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    MessagePlugin.error(t('agent.workManage.editor.iconUploadSize', { size: MAX_IMAGE_UPLOAD_SIZE_MB }))
    return false
  }

  uploadAgentIcon(file)
  return false
}

const uploadAgentIcon = async (file) => {
  if (!canEditOpenedAgent.value) return
  agentIconUploading.value = true
  try {
    const data = await userApi.uploadImage(file)
    agentForm.icon = data.image_url || data.url || ''
    MessagePlugin.success(t('agent.workManage.editor.iconUploaded'))
  } catch (error) {
    MessagePlugin.error(error.message || t('agent.workManage.editor.iconUploadFailed'))
  } finally {
    agentIconUploading.value = false
  }
}

const copyAgentId = async () => {
  const id = agentForm.slug || editingAgentId.value
  if (!id) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(id)
    } else {
      const textarea = document.createElement('textarea')
      textarea.value = id
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
    }
    MessagePlugin.success(t('common.copied'))
  } catch {
    MessagePlugin.error(t('common.copyFailed'))
  }
}

const buildAgentPayload = () => {
  const payload = {
    name: agentForm.name.trim(),
    description: agentForm.description.trim() || null,
    icon: agentForm.icon.trim() || null,
    share_config: normalizeShareConfigForPayload(),
    is_subagent: isSubAgentBackend(agentForm.backend_id)
  }

  if (!editingAgentId.value) {
    payload.slug = agentForm.slug.trim() || undefined
    payload.backend_id = agentForm.backend_id
  }

  return payload
}

const saveAgent = async () => {
  if (!canEditOpenedAgent.value) {
    MessagePlugin.warning(t('agent.workManage.editor.notEditable'))
    return
  }
  if (!agentForm.name.trim()) {
    agentModalActiveTab.value = 'basic'
    MessagePlugin.error(t('agent.workManage.editor.nameRequired'))
    return
  }
  if (editingAgentId.value && runtimeConfigFormRef.value?.isModelMissing?.()) {
    agentModalActiveTab.value = 'model'
    MessagePlugin.error(t('agent.workManage.editor.modelRequired'))
    return
  }

  saving.value = true
  try {
    const payload = buildAgentPayload()
    if (editingAgentId.value) {
      const validatedConfig = runtimeConfigFormRef.value?.validateAndFilterConfig?.()
      if (
        validatedConfig &&
        JSON.stringify(validatedConfig) !== JSON.stringify(agentStore.agentConfig)
      ) {
        agentStore.updateAgentConfig(validatedConfig)
      }
      if (agentStore.hasConfigChanges) {
        payload.config_json = { context: agentStore.agentConfig }
      }
      const updated = await agentStore.updateAgentProfile(editingAgentId.value, payload)
      agentStore.originalAgentConfig = { ...agentStore.agentConfig }
      captureProfileBaseline()
      emit('saved', { mode: 'edit', agent: updated })
      MessagePlugin.success(t('agent.workManage.editor.saved'))
    } else {
      const created = await agentStore.createAgent(payload)
      emit('saved', { mode: 'create', agent: normalizeAgent(created) })
      MessagePlugin.success(t('agent.workManage.editor.created'))
    }
    showAgentModal.value = false
    await restoreChatAgentSelectionIfNeeded()
  } catch (error) {
    MessagePlugin.error(error.message || t('agent.workManage.editor.saveFailed'))
  } finally {
    saving.value = false
  }
}

const isNavItemDirty = (key) => {
  if (key === 'basic') return hasProfileChanges.value
  return agentStore.hasConfigChanges
}

defineExpose({
  openCreate,
  openEdit,
  close: closeAgentModal
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="showAgentModal" class="settings-overlay" @click.self="closeAgentModal">
        <div class="settings-modal">
          <button class="close-btn" :aria-label="t('common.close')" @click="closeAgentModal">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>
          <div class="settings-container">
            <div class="settings-sidebar">
              <div class="sidebar-header">
                <h2 class="sidebar-title">{{ agentModalTitle }}</h2>
              </div>
              <div class="settings-nav">
                <template v-for="group in agentModalNavGroups" :key="group.key">
                  <div class="nav-group-title">{{ group.label }}</div>
                  <div
                    v-for="item in group.items"
                    :key="item.key"
                    :class="['nav-item', { active: agentModalActiveTab === item.key }]"
                    @click="agentModalActiveTab = item.key"
                  >
                    <t-icon :name="item.icon" class="nav-icon" />
                    <span class="nav-label">{{ item.label }}</span>
                    <span v-if="isNavItemDirty(item.key)" class="nav-dirty-dot" />
                  </div>
                </template>
              </div>
            </div>
            <div class="settings-content">
              <div
                class="content-wrapper"
                :class="{ 'content-wrapper--prompts': agentModalActiveTab === 'prompts' }"
              >
                <section v-show="agentModalActiveTab === 'basic'" class="agent-modal-section">
                  <div class="section-header">
                    <h2>{{ t('agent.editor.basicInfo') }}</h2>
                    <p class="section-description">{{ t('agent.workManage.editor.basicInfoDesc') }}</p>
                    <p v-if="!canEditOpenedAgent" class="section-description readonly-hint">
                      {{ t('agent.workManage.editor.readonlyHint') }}
                    </p>
                  </div>
                  <div class="settings-group">
                    <div v-if="!editingAgentId" class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('agent.workManage.editor.slug') }}</label>
                        <p class="desc">{{ t('agent.workManage.editor.slugDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-input
                          v-model="agentForm.slug"
                          :placeholder="t('agent.workManage.editor.slugPlaceholder')"
                        />
                      </div>
                    </div>

                    <div v-else class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('agent.editor.agentId') }}</label>
                        <p class="desc">{{ t('agent.editor.agentIdDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <div class="agent-id-field">
                          <code class="agent-id-value" :title="agentForm.slug || editingAgentId">
                            {{ agentForm.slug || editingAgentId }}
                          </code>
                          <t-tooltip :content="t('common.copy')" placement="top">
                            <t-button
                              theme="default"
                              size="small"
                              variant="text"
                              class="agent-id-copy"
                              @click="copyAgentId"
                            >
                              <t-icon name="file-copy" />
                            </t-button>
                          </t-tooltip>
                        </div>
                      </div>
                    </div>

                    <div class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('agent.workManage.editor.backend') }} <span class="required">*</span></label>
                        <p class="desc">{{ selectedBackendDesc }}</p>
                      </div>
                      <div class="setting-control">
                        <t-radio-group
                          v-model="agentForm.backend_id"
                          :disabled="Boolean(editingAgentId) || !canEditOpenedAgent"
                          class="backend-radio-group"
                        >
                          <t-radio-button
                            v-for="option in backendRadioOptions"
                            :key="option.value"
                            :value="option.value"
                          >
                            {{ option.label }}
                          </t-radio-button>
                        </t-radio-group>
                      </div>
                    </div>

                    <div class="setting-row">
                      <div class="setting-info">
                        <label>
                          {{ t('agent.editor.name') }}
                          <span v-if="canEditOpenedAgent" class="required">*</span>
                        </label>
                        <p class="desc">{{ t('agentEditor.desc.name') }}</p>
                      </div>
                      <div class="setting-control">
                        <div class="name-input-wrapper">
                          <input
                            ref="agentIconInputRef"
                            class="agent-icon-file-input"
                            type="file"
                            accept="image/*"
                            :disabled="!canEditOpenedAgent || agentIconUploading"
                            @change="onAgentIconFileChange"
                          />
                          <div
                            class="agent-icon-upload"
                            :class="{
                              uploading: agentIconUploading,
                              'is-empty': !agentForm.icon && !editingAgentId,
                              'is-readonly': !canEditOpenedAgent
                            }"
                            @click="triggerAgentIconUpload"
                          >
                            <FallbackAvatar
                              v-if="agentForm.icon || editingAgentId"
                              :src="agentForm.icon"
                              :default-src="agentPreviewDefaultIcon"
                              :name="agentPreviewName"
                              :seed="editingAgentId || agentForm.slug || agentForm.name"
                              kind="agent"
                              :size="40"
                              shape="rounded"
                              :alt="agentForm.name || t('agent.title')"
                              class="agent-icon-preview-avatar"
                            />
                            <div v-if="canEditOpenedAgent" class="agent-icon-mask">
                              <RefreshCw v-if="agentIconUploading" :size="14" class="spinning" />
                              <Upload v-else :size="14" />
                            </div>
                          </div>
                          <t-input
                            v-model="agentForm.name"
                            class="name-input"
                            :placeholder="t('agent.editor.namePlaceholder')"
                            :readonly="!canEditOpenedAgent"
                          />
                        </div>
                      </div>
                    </div>

                    <div class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('agent.editor.description') }}</label>
                        <p class="desc">{{ t('agentEditor.desc.description') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-textarea
                          v-model="agentForm.description"
                          :autosize="{ minRows: 2, maxRows: 4 }"
                          :placeholder="t('agent.editor.descriptionPlaceholder')"
                          :readonly="!canEditOpenedAgent"
                        />
                      </div>
                    </div>
                  </div>
                </section>

                <section
                  v-if="editingAgentId"
                  v-show="isWorkAgentModalTab(agentModalActiveTab)"
                  class="agent-modal-section work-section"
                >
                  <div v-if="runtimeSectionMeta" class="section-header">
                    <h2>{{ t(runtimeSectionMeta.labelKey) }}</h2>
                    <p class="section-description">{{ t(runtimeSectionMeta.descKey) }}</p>
                  </div>
                  <AgentWorkConfigForm
                    ref="runtimeConfigFormRef"
                    :segment="runtimeConfigSegment"
                    :show-segmented="false"
                  />
                </section>
              </div>
              <div class="settings-footer">
                <div class="settings-footer-actions">
                  <t-button variant="outline" :disabled="saving" @click="closeAgentModal">
                    {{ canEditOpenedAgent ? t('common.cancel') : t('common.close') }}
                  </t-button>
                  <t-button
                    v-if="canEditOpenedAgent"
                    theme="primary"
                    :loading="saving"
                    @click="saveAgent"
                  >
                    {{
                      editingAgentId
                        ? t('agent.editor.buttons.saveAndClose')
                        : t('agent.editor.buttons.create')
                    }}
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="less" scoped>
.settings-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.settings-modal {
  position: relative;
  width: 90vw;
  max-width: 1100px;
  height: 85vh;
  max-height: 750px;
  background: var(--td-bg-color-container);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--td-text-color-secondary);
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-primary);
  }
}

.settings-container {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.settings-sidebar {
  width: 208px;
  background-color: var(--td-bg-color-settings-modal);
  border-right: 1px solid var(--td-component-stroke);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  padding: 16px 14px 12px;
  border-bottom: 1px solid var(--td-component-stroke);
  flex-shrink: 0;
}

.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.settings-nav {
  flex: 1;
  padding: 8px 8px 12px;
  overflow-y: auto;
  min-height: 0;
}

.nav-group-title {
  padding: 6px 14px 2px;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;

  .settings-nav > &:first-child {
    padding-top: 2px;
  }

  .settings-nav > &:not(:first-child) {
    padding-top: 8px;
  }
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  color: var(--td-text-color-primary);
  user-select: none;

  &:hover {
    background-color: var(--td-bg-color-container-hover);
  }

  &.active {
    background-color: var(--td-bg-color-secondarycontainer);
    color: var(--td-brand-color);
    font-weight: 500;
  }
}

.nav-icon {
  margin-right: 9px;
  font-size: 16px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

.nav-label {
  flex: 1;
}

.nav-dirty-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--color-warning-600);
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--td-bg-color-container);
  min-width: 0;
  min-height: 0;
}

.content-wrapper {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 28px 40px 48px;
  box-sizing: border-box;

  &--prompts {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding-bottom: 16px;

    .work-section {
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }
  }
}

.section-header {
  margin-bottom: 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}

.section-description {
  margin: 0;
  font-size: 14px;
  color: var(--td-text-color-placeholder);
  line-height: 22px;

  &.readonly-hint {
    margin-top: 6px;
    color: var(--td-text-color-secondary);
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
  flex: 0 0 42%;
  max-width: 42%;
  min-width: 0;

  label {
    font-size: 15px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    display: block;
    margin-bottom: 4px;

    .required {
      color: var(--td-error-color);
      margin-left: 2px;
    }
  }

  .desc {
    font-size: 13px;
    color: var(--td-text-color-secondary);
    margin: 0;
    line-height: 1.5;
  }
}

.setting-control {
  flex: 1 1 58%;
  min-width: 0;
  max-width: 58%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-start;

  :deep(.t-select),
  :deep(.t-input),
  :deep(.t-textarea) {
    width: 100%;
    min-width: 0;
  }

  &.setting-control-full {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    justify-content: flex-start;
  }
}

.backend-radio-group {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.name-input-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  .name-input {
    flex: 1;
  }
}

.agent-icon-upload {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  overflow: hidden;
  border: 1px solid var(--td-component-stroke);
  border-radius: 10px;
  background: var(--td-bg-color-secondarycontainer);
  cursor: pointer;
  flex-shrink: 0;

  .agent-icon-preview-avatar {
    width: 100%;
    height: 100%;
    border: 0;
  }

  &:hover .agent-icon-mask,
  &:focus-within .agent-icon-mask,
  &.uploading .agent-icon-mask,
  &.is-empty .agent-icon-mask {
    opacity: 1;
  }

  &.is-empty {
    border-style: dashed;
    background: var(--td-bg-color-container);
  }

  &.is-readonly {
    cursor: default;
  }
}

.agent-icon-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: color-mix(in srgb, var(--gray-900) 62%, transparent);
  color: var(--gray-0);
  opacity: 0;
  transition: opacity 0.16s ease;
}

.agent-icon-upload.is-empty .agent-icon-mask {
  background: transparent;
  color: var(--td-text-color-placeholder);
}

.agent-id-field {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 6px 8px 6px 12px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;

  .agent-id-value {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    font-family: var(--app-font-family-mono);
    font-size: 13px;
    line-height: 1.5;
    color: var(--td-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .agent-id-copy {
    flex-shrink: 0;
    color: var(--td-text-color-secondary);

    &:hover {
      color: var(--td-brand-color);
    }
  }
}

.settings-footer {
  padding: 12px 40px;
  border-top: 1px solid var(--td-component-stroke);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-shrink: 0;
  background-color: var(--td-bg-color-container);
}

.settings-footer-actions {
  display: flex;
  gap: 12px;
}

.agent-modal-section {
  min-height: 0;
  background: var(--td-bg-color-container);
}

.work-section {
  display: flex;
  flex-direction: column;
  min-height: 100%;

  :deep(.agent-work-config-form) {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    background: transparent;
  }

  :deep(.work-config-content) {
    flex: 1;
    min-width: 0;
    min-height: 0;
    padding: 0;
    overflow: visible;
  }
}

.agent-icon-file-input {
  display: none;
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
