<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="close">
        <div class="settings-modal skill-editor-modal" role="dialog" aria-modal="true">
          <button type="button" class="close-btn" :aria-label="t('common.close')" @click="close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
          </button>

          <div class="settings-container">
            <div class="settings-sidebar">
              <div class="sidebar-header">
                <h2 class="sidebar-title">{{ modalTitle }}</h2>
              </div>
              <div class="settings-nav">
                <div class="nav-group-title">{{ t('ext.skills.form.navGroup') }}</div>
                <div
                  :class="['nav-item', { active: currentSection === 'content' }]"
                  @click="currentSection = 'content'"
                >
                  <t-icon name="file-1" class="nav-icon" />
                  <span class="nav-label">{{ t('ext.skills.form.navContent') }}</span>
                </div>
                <div
                  v-if="showEnableSection"
                  :class="['nav-item', { active: currentSection === 'enable' }]"
                  @click="currentSection = 'enable'"
                >
                  <t-icon name="setting" class="nav-icon" />
                  <span class="nav-label">{{ t('ext.skills.form.navEnable') }}</span>
                </div>
                <div
                  v-if="showDepsSection"
                  :class="['nav-item', { active: currentSection === 'deps' }]"
                  @click="currentSection = 'deps'"
                >
                  <t-icon name="layers" class="nav-icon" />
                  <span class="nav-label">{{ t('ext.skills.form.navDeps') }}</span>
                </div>
              </div>
            </div>

            <div class="settings-content">
              <t-loading :loading="detailLoading" class="skill-detail-loading">
                <div
                  class="content-wrapper"
                  :class="{ 'content-wrapper--workspace': currentSection === 'content' }"
                >
                  <div v-show="currentSection === 'content'" class="workspace">
                    <div class="tree-container">
                      <div class="tree-chrome" aria-hidden="true" />
                      <div class="tree-body">
                        <div class="tree-header">
                          <span class="label">{{ t('ext.skills.detail.projectStructure') }}</span>
                          <div class="tree-actions">
                            <t-tooltip
                              v-if="canEditSkillFiles"
                              :content="t('ext.skills.detail.newFile')"
                            >
                              <button type="button" @click="openCreateModal(false)"><FilePlus :size="14" /></button>
                            </t-tooltip>
                            <t-tooltip
                              v-if="canEditSkillFiles"
                              :content="t('ext.skills.detail.newDir')"
                            >
                              <button type="button" @click="openCreateModal(true)"><FolderPlus :size="14" /></button>
                            </t-tooltip>
                          </div>
                        </div>
                        <div class="tree-content">
                          <FileTreeComponent
                            v-if="treeData.length"
                            v-model:selectedKeys="selectedTreeKeys"
                            v-model:expandedKeys="expandedKeys"
                            :tree-data="treeData"
                            @select="handleTreeSelect"
                          />
                          <t-empty v-else :description="t('ext.skills.detail.notFound')" />
                        </div>
                      </div>
                    </div>
                    <div class="editor-container">
                      <div class="editor-main">
                        <t-empty
                          v-if="!selectedPath || selectedIsDir"
                          :description="t('ext.skills.detail.pickFile')"
                          class="mt-40"
                        />
                        <AgentFilePreview
                          v-else
                          :file="selectedFilePreview"
                          :file-path="selectedPath"
                          :show-download="false"
                          :show-fullscreen="false"
                          :editable="canEditSkillFiles"
                          :edit-all-text="true"
                          :saving="savingFile"
                          :full-height="true"
                          container-class="skill-file-preview"
                          content-class="skill-file-preview-content"
                          @save="saveCurrentFile"
                        />
                      </div>
                    </div>
                  </div>

                  <div v-show="currentSection === 'enable'" class="config-view">
                    <div class="config-header">
                      <div class="text">
                        <h3>{{ t('ext.skills.detail.shareTitle') }}</h3>
                        <p>{{ t('ext.skills.detail.shareDesc') }}</p>
                      </div>
                    </div>
                    <div class="settings-stack">
                      <section class="settings-card">
                        <div class="settings-card-main">
                          <div class="settings-card-title">{{ t('ext.skills.detail.enabledTitle') }}</div>
                          <div class="settings-card-desc">
                            {{ t('ext.skills.detail.enabledDesc') }}
                          </div>
                        </div>
                        <div class="settings-card-action">
                          <span class="status-pill" :class="enabledForm ? 'enabled' : 'disabled'">
                            {{
                              enabledForm
                                ? t('ext.skills.detail.enabled')
                                : t('ext.skills.detail.disabled')
                            }}
                          </span>
                          <t-switch v-model="enabledForm" :disabled="!canManage" />
                        </div>
                      </section>
                      <section class="settings-card scope-card">
                        <div class="settings-card-main">
                          <div class="settings-card-title">{{ t('ext.skills.detail.scopeTitle') }}</div>
                          <div class="settings-card-desc">
                            {{ t('ext.skills.detail.scopeDesc') }}
                          </div>
                        </div>
                        <div v-if="isBuiltin" class="readonly-scope-hint">
                          {{ t('ext.skills.detail.builtinScopeHint') }}
                        </div>
                        <div v-else-if="!canManage" class="readonly-scope-hint">
                          {{ t('ext.skills.detail.readonlyScopeHint') }}
                        </div>
                        <ShareConfigForm
                          v-else
                          ref="shareConfigFormRef"
                          v-model="shareConfigForm"
                          :auto-select-user-dept="true"
                          :allowed-access-levels="allowedSkillAccessLevels"
                        />
                      </section>
                    </div>
                  </div>

                  <div v-show="currentSection === 'deps'" class="config-view">
                    <div class="config-header">
                      <div class="text">
                        <h3>{{ t('ext.skills.detail.depsTitle') }}</h3>
                        <p>{{ t('ext.skills.detail.depsDesc') }}</p>
                      </div>
                      <t-button
                        v-if="canEditDeps"
                        theme="primary"
                        :loading="savingDependencies"
                        @click="saveDependencies"
                      >
                        <template #icon><t-icon name="save" /></template>
                        {{ t('ext.skills.detail.updateDeps') }}
                      </t-button>
                    </div>
                    <div class="dependency-groups">
                      <section
                        v-for="group in dependencyGroups"
                        :key="group.key"
                        class="dependency-card"
                        :class="{ readonly: !canEditDeps }"
                      >
                        <div class="dependency-card-header">
                          <div class="dependency-title-block">
                            <div class="dependency-title-row">
                              <h4>{{ group.title }}</h4>
                              <span class="dependency-count">
                                {{
                                  t('ext.skills.detail.selectedCount', {
                                    count: getDependencyValues(group).length
                                  })
                                }}
                              </span>
                            </div>
                            <p>{{ group.description }}</p>
                          </div>
                          <t-popup
                            v-if="canEditDeps"
                            trigger="click"
                            placement="bottom-right"
                            overlay-class-name="dependency-selection-popover"
                          >
                            <t-button size="small" class="dependency-action-btn dependency-select-btn">
                              <Plus :size="13" />
                              <span>{{ t('ext.skills.detail.pickDeps') }}</span>
                              <ChevronDown :size="12" class="dependency-select-chevron" />
                            </t-button>
                            <template #content>
                              <div class="selection-dropdown" @mousedown.stop @click.stop>
                                <div class="selection-dropdown-header">
                                  <div class="selection-dropdown-title">{{ group.title }}</div>
                                  <div class="selection-dropdown-subtitle">{{ group.dropdownHint }}</div>
                                </div>
                                <t-input
                                  v-model="dependencySearch[group.key]"
                                  size="small"
                                  clearable
                                  class="selection-search"
                                  :placeholder="
                                    t('ext.skills.detail.searchDeps', {
                                      name: group.shortTitle
                                    })
                                  "
                                  @mousedown.stop
                                  @click.stop
                                />
                                <div
                                  v-if="getFilteredDependencyOptions(group).length"
                                  class="selection-list"
                                >
                                  <div
                                    v-for="option in getFilteredDependencyOptions(group)"
                                    :key="option.value"
                                    role="checkbox"
                                    :aria-checked="isDependencySelected(group, option.value)"
                                    tabindex="0"
                                    class="selection-item"
                                    :class="{ selected: isDependencySelected(group, option.value) }"
                                    @mousedown.stop
                                    @click.stop="
                                      toggleDependency(
                                        group,
                                        option.value,
                                        !isDependencySelected(group, option.value)
                                      )
                                    "
                                  >
                                    <span class="selection-item-content">
                                      <t-checkbox
                                        :checked="isDependencySelected(group, option.value)"
                                        @click.stop
                                        @change="(checked) => toggleDependency(group, option.value, checked)"
                                      />
                                      <span class="selection-label">{{ option.label }}</span>
                                    </span>
                                  </div>
                                </div>
                                <div v-else class="selection-empty">
                                  {{
                                    group.options.length
                                      ? t('ext.skills.detail.noMatchDeps')
                                      : t('ext.skills.detail.noDeps')
                                  }}
                                </div>
                              </div>
                            </template>
                          </t-popup>
                          <t-button v-else size="small" disabled class="dependency-action-btn">
                            {{
                              isBuiltin
                                ? t('ext.skills.detail.systemMaintained')
                                : t('ext.skills.detail.readonly')
                            }}
                          </t-button>
                        </div>
                        <div v-if="getDependencyValues(group).length" class="dependency-chip-list">
                          <span
                            v-for="value in getDependencyValues(group)"
                            :key="value"
                            class="dependency-chip"
                            :title="getDependencyOptionLabel(group, value)"
                          >
                            <span>{{ getDependencyOptionLabel(group, value) }}</span>
                            <button
                              v-if="canEditDeps"
                              type="button"
                              class="dependency-chip-remove"
                              :aria-label="
                                t('ext.skills.detail.removeAria', {
                                  name: getDependencyOptionLabel(group, value)
                                })
                              "
                              @click="removeDependency(group, value)"
                            >
                              <X :size="12" />
                            </button>
                          </span>
                        </div>
                        <div v-else class="dependency-empty-hint">{{ group.emptyText }}</div>
                      </section>
                    </div>
                  </div>
                </div>
              </t-loading>

              <div class="settings-footer">
                <div class="settings-footer-actions">
                  <t-button variant="outline" @click="close">{{ t('common.cancel') }}</t-button>
                  <t-button
                    v-if="showSaveAndClose"
                    theme="primary"
                    :loading="savingShareConfig"
                    @click="saveShareConfigAndClose"
                  >
                    {{ t('ext.skills.form.saveAndClose') }}
                  </t-button>
                  <t-button
                    v-if="canUninstall"
                    theme="danger"
                    variant="outline"
                    :loading="deleting"
                    @click="confirmUninstall"
                  >
                    {{ t('ext.skills.uninstall') }}
                  </t-button>
                  <t-button
                    v-if="canExport"
                    theme="primary"
                    :loading="exporting"
                    @click="handleExport"
                  >
                    {{ t('ext.skills.detail.export') }}
                  </t-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <t-dialog
    v-model:visible="createModalVisible"
    attach="body"
    placement="center"
    :header="
      createForm.isDir
        ? t('ext.skills.detail.newDir')
        : t('ext.skills.detail.newFile')
    "
    :confirm-btn="t('common.confirm')"
    :cancel-btn="t('ext.cancel')"
    :confirm-loading="creatingNode"
    :width="400"
    @confirm="handleCreateNode"
  >
    <t-form layout="vertical" class="pt-12">
      <t-form-item :label="t('ext.skills.detail.pathRelative')" required>
        <t-input v-model="createForm.path" placeholder="src/main.py" />
      </t-form-item>
      <t-form-item v-if="!createForm.isDir" :label="t('ext.skills.detail.content')">
        <t-textarea v-model="createForm.content" :autosize="{ minRows: 5 }" />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'
