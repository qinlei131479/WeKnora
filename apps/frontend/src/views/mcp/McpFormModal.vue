<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="settings-overlay" @click.self="close">
        <div class="settings-modal" role="dialog" aria-modal="true">
          <button type="button" class="close-btn" :aria-label="t('common.cancel')" @click="close">
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
                <div class="nav-group-title">{{ t('knowledgeList.extensions.mcp.form.navGroup') }}</div>
                <div
                  :class="['nav-item', { active: currentSection === 'config' }]"
                  @click="currentSection = 'config'"
                >
                  <t-icon name="edit-1" class="nav-icon" />
                  <span class="nav-label">{{ configNavLabel }}</span>
                </div>
                <div
                  v-if="editMode && !activeServer?.requires_migration"
                  :class="['nav-item', { active: currentSection === 'tools' }]"
                  @click="currentSection = 'tools'"
                >
                  <t-icon name="tools" class="nav-icon" />
                  <span class="nav-label">{{ t('knowledgeList.extensions.mcp.form.navTools') }}</span>
                </div>
              </div>
            </div>

            <div class="settings-content">
              <div class="content-wrapper">
                <t-loading v-if="detailLoading" :loading="true" class="mcp-inline-loading" />
                <div v-show="currentSection === 'config'" class="section">
                  <div class="section-header">
                    <div class="section-header__top">
                      <div>
                        <h2>{{ configNavLabel }}</h2>
                        <p class="section-description">
                          {{
                            isReadonly
                              ? t('knowledgeList.extensions.mcp.detail.builtinConfigHint')
                              : editMode
                                ? t('knowledgeList.extensions.mcp.detail.editHint')
                                : t('knowledgeList.extensions.mcp.form.createHint')
                          }}
                        </p>
                      </div>
                      <t-button
                        v-if="editMode && !activeServer?.requires_migration"
                        theme="primary"
                        variant="text"
                        class="mcp-test-trigger"
                        :loading="!!testLoading"
                        @click="handleTestServer"
                      >
                        <template #icon><t-icon name="play-circle-stroke" /></template>
                        {{ t('knowledgeList.extensions.mcp.detail.test') }}
                      </t-button>
                    </div>
                  </div>

                  <t-alert
                    v-if="activeServer?.requires_migration"
                    theme="warning"
                    :message="t('knowledgeList.extensions.mcp.detail.migrateAlert')"
                    style="margin-bottom: 16px"
                  />

                  <div class="mcp-settings">
                    <div class="setting-row">
                      <div class="setting-info">
                        <label>
                          {{ t('knowledgeList.extensions.mcp.form.slug') }}
                          <span class="required">*</span>
                        </label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.slugDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-input
                          v-model="form.slug"
                          :placeholder="t('knowledgeList.extensions.mcp.form.slugPlaceholder')"
                          :disabled="editMode || isReadonly"
                        />
                      </div>
                    </div>
                    <div class="setting-row">
                      <div class="setting-info">
                        <label>
                          {{ t('knowledgeList.extensions.mcp.form.name') }}
                          <span class="required">*</span>
                        </label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.nameDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-input
                          v-model="form.name"
                          :placeholder="t('knowledgeList.extensions.mcp.form.namePlaceholder')"
                          :disabled="isReadonly"
                        />
                      </div>
                    </div>
                    <div class="setting-row setting-row-vertical">
                      <div class="setting-info">
                        <label>{{ t('knowledgeList.extensions.mcp.form.description') }}</label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.descriptionDesc') }}</p>
                      </div>
                      <div class="setting-control setting-control-full">
                        <t-textarea
                          v-model="form.description"
                          :placeholder="t('knowledgeList.extensions.mcp.form.descPlaceholder')"
                          :autosize="{ minRows: 2, maxRows: 4 }"
                          :disabled="isReadonly"
                        />
                      </div>
                    </div>
                    <div class="setting-row">
                      <div class="setting-info">
                        <label>
                          {{ t('knowledgeList.extensions.mcp.form.transport') }}
                          <span class="required">*</span>
                        </label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.transportDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-select v-model="form.transport" :disabled="isReadonly">
                          <t-option value="streamable_http" label="Streamable HTTP / streamable_http" />
                          <t-option value="sse" label="SSE / sse" />
                          <t-option v-if="form.transport === 'stdio'" value="stdio" label="stdio" />
                        </t-select>
                      </div>
                    </div>
                    <div class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('knowledgeList.extensions.mcp.form.icon') }}</label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.iconDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-input
                          v-model="form.icon"
                          :placeholder="t('knowledgeList.extensions.mcp.form.iconPlaceholder')"
                          :maxlength="2"
                          :disabled="isReadonly"
                        />
                      </div>
                    </div>
                    <template v-if="form.transport === 'streamable_http' || form.transport === 'sse'">
                      <div class="setting-row">
                        <div class="setting-info">
                          <label>
                            {{ t('knowledgeList.extensions.mcp.form.url') }}
                            <span class="required">*</span>
                          </label>
                          <p class="desc">{{ t('knowledgeList.extensions.mcp.form.urlDesc') }}</p>
                        </div>
                        <div class="setting-control">
                          <t-input v-model="form.url" placeholder="https://example.com/mcp" :disabled="isReadonly" />
                        </div>
                      </div>
                      <div class="setting-row setting-row-vertical">
                        <div class="setting-info">
                          <label>{{ t('knowledgeList.extensions.mcp.form.headers') }}</label>
                          <p class="desc">{{ t('knowledgeList.extensions.mcp.form.headersDesc') }}</p>
                        </div>
                        <div class="setting-control setting-control-full">
                          <t-textarea
                            v-model="form.headersText"
                            :placeholder="t('knowledgeList.extensions.mcp.form.headersPlaceholder')"
                            :autosize="{ minRows: 3 }"
                            :disabled="isReadonly"
                          />
                        </div>
                      </div>
                      <div class="setting-row">
                        <div class="setting-info">
                          <label>{{ t('knowledgeList.extensions.mcp.form.httpTimeout') }}</label>
                          <p class="desc">{{ t('knowledgeList.extensions.mcp.form.httpTimeoutDesc') }}</p>
                        </div>
                        <div class="setting-control">
                          <t-input-number
                            v-model="form.timeout"
                            :min="1"
                            :max="300"
                            theme="column"
                            :disabled="isReadonly"
                          />
                        </div>
                      </div>
                      <div class="setting-row">
                        <div class="setting-info">
                          <label>{{ t('knowledgeList.extensions.mcp.form.sseTimeout') }}</label>
                          <p class="desc">{{ t('knowledgeList.extensions.mcp.form.sseTimeoutDesc') }}</p>
                        </div>
                        <div class="setting-control">
                          <t-input-number
                            v-model="form.sse_read_timeout"
                            :min="1"
                            :max="300"
                            theme="column"
                            :disabled="isReadonly"
                          />
                        </div>
                      </div>
                    </template>
                    <template v-if="form.transport === 'stdio'">
                      <div v-if="activeServer?.command" class="setting-row">
                        <div class="setting-info">
                          <label>{{ t('knowledgeList.extensions.mcp.detail.command') }}</label>
                        </div>
                        <div class="setting-control">
                          <t-input :model-value="activeServer.command" disabled />
                        </div>
                      </div>
                      <div v-if="activeServer?.args?.length" class="setting-row">
                        <div class="setting-info">
                          <label>{{ t('knowledgeList.extensions.mcp.detail.args') }}</label>
                        </div>
                        <div class="setting-control">
                          <div class="wk-chip-row">
                            <t-tag
                              v-for="(arg, index) in activeServer.args"
                              :key="index"
                              size="small"
                              variant="light-outline"
                              class="wk-chip"
                            >{{ arg }}</t-tag>
                          </div>
                        </div>
                      </div>
                    </template>
                    <div class="setting-row">
                      <div class="setting-info">
                        <label>{{ t('knowledgeList.extensions.mcp.form.tags') }}</label>
                        <p class="desc">{{ t('knowledgeList.extensions.mcp.form.tagsDesc') }}</p>
                      </div>
                      <div class="setting-control">
                        <t-select
                          v-model="form.tags"
                          multiple
                          creatable
                          filterable
                          :placeholder="t('knowledgeList.extensions.mcp.form.tagsPlaceholder')"
                          class="mcp-tags-select"
                          :disabled="isReadonly"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div v-show="currentSection === 'tools'" class="section tools-section">
                  <div class="section-header">
                    <h2>{{ t('knowledgeList.extensions.mcp.form.navTools') }}</h2>
                    <p class="section-description">{{ t('knowledgeList.extensions.mcp.form.toolsHint') }}</p>
                  </div>
                  <div class="tools-toolbar">
                    <t-input
                      v-model="toolSearchText"
                      :placeholder="t('knowledgeList.extensions.mcp.detail.searchTools')"
                      style="width: 240px"
                      clearable
                    />
                    <span class="tools-count">
                      {{ t('knowledgeList.extensions.mcp.detail.tabTools', { count: tools.length }) }}
                    </span>
                    <t-button variant="outline" :loading="toolsLoading" @click="fetchTools">
                      {{ t('knowledgeList.extensions.mcp.detail.refresh') }}
                    </t-button>
                  </div>
                  <t-loading :loading="toolsLoading">
                    <div v-if="filteredTools.length === 0" class="empty-tools">
                      <t-empty :description="toolsError || t('knowledgeList.extensions.mcp.detail.noTools')" />
                    </div>
                    <div v-else class="tools-list">
                      <div
                        v-for="tool in filteredTools"
                        :key="tool.name"
                        class="tool-card"
                        :class="{ disabled: !tool.enabled }"
                      >
                        <div class="tool-header">
                          <div class="tool-info">
                            <span class="tool-name">{{ tool.name }}</span>
                          </div>
                          <div class="tool-actions">
                            <t-switch
                              :model-value="tool.enabled"
                              size="small"
                              :loading="toggleToolLoading === tool.name"
                              :disabled="isReadonly"
                              @change="handleToggleTool(tool)"
                            />
                            <t-tooltip :content="t('common.copy')" placement="top">
                              <t-button
                                theme="default"
                                size="small"
                                variant="text"
                                class="tool-copy-btn"
                                @click="copyToolName(tool.name)"
                              >
                                <t-icon name="file-copy" />
                              </t-button>
                            </t-tooltip>
                          </div>
                        </div>
                        <div v-if="tool.description" class="tool-description">{{ tool.description }}</div>
                      </div>
                    </div>
                  </t-loading>
                </div>
              </div>

              <div class="settings-footer">
                <div class="settings-footer-actions">
                  <t-button variant="outline" @click="close">
                    {{ t('common.cancel') }}
                  </t-button>
                  <t-button v-if="!isReadonly" theme="primary" :loading="formLoading" @click="handleFormSubmit">
                    {{ t('knowledgeList.extensions.mcp.form.saveAndClose') }}
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

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { mcpApi } from '@/api/runtime/mcp'

