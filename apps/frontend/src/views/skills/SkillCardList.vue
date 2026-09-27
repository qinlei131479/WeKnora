<template>
  <div class="skill-cards-page extension-page-root">
    <Teleport defer to="#extension-page-header-actions">
      <div class="extension-header-actions">
        <t-button theme="primary" :disabled="loading" @click="skillSettingsRef?.openAdd()">
          {{ t('settings.skills.addSkill') }}
        </t-button>
      </div>
    </Teleport>

    <PageShoulder :search-placeholder="t('ext.skills.searchPlaceholder')" v-model:search="searchQuery">
      <template #filters>
        <t-select
          v-model="selectedScope"
          style="width: 140px"
          :placeholder="t('ext.skills.scopeAll')"
          clearable
        >
          <t-option value="" :label="t('ext.skills.scopeAll')" />
          <t-option value="chat" :label="t('ext.tools.sourceChat')" />
          <t-option value="work" :label="t('ext.tools.sourceWork')" />
          <t-option value="common" :label="t('ext.skills.sourceCommon')" />
        </t-select>
      </template>
    </PageShoulder>

    <div v-if="visibleSkillGroups.length === 0" class="extension-page-body">
      <div class="extension-card-grid-empty-state">
        <t-empty
          :title="searchQuery || selectedScope ? t('ext.skills.emptySearchTitle') : t('ext.skills.emptyTitle')"
          :description="searchQuery || selectedScope ? t('ext.skills.emptySearchDesc') : t('ext.skills.emptyDesc')"
        />
      </div>
    </div>

    <div v-else class="extension-page-body">
      <template v-for="group in visibleSkillGroups" :key="group.key">
        <div class="extension-section-header skill-section-header">
          <button
            type="button"
            class="skill-section-toggle"
            @click="toggleSkillSection(group.key)"
          >
            <span>{{ group.title }}</span>
            <span class="section-count">{{ group.skills.length }}</span>
            <ChevronRight v-if="isSkillSectionCollapsed(group.key)" :size="14" class="section-toggle" />
            <ChevronDown v-else :size="14" class="section-toggle" />
          </button>
        </div>
        <ExtensionCardGrid v-show="!isSkillSectionCollapsed(group.key)" :min-width="240" :gap="12">
          <div
            v-for="skill in group.skills"
            :key="`${group.key}:${skill.slug || skill.id}`"
            class="card-wrapper"
          >
            <InfoCard
              variant="default"
              layout="kb"
              :title="formatExtensionCardTitle(skill.name)"
              :subtitle="skill.slug"
              :description="skill.description || t('ext.noDescription')"
              :tags="skillCardTags(skill)"
              :default-icon="getSkillIcon(skill.slug)"
              @click="openSkillFiles(skill)"
            >
              <template #footer>
                <div class="skill-card-footer" @click.stop>
                  <template v-for="view in [installView(skill)]" :key="skill.slug">
                    <button
                      v-if="sandboxInstallLocked(skill) || !view.needsPanel"
                      type="button"
                      class="skill-sandbox-chip"
                      :class="view.installs.length ? 'is-installed' : 'is-idle'"
                      :disabled="sandboxInstallLocked(skill)"
                      :title="sandboxInstallLocked(skill) ? t('ext.skills.builtinWorkNoSandbox') : undefined"
                      @click="onInstallChip(skill, view)"
                    >
                      <span>{{ sandboxInstallLocked(skill) ? t('settings.skills.installToSandbox') : installChipText(skill, view) }}</span>
                    </button>
                    <t-popup
                      v-else
                      :visible="openInstallPanelId === skill.slug"
                      trigger="click"
                      placement="bottom-left"
                      attach="body"
                      @visible-change="(visible) => setInstallPanel(skill.slug, visible)"
                    >
                      <button type="button" class="skill-sandbox-chip is-installed">
                        <span>{{ installChipText(skill, view) }}</span>
                      </button>
                      <template #content>
                        <div class="skill-install-panel">
                          <button
                            v-for="inst in view.installs"
                            :key="inst.skill_id"
                            type="button"
                            class="skill-install-panel__item"
                            @click="openInstalledManage(skill, inst)"
                          >
                            {{ inst.sandbox_config_name || inst.name }}
                            <span v-if="inst.status === 'installing'"> · {{ t('settings.sandbox.skillStatusInstalling') }}</span>
                          </button>
                          <button
                            v-for="sandbox in view.available"
                            :key="sandbox.id"
                            type="button"
                            class="skill-install-panel__item is-available"
                            @click="openSkillInstall(skill)"
                          >
                            {{ sandbox.name }} · {{ t('settings.skills.installPanelAvailable') }}
                          </button>
                        </div>
                      </template>
                    </t-popup>
                  </template>
                  <span class="skill-card-source">{{ usageSourceLabel(skill) }}</span>
                </div>
              </template>
              <template #actions>
                <button
                  v-if="canDeleteSkill(skill)"
                  type="button"
                  class="skill-card__icon-btn skill-card__icon-btn--danger"
                  :disabled="deletingSlug === skillFileKey(skill)"
                  :title="t('settings.skills.deleteCatalog')"
                  :aria-label="t('settings.skills.deleteCatalog')"
                  @click.stop="askDeleteSkill(skill)"
                >
                  <DeleteIcon size="14px" />
                </button>
              </template>
            </InfoCard>
          </div>
        </ExtensionCardGrid>
      </template>
    </div>

    <SkillFilesDrawer
      v-model:visible="filesVisible"
      persist="harness"
      :catalog-id="filesCatalogId"
      :skill-name="filesCatalogName"
      :builtin="filesBuiltin"
      :installed="filesInstalled"
      :source-type="filesSourceType"
      :tool-dependencies="filesToolDeps"
      :mcp-dependencies="filesMcpDeps"
      :skill-dependencies="filesSkillDeps"
      @changed="() => fetchSkills({ silent: true })"
    />

    <SkillSettings
      ref="skillSettingsRef"
      persist="harness"
      drawers-only
      @changed="() => fetchSkills({ silent: true })"
    />

  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import { DeleteIcon } from 'tdesign-icons-vue-next'