import { ChevronDown, FilePlus, FolderPlus, Plus, X } from 'lucide-vue-next'
import { skillApi } from '@/api/runtime/skill'
import AgentFilePreview from '@harness/components/AgentFilePreview.vue'
import FileTreeComponent from '@harness/components/FileTreeComponent.vue'
import ShareConfigForm from '@harness/components/ShareConfigForm.vue'
import { getPreviewTypeByPath } from '@harness/utils/file_preview'

const props = defineProps({
  open: { type: Boolean, default: false },
  skill: { type: Object, default: null }
})

const emit = defineEmits(['update:open', 'submitted'])
const { t } = useI18n()

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const currentSection = ref('content')
const detailLoading = ref(false)
const exporting = ref(false)
const deleting = ref(false)
const savingFile = ref(false)
const savingShareConfig = ref(false)
const savingDependencies = ref(false)
const creatingNode = ref(false)
const createModalVisible = ref(false)
const createForm = reactive({ path: '', isDir: false, content: '' })
const currentSkill = ref(null)
const enabledForm = ref(true)
const shareConfigFormRef = ref(null)
const allowedSkillAccessLevels = ref(['user'])
const shareConfigForm = ref({
  version: 2,
  read_scope: { access_level: 'user', department_ids: [], user_uids: [] },
  manage_scope: null
})
const treeData = ref([])
const selectedTreeKeys = ref([])
const expandedKeys = ref([])
const selectedPath = ref('')
const selectedIsDir = ref(false)
const fileContent = ref('')
const dependencyOptions = reactive({ tools: [], mcps: [], skills: [] })
const dependencyForm = reactive({
  tool_dependencies: [],
  mcp_dependencies: [],
  skill_dependencies: []
})
const dependencySearch = reactive({ tools: '', mcps: '', skills: '' })

