<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { DialogPlugin, MessagePlugin } from 'tdesign-vue-next'

import { agentApi } from '@/api/chat-work/agent'
import AgentEditModal from './AgentEditModal.vue'
import FallbackAvatar from '@/components/harness/common/FallbackAvatar.vue'
import { isBuiltinAgent, useAgentStore } from '@/stores/harness/agent'
import { generatePixelAvatar } from '@/utils/harness/pixelAvatar'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const agentStore = useAgentStore()
const agentLoading = ref(false)
const openMoreAgentId = ref(null)
const collapsedSections = ref(new Set())

const agentBackendOptions = ref([])
const managedAgents = ref([])
const agentEditModalRef = ref(null)

const SECTION_META = {
  agents: { icon: 'app' },
  subagents: { icon: 'root-list' }
}

const normalizeAgent = (agent) => {
  const agentId = agent?.agent_id || agent?.slug || agent?.id
  return agentId
    ? { ...agent, id: agentId, agent_id: agentId, slug: agent?.slug || agentId }
    : agent
}

const filteredAgents = computed(() => {
  const list = managedAgents.value || []
  return [...list].sort((a, b) => {
    if (isBuiltinAgent(a) !== isBuiltinAgent(b)) return isBuiltinAgent(a) ? -1 : 1
    return String(a.name || a.id).localeCompare(String(b.name || b.id), 'zh-CN')
  })
})

const groupedAgents = computed(() => {
  const agents = filteredAgents.value.filter((agent) => !agent.is_subagent)
  const subagents = filteredAgents.value.filter((agent) => agent.is_subagent)
  return [
    {
      key: 'agents',
      title: t('agent.workManage.sectionAgents'),
      icon: SECTION_META.agents.icon,
      agents
    },
    {
      key: 'subagents',
      title: t('agent.workManage.sectionSubagents'),
      icon: SECTION_META.subagents.icon,
      agents: subagents
    }
  ].filter((group) => group.agents.length > 0)
})

const canManageAgent = (agent) => !!agent?.can_manage
const getAgentDefaultIconSrc = (agent) => (agent.id ? generatePixelAvatar(agent.id) : '')

const getAgentShareLabel = (agent) => {
  const config = agent?.share_config || {}
  const readScope = config.version === 2 ? config.read_scope : config
  const manageScope = config.manage_scope
  if (config.version === 2 && !config.read_scope && !manageScope) {
    return t('agent.workManage.share.ownerOnly')
  }
  const scopeLabel = (scope) => {
    if (!scope) return t('agent.workManage.share.none')
    if (scope.access_level === 'global') return t('agent.workManage.share.global')
    if (scope.access_level === 'department') {
      return t('agent.workManage.share.department', { count: scope.department_ids?.length || 0 })
    }
    return t('agent.workManage.share.user', { count: scope.user_uids?.length || 0 })
  }
  return manageScope
    ? t('agent.workManage.share.readManage', {
        read: scopeLabel(readScope),
        manage: scopeLabel(manageScope)
      })
    : t('agent.workManage.share.readonly', { scope: scopeLabel(readScope) })
}