const { t } = useI18n()
const props = defineProps({
  open: { type: Boolean, default: false },
  editMode: { type: Boolean, default: false },
  editData: { type: Object, default: null }
})

const emit = defineEmits(['update:open', 'submitted'])

const visible = computed({
  get: () => props.open,
  set: (val) => emit('update:open', val)
})

const currentSection = ref('config')
const formLoading = ref(false)
const detailLoading = ref(false)
const detailServer = ref(null)
const activeServer = computed(() => detailServer.value || props.editData)
const isReadonly = computed(() => props.editMode && !!activeServer.value?.is_builtin)
const configNavLabel = computed(() => {
  if (!props.editMode) return t('knowledgeList.extensions.mcp.form.navCreate')
  return isReadonly.value
    ? t('knowledgeList.extensions.mcp.form.navView')
    : t('knowledgeList.extensions.mcp.form.navConfig')
})
const modalTitle = computed(() => {
  if (!props.editMode) return t('knowledgeList.extensions.mcp.form.addTitle')
  return isReadonly.value
    ? t('knowledgeList.extensions.mcp.form.viewTitle')
    : t('knowledgeList.extensions.mcp.form.editTitle')
})
const testLoading = ref(false)
const tools = ref([])
const toolsLoading = ref(false)
const toolsError = ref(null)
const toolSearchText = ref('')
const toggleToolLoading = ref(null)