const isPersonal = computed(
  () => props.skill?.sourceScope === 'personal' || props.skill?.source_scope === 'personal'
)
const isBuiltin = computed(
  () => (currentSkill.value?.source_type || props.skill?.sourceType || props.skill?.source_type) === 'builtin'
)
const canManage = computed(() => (currentSkill.value || props.skill)?.can_manage !== false && !isPersonal.value)
const canEditSkillFiles = computed(() => canManage.value && !isBuiltin.value)
const showEnableSection = computed(() => !isPersonal.value)
const showDepsSection = computed(() => !isPersonal.value)
const canEditDeps = computed(() => canManage.value && !isBuiltin.value)
const canUninstall = computed(() => (props.skill?.can_manage !== false) && !isBuiltin.value)
const canExport = computed(() => !isPersonal.value && canManage.value)
const showSaveAndClose = computed(() => currentSection.value === 'enable' && canManage.value)
const modalTitle = computed(() =>
  canManage.value
    ? t('ext.skills.form.manageTitle')
    : t('ext.skills.form.viewTitle')
)
const selectedFilePreview = computed(() => ({
  content: fileContent.value,
  previewType: getPreviewTypeByPath(selectedPath.value),
  supported: true
}))

const toolDependencyOptions = computed(() =>
  (dependencyOptions.tools || []).map((item) =>
    typeof item === 'object'
      ? { label: item.name || item.slug, value: item.slug || item.id }
      : { label: item, value: item }
  )
)
const mcpDependencyOptions = computed(() =>
  (dependencyOptions.mcps || []).map((item) => ({ label: item, value: item }))
)
const skillDependencyOptions = computed(() =>
  (dependencyOptions.skills || [])
    .filter((item) => item !== (currentSkill.value?.slug || props.skill?.slug))
    .map((item) => ({ label: item, value: item }))
)
const dependencyGroups = computed(() => [
  {
    key: 'tools',
    formKey: 'tool_dependencies',
    title: t('ext.skills.detail.depToolsTitle'),
    shortTitle: t('ext.skills.detail.depToolsShort'),
    description: t('ext.skills.detail.depToolsDesc'),
    dropdownHint: t('ext.skills.detail.depToolsHint'),
    emptyText: t('ext.skills.detail.depToolsEmpty'),
    options: toolDependencyOptions.value
  },
  {
    key: 'mcps',
    formKey: 'mcp_dependencies',
    title: t('ext.skills.detail.depMcpTitle'),
    shortTitle: 'MCP',
    description: t('ext.skills.detail.depMcpDesc'),
    dropdownHint: t('ext.skills.detail.depMcpHint'),
    emptyText: t('ext.skills.detail.depMcpEmpty'),
    options: mcpDependencyOptions.value
  },
  {
    key: 'skills',
    formKey: 'skill_dependencies',
    title: t('ext.skills.detail.depSkillTitle'),
    shortTitle: 'Skill',
    description: t('ext.skills.detail.depSkillDesc'),
    dropdownHint: t('ext.skills.detail.depSkillHint'),
    emptyText: t('ext.skills.detail.depSkillEmpty'),
    options: skillDependencyOptions.value
  }
])