const isSectionCollapsed = (key) => collapsedSections.value.has(key)
const toggleSection = (key) => {
  const next = new Set(collapsedSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedSections.value = next
}

const toggleMore = (e, agentId) => {
  e.stopPropagation()
  openMoreAgentId.value = openMoreAgentId.value === agentId ? null : agentId
}

const loadAgentBackends = async () => {
  try {
    const response = await agentApi.getAgentBackends()
    agentBackendOptions.value = (response.backends || []).map((backend) => ({
      label: backend.name || backend.backend_id,
      value: backend.backend_id
    }))
  } catch (error) {
    MessagePlugin.error(error.message || t('agent.workManage.loadBackendsFailed'))
  }
}

const loadAgents = async () => {
  agentLoading.value = true
  try {
    const response = await agentApi.getAgents({ includeSubagents: true })
    managedAgents.value = (response.agents || []).map(normalizeAgent)
  } catch (error) {
    MessagePlugin.error(error.message || t('agent.workManage.loadFailed'))
  } finally {
    agentLoading.value = false
  }
}

const openCreateAgentModal = () => {
  agentEditModalRef.value?.openCreate()
}

const openEditAgentModal = (agent) => {
  if (!agent?.id) return
  openMoreAgentId.value = null
  agentEditModalRef.value?.openEdit(agent)
}

const findManagedAgent = (agentId) =>
  managedAgents.value.find((agent) => agent.id === agentId || agent.agent_id === agentId || agent.slug === agentId)

const openEdit = async (agentId) => {
  if (!agentId) return
  let agent = findManagedAgent(agentId)
  if (!agent) {
    await loadAgents()
    agent = findManagedAgent(agentId)
  }
  if (agent) openEditAgentModal(agent)
}

const consumeEditQuery = async () => {
  const editId = typeof route.query.edit === 'string' ? route.query.edit : ''
  if (!editId) return
  const { edit: _edit, ...rest } = route.query
  await router.replace({ path: route.path, query: rest })
  await openEdit(editId)
}

const handleCardClick = (agent) => {
  if (openMoreAgentId.value === agent.id) return
  openEditAgentModal(agent)
}

const refreshAgentLists = async () => {
  await Promise.all([loadAgents(), agentStore.fetchAgents()])
}

const deleteAgent = (agent) => {
  if (isBuiltinAgent(agent)) {
    MessagePlugin.warning(t('agent.workManage.deleteBuiltinWarning'))
    return
  }
  openMoreAgentId.value = null
  const dialog = DialogPlugin.confirm({
    attach: 'body',
    header: t('agent.workManage.deleteConfirmTitle', { name: agent.name }),
    body: t('agent.workManage.deleteConfirmContent'),
    confirmBtn: t('common.delete'),
    cancelBtn: t('common.cancel'),
    theme: 'warning',
    onConfirm: async () => {
      try {
        await agentApi.deleteAgent(agent.id)
        await refreshAgentLists()
        MessagePlugin.success(t('agent.workManage.deleted'))
      } catch (error) {
        MessagePlugin.error(error.message || t('agent.workManage.deleteFailed'))
      } finally {
        dialog.hide()
      }
    }
  })
}

onMounted(async () => {
  await Promise.all([loadAgentBackends(), loadAgents()])
  await consumeEditQuery()
})

watch(
  () => route.query.edit,
  (value) => {
    if (value) consumeEditQuery()
  }
)

defineExpose({
  loading: agentLoading,
  refresh: loadAgents,
  openCreate: openCreateAgentModal,
  openEdit
})
</script>

<template>
  <div class="agent-manage-panel">
    <div v-if="groupedAgents.length === 0" class="agent-empty-state">
      <t-empty :description="t('agent.noAgents')" />
    </div>

    <div v-else class="agent-list-main">
      <template v-for="group in groupedAgents" :key="group.key">
        <div class="agent-card-wrap">
          <div
            class="agent-section-header"
            role="button"
            tabindex="0"
            @click="toggleSection(group.key)"
            @keydown.enter.prevent="toggleSection(group.key)"
            @keydown.space.prevent="toggleSection(group.key)"
          >
            <t-icon :name="group.icon" size="14px" />
            <span>{{ group.title }}</span>
            <span class="agent-section-count">{{ group.agents.length }}</span>
            <t-icon
              class="agent-section-toggle"
              :name="isSectionCollapsed(group.key) ? 'chevron-right' : 'chevron-down'"
              size="14px"
            />
          </div>
          <div
            v-show="!isSectionCollapsed(group.key)"
            v-for="agent in group.agents"
            :key="agent.id"
            class="agent-card"
            :class="{ 'is-builtin': isBuiltinAgent(agent) }"
            @click="handleCardClick(agent)"
          >
            <div class="card-decoration">
              <svg class="star-icon" width="24" height="24" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3L10.8 6.2C10.9 6.7 11.3 7.1 11.8 7.2L15 8L11.8 8.8C11.3 8.9 10.9 9.3 10.8 9.8L10 13L9.2 9.8C9.1 9.3 8.7 8.9 8.2 8.8L5 8L8.2 7.2C8.7 7.1 9.1 6.7 9.2 6.2L10 3Z"
                  stroke="currentColor"
                  stroke-width="0.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="currentColor"
                  fill-opacity="0.15"
                />
              </svg>
              <svg class="star-icon small" width="14" height="14" viewBox="0 0 20 20" fill="none">
                <path
                  d="M10 3L10.8 6.2C10.9 6.7 11.3 7.1 11.8 7.2L15 8L11.8 8.8C11.3 8.9 10.9 9.3 10.8 9.8L10 13L9.2 9.8C9.1 9.3 8.7 8.9 8.2 8.8L5 8L8.2 7.2C8.7 7.1 9.1 6.7 9.2 6.2L10 3Z"
                  stroke="currentColor"
                  stroke-width="0.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  fill="currentColor"
                  fill-opacity="0.15"
                />
              </svg>
            </div>
            <div class="card-header">
              <div class="card-header-left">
                <FallbackAvatar
                  class="agent-card-avatar"
                  :src="agent.icon"
                  :default-src="getAgentDefaultIconSrc(agent)"
                  :name="agent.name || agent.id"
                  :seed="agent.id || agent.name"
                  kind="agent"
                  :size="32"
                  shape="rounded"
                  :alt="agent.name || t('agent.title')"
                />
                <span class="card-title" :title="agent.name">{{ agent.name }}</span>
              </div>
              <t-popup
                v-if="canManageAgent(agent)"
                :visible="openMoreAgentId === agent.id"
                trigger="hover"
                overlayClassName="card-more-popup"
                destroy-on-close
                placement="bottom-right"
                @update:visible="(v) => { if (!v) openMoreAgentId = null }"
              >
                <div
                  class="more-wrap"
                  :class="{ 'active-more': openMoreAgentId === agent.id }"
                  @click="toggleMore($event, agent.id)"
                >
                  <img class="more-icon" src="@/assets/img/more.png" alt="" />
                </div>
                <template #content>
                  <div class="popup-menu">
                    <div class="popup-menu-item" @click.stop="openEditAgentModal(agent)">
                      <t-icon class="menu-icon" name="edit" />
                      <span>{{ t('common.edit') }}</span>
                    </div>
                    <div
                      v-if="!isBuiltinAgent(agent)"
                      class="popup-menu-item delete"
                      @click.stop="deleteAgent(agent)"
                    >
                      <t-icon class="menu-icon" name="delete" />
                      <span>{{ t('common.delete') }}</span>
                    </div>
                  </div>
                </template>
              </t-popup>
            </div>
            <div class="card-content">
              <div
                class="card-description"
                :title="agent.description || t('agent.noDescription')"
              >
                {{ agent.description || t('agent.noDescription') }}
              </div>
            </div>
            <div class="card-bottom">
              <div class="bottom-left">
                <div v-if="isBuiltinAgent(agent)" class="builtin-badge">
                  <t-icon name="lock-on" size="12px" />
                  <span>{{ t('agent.builtin') }}</span>
                </div>
                <div v-else class="builtin-badge">
                  <span>{{ getAgentShareLabel(agent) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <AgentEditModal
      ref="agentEditModalRef"
      :backend-options="agentBackendOptions"
      @saved="refreshAgentLists"
    />
  </div>
</template>

<style lang="less" scoped>
.agent-manage-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--gray-25, #f8fafa);
  color: var(--td-text-color-primary, var(--gray-1000));
}

.agent-empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 100px var(--page-padding, 22px) 40px;
  text-align: center;
}

.agent-list-main {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 var(--page-padding, 22px) 8px;
}

.agent-section-header {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 6px;
  pointer-events: none;
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--gray-25, #f8fafa);
  box-shadow: 0 -8px 0 0 var(--gray-25, #f8fafa);
  padding: 6px 4px 6px 0;
  color: var(--td-text-color-secondary);
  font-family: var(--app-font-family);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  cursor: pointer;
  user-select: none;
  outline: none;

  & > * {
    pointer-events: auto;
  }

  &:hover {
    color: var(--td-text-color-primary);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px var(--td-brand-color-focus, rgba(0, 82, 217, 0.2));
  }

  .t-icon {
    color: inherit;
  }

  .agent-section-toggle {
    margin-left: 4px;
    opacity: 0.7;
    transition: opacity 0.15s ease;
  }

  .agent-section-count {
    margin-left: 2px;
    padding: 0 6px;
    border-radius: 8px;
    background: var(--td-bg-color-secondarycontainer);
    color: var(--td-text-color-secondary);
    font-size: 11px;
    line-height: 16px;
    font-weight: 500;
  }

  &:hover .agent-section-toggle {
    opacity: 1;
  }
}

.agent-card-wrap {
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr;
  margin-bottom: 8px;
  animation: contentFadeIn 0.32s ease-out;
}

@keyframes contentFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.agent-card {
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  overflow: hidden;
  box-sizing: border-box;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  background: var(--td-bg-color-container);
  position: relative;
  z-index: 0;
  cursor: pointer;
  transition: border-color 0.25s ease, box-shadow 0.25s ease;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  height: 136px;
  min-height: 136px;
  min-width: 0;

  &:hover {
    z-index: 1;
    border-color: var(--td-brand-color);
    box-shadow: 0 4px 12px rgba(7, 192, 95, 0.12);
  }

  .card-header,
  .card-content,
  .card-bottom {
    position: relative;
    z-index: 1;
  }
}

.card-decoration {
  position: absolute;
  top: 12px;
  right: 44px;
  display: flex;
  align-items: flex-start;
  gap: 4px;
  pointer-events: none;
  z-index: 0;
  color: rgba(7, 192, 95, 0.35);
  transition: color 0.25s ease;

  .star-icon {
    opacity: 0.9;

    &.small {
      margin-top: 10px;
      opacity: 0.7;
    }
  }
}

.agent-card:hover .card-decoration {
  color: rgba(7, 192, 95, 0.5);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.agent-card-avatar {
  flex-shrink: 0;
}

.card-title {
  color: var(--td-text-color-primary);
  font-family: var(--app-font-family);
  font-size: 15px;
  font-weight: 600;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.more-wrap {
  display: flex;
  width: 28px;
  height: 28px;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
  opacity: 0;

  .agent-card:hover & {
    opacity: 0.6;
  }

  &:hover,
  &.active-more {
    background: var(--td-bg-color-container-hover);
    opacity: 1 !important;
  }

  .more-icon {
    width: 16px;
    height: 16px;
  }
}

.card-content {
  flex: none;
  width: 100%;
  min-width: 0;
  height: 36px;
  margin-bottom: 8px;
  overflow: hidden;
}

.card-description {
  display: -webkit-box;
  /* autoprefixer: ignore next */
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  overflow: hidden;
  text-overflow: ellipsis;
  word-break: break-word;
  overflow-wrap: anywhere;
  color: var(--td-text-color-secondary);
  font-family: var(--app-font-family);
  font-size: 12px;
  font-weight: 400;
  line-height: 18px;
  height: 36px;
  max-height: 36px;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 8px;
  border-top: 0.5px solid var(--td-component-stroke);
  gap: 8px;
}

.bottom-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.builtin-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 10px;
  background: var(--td-bg-color-container-hover);
  color: var(--td-text-color-secondary);
  font-family: var(--app-font-family);
  font-size: 11px;
  font-weight: 500;
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 900px) {
  .agent-card-wrap {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1250px) {
  .agent-card-wrap {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1600px) {
  .agent-card-wrap {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (min-width: 1900px) {
  .agent-card-wrap {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (min-width: 2200px) {
  .agent-card-wrap {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