const form = reactive({
  slug: '',
  name: '',
  description: '',
  transport: 'streamable_http',
  url: '',
  headersText: '',
  timeout: null,
  sse_read_timeout: null,
  tags: [],
  icon: ''
})

const filteredTools = computed(() => {
  if (!toolSearchText.value) return tools.value
  const search = toolSearchText.value.toLowerCase()
  return tools.value.filter(
    (item) =>
      item.name.toLowerCase().includes(search) ||
      (item.description && item.description.toLowerCase().includes(search))
  )
})

const resetForm = (data) => {
  Object.assign(form, {
    slug: data?.slug || '',
    name: data?.name || '',
    description: data?.description || '',
    transport: data?.transport || 'streamable_http',
    url: data?.url || '',
    headersText: data?.headers ? JSON.stringify(data.headers, null, 2) : '',
    timeout: data?.timeout ?? null,
    sse_read_timeout: data?.sse_read_timeout ?? null,
    tags: data?.tags || [],
    icon: data?.icon || ''
  })
}

const loadDetail = async (server) => {
  if (!server?.slug) return
  try {
    detailLoading.value = true
    const result = await mcpApi.getMcpServer(server.slug)
    if (result.success && result.data) {
      detailServer.value = result.data
      resetForm(result.data)
    } else {
      detailServer.value = server
    }
  } catch {
    detailServer.value = server
  } finally {
    detailLoading.value = false
  }
}