const getDependencyValues = (group) => dependencyForm[group.formKey] || []
const getDependencyOptionLabel = (group, value) =>
  group.options.find((item) => item.value === value)?.label || value
const getFilteredDependencyOptions = (group) => {
  const keyword = String(dependencySearch[group.key] || '')
    .trim()
    .toLowerCase()
  if (!keyword) return group.options
  return group.options.filter((option) => {
    const label = String(option.label || '').toLowerCase()
    const value = String(option.value || '').toLowerCase()
    return label.includes(keyword) || value.includes(keyword)
  })
}
const isDependencySelected = (group, value) => getDependencyValues(group).includes(value)
const toggleDependency = (group, value, checked) => {
  if (!canEditDeps.value) return
  const values = getDependencyValues(group)
  if (checked) {
    if (!values.includes(value)) dependencyForm[group.formKey] = [...values, value]
    return
  }
  dependencyForm[group.formKey] = values.filter((item) => item !== value)
}
const removeDependency = (group, value) => toggleDependency(group, value, false)

const cloneShareConfig = (config) => ({
  version: 2,
  read_scope:
    config?.version === 2
      ? config.read_scope
        ? {
            access_level: config.read_scope.access_level || 'global',
            department_ids: [...(config.read_scope.department_ids || [])],
            user_uids: [...(config.read_scope.user_uids || [])]
          }
        : null
      : {
          access_level: config?.access_level || 'user',
          department_ids: [...(config?.department_ids || [])],
          user_uids: [...(config?.user_uids || [])]
        },
  manage_scope:
    config?.version === 2 && config.manage_scope
      ? {
          access_level: config.manage_scope.access_level || 'global',
          department_ids: [...(config.manage_scope.department_ids || [])],
          user_uids: [...(config.manage_scope.user_uids || [])]
        }
      : null
})

const syncShareConfigFromSkill = (skillRecord) => {
  enabledForm.value = skillRecord?.enabled !== false
  shareConfigForm.value = cloneShareConfig(skillRecord?.share_config)
}

const syncDependencyFormFromSkill = (skillRecord) => {
  dependencyForm.tool_dependencies = [...(skillRecord?.tool_dependencies || [])]
  dependencyForm.mcp_dependencies = [...(skillRecord?.mcp_dependencies || [])]
  dependencyForm.skill_dependencies = [...(skillRecord?.skill_dependencies || [])]
}

