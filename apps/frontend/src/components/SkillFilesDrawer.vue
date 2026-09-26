<template>
  <teleport to="body">
    <div
      v-if="visible"
      class="skill-files-drawer-resize-handle"
      :class="{ 'skill-files-drawer-resize-handle--active': resizing }"
      :style="{ right: `${drawerWidth}px`, '--skill-files-drawer-travel': `${drawerWidth}px` }"
      role="separator"
      aria-orientation="vertical"
      @mousedown.prevent="onResizeStart"
    >
      <div class="skill-files-drawer-resize-line" />
    </div>
  </teleport>
  <t-drawer
    :visible="visible"
    :z-index="2600"
    :size="`${drawerWidth}px`"
    attach="body"
    :close-btn="false"
    :footer="false"
    :header="false"
    :show-overlay="true"
    :close-on-overlay-click="true"
    destroy-on-close
    placement="right"
    :class="['skill-files-drawer', { 'skill-files-drawer--resizing': resizing }]"
    @close="onClose"
  >
    <div class="skill-files-drawer__shell">
      <header class="skill-files-drawer__head">
        <div class="skill-files-drawer__head-icon">
          <t-icon name="folder" />
        </div>
        <div class="skill-files-drawer__head-text">
          <div class="skill-files-drawer__title">{{ skillName }}</div>
          <div class="skill-files-drawer__subtitle">{{ $t('settings.sandbox.skillFilesTitle') }}</div>
        </div>
        <button
          type="button"
          class="skill-files-drawer__close"
          :title="$t('common.close')"
          :aria-label="$t('common.close')"
          @click="onClose"
        >
          <t-icon name="close" size="16px" />
        </button>
      </header>
      <div v-if="persist === 'harness'" class="skill-files-drawer__tabs">
        <button
          type="button"
          class="skill-files-drawer__tab"
          :class="{ 'is-active': activeTab === 'files' }"
          @click="activeTab = 'files'"
        >
          {{ $t('ext.skills.fileTab') }}
        </button>
        <button
          type="button"
          class="skill-files-drawer__tab"
          :class="{ 'is-active': activeTab === 'deps' }"
          @click="activeTab = 'deps'"
        >
          {{ $t('ext.skills.depsTab') }}
        </button>
      </div>
      <SkillFilesPanel
        v-if="visible && activeTab === 'files' && (catalogId || (configId && skillId))"
        :config-id="configId"
        :skill-id="skillId"
        :catalog-id="catalogId"
        :persist="persist"
        :file-actions="fileActions"
        :drawer-width="drawerWidth"
      />
      <div v-else-if="persist === 'harness' && activeTab === 'deps'" class="skill-deps">
        <section v-for="group in dependencyGroups" :key="group.key" class="skill-deps__card">
          <div class="skill-deps__head">
            <div>
              <h4>{{ group.title }}</h4>
              <p>{{ group.description }}</p>
            </div>
            <t-popup v-if="canEditDeps" trigger="click" placement="bottom-right">
              <t-button size="small" theme="primary">{{ $t('ext.skills.detail.pickDeps') }}</t-button>
              <template #content>
                <div class="skill-deps__menu" @mousedown.stop @click.stop>
                  <t-input v-model="dependencySearch[group.key]" size="small" clearable :placeholder="group.searchPlaceholder" />
                  <button
                    v-for="option in filteredOptions(group)"
                    :key="option.value"
                    type="button"
                    class="skill-deps__option"
                    :class="{ 'is-on': isSelected(group, option.value) }"
                    @click="toggleDependency(group, option.value)"
                  >
                    {{ option.label }}
                  </button>
                  <p v-if="!filteredOptions(group).length" class="skill-deps__empty">{{ $t('ext.skills.detail.noDeps') }}</p>
                </div>
              </template>
            </t-popup>
          </div>
          <div class="skill-deps__chips">
            <t-tag
              v-for="value in dependencyForm[group.formKey]"
              :key="value"
              size="small"
              variant="light-outline"
              theme="success"
              class="wk-chip"
              :closable="canEditDeps"
              @close="toggleDependency(group, value)"
            >
              {{ optionLabel(group, value) }}
            </t-tag>
            <span v-if="!dependencyForm[group.formKey].length" class="skill-deps__empty">{{ group.emptyText }}</span>
          </div>
        </section>
        <div v-if="canEditDeps" class="skill-deps__actions">
          <t-button size="small" theme="primary" :loading="savingDeps" @click="saveDependencies">
            {{ $t('ext.skills.detail.updateDeps') }}
          </t-button>
        </div>
      </div>
    </div>
  </t-drawer>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import SkillFilesPanel from '@/components/SkillFilesPanel.vue'