watch(
  () => props.open,
  (val) => {
    if (!val) return
    currentSection.value = 'config'
    tools.value = []
    toolsError.value = null
    toolSearchText.value = ''
    if (props.editMode && props.editData?.slug) {
      resetForm(props.editData)
      void loadDetail(props.editData)
      return
    }
    detailServer.value = null
    resetForm(null)
  },
  { immediate: true }
)

watch(currentSection, (section) => {
  if (section === 'tools' && activeServer.value?.slug) fetchTools()
})

const close = () => {
  visible.value = false
}

const handleEscape = (e) => {
  if (e.key === 'Escape' && visible.value) close()
}

onMounted(() => window.addEventListener('keydown', handleEscape))
onUnmounted(() => window.removeEventListener('keydown', handleEscape))

const fetchTools = async () => {
  if (!activeServer.value?.slug) return
  try {
    toolsLoading.value = true
    toolsError.value = null
    const result = await mcpApi.getMcpServerTools(activeServer.value.slug)
    if (result.success) {
      tools.value = result.data || []
    } else {
      toolsError.value = t('knowledgeList.extensions.mcp.detail.fetchToolsFailed')
      tools.value = []
    }
  } catch {
    toolsError.value = t('knowledgeList.extensions.mcp.detail.fetchToolsFailed')
    tools.value = []
  } finally {
    toolsLoading.value = false
  }
}

const handleToggleTool = async (tool) => {
  if (!activeServer.value?.slug || isReadonly.value) return
  try {
    toggleToolLoading.value = tool.name
    const result = await mcpApi.toggleMcpServerTool(activeServer.value.slug, tool.name)
    if (result.success) {
      MessagePlugin.success(
        t(
          result.enabled
            ? 'knowledgeList.extensions.mcp.detail.toolEnabled'
            : 'knowledgeList.extensions.mcp.detail.toolDisabled',
          { name: tool.name }
        )
      )
      const target = tools.value.find((item) => item.name === tool.name)
      if (target) target.enabled = result.enabled
    } else {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
    }
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
  } finally {
    toggleToolLoading.value = null
  }
}

const copyToolName = async (toolName) => {
  try {
    await navigator.clipboard.writeText(toolName)
    MessagePlugin.success(t('knowledgeList.extensions.mcp.detail.copied'))
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.mcp.detail.copyFailed'))
  }
}

const handleTestServer = async () => {
  if (!activeServer.value?.slug) return
  try {
    testLoading.value = true
    const result = await mcpApi.testMcpServer(activeServer.value.slug)
    if (result.success) {
      MessagePlugin.success(
        t('knowledgeList.extensions.mcp.detail.testOk', { count: result.tool_count ?? 0 })
      )
      if (currentSection.value === 'tools') await fetchTools()
    } else {
      MessagePlugin.warning(t('knowledgeList.extensions.mcp.detail.connectFailed'))
    }
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.mcp.detail.testFailed'))
  } finally {
    testLoading.value = false
  }
}