const SKILL_TREE_NOISE_NAMES = new Set(['__pycache__', '.DS_Store', '.git', '.venv', 'venv'])
const SKILL_TREE_NOISE_SUFFIXES = ['.pyc', '.pyo', '.pyd']

const isSkillTreeNoise = (node) => {
  const name = String(node?.name || '')
  if (SKILL_TREE_NOISE_NAMES.has(name)) return true
  return SKILL_TREE_NOISE_SUFFIXES.some((suffix) => name.endsWith(suffix))
}

const normalizeTree = (nodes) =>
  (nodes || [])
    .filter((node) => !isSkillTreeNoise(node))
    .map((node) => ({
      title: node.name,
      key: node.path,
      isLeaf: !node.is_dir,
      path: node.path,
      is_dir: node.is_dir,
      children: node.is_dir ? normalizeTree(node.children || []) : undefined
    }))

const expandAllKeys = (nodes) =>
  nodes.flatMap((node) => (node.is_dir ? [node.key, ...expandAllKeys(node.children || [])] : []))

const resetFileState = () => {
  selectedPath.value = ''
  selectedIsDir.value = false
  selectedTreeKeys.value = []
  expandedKeys.value = []
  fileContent.value = ''
}

const close = () => {
  visible.value = false
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && visible.value && !createModalVisible.value) close()
}

const loadSkillFile = async (skillSlug, path = 'SKILL.md') => {
  try {
    const fileResult = isPersonal.value
      ? await skillApi.getPersonalSkillFile(skillSlug, path)
      : await skillApi.getSkillFile(skillSlug, path)
    fileContent.value = fileResult?.data?.content || ''
    selectedPath.value = path
    selectedIsDir.value = false
    selectedTreeKeys.value = [path]
  } catch {
    fileContent.value = ''
  }
}

const reloadTree = async () => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || isPersonal.value) return
  try {
    const result = await skillApi.getSkillTree(slug)
    const normalized = normalizeTree(result?.data || [])
    treeData.value = normalized
    expandedKeys.value = expandAllKeys(normalized)
  } catch {
    treeData.value = []
    MessagePlugin.error(t('ext.skills.detail.treeFailed'))
  }
}

const handleTreeSelect = async (keys, info) => {
  if (!keys?.length) {
    resetFileState()
    return
  }
  const node = info?.node || {}
  const path = node.path || node.key
  const isDir = !!node.is_dir
  selectedTreeKeys.value = [path]
  selectedPath.value = path
  selectedIsDir.value = isDir
  if (isDir) {
    fileContent.value = ''
    return
  }
  await loadSkillFile(currentSkill.value?.slug || props.skill?.slug, path)
}

const saveCurrentFile = async (content = fileContent.value) => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || !selectedPath.value || selectedIsDir.value || !canEditSkillFiles.value) return
  savingFile.value = true
  try {
    await skillApi.updateSkillFile(slug, { path: selectedPath.value, content })
    fileContent.value = content
    MessagePlugin.success(t('ext.skills.detail.saved'))
  } catch {
    MessagePlugin.error(t('ext.skills.detail.saveFailed'))
  } finally {
    savingFile.value = false
  }
}

const openCreateModal = (isDir) => {
  if (!canEditSkillFiles.value) return
  createForm.path = ''
  createForm.content = ''
  createForm.isDir = isDir
  createModalVisible.value = true
}

const handleCreateNode = async () => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || !createForm.path.trim() || !canEditSkillFiles.value) return false
  creatingNode.value = true
  try {
    await skillApi.createSkillFile(slug, {
      path: createForm.path.trim(),
      is_dir: createForm.isDir,
      content: createForm.content
    })
    createModalVisible.value = false
    await reloadTree()
    MessagePlugin.success(t('ext.skills.detail.created'))
  } catch {
    MessagePlugin.error(t('ext.skills.detail.createFailed'))
    return false
  } finally {
    creatingNode.value = false
  }
}

const saveShareConfig = async () => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || !canManage.value) return false
  if (!isBuiltin.value) {
    const validation = shareConfigFormRef.value?.validate?.()
    if (validation && !validation.valid) {
      MessagePlugin.warning(validation.message || t('ext.skills.detail.needScope'))
      return false
    }
  }
  savingShareConfig.value = true
  try {
    if (!isBuiltin.value) {
      await skillApi.updateSkillShareConfig(slug, shareConfigForm.value)
    }
    const result = await skillApi.updateSkillEnabled(slug, enabledForm.value)
    if (result?.data) {
      currentSkill.value = result.data
      syncShareConfigFromSkill(result.data)
    }
    MessagePlugin.success(t('ext.skills.detail.settingsSaved'))
    emit('submitted')
    return true
  } catch {
    MessagePlugin.error(t('ext.skills.detail.settingsSaveFailed'))
    return false
  } finally {
    savingShareConfig.value = false
  }
}

const saveShareConfigAndClose = async () => {
  const saved = await saveShareConfig()
  if (saved) close()
}