import { getSkillDependencyOptions, updateSkillDependencies } from '@/api/chat-work/skill'

const WIDTH_KEY = 'skill-files-drawer:width'
const DEFAULT_WIDTH = 720
const MIN_WIDTH = 480

const props = defineProps<{
  visible: boolean
  configId?: string
  skillId?: string
  catalogId?: string
  skillName: string
  persist?: 'app-core' | 'harness'
  builtin?: boolean
  installed?: boolean
  sourceType?: string
  toolDependencies?: string[]
  mcpDependencies?: string[]
  skillDependencies?: string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  changed: []
}>()

const { t } = useI18n()
const activeTab = ref<'files' | 'deps'>('files')
const fileActions = computed(() => {
  if (props.persist !== 'harness') return 'default'
  if (props.builtin || props.installed) return 'none'
  return 'edit'
})
const canEditDeps = computed(() => props.persist === 'harness' && !props.builtin && !props.installed)
const dependencyOptions = reactive<{ tools: any[]; mcps: any[]; skills: string[] }>({
  tools: [],
  mcps: [],
  skills: [],
})
const dependencyForm = reactive<{ tool_dependencies: string[]; mcp_dependencies: string[]; skill_dependencies: string[] }>({
  tool_dependencies: [],
  mcp_dependencies: [],
  skill_dependencies: [],
})
const dependencySearch = reactive({ tools: '', mcps: '', skills: '' })
const savingDeps = ref(false)

const dependencyGroups = computed(() => {
  const groups = [
    {
      key: 'tools',
      formKey: 'tool_dependencies' as const,
      title: t('ext.skills.detail.depToolsTitle'),
      description: t('ext.skills.detail.depToolsDesc'),
      emptyText: t('ext.skills.detail.depToolsEmpty'),
      searchPlaceholder: t('ext.skills.detail.searchDeps', { name: t('ext.skills.detail.depToolsShort') }),
      options: (dependencyOptions.tools || []).map((item) =>
        typeof item === 'object'
          ? { label: item.name || item.slug, value: item.slug || item.id }
          : { label: item, value: item },
      ),
    },
    {
      key: 'mcps',
      formKey: 'mcp_dependencies' as const,
      title: t('ext.skills.detail.depMcpTitle'),
      description: t('ext.skills.detail.depMcpDesc'),
      emptyText: t('ext.skills.detail.depMcpEmpty'),
      searchPlaceholder: t('ext.skills.detail.searchDeps', { name: 'MCP' }),
      options: (dependencyOptions.mcps || []).map((item) =>
        typeof item === 'object'
          ? { label: item.name || item.slug, value: item.slug || item.id }
          : { label: item, value: item },
      ),
    },
    {
      key: 'skills',
      formKey: 'skill_dependencies' as const,
      title: t('ext.skills.detail.depSkillTitle'),
      description: t('ext.skills.detail.depSkillDesc'),
      emptyText: t('ext.skills.detail.depSkillEmpty'),
      searchPlaceholder: t('ext.skills.detail.searchDeps', { name: 'Skill' }),
      options: (dependencyOptions.skills || []).map((item) =>
        typeof item === 'object'
          ? { label: item.name || item.slug, value: item.slug || item.id }
          : { label: item, value: item },
      ),
    },
  ]
  if (props.sourceType === 'common') return groups.filter((group) => group.key === 'mcps')
  return groups
})

function syncDependencyForm() {
  dependencyForm.tool_dependencies = [...(props.toolDependencies || [])]
  dependencyForm.mcp_dependencies = [...(props.mcpDependencies || [])]
  dependencyForm.skill_dependencies = [...(props.skillDependencies || [])]
}

function filteredOptions(group: { key: string; options: { label: string; value: string }[] }) {
  const keyword = String(dependencySearch[group.key as 'tools'] || '').trim().toLowerCase()
  if (!keyword) return group.options
  return group.options.filter((option) =>
    `${option.label} ${option.value}`.toLowerCase().includes(keyword),
  )
}

