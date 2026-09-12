<template>
  <div class="agent-view">
    <div class="agent-view-body">
      <!-- 中间内容区域 -->
      <div class="content">
        <ChatWorkPanel
          ref="chatComponentRef"
          :single-mode="false"
          @thread-change="handleThreadChange"
        >
          <template #input-actions-left="{ hasActiveThread }">
            <button
              v-if="selectedAgentId"
              ref="agentDropdownTriggerRef"
              type="button"
              class="input-action-btn config-dropdown-trigger"
              :class="{ disabled: isLoadingConfig, active: agentDropdownOpen }"
              :aria-label="currentAgentLabel"
              aria-haspopup="menu"
              :aria-expanded="agentDropdownOpen"
              @click.stop="toggleAgentDropdown"
            >
              <FallbackAvatar
                v-if="currentAgentOption"
                class="config-dropdown-compact-icon"
                :src="currentAgentOption.icon"
                :default-src="currentAgentOption.defaultIcon"
                :name="currentAgentOption.label"
                :seed="currentAgentOption.value || currentAgentOption.label"
                kind="agent"
                :size="18"
                shape="rounded"
                alt=""
              />
              <span class="hide-text config-dropdown-text">{{ currentAgentLabel }}</span>
              <ChevronDown size="15" class="config-dropdown-chevron" />
            </button>

            <Teleport to="body">
              <div v-if="agentDropdownOpen" class="agent-selector-overlay" @click="agentDropdownOpen = false">
                <div
                  ref="agentDropdownPanelRef"
                  class="agent-selector-dropdown"
                  :style="agentDropdownStyle"
                  @click.stop
                >
                  <div class="agent-selector-header">
                    <span>{{ t('agent.selectAgent') }}</span>
                    <button type="button" class="agent-selector-add" @click="openRuntimeAgentList">
                      <span class="add-icon">+</span>
                      <span class="add-text">{{ t('agent.manageAgents') }}</span>
                    </button>
                  </div>
                  <div class="agent-selector-content" @scroll="hideDetailPanel">
                    <div v-if="builtinAgentOptions.length" class="agent-group">
                      <div class="agent-group-title">{{ t('agent.builtinAgents') }}</div>
                      <div
                        v-for="agent in builtinAgentOptions"
                        :key="agent.value"
                        class="agent-option"
                        :class="{
                          selected: agent.value === selectedAgentId,
                          disabled: hasActiveThread && agent.value !== selectedAgentId
                        }"
                        @mouseenter="onAgentOptionEnter(agent, $event)"
                        @mouseleave="onAgentOptionLeave"
                        @click="handleAgentSwitch(agent.value, hasActiveThread)"
                      >
                        <FallbackAvatar
                          class="agent-option-avatar"
                          :src="agent.icon"
                          :default-src="agent.defaultIcon"
                          :name="agent.label"
                          :seed="agent.value || agent.label"
                          kind="agent"
                          :size="22"
                          shape="rounded"
                          :alt="`${agent.label}图标`"
                        />
                        <span class="agent-option-name">{{ agent.label }}</span>
                      </div>
                    </div>
                    <div v-if="customAgentOptions.length" class="agent-group">
                      <div class="agent-group-title">{{ t('agent.customAgents') }}</div>
                      <div
                        v-for="agent in customAgentOptions"
                        :key="agent.value"
                        class="agent-option"
                        :class="{
                          selected: agent.value === selectedAgentId,
                          disabled: hasActiveThread && agent.value !== selectedAgentId
                        }"
                        @mouseenter="onAgentOptionEnter(agent, $event)"
                        @mouseleave="onAgentOptionLeave"
                        @click="handleAgentSwitch(agent.value, hasActiveThread)"
                      >
                        <FallbackAvatar
                          class="agent-option-avatar"
                          :src="agent.icon"
                          :default-src="agent.defaultIcon"
                          :name="agent.label"
                          :seed="agent.value || agent.label"
                          kind="agent"
                          :size="22"
                          shape="rounded"
                          :alt="`${agent.label}图标`"
                        />
                        <span class="agent-option-name">{{ agent.label }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  v-if="activeDetail"
                  ref="detailPanelRef"
                  class="agent-detail-panel"
                  :style="detailPanelStyle"
                  @mouseenter="onDetailPanelEnter"
                  @mouseleave="onAgentOptionLeave"
                  @click.stop
                >
                  <div class="agent-detail-panel-inner">
                    <div class="detail-header">
                      <FallbackAvatar
                        class="agent-option-avatar"
                        :src="activeDetail.icon"
                        :default-src="activeDetail.defaultIcon"
                        :name="activeDetail.label"
                        :seed="activeDetail.value || activeDetail.label"
                        kind="agent"
                        :size="28"
                        shape="rounded"
                        alt=""
                      />
                      <div class="detail-title-wrap">
                        <div class="detail-title-row">
                          <span class="detail-name">{{ activeDetail.label }}</span>
                          <button
                            type="button"
                            class="detail-header-action"
                            :title="t('agent.selector.goToSettings')"
                            @click="openRuntimeAgentEditor(activeDetail.value)"
                          >
                            <t-icon name="setting" size="14px" />
                          </button>
                        </div>
                        <span v-if="activeDetail.value === selectedAgentId" class="detail-current">
                          {{ t('agent.selector.current') }}
                        </span>
                      </div>
                    </div>
                    <p class="detail-desc">{{ activeDetail.description || t('agent.noDescription') }}</p>
                  </div>
                </div>
              </div>
            </Teleport>
          </template>
        </ChatWorkPanel>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { ChevronDown } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'
import { getRootZoom, rectToCssPx, cssViewportSize } from '@/utils/zoom'
import ChatWorkPanel from './ChatWorkPanel.vue'
import { isBuiltinAgent, useAgentStore } from '@harness/stores/agent'
import { handleChatError } from '@harness/utils/errorHandler'
import { generatePixelAvatar } from '@harness/utils/pixelAvatar'
import FallbackAvatar from '@harness/components/common/FallbackAvatar.vue'

import { storeToRefs } from 'pinia'

const { t } = useI18n()

// 组件引用
const chatComponentRef = ref(null)

// Stores
const agentStore = useAgentStore()
const route = useRoute()
const router = useRouter()

// 从 agentStore 中获取响应式状态
const { agents, selectedAgentId, isLoadingConfig } = storeToRefs(agentStore)

const syncingRouteThread = ref(false)

const getRouteThreadId = () => {
  const value = route.params.thread_id
  return typeof value === 'string' ? value : ''
}

const getRouteAgentId = () => {
  const value = route.query.agent_id
  return typeof value === 'string' ? value : ''
}

const syncSelectedThreadFromRoute = async () => {
  const chatComponent = chatComponentRef.value
  if (!chatComponent?.selectThreadFromRoute) return

  const threadId = getRouteThreadId()
  syncingRouteThread.value = true
  try {
    if (!threadId && !agentStore.isInitialized) {
      await agentStore.initialize()
    }

    const ok = await chatComponent.selectThreadFromRoute(threadId)
    if (threadId && !ok) {
      await router.replace({ name: 'chatWorkCreat' })
    }
  } catch (error) {
    handleChatError(error, 'load')
  } finally {
    syncingRouteThread.value = false
  }
}

const consumeRouteAgentSelection = async () => {
  const targetAgentId = getRouteAgentId()
  if (!targetAgentId || getRouteThreadId()) return

  try {
    if (!agentStore.isInitialized) {
      await agentStore.initialize()
    }

    await nextTick()
    await chatComponentRef.value?.selectThreadFromRoute?.('')
    await agentStore.selectAgent(targetAgentId)
  } catch (error) {
    handleChatError(error, 'load')
  } finally {
    const nextQuery = { ...route.query }
    delete nextQuery.agent_id
    await router.replace({ name: 'chatWorkCreat', query: nextQuery })
  }
}

watch(
  () => route.params.thread_id,
  () => {
    syncSelectedThreadFromRoute()
  },
  { immediate: true }
)

watch(
  () => route.query.agent_id,
  () => {
    consumeRouteAgentSelection()
  },
  { immediate: true }
)

watch(chatComponentRef, (instance) => {
  if (!instance) return
  syncSelectedThreadFromRoute()
})

const handleThreadChange = (threadId) => {
  if (syncingRouteThread.value) return
  const currentRouteThreadId = getRouteThreadId()
  const nextThreadId = threadId || ''
  if (currentRouteThreadId === nextThreadId) return

  if (nextThreadId) {
    router.replace({ name: 'chatWork', params: { thread_id: nextThreadId } })
  } else {
    router.replace({ name: 'chatWorkCreat' })
  }
}

const agentQuickSwitchOptions = computed(() =>
  (agents.value || [])
    .filter((agent) => !agent.is_subagent)
    .map((agent) => ({
      label: agent.name || agent.id,
      value: agent.id,
      icon: agent.icon || '',
      defaultIcon: agent.id ? generatePixelAvatar(agent.id) : '',
      description: agent.description || '',
      isBuiltin: isBuiltinAgent(agent)
    }))
)

const currentAgentOption = computed(() =>
  agentQuickSwitchOptions.value.find((agent) => agent.value === selectedAgentId.value)
)

const currentAgentLabel = computed(() => {
  if (isLoadingConfig.value) return t('common.loading')
  return currentAgentOption.value?.label || t('harness.chat.agent')
})

const builtinAgentOptions = computed(() =>
  agentQuickSwitchOptions.value.filter((agent) => agent.isBuiltin)
)
const customAgentOptions = computed(() =>
  agentQuickSwitchOptions.value.filter((agent) => !agent.isBuiltin)
)

const agentDropdownOpen = ref(false)
const agentDropdownTriggerRef = ref(null)
const agentDropdownPanelRef = ref(null)
const agentDropdownStyle = ref({})
const activeDetail = ref(null)
const detailAnchorEl = ref(null)
const detailPanelRef = ref(null)
const detailPanelStyle = ref({})
let detailHideTimer = null
const DETAIL_PANEL_WIDTH = 200
const DETAIL_PANEL_GAP = 8
const DETAIL_HIDE_DELAY_MS = 400

const updateAgentDropdownPosition = () => {
  const anchor = agentDropdownTriggerRef.value
  if (!anchor) return
  const zoom = getRootZoom()
  const rect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: vw, height: vh } = cssViewportSize(zoom)
  const dropdownWidth = 220
  const offsetY = 6
  let left = Math.floor(rect.left)
  left = Math.max(16, Math.min(Math.max(16, vw - dropdownWidth - 16), left))
  const preferredDropdownHeight = 280
  const minDropdownHeight = 100
  const spaceBelow = vh - rect.bottom
  const spaceAbove = rect.top
  if (spaceBelow >= minDropdownHeight + offsetY) {
    agentDropdownStyle.value = {
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
  agentDropdownStyle.value = {
    position: 'fixed',
    width: `${dropdownWidth}px`,
    left: `${left}px`,
    bottom: `${vh - rect.top + offsetY}px`,
    maxHeight: `${availableHeight >= preferredDropdownHeight ? preferredDropdownHeight : Math.max(minDropdownHeight, availableHeight)}px`,
    zIndex: '10001'
  }
}

const toggleAgentDropdown = () => {
  if (isLoadingConfig.value) return
  agentDropdownOpen.value = !agentDropdownOpen.value
}

watch(agentDropdownOpen, (open) => {
  if (!open) {
    hideDetailPanel()
    return
  }
  nextTick(() => {
    updateAgentDropdownPosition()
    requestAnimationFrame(() => updateAgentDropdownPosition())
  })
})

const hideDetailPanel = () => {
  if (detailHideTimer) {
    clearTimeout(detailHideTimer)
    detailHideTimer = null
  }
  activeDetail.value = null
  detailAnchorEl.value = null
}

const updateDetailPanelPosition = () => {
  const anchor = detailAnchorEl.value
  if (!anchor || !activeDetail.value) return
  const zoom = getRootZoom()
  const rowRect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: vw, height: vh } = cssViewportSize(zoom)
  let left = rowRect.right + DETAIL_PANEL_GAP
  if (left + DETAIL_PANEL_WIDTH > vw - 8) {
    left = Math.max(8, vw - DETAIL_PANEL_WIDTH - 8)
  }
  const panelHeight = detailPanelRef.value?.offsetHeight || 140
  const rowCenter = rowRect.top + rowRect.height / 2
  let top = rowCenter - panelHeight / 2
  const minTop = 8
  const maxTop = vh - panelHeight - 8
  top = Math.max(minTop, Math.min(top, maxTop))
  detailPanelStyle.value = {
    position: 'fixed',
    left: `${Math.round(left)}px`,
    top: `${Math.round(top)}px`,
    width: `${DETAIL_PANEL_WIDTH}px`,
    zIndex: '10002'
  }
}

const onAgentOptionEnter = (agent, event) => {
  if (detailHideTimer) {
    clearTimeout(detailHideTimer)
    detailHideTimer = null
  }
  activeDetail.value = agent
  detailAnchorEl.value = event.currentTarget
  nextTick(() => {
    const zoom = getRootZoom()
    const rowRect = rectToCssPx(event.currentTarget.getBoundingClientRect(), zoom)
    const { width: vw, height: vh } = cssViewportSize(zoom)
    let left = rowRect.right + DETAIL_PANEL_GAP
    if (left + DETAIL_PANEL_WIDTH > vw - 8) {
      left = Math.max(8, vw - DETAIL_PANEL_WIDTH - 8)
    }
    const panelHeight = detailPanelRef.value?.offsetHeight || 140
    const rowCenter = rowRect.top + rowRect.height / 2
    let top = rowCenter - panelHeight / 2
    top = Math.max(8, Math.min(top, vh - panelHeight - 8))
    detailPanelStyle.value = {
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      width: `${DETAIL_PANEL_WIDTH}px`,
      zIndex: '10002'
    }
    requestAnimationFrame(updateDetailPanelPosition)
  })
}

const onAgentOptionLeave = () => {
  detailHideTimer = setTimeout(() => {
    activeDetail.value = null
  }, DETAIL_HIDE_DELAY_MS)
}

const onDetailPanelEnter = () => {
  if (detailHideTimer) {
    clearTimeout(detailHideTimer)
    detailHideTimer = null
  }
}

const openRuntimeAgentList = () => {
  hideDetailPanel()
  agentDropdownOpen.value = false
  router.push({ path: '/platform/agents', query: { surface: 'work' } })
}

const openRuntimeAgentEditor = (agentId) => {
  hideDetailPanel()
  agentDropdownOpen.value = false
  router.push({
    path: '/platform/agents',
    query: { surface: 'work', ...(agentId ? { edit: agentId } : {}) }
  })
}

onBeforeUnmount(() => {
  hideDetailPanel()
})

const handleAgentSwitch = async (agentId, hasActiveThread) => {
  if (!agentId || agentId === selectedAgentId.value) return
  if (hasActiveThread) {
    MessagePlugin.info(t('harness.chat.switchBound'))
    return
  }
  try {
    await agentStore.selectAgent(agentId)
    agentDropdownOpen.value = false
  } catch (error) {
    console.error('切换智能体出错:', error)
    MessagePlugin.error(t('harness.chat.switchFailed'))
  }
}

</script>

<style lang="less" scoped>
.agent-view {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.agent-view-body {
  --gap-radius: 6px;
  display: flex;
  flex-direction: row;
  width: 100%;
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
}

.content {
  flex: 1;
  overflow: hidden;
}

.config-dropdown-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 0;
  max-width: min(240px, calc(100vw - 160px));
  height: 28px;
  padding: 0 10px;
  gap: 4px;
  border: 0.5px solid var(--td-component-border, #e7e7e7);
  border-radius: 6px;
  background: transparent;
  color: var(--td-text-color-secondary, #666);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(.disabled),
  &.active {
    background: var(--td-bg-color-secondarycontainer-hover, #e6e6e6);
  }
}

.config-dropdown-trigger :deep(svg) {
  color: currentColor;
}

.config-dropdown-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: currentColor;
}

.config-dropdown-chevron {
  flex-shrink: 0;
  color: currentColor;
}

.config-dropdown-compact-icon {
  display: none;
  flex-shrink: 0;
}

@container (max-width: 640px) {
  .config-dropdown-trigger {
    width: 30px;
    padding-inline: 0;
  }

  .config-dropdown-compact-icon {
    display: block;
  }

  .config-dropdown-text,
  .config-dropdown-chevron {
    display: none;
  }
}

// 响应式优化
@media (max-width: 520px) {
  .config-dropdown-trigger {
    max-width: calc(100vw - 112px);
  }
}
</style>

<style lang="less">
.agent-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: transparent;
  touch-action: none;
}

.agent-selector-dropdown {
  position: fixed !important;
  background: var(--td-bg-color-container);
  border: 0.5px solid var(--td-component-border);
  border-radius: 8px;
  box-shadow: var(--td-shadow-2);
  display: flex;
  flex-direction: column;
  z-index: 10001;
  margin: 0;
  transform-origin: top left;
  animation: agentSelectorFadeIn 0.15s ease-out;
  overflow: hidden;
  overflow-x: hidden;
  box-sizing: border-box;
}

@keyframes agentSelectorFadeIn {
  from {
    opacity: 0;
    transform: scale(0.98);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.agent-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  min-height: 36px;
  padding: 8px 12px;
  border-bottom: 0.5px solid var(--td-component-stroke);
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  color: var(--td-text-color-secondary);
  overflow: hidden;
}

.agent-selector-add {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  height: 22px;
  padding: 0 6px;
  border: none;
  border-radius: 5px;
  color: var(--td-brand-color);
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: var(--td-bg-color-secondarycontainer);
  }

  .add-icon {
    font-size: 14px;
    font-weight: 400;
  }
}

.agent-selector-content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 6px 4px 8px;
  scrollbar-width: thin;
  scrollbar-gutter: auto;

  &::-webkit-scrollbar:horizontal {
    display: none;
    height: 0;
  }
}

.agent-group {
  min-width: 0;
  max-width: 100%;
}

.agent-group:not(:last-child) {
  margin-bottom: 4px;
  padding-bottom: 4px;
  border-bottom: 0.5px solid var(--td-component-stroke);
}

.agent-group-title {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  padding: 8px 12px 4px;
  font-weight: 600;
  line-height: 16px;
}

.agent-option {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  margin: 0 4px;
  padding: 6px 8px;
  border: none;
  box-sizing: border-box;
  width: calc(100% - 8px);
  max-width: calc(100% - 8px);
  min-width: 0;
  background: transparent;
  cursor: pointer;
  transition: background 0.12s;
  border-radius: 5px;
  text-align: left;

  &:hover,
  &.selected {
    background: var(--td-bg-color-secondarycontainer);
  }

  &.disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }
}