import { useConfirmDelete } from '@/components/settings/useConfirmDelete'
import { skillApi } from '@/api/chat-work/skill'
import ExtensionCardGrid from '@/components/harness/extensions/ExtensionCardGrid.vue'
import SkillFilesDrawer from '@/components/SkillFilesDrawer.vue'
import SkillSettings from '@/views/settings/SkillSettings.vue'
import InfoCard from '@/components/harness/shared/InfoCard.vue'
import PageShoulder from '@/components/harness/shared/PageShoulder.vue'
import { formatExtensionCardTitle } from '@/utils/harness/extensionDisplayName'
import { getSkillIcon } from '@/utils/harness/skill_icon_utils'

const { t } = useI18n()
const confirmDelete = useConfirmDelete()

const emit = defineEmits(['loading-change'])

const loading = ref(false)
const searchQuery = ref('')
const selectedScope = ref('')

const deletingSlug = ref('')

const skills = ref([])
const skillSettingsRef = ref(null)
const sandboxBoard = ref({ sandboxes: [], installations: [] })
const openInstallPanelId = ref('')
const filesVisible = ref(false)
const filesCatalogId = ref('')
const filesCatalogName = ref('')
const filesBuiltin = ref(false)
const filesInstalled = ref(false)
const filesSourceType = ref('')
const filesToolDeps = ref([])
const filesMcpDeps = ref([])
const filesSkillDeps = ref([])

watch(loading, (v) => emit('loading-change', v), { immediate: true })