function isSelected(group: { formKey: 'tool_dependencies' | 'mcp_dependencies' | 'skill_dependencies' }, value: string) {
  return dependencyForm[group.formKey].includes(value)
}

function optionLabel(group: { options: { label: string; value: string }[] }, value: string) {
  return group.options.find((item) => item.value === value)?.label || value
}

function toggleDependency(group: { formKey: 'tool_dependencies' | 'mcp_dependencies' | 'skill_dependencies' }, value: string) {
  if (!canEditDeps.value) return
  const values = dependencyForm[group.formKey]
  dependencyForm[group.formKey] = values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value]
}

async function loadDependencyOptions() {
  if (props.persist !== 'harness' || !props.catalogId) return
  try {
    const result: any = await getSkillDependencyOptions(props.catalogId)
    dependencyOptions.tools = result?.data?.tools || []
    dependencyOptions.mcps = result?.data?.mcps || []
    dependencyOptions.skills = result?.data?.skills || []
  } catch (error: any) {
    MessagePlugin.error(error?.message || t('ext.skills.detail.loadFailed'))
  }
}

async function saveDependencies() {
  if (!props.catalogId || !canEditDeps.value || savingDeps.value) return
  savingDeps.value = true
  try {
    await updateSkillDependencies(props.catalogId, {
      tool_dependencies: props.sourceType === 'common' ? [] : dependencyForm.tool_dependencies,
      mcp_dependencies: dependencyForm.mcp_dependencies,
      skill_dependencies: props.sourceType === 'common' ? [] : dependencyForm.skill_dependencies,
    })
    MessagePlugin.success(t('ext.skills.detail.depsUpdated'))
    emit('changed')
  } catch (error: any) {
    MessagePlugin.error(error?.message || t('ext.skills.detail.depsUpdateFailed'))
  } finally {
    savingDeps.value = false
  }
}

const drawerWidth = ref(DEFAULT_WIDTH)
const resizing = ref(false)

let resizeStartX = 0
let resizeStartWidth = 0

function maxWidth() {
  return Math.min(1200, Math.max(MIN_WIDTH, Math.floor(window.innerWidth * 0.92)))
}

function clampWidth(width: number) {
  return Math.max(MIN_WIDTH, Math.min(maxWidth(), Math.round(width)))
}

function loadWidth() {
  try {
    const raw = localStorage.getItem(WIDTH_KEY)
    const parsed = raw ? parseInt(raw, 10) : NaN
    if (!Number.isNaN(parsed)) drawerWidth.value = clampWidth(parsed)
  } catch {
    /* ignore */
  }
}

function persistWidth() {
  try {
    localStorage.setItem(WIDTH_KEY, String(drawerWidth.value))
  } catch {
    /* ignore */
  }
}

function onResizeStart(e: MouseEvent) {
  resizing.value = true
  resizeStartX = e.clientX
  resizeStartWidth = drawerWidth.value
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
}

function onResizeMove(e: MouseEvent) {
  drawerWidth.value = clampWidth(resizeStartWidth + (resizeStartX - e.clientX))
}

function onResizeEnd() {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  resizing.value = false
  persistWidth()
}

function cleanupResize() {
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  resizing.value = false
}

function onWindowResize() {
  drawerWidth.value = clampWidth(drawerWidth.value)
}

function onClose() {
  emit('update:visible', false)
}

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    loadWidth()
    activeTab.value = 'files'
    syncDependencyForm()
    if (props.persist === 'harness') loadDependencyOptions()
  },
)

onMounted(() => {
  loadWidth()
  window.addEventListener('resize', onWindowResize, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  cleanupResize()
})
</script>

<style lang="less" scoped>
.skill-files-drawer__shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100%;
  min-height: 0;
  width: 100%;
  overflow: hidden;
  background: var(--td-bg-color-container);
}

.skill-files-drawer__head {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  padding: 14px 18px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.skill-files-drawer__head-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 192, 95, 0.1);
  color: var(--td-brand-color);
  font-size: 16px;
}

.skill-files-drawer__head-text {
  min-width: 0;
  flex: 1;
}

.skill-files-drawer__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-files-drawer__tabs {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
  padding: 0 18px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.skill-files-drawer__tab {
  height: 36px;
  padding: 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--td-text-color-secondary);
  font-size: 13px;
  cursor: pointer;

  &.is-active {
    color: var(--td-text-color-primary);
    border-bottom-color: var(--td-brand-color);
  }
}