const saveDependencies = async () => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || !canEditDeps.value) return
  savingDependencies.value = true
  try {
    const result = await skillApi.updateSkillDependencies(slug, {
      tool_dependencies: dependencyForm.tool_dependencies,
      mcp_dependencies: dependencyForm.mcp_dependencies,
      skill_dependencies: dependencyForm.skill_dependencies
    })
    if (result?.data) {
      currentSkill.value = result.data
      syncDependencyFormFromSkill(result.data)
    }
    MessagePlugin.success(t('ext.skills.detail.depsUpdated'))
    emit('submitted')
  } catch {
    MessagePlugin.error(t('ext.skills.detail.depsUpdateFailed'))
  } finally {
    savingDependencies.value = false
  }
}

const handleExport = async () => {
  const slug = currentSkill.value?.slug || props.skill?.slug
  if (!slug || !canExport.value) return
  exporting.value = true
  try {
    const response = await skillApi.exportSkill(slug)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${slug}.zip`
    link.click()
    URL.revokeObjectURL(url)
  } catch {
    MessagePlugin.error(t('ext.skills.detail.exportFailed'))
  } finally {
    exporting.value = false
  }
}

const confirmUninstall = () => {
  const target = currentSkill.value || props.skill
  if (!target || !canUninstall.value) return
  const dialog = DialogPlugin.confirm({
    attach: 'body',
    placement: 'center',
    header: t('ext.skills.uninstallTitle', { name: target.name || target.slug }),
    body: isPersonal.value
      ? t('ext.skills.uninstallPersonalHint')
      : t('ext.skills.uninstallSharedHint'),
    confirmBtn: { content: t('ext.skills.uninstall'), theme: 'danger' },
    cancelBtn: t('ext.cancel'),
    onConfirm: async () => {
      try {
        deleting.value = true
        if (isPersonal.value) await skillApi.deletePersonalSkill(target.slug)
        else await skillApi.deleteSkill(target.slug)
        MessagePlugin.success(t('ext.skills.uninstalled'))
        close()
        emit('submitted')
      } catch (error) {
        MessagePlugin.error(
          error?.response?.data?.detail || error.message || t('ext.skills.uninstallFailed')
        )
      } finally {
        deleting.value = false
        dialog.hide()
      }
    }
  })
}

const loadDetail = async () => {
  const skill = props.skill
  if (!skill?.slug) return
  detailLoading.value = true
  currentSkill.value = skill
  resetFileState()
  treeData.value = []
  syncShareConfigFromSkill(skill)
  syncDependencyFormFromSkill(skill)
  try {
    if (!isPersonal.value) {
      const skillResult = await skillApi.listSkills()
      allowedSkillAccessLevels.value = skillResult?.allowed_access_levels || ['user']
      const found = (skillResult?.data || []).find((item) => item.slug === skill.slug)
      if (found) {
        currentSkill.value = found
        syncShareConfigFromSkill(found)
        syncDependencyFormFromSkill(found)
      }
      await reloadTree()
    }
    await loadSkillFile(skill.slug)
    if (!isPersonal.value) {
      const result = await skillApi.getSkillDependencyOptions(skill.slug)
      const data = result?.data || {}
      dependencyOptions.tools = data.tools || []
      dependencyOptions.mcps = data.mcps || []
      dependencyOptions.skills = data.skills || []
    }
  } catch {
    MessagePlugin.error(t('ext.skills.detail.loadFailed'))
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (!val) return
    currentSection.value = 'content'
    void loadDetail()
  },
  { immediate: true }
)

onMounted(() => window.addEventListener('keydown', handleEscape))
onUnmounted(() => window.removeEventListener('keydown', handleEscape))
</script>

<style lang="less" scoped>
.settings-overlay {
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

.settings-modal {
  --page-padding: 28px;
  --skill-chrome-header-height: 53px;
  position: relative;
  width: 90vw;
  max-width: 1200px;
  height: 85vh;
  max-height: 780px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
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
  color: var(--td-text-color-secondary);
  cursor: pointer;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
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
}

.sidebar-header {
  box-sizing: border-box;
  height: var(--skill-chrome-header-height);
  padding: 0 14px;
  border-bottom: 1px solid var(--td-component-stroke);
  display: flex;
  align-items: center;
}

.sidebar-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.settings-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
}

.nav-group-title {
  padding: 6px 14px 2px;
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  font-weight: 600;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  margin-bottom: 2px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--td-text-color-primary);
  font-size: 14px;

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
}

.nav-label {
  flex: 1;
}

.settings-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.skill-detail-loading {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 28px 36px 20px;

  &--workspace {
    display: flex;
    overflow: hidden;
    padding: 0;
  }
}

.workspace {
  display: flex;
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}

.tree-container {
  width: 240px;
  order: 2;
  background: var(--td-bg-color-container);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  .tree-chrome {
    flex-shrink: 0;
    height: var(--skill-chrome-header-height);
    background: var(--td-bg-color-container);
    border-bottom: 1px solid var(--td-component-stroke);
  }

  .tree-body {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--td-component-stroke);
  }

  .tree-header {
    padding: 12px 16px 4px;
    display: flex;
    justify-content: space-between;
    align-items: center;

    .label {
      font-size: 12px;
      font-weight: 600;
      color: var(--td-text-color-placeholder);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .tree-actions {
      display: flex;
      gap: 4px;

      button {
        display: flex;
        align-items: center;
        padding: 2px;
        border: none;
        background: none;
        color: var(--td-text-color-placeholder);
        cursor: pointer;

        &:hover {
          color: var(--td-text-color-primary);
        }
      }
    }
  }

  .tree-content {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 8px 12px 16px;
  }
}

.editor-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;

  .editor-main {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .skill-file-preview {
    flex: 1;
    min-height: 0;
    border-radius: 0;
    background: var(--td-bg-color-container);
  }

  :deep(.preview-header) {
    box-sizing: border-box;
    height: var(--skill-chrome-header-height);
    min-height: var(--skill-chrome-header-height);
    padding: 0 16px;
    background: var(--td-bg-color-container);
    border-bottom: 1px solid var(--td-component-stroke);
  }

  :deep(.skill-file-preview-content) {
    flex: 1;
    min-height: 0;
    max-height: none;
  }

  :deep(.skill-file-preview-content .flat-md-preview) {
    padding: 24px 32px 40px;
    font-size: 15px;
    line-height: 1.75;
  }

  :deep(.skill-file-preview-content .frontmatter-card) {
    margin: 0 0 28px;
    padding: 16px 18px;
  }

  :deep(.skill-file-preview-content .frontmatter-card .fm-body) {
    gap: 12px;
  }

  :deep(.skill-file-preview-content .frontmatter-card .fm-row) {
    gap: 12px 24px;
    padding: 2px 0;
  }

  :deep(.skill-file-preview-content .frontmatter-card .fm-key) {
    font-size: 12px;
    line-height: 1.6;
  }

  :deep(.skill-file-preview-content .frontmatter-card .fm-value) {
    font-size: 14px;
    line-height: 1.7;
  }

  :deep(.skill-file-preview-content h1),
  :deep(.skill-file-preview-content h2) {
    margin: 1.5em 0 0.7em;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.4;
  }

  :deep(.skill-file-preview-content h3),
  :deep(.skill-file-preview-content h4) {
    margin: 1.25em 0 0.55em;
    font-size: 15px;
    font-weight: 650;
    line-height: 1.45;
  }

  :deep(.skill-file-preview-content h1:first-child),
  :deep(.skill-file-preview-content h2:first-child),
  :deep(.skill-file-preview-content h3:first-child),
  :deep(.skill-file-preview-content .frontmatter-card + h1),
  :deep(.skill-file-preview-content .frontmatter-card + h2),
  :deep(.skill-file-preview-content .frontmatter-card + h3) {
    margin-top: 0;
  }

  :deep(.skill-file-preview-content p) {
    margin: 0 0 0.95em;
    line-height: 1.75;
  }

  :deep(.skill-file-preview-content ul),
  :deep(.skill-file-preview-content ol) {
    margin: 0 0 1.1em;
  }

  :deep(.skill-file-preview-content li) {
    margin: 0.4em 0;
    line-height: 1.7;
  }

  :deep(.skill-file-preview-content li > p) {
    margin: 0.2em 0;
  }
}

.config-view {
  max-width: 860px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 18px;

  .text {
    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
    }

    p {
      margin: 0;
      color: var(--td-text-color-secondary);
      font-size: 13px;
    }
  }
}

.settings-stack,
.dependency-groups {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.settings-card,
.dependency-card {
  border: 1px solid var(--td-component-stroke);
  border-radius: 10px;
  background: var(--td-bg-color-container);
}

.settings-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 12px;

  &.scope-card {
    display: block;
  }
}

.settings-card-title {
  margin-bottom: 4px;
  font-size: 14px;
  font-weight: 700;
}

.settings-card-desc {
  color: var(--td-text-color-secondary);
  font-size: 13px;
  line-height: 1.55;
}

.settings-card-action {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  gap: 10px;
}

.scope-card .settings-card-main {
  margin-bottom: 14px;
}

.status-pill {
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  line-height: 18px;

  &.enabled {
    background: color-mix(in srgb, var(--td-brand-color) 12%, transparent);
    color: var(--td-brand-color);
  }

  &.disabled {
    background: var(--td-bg-color-secondarycontainer);
    color: var(--td-text-color-placeholder);
  }
}

.readonly-scope-hint {
  color: var(--td-text-color-secondary);
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid var(--td-component-stroke);
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 13px;
  line-height: 1.55;
}

.dependency-card {
  padding: 14px;

  &.readonly {
    background: linear-gradient(180deg, var(--td-bg-color-container) 0%, var(--td-bg-color-secondarycontainer) 100%);
  }
}

.dependency-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.dependency-title-block {
  min-width: 0;
  flex: 1;
}

.dependency-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;

  h4 {
    margin: 0;
    font-size: 14px;
    font-weight: 700;
  }
}

.dependency-title-block p {
  margin: 4px 0 0;
  color: var(--td-text-color-secondary);
  font-size: 12px;
  line-height: 1.45;
}

.dependency-count {
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-placeholder);
  font-size: 12px;
  line-height: 18px;
}

.dependency-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  flex-shrink: 0;
  gap: 5px;
  padding: 0 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.dependency-select-chevron {
  opacity: 0.72;
}

.dependency-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.dependency-chip {
  display: inline-flex;
  align-items: center;
  max-width: 220px;
  gap: 6px;
  padding: 4px 8px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-primary);
  font-size: 12px;
  line-height: 18px;

  span {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

.dependency-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;
}

.dependency-empty-hint {
  margin-top: 14px;
  padding: 10px 12px;
  border: 1px dashed var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer);
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}

.settings-footer {
  padding: 12px 36px;
  border-top: 1px solid var(--td-component-stroke);
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.settings-footer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.mt-40 {
  margin-top: 40px;
}

.pt-12 {
  padding-top: 12px;
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

<style lang="less">
.dependency-selection-popover {
  .selection-dropdown {
    width: 300px;
    max-height: 360px;
    padding: 8px;
    overflow: hidden auto;
  }

  .selection-dropdown-header {
    padding: 8px 10px 10px;
    margin-bottom: 4px;
    border-bottom: 1px solid var(--td-component-stroke);
  }

  .selection-dropdown-title {
    font-size: 13px;
    font-weight: 700;
  }

  .selection-dropdown-subtitle {
    margin-top: 2px;
    color: var(--td-text-color-secondary);
    font-size: 12px;
  }

  .selection-search {
    width: calc(100% - 16px);
    margin: 8px;
  }

  .selection-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .selection-item {
    display: flex;
    align-items: center;
    min-height: 38px;
    padding: 8px 10px;
    border-radius: 9px;
    cursor: pointer;

    &:hover {
      background: var(--td-bg-color-container-hover);
    }

    &.selected {
      background: var(--td-bg-color-secondarycontainer);
    }
  }

  .selection-item-content {
    display: flex;
    align-items: center;
    min-width: 0;
    gap: 8px;
  }

  .selection-label {
    overflow: hidden;
    font-size: 13px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .selection-empty {
    padding: 16px 0;
    color: var(--td-text-color-secondary);
    font-size: 13px;
    text-align: center;
  }
}
</style>

<style lang="less">
/* Teleport 到 body 后不在 .harness-root 内，深色 --gray-* 不会自动继承。
   必须用非 scoped 规则写在弹窗自己身上，预览/树组件才能跟技能列表一致。 */
.skill-editor-modal {
  --page-padding: 28px;
  --main-800: #027218;
  --main-700: #038626;
  --main-600: #049b38;
  --main-500: #07c05f;
  --main-bright: #07c05f;
  --main-color: #07c05f;
  --gray-2000: #0c0d0d;
  --gray-1000: #151616;
  --gray-900: #1e1f1f;
  --gray-800: #323333;
  --gray-700: #4c4d4d;
  --gray-600: #697070;
  --gray-500: #979999;
  --gray-400: #bdbfbf;
  --gray-300: #d7d9d9;
  --gray-200: #e4e6e6;
  --gray-150: #eef0f0;
  --gray-100: #eff2f2;
  --gray-50: #f5f7f7;
  --gray-25: #f8fafa;
  --gray-10: #fbfcfc;
  --gray-0: #ffffff;
}

html[theme-mode='dark'] .skill-editor-modal {
  --main-bright: var(--td-brand-color, #06b04d);
  --main-color: var(--td-brand-color, #06b04d);
  --gray-2000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-1000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-900: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-800: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-700: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-600: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-500: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-400: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-300: var(--td-component-border, #5e5e5e);
  --gray-200: var(--td-component-border, #5e5e5e);
  --gray-150: rgba(255, 255, 255, 0.06);
  --gray-100: rgba(255, 255, 255, 0.06);
  --gray-50: var(--td-bg-color-container-hover, #2c2c2c);
  --gray-25: var(--td-bg-color-page, #181818);
  --gray-10: var(--td-bg-color-page, #181818);
  --gray-0: var(--td-bg-color-container, #242424);

  .ant-tree,
  .ant-tree-list,
  .ant-tree-list-holder,
  .ant-tree-list-holder-inner {
    background: transparent !important;
    color: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  }
}
</style>