const matchesSearch = (skill) => {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  const text = [
    skill.name,
    skill.slug,
    skill.description
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return text.includes(q)
}

const installedSkillCards = computed(() =>
  (skills.value || []).map((skill) => ({
    ...skill,
    sourceType: skill.source_type || 'upload',
    sourceScope: skill.source_scope
  }))
)

const filteredInstalledSkills = computed(() => installedSkillCards.value.filter(matchesSearch))
const pageSkills = computed(() =>
  filteredInstalledSkills.value.filter((skill) => {
    if (skill.sourceScope === 'personal') return false
    if (!selectedScope.value) return true
    return (skill.source_type || skill.sourceType) === selectedScope.value
  })
)
const isBuiltinSkill = (skill) => skill.sourceScope === 'builtin' || skill.is_builtin === true
const sandboxInstallLocked = (skill) =>
  isBuiltinSkill(skill) && (skill.source_type || skill.sourceType) === 'work'
const builtinIdentity = computed(() => {
  const keys = new Set()
  for (const skill of pageSkills.value) {
    if (!isBuiltinSkill(skill)) continue
    for (const value of [skill.name, skill.slug]) {
      const text = String(value || '').trim()
      if (text) keys.add(text)
    }
  }
  return keys
})
const isBuiltinClone = (skill) => {
  if (isBuiltinSkill(skill)) return false
  const name = String(skill?.name || '').trim()
  const slug = String(skill?.slug || '').trim()
  return Boolean((name && builtinIdentity.value.has(name)) || (slug && builtinIdentity.value.has(slug)))
}
const skillGroups = computed(() => [
  {
    key: 'builtin',
    title: t('ext.skills.groupBuiltin'),
    skills: pageSkills.value.filter((skill) => isBuiltinSkill(skill))
  },
  {
    key: 'uploaded',
    title: t('ext.skills.groupShared'),
    skills: pageSkills.value.filter((skill) => !isBuiltinSkill(skill) && !isBuiltinClone(skill))
  }
])
const visibleSkillGroups = computed(() => skillGroups.value.filter((group) => group.skills.length))
const collapsedSkillSections = ref(new Set())
const isSkillSectionCollapsed = (key) => collapsedSkillSections.value.has(key)
const toggleSkillSection = (key) => {
  const next = new Set(collapsedSkillSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedSkillSections.value = next
}

const skillCardTags = (skill) => {
  if (skill.sourceScope === 'personal') {
    return [
      { name: t('ext.skills.sourcePersonal'), color: 'gray' },
      ...(skill.overrides_shared ? [{ name: t('ext.skills.tagOverrideShared'), color: 'orange' }] : [])
    ]
  }
  return [
    ...(skill.shadowed_by_personal ? [{ name: t('ext.skills.tagShadowed'), color: 'orange' }] : [])
  ]
}

const skillFileKey = (skill) => {
  if (skill?.sourceScope === 'builtin' || skill?.is_builtin) return skill.slug
  return skill?.id || skill?.slug
}

const openSkillFiles = (skill) => {
  const key = skillFileKey(skill)
  if (!key) return
  filesCatalogId.value = key
  filesCatalogName.value = skill.name || skill.slug || ''
  filesBuiltin.value = isBuiltinSkill(skill)
  filesInstalled.value = installView(skill).installs.length > 0
  filesSourceType.value = skill.source_type || skill.sourceType || ''
  filesToolDeps.value = [...(skill.tool_dependencies || [])]
  filesMcpDeps.value = [...(skill.mcp_dependencies || [])]
  filesSkillDeps.value = [...(skill.skill_dependencies || [])]
  filesVisible.value = true
}

const canDeleteSkill = (skill) => {
  if (!skill || skill.sourceScope === 'builtin' || skill.is_builtin || skill.sourceScope === 'personal') return false
  return installView(skill).installs.length === 0
}

const askDeleteSkill = (skill) => {
  if (!canDeleteSkill(skill) || deletingSlug.value) return
  confirmDelete({
    body: t('settings.skills.deleteCatalogConfirm', { name: skill.name || skill.slug }),
    onConfirm: () => removeSkill(skill),
  })
}

const removeSkill = async (skill) => {
  const key = skillFileKey(skill)
  if (!key) return
  deletingSlug.value = key
  try {
    await skillApi.deleteSkill(key)
    MessagePlugin.success(t('ext.skills.uninstalled'))
    await fetchSkills()
  } catch (error) {
    MessagePlugin.error(error?.message || t('ext.skills.uninstallFailed'))
  } finally {
    deletingSlug.value = ''
  }
}

const usageSourceLabel = (skill) => {
  const value = skill.source_type || skill.sourceType
  if (value === 'work') return t('ext.tools.sourceWork')
  if (value === 'common') return t('ext.skills.sourceCommon')
  return t('ext.tools.sourceChat')
}

const skillIdentityKeys = (skill) => [skill?.id, skill?.slug, skill?.app_core_id, skill?.name]
  .map((value) => String(value || '').trim())
  .filter(Boolean)

// 内置技能卡片的 id/slug 是目录 slug，安装记录的 catalog_id 可能是空间内同名副本，name 则是展示名。
const sameSkillInstall = (skill, inst) => {
  const keys = skillIdentityKeys(skill)
  if (!keys.length) return false
  return keys.includes(String(inst?.catalog_id || '').trim()) || keys.includes(String(inst?.name || '').trim())
}

const liveInstallsFor = (skill) =>
  (sandboxBoard.value.installations || []).filter((inst) => {
    if (!inst?.status || inst.status === 'removed') return false
    return sameSkillInstall(skill, inst)
  })

const installView = (skill) => {
  const installs = liveInstallsFor(skill)
  const taken = new Set(
    installs
      .filter((inst) => ['installing', 'ready', 'removing'].includes(inst.status))
      .map((inst) => inst.sandbox_config_id)
  )
  const available = (sandboxBoard.value.sandboxes || []).filter((sandbox) => !taken.has(sandbox.id))
  return {
    installs,
    available,
    needsPanel: installs.length + available.length > 1
  }
}

const installChipText = (skill, view) => {
  if (!view.installs.length) return t('settings.skills.installToSandbox')
  if (view.installs.length === 1) {
    const name = view.installs[0].sandbox_config_name || view.installs[0].name
    return t('settings.skills.installedOnName', { name })
  }
  return t('settings.skills.installedCount', { count: view.installs.length })
}

const catalogItemFor = (skill) => ({
  id: skillFileKey(skill),
  name: skill.name,
  description: skill.description || '',
  created_at: skill.created_at || '',
  updated_at: skill.updated_at || '',
  installations: liveInstallsFor(skill).map((inst) => ({
    skill_id: inst.skill_id,
    sandbox_config_id: inst.sandbox_config_id,
    sandbox_config_name: inst.sandbox_config_name,
    sandbox_type: inst.sandbox_type,
    status: inst.status,
    enabled: inst.enabled !== false,
    updated_at: inst.updated_at || ''
  }))
})

const setInstallPanel = (slug, visible) => {
  openInstallPanelId.value = visible ? slug : ''
}

const openSkillInstall = (skill) => {
  openInstallPanelId.value = ''
  skillSettingsRef.value?.openInstall(catalogItemFor(skill))
}

const openInstalledManage = (skill, install) => {
  openInstallPanelId.value = ''
  skillSettingsRef.value?.openManage(catalogItemFor(skill), install)
}

const onInstallChip = (skill, view) => {
  if (sandboxInstallLocked(skill)) return
  if (view.installs.length === 1) {
    openInstalledManage(skill, view.installs[0])
    return
  }
  openSkillInstall(skill)
}

const fetchSkills = async ({ refreshPersonal = false, silent = false } = {}) => {
  if (!silent) loading.value = true
  try {
    const [skillResult, boardResult] = await Promise.all([
      skillApi.listSkillCards({ refreshPersonal }),
      skillApi.listSkillSandboxBoard().catch(() => ({ data: { sandboxes: [], installations: [] } }))
    ])
    skills.value = skillResult?.data || []
    sandboxBoard.value = boardResult?.data || { sandboxes: [], installations: [] }
    ensureBoardPoll()
  } catch {
    MessagePlugin.error(t('ext.skills.loadFailed'))
  } finally {
    loading.value = false
  }
}

let boardPoll = null
function stopBoardPoll() {
  if (boardPoll != null) {
    window.clearInterval(boardPoll)
    boardPoll = null
  }
}

function ensureBoardPoll() {
  const busy = (sandboxBoard.value.installations || []).some((inst) =>
    inst?.status === 'installing' || inst?.status === 'removing',
  )
  if (!busy) {
    stopBoardPoll()
    return
  }
  if (boardPoll != null) return
  boardPoll = window.setInterval(() => {
    void fetchSkills({ silent: true })
  }, 2500)
}

onMounted(() => {
  fetchSkills()
})

onUnmounted(() => {
  stopBoardPoll()
})

defineExpose({
  fetchSkills,
  loading
})
</script>

<style lang="less" scoped>
@import '@/assets/harness/css/extensions.less';

:deep(.t-button) {
  display: inline-flex;
  align-items: center;
}

.extension-header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.skill-section-header {
  cursor: default;
}

.skill-section-toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover {
    color: var(--td-text-color-primary, var(--gray-800));
  }

  &:hover .section-toggle {
    opacity: 1;
  }

  &:focus-visible {
    outline: 2px solid var(--td-brand-color-focus, rgba(0, 82, 217, 0.2));
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.card-wrapper {
  position: relative;

  :deep(.info-card-mini-desc) {
    display: -webkit-box;
    min-height: 36px;
    color: var(--gray-700);
    white-space: normal;
    line-clamp: 2;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  :deep(.info-card-mini .info-card-icon) {
    align-self: flex-start;
  }
}

.skill-card__icon-btn {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: none;
  color: var(--td-text-color-placeholder);
  cursor: pointer;

  &:hover:not(:disabled) {
    color: var(--td-error-color);
    background: var(--td-bg-color-container-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
}

.skill-preview-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.skill-preview-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.skill-preview-title-area {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.skill-preview-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  background: var(--gray-50);
  color: var(--gray-600);
}

.skill-preview-title-text {
  min-width: 0;
}

.skill-preview-title {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-preview-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 2px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 18px;
}

.skill-preview-actions {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  gap: 8px;
  padding-top: 2px;
}

.skill-preview-body {
  min-height: 260px;
  max-height: min(56vh, 520px);
  padding: 14px 16px;
  overflow-y: auto;
  border: 1px solid var(--gray-150);
  border-radius: 12px;
  background: var(--gray-25);

  :deep(.yk-markdown-preview) {
    background: transparent;
  }
}

.skill-preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
}

.skill-preview-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
}

.skill-preview-footer-left,
.skill-preview-footer-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
</style>

<!-- NOTE: unscoped style block 用于卡片底部芯片，挂在卡片外层 -->
<style lang="less">
.card-wrapper :deep(.info-card--kb) {
  height: auto;
  overflow: visible;
}

.skill-card-footer {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;
  margin-top: 4px;
}

.skill-sandbox-chip {
  flex-shrink: 0;
  max-width: none;
  padding: 2px 8px;
  border: 1px solid var(--td-component-stroke, var(--gray-150));
  border-radius: 999px;
  background: transparent;
  color: var(--td-text-color-secondary, var(--gray-600));
  font-size: 12px;
  line-height: 20px;
  white-space: nowrap;
  cursor: pointer;
}

.skill-sandbox-chip.is-installed {
  color: var(--td-brand-color, #0052d9);
}

.skill-sandbox-chip:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.skill-card-source {
  flex-shrink: 0;
  margin-left: auto;
  color: #7dcea0;
  font-size: 12px;
  white-space: nowrap;
}

.skill-install-panel {
  display: flex;
  flex-direction: column;
  min-width: 180px;
  padding: 6px;
}

.skill-install-panel__item {
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.skill-install-panel__item:hover {
  background: var(--td-bg-color-container-hover, var(--gray-50));
}
</style>