.skill-deps {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px 24px;
}

.skill-deps__card {
  padding: 14px 0;
  border-bottom: 1px solid var(--td-component-stroke);
}

.skill-deps__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    color: var(--td-text-color-secondary);
    font-size: 12px;
  }
}

.skill-deps__pick,
.skill-deps__save {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
}

.skill-deps__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

:deep(.t-tag.wk-chip) {
  height: 22px;
  margin: 0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.skill-deps__menu {
  width: 240px;
  max-height: 280px;
  overflow: auto;
  padding: 8px;
}

.skill-deps__option {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 6px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &.is-on {
    background: rgba(7, 192, 95, 0.12);
  }
}

.skill-deps__empty {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}

.skill-deps__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.skill-files-drawer__tabs {
  display: flex;
  gap: 16px;
  flex-shrink: 0;
  padding: 0 18px;
  border-bottom: 1px solid var(--td-component-stroke);
}

.skill-files-drawer__tab {
  height: 36px;
  padding: 0;
  border: 0;
  border-bottom: 2px solid transparent;
  background: transparent;
  color: var(--td-text-color-secondary);
  font-size: 13px;
  cursor: pointer;

  &.is-active {
    color: var(--td-text-color-primary);
    border-bottom-color: var(--td-brand-color);
  }
}

.skill-deps {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px 24px;
}

.skill-deps__card {
  padding: 14px 0;
  border-bottom: 1px solid var(--td-component-stroke);
}

.skill-deps__head {
  display: flex;
  justify-content: space-between;
  gap: 12px;

  h4 {
    margin: 0;
    font-size: 14px;
  }

  p {
    margin: 4px 0 0;
    color: var(--td-text-color-secondary);
    font-size: 12px;
  }
}

.skill-deps__pick,
.skill-deps__save {
  height: 28px;
  padding: 0 10px;
  border: 1px solid var(--td-component-stroke);
  border-radius: 6px;
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
}

.skill-deps__chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

:deep(.t-tag.wk-chip) {
  height: 22px;
  margin: 0;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
}

.skill-deps__menu {
  width: 240px;
  max-height: 280px;
  overflow: auto;
  padding: 8px;
}

.skill-deps__option {
  display: block;
  width: 100%;
  margin-top: 4px;
  padding: 6px 8px;
  border: 0;
  border-radius: 4px;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &.is-on {
    background: rgba(7, 192, 95, 0.12);
  }
}

.skill-deps__empty {
  color: var(--td-text-color-placeholder);
  font-size: 12px;
}

.skill-deps__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.skill-files-drawer__subtitle {
  margin-top: 2px;
  font-size: 12px;
  line-height: 1.4;
  color: var(--td-text-color-secondary);
}

.skill-files-drawer__close {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;

  &:hover {
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-primary);
  }
}
</style>

<style lang="less">
.t-drawer.skill-files-drawer .t-drawer__content-wrapper,
.t-drawer.skill-files-drawer .t-drawer__content {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--td-bg-color-container);
}

.t-drawer.skill-files-drawer .t-drawer__body {
  padding: 0 !important;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.t-drawer.skill-files-drawer--resizing .t-drawer__content,
.t-drawer.skill-files-drawer--resizing .t-drawer__content-wrapper {
  transition: none !important;
}

.skill-files-drawer-resize-handle {
  position: fixed;
  top: 0;
  bottom: 0;
  width: 12px;
  margin-left: -6px;
  cursor: col-resize;
  z-index: 2601;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: skill-files-drawer-resize-handle-in 0.28s cubic-bezier(0.38, 0, 0.24, 1) both;
}

@keyframes skill-files-drawer-resize-handle-in {
  from {
    transform: translateX(var(--skill-files-drawer-travel));
  }

  to {
    transform: translateX(0);
  }
}

.skill-files-drawer-resize-line {
  width: 2px;
  height: 48px;
  border-radius: 1px;
  background: var(--td-component-border);
  opacity: 0.55;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.skill-files-drawer-resize-handle:hover .skill-files-drawer-resize-line,
.skill-files-drawer-resize-handle--active .skill-files-drawer-resize-line {
  opacity: 1;
  background: var(--td-brand-color);
}
</style>