const handleFormSubmit = async () => {
  try {
    formLoading.value = true
    let headers = null
    if (form.headersText.trim()) {
      try {
        headers = JSON.parse(form.headersText)
      } catch {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.badHeaders'))
        return false
      }
    }
    const data = {
      slug: form.slug,
      name: form.name,
      description: form.description || null,
      transport: form.transport,
      url: form.url || null,
      headers,
      timeout: form.timeout || null,
      sse_read_timeout: form.sse_read_timeout || null,
      tags: form.tags.length > 0 ? form.tags : null,
      icon: form.icon || null
    }
    if (!data.slug?.trim()) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.slugRequired'))
      return false
    }
    if (!data.name?.trim()) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.nameRequired'))
      return false
    }
    if (!data.transport) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.transportRequired'))
      return false
    }
    if (['sse', 'streamable_http'].includes(data.transport) && !data.url?.trim()) {
      MessagePlugin.error(t('knowledgeList.extensions.mcp.form.urlRequired'))
      return false
    }
    if (props.editMode) {
      const { slug, ...updateData } = data
      const result = await mcpApi.updateMcpServer(activeServer.value?.slug || slug, updateData)
      if (result.success) {
        MessagePlugin.success(t('knowledgeList.extensions.mcp.form.updated'))
      } else {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.updateFailed'))
        return false
      }
    } else {
      const result = await mcpApi.createMcpServer(data)
      if (result.success) {
        MessagePlugin.success(t('knowledgeList.extensions.mcp.form.created'))
      } else {
        MessagePlugin.error(t('knowledgeList.extensions.mcp.form.createFailed'))
        return false
      }
    }
    visible.value = false
    emit('submitted')
  } catch {
    MessagePlugin.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
    return false
  } finally {
    formLoading.value = false
  }
}
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
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--td-bg-color-container);
}

.content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 32px 40px 24px;
}

.mcp-inline-loading {
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.section-header {
  margin-bottom: 8px;
  padding-right: 32px;

  h2 {
    margin: 0 0 8px;
    font-size: 20px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .section-description {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: var(--td-text-color-secondary);
  }
}

.section-header__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.mcp-test-trigger {
  --td-bg-color-container-hover: transparent;
  flex-shrink: 0;
  padding-left: 0;
  padding-right: 0;
  font-weight: 600;

  &:hover,
  &:focus,
  &.t-is-active,
  &:active {
    background-color: transparent !important;
    color: var(--td-brand-color-hover);
  }

  &:active {
    color: var(--td-brand-color-active);
  }
}

.mcp-settings {
  display: flex;
  flex-direction: column;
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
      padding-right: 0;
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

  &.setting-control-full {
    width: 100%;
    min-width: 100%;
    max-width: 100%;
    justify-content: flex-start;
  }

  :deep(.t-select),
  :deep(.t-input),
  :deep(.t-textarea) {
    width: 100%;
    min-width: 0;
  }

  :deep(.t-input-number) {
    width: 120px;
  }
}

.wk-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.settings-footer {
  padding: 12px 40px;
  border-top: 1px solid var(--td-component-stroke);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

.settings-footer-actions {
  display: flex;
  gap: 12px;
}

.tools-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.tools-count {
  color: var(--td-text-color-secondary);
  font-size: 13px;
  white-space: nowrap;
  margin-right: auto;
}

.empty-tools {
  padding: 40px 0;
}

.tools-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tool-card {
  border: 1px solid var(--td-component-stroke);
  border-radius: 8px;
  padding: 12px 16px;

  &.disabled {
    opacity: 0.65;
  }
}

.tool-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tool-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--td-text-color-primary);
}

.tool-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tool-copy-btn {
  flex-shrink: 0;
  color: var(--td-text-color-secondary);

  &:hover {
    color: var(--td-brand-color);
  }
}

.tool-description {
  margin-top: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--td-text-color-secondary);
  white-space: pre-wrap;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .settings-modal,
.modal-leave-active .settings-modal {
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .settings-modal,
.modal-leave-to .settings-modal {
  transform: scale(0.95);
  opacity: 0;
}
</style>