.agent-option-avatar {
  width: 22px;
  height: 22px;
  border-radius: 5px;
  flex-shrink: 0;
}

.agent-option-name {
  font-size: 12px;
  color: var(--td-text-color-primary);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 22px;
}

.agent-option-action-icon {
  flex-shrink: 0;
  color: var(--td-text-color-secondary);
}

.agent-detail-panel {
  box-sizing: border-box;
  position: relative;
  --detail-panel-gap: 8px;
  --detail-bridge-width: 8px;

  &::before {
    content: '';
    position: absolute;
    left: calc(-1 * (var(--detail-bridge-width) + var(--detail-panel-gap)));
    top: 0;
    width: calc(var(--detail-bridge-width) + var(--detail-panel-gap));
    height: 100%;
  }
}

.agent-detail-panel-inner {
  padding: 12px;
  border: 1px solid var(--td-component-stroke);
  border-radius: var(--td-radius-large, 9px);
  background: var(--td-bg-color-container);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.04);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.detail-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.detail-title-row {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.detail-name {
  font-weight: 600;
  font-size: 13px;
  line-height: 18px;
  word-break: break-word;
  min-width: 0;
  flex: 1;
}

.detail-header-action {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--td-text-color-placeholder);
  cursor: pointer;

  &:hover {
    background: var(--td-bg-color-component-hover, #e8e8e8);
    color: var(--td-text-color-secondary);
  }
}

.detail-current {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.detail-desc {
  margin: 0;
  font-size: 12px;
  color: var(--td-text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
