<template>
  <div class="mcp-detail extension-detail-page">
    <div v-if="loading" class="loading-bar-wrapper">
      <div class="loading-bar"></div>
    </div>
    <div class="detail-top-bar">
      <button class="detail-back-btn" @click="goBack">
        <ArrowLeft :size="16" />
        <span>{{ t('ext.mcp.detail.back') }}</span>
      </button>
      <div class="detail-title-area">
        <div class="detail-icon">{{ server?.icon || '🔌' }}</div>
        <div class="detail-title-text">
          <h2>{{ server?.name || name }}</h2>
          <span class="detail-subtitle">{{ server?.transport || '' }}</span>
        </div>
      </div>
      <div class="detail-actions">
        <div style="display:flex;align-items:center;gap:8px">
          <button
            type="button"
            @click="handleTestServer"
            :disabled="testLoading || server?.requires_migration"
            :title="server?.requires_migration ? t('ext.mcp.detail.migrateFirst') : ''"
            class="lucide-icon-btn extension-panel-action extension-panel-action-secondary"
          >
            <Zap :size="14" v-if="!testLoading" />
            <span>{{ t('ext.mcp.detail.test') }}</span>
          </button>
          <button
            type="button"
            @click="startEdit"
            :disabled="isEditing || !server || server.is_builtin"
            :title="server?.is_builtin ? t('ext.mcp.detail.builtinConfigHint') : ''"
            class="lucide-icon-btn extension-panel-action extension-panel-action-secondary"
          >
            <Pencil :size="14" />
            <span>{{ t('ext.mcp.detail.edit') }}</span>
          </button>
          <button
            type="button"
            @click="handleDangerAction"
            :class="[
              'lucide-icon-btn',
              'extension-panel-action',
              server?.enabled === false && !server?.requires_migration
                ? 'extension-panel-action-primary'
                : 'extension-panel-action-danger'
            ]"
          >
            <Plus v-if="server?.enabled === false && !server?.requires_migration" :size="14" />
            <Trash2 v-else :size="14" />
            <span>{{ actionLabel }}</span>
          </button>
        </div>
      </div>
    </div>

    <div class="detail-content-wrapper">
      <t-loading :loading="loading">
        <div v-if="server" class="detail-content-inner">
          <t-alert
            v-if="server.requires_migration"
            theme="warning"
            :message="t('ext.mcp.detail.migrateAlert')"
          />
          <t-tabs v-model="detailTab" class="detail-tabs">
            <t-tab-panel value="general">
              <template #label>
                <span class="tab-title"><Settings2 :size="14" />{{ t('ext.mcp.detail.tabInfo') }}</span>
              </template>
              <div class="tab-content">
                <div v-if="isEditing" class="edit-panel">
                  <div class="edit-panel-header">
                    <div>
                      <h3>{{ t('ext.mcp.detail.editHeading') }}</h3>
                      <p>{{ t('ext.mcp.detail.editHint') }}</p>
                    </div>
                  </div>

                  <t-form label-align="top" class="extension-form inline-edit-form">
                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('ext.mcp.detail.basicTitle') }}</span>
                        <small>{{ t('ext.mcp.detail.basicHint') }}</small>
                      </div>
                      <t-form-item required class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.slug') }}</span>
                            <small v-if="showEnHint">Identifier</small>
                          </span>
                        </template>
                        <t-input v-model="editForm.slug" disabled />
                      </t-form-item>
                      <t-form-item required class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.name') }}</span>
                            <small v-if="showEnHint">Name</small>
                          </span>
                        </template>
                        <t-input
                          v-model="editForm.name"
                          :placeholder="t('ext.mcp.form.namePlaceholder')"
                        />
                      </t-form-item>
                      <t-form-item required class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.transport') }}</span>
                            <small v-if="showEnHint">Transport</small>
                          </span>
                        </template>
                        <t-select v-model="editForm.transport">
                          <t-option value="streamable_http" label="Streamable HTTP / streamable_http" />
                          <t-option value="sse" label="SSE / sse" />
                        </t-select>
                      </t-form-item>
                      <t-form-item class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.icon') }}</span>
                            <small v-if="showEnHint">Icon</small>
                          </span>
                        </template>
                        <t-input
                          v-model="editForm.icon"
                          :placeholder="t('ext.mcp.form.iconPlaceholder')"
                          :maxlength="2"
                        />
                      </t-form-item>
                      <t-form-item class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.description') }}</span>
                            <small v-if="showEnHint">Description</small>
                          </span>
                        </template>
                        <t-textarea
                          v-model="editForm.description"
                          :placeholder="t('ext.mcp.form.descPlaceholder')"
                          :autosize="{ minRows: 2 }"
                        />
                      </t-form-item>
                    </section>

                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('ext.mcp.detail.connTitle') }}</span>
                        <small>{{ t('ext.mcp.detail.connHint') }}</small>
                      </div>
                      <template
                        v-if="
                          editForm.transport === 'streamable_http' || editForm.transport === 'sse'
                        "
                      >
                        <t-form-item required class="form-item">
                          <template #label>
                            <span class="wk-bilingual-label">
                              <span>{{ t('ext.mcp.form.url') }}</span>
                              <small v-if="showEnHint">URL</small>
                            </span>
                          </template>
                          <t-input
                            v-model="editForm.url"
                            placeholder="https://example.com/mcp"
                          />
                        </t-form-item>
                        <t-form-item class="form-item">
                          <template #label>
                            <span class="wk-bilingual-label">
                              <span>{{ t('ext.mcp.form.httpTimeout') }}</span>
                              <small v-if="showEnHint">HTTP Timeout</small>
                            </span>
                          </template>
                          <t-input-number
                            v-model="editForm.timeout"
                            :min="1"
                            :max="300"
                            style="width: 100%"
                          />
                        </t-form-item>
                        <t-form-item class="form-item">
                          <template #label>
                            <span class="wk-bilingual-label">
                              <span>{{ t('ext.mcp.form.sseTimeout') }}</span>
                              <small v-if="showEnHint">SSE Read Timeout</small>
                            </span>
                          </template>
                          <t-input-number
                            v-model="editForm.sse_read_timeout"
                            :min="1"
                            :max="300"
                            style="width: 100%"
                          />
                        </t-form-item>
                      </template>
                      <t-form-item class="form-item">
                        <template #label>
                          <span class="wk-bilingual-label">
                            <span>{{ t('ext.mcp.form.tags') }}</span>
                            <small v-if="showEnHint">Tags</small>
                          </span>
                        </template>
                        <t-select
                          v-model="editForm.tags"
                          multiple
                          creatable
                          filterable
                          :placeholder="t('ext.mcp.form.tagsPlaceholder')"
                          class="mcp-tags-select"
                          style="width: 100%"
                        />
                      </t-form-item>
                    </section>

                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('ext.mcp.detail.advancedTitle') }}</span>
                        <small>{{ t('ext.mcp.detail.advancedHint') }}</small>
                      </div>
                      <template
                        v-if="
                          editForm.transport === 'streamable_http' || editForm.transport === 'sse'
                        "
                      >
                        <t-form-item :label="t('ext.mcp.form.headers')" class="form-item form-item-full">
                          <t-textarea
                            v-model="editForm.headersText"
                            :placeholder="t('ext.mcp.form.headersPlaceholder')"
                            :autosize="{ minRows: 4 }"
                            class="config-textarea"
                          />
                          <div class="form-helper">
                            {{ t('ext.mcp.detail.headersHelp') }}
                          </div>
                        </t-form-item>
                      </template>
                    </section>
                  </t-form>

                  <div class="edit-panel-actions">
                    <t-button @click="cancelEdit" :disabled="editLoading" class="lucide-icon-btn">
                      <template #icon><X :size="14" /></template>
                      {{ t('ext.mcp.detail.cancel') }}
                    </t-button>
                    <t-button
                      theme="primary"
                      @click="handleSaveEdit"
                      :loading="editLoading"
                      class="lucide-icon-btn"
                    >
                      <template #icon><Save :size="14" /></template>
                      {{ t('ext.mcp.detail.save') }}
                    </t-button>
                  </div>
                </div>

                <div v-else class="info-grid">
                  <div class="info-item" v-if="server.description">
                    <label>{{ t('ext.mcp.form.description') }}</label>
                    <span>{{ server.description }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('ext.mcp.form.transport') }}</label>
                    <span>
                      <t-tag :theme="getTransportTheme(server.transport)" size="small" variant="light-outline" class="wk-chip">{{
                        server.transport
                      }}</t-tag>
                    </span>
                  </div>
                  <div
                    class="info-item"
                    v-if="Array.isArray(server.tags) && server.tags.length > 0"
                  >
                    <label>{{ t('ext.mcp.form.tags') }}</label>
                    <span class="wk-chip-row">
                      <t-tag v-for="tag in server.tags" :key="tag" size="small" variant="light-outline" class="wk-chip">{{ tag }}</t-tag>
                    </span>
                  </div>
                  <template
                    v-if="server.transport === 'streamable_http' || server.transport === 'sse'"
                  >
                    <div class="info-item" v-if="server.url">
                      <label>{{ t('ext.mcp.form.url') }}</label>
                      <span class="code-inline text-break-all">{{ server.url }}</span>
                    </div>
                    <div
                      class="info-item"
                      v-if="server.headers && Object.keys(server.headers).length > 0"
                    >
                      <label>{{ t('ext.mcp.form.headers') }}</label>
                      <pre class="code-pre">{{ JSON.stringify(server.headers, null, 2) }}</pre>
                    </div>
                    <div class="info-item" v-if="server.timeout">
                      <label>{{ t('ext.mcp.form.httpTimeout') }}</label>
                      <span>{{ t('ext.mcp.detail.seconds', { count: server.timeout }) }}</span>
                    </div>
                    <div class="info-item" v-if="server.sse_read_timeout">
                      <label>{{ t('ext.mcp.form.sseTimeout') }}</label>
                      <span>{{ t('ext.mcp.detail.seconds', { count: server.sse_read_timeout }) }}</span>
                    </div>
                  </template>
                  <template v-if="server.transport === 'stdio'">
                    <div class="info-item" v-if="server.command">
                      <label>{{ t('ext.mcp.detail.command') }}</label>
                      <span class="code-inline">{{ server.command }}</span>
                    </div>
                    <div class="info-item" v-if="server.args && server.args.length > 0">
                      <label>{{ t('ext.mcp.detail.args') }}</label>
                      <span class="wk-chip-row">
                        <t-tag v-for="(arg, index) in server.args" :key="index" size="small" variant="light-outline" class="wk-chip">{{
                          arg
                        }}</t-tag>
                      </span>
                    </div>
                    <div class="info-item" v-if="server.env && Object.keys(server.env).length > 0">
                      <label>{{ t('ext.mcp.detail.env') }}</label>
                      <pre class="code-pre">{{ JSON.stringify(server.env, null, 2) }}</pre>
                    </div>
                  </template>
                  <div class="info-item">
                    <label>{{ t('ext.mcp.detail.createdAt') }}</label>
                    <span>{{ formatTime(server.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('ext.mcp.detail.updatedAt') }}</label>
                    <span>{{ formatTime(server.updated_at) }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('ext.mcp.detail.creator') }}</label>
                    <span>{{ server.created_by }}</span>
                  </div>
                </div>
              </div>
            </t-tab-panel>

            <t-tab-panel v-if="!server.requires_migration" value="tools">
              <template #label>
                <span class="tab-title"><Wrench :size="14" />{{ t('ext.mcp.detail.tabTools', { count: tools.length }) }}</span>
              </template>
              <div class="tab-content tools-tab">
                <div class="tools-toolbar">
                  <t-input
                    v-model="toolSearchText"
                    :placeholder="t('ext.mcp.detail.searchTools')"
                    style="width: 200px"
                    clearable
                  />
                  <t-button @click="fetchTools" :loading="toolsLoading" class="lucide-icon-btn">
                    <RotateCw :size="14" />
                    <span>{{ t('ext.mcp.detail.refresh') }}</span>
                  </t-button>
                </div>
                <t-loading :loading="toolsLoading">
                  <div v-if="filteredTools.length === 0" class="empty-tools">
                    <t-empty :description="toolsError || t('ext.mcp.detail.noTools')" />
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
                          <t-tooltip :content="`ID: ${tool.id}`">
                            <Info :size="14" class="info-icon" />
                          </t-tooltip>
                        </div>
                        <div class="tool-actions">
                          <t-switch
                            :model-value="tool.enabled"
                            @change="handleToggleTool(tool)"
                            :loading="toggleToolLoading === tool.name"
                            size="small"
                          />
                          <t-tooltip :content="t('ext.mcp.detail.copyToolName')">
                            <t-button
                              variant="text"
                              size="small"
                              @click="copyToolName(tool.name)"
                              class="lucide-icon-btn"
                            >
                              <Copy :size="14" />
                            </t-button>
                          </t-tooltip>
                        </div>
                      </div>
                      <div class="tool-description" v-if="tool.description">
                        {{ tool.description }}
                      </div>
                      <t-collapse
                        v-if="tool.parameters && Object.keys(tool.parameters).length > 0"
                        borderless
                      >
                        <t-collapse-panel value="params" :header="t('ext.mcp.detail.params')">
                          <div class="params-list">
                            <div
                              v-for="(param, paramName) in tool.parameters"
                              :key="paramName"
                              class="param-item"
                            >
                              <div class="param-header">
                                <span class="param-name">{{ paramName }}</span>
                                <span
                                  class="param-required"
                                  v-if="tool.required?.includes(paramName)"
                                  >{{ t('ext.mcp.detail.required') }}</span
                                >
                                <span class="param-type">{{ param.type || 'any' }}</span>
                              </div>
                              <div class="param-desc" v-if="param.description">
                                {{ param.description }}
                              </div>
                            </div>
                          </div>
                        </t-collapse-panel>
                      </t-collapse>
                    </div>
                  </div>
                </t-loading>
              </div>
            </t-tab-panel>
          </t-tabs>
        </div>
        <div v-else-if="!loading" class="detail-empty">
          <t-empty :description="t('ext.mcp.detail.notFound')" />
        </div>
      </t-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import {
  ArrowLeft,
  Zap,
  Pencil,
  Trash2,
  Plus,
  RotateCw,
  Info,
  Copy,
  Settings2,
  Wrench,
  Save,
  X
} from 'lucide-vue-next'
import { mcpApi } from '@/api/chat-work/mcp'
import { formatFullDateTime } from '@harness/utils/time'
import { knowledgeBasesLocation } from '@/utils/weknoraFeatures'

const { t, locale } = useI18n()
const showEnHint = computed(() => !String(locale.value || '').toLowerCase().startsWith('en'))
const route = useRoute()
const router = useRouter()
const slug = computed(() => decodeURIComponent(route.params.slug ?? route.params.name))

const loading = ref(false)
const server = ref(null)
const detailTab = ref('general')
const testLoading = ref(null)

const tools = ref([])
const toolsLoading = ref(false)
const toolsError = ref(null)
const toolSearchText = ref('')
const toggleToolLoading = ref(null)

const isEditing = ref(false)
const editLoading = ref(false)

const editForm = reactive({
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

const actionLabel = computed(() => {
  if (server.value?.requires_migration) return t('ext.mcp.detail.delete')
  if (server.value?.enabled === false) return t('ext.mcp.detail.add')
  return server.value?.is_builtin
    ? t('ext.mcp.detail.remove')
    : t('ext.mcp.detail.delete')
})

const filteredTools = computed(() => {
  if (!toolSearchText.value) return tools.value
  const search = toolSearchText.value.toLowerCase()
  return tools.value.filter(
    (t) =>
      t.name.toLowerCase().includes(search) ||
      (t.description && t.description.toLowerCase().includes(search))
  )
})

const goBack = () => {
  router.push(knowledgeBasesLocation('mcp'))
}

const formatTime = (timeStr) => formatFullDateTime(timeStr)

const getTransportTheme = (transport) => {
  const themes = { sse: 'warning', stdio: 'success', streamable_http: 'primary' }
  return themes[transport] || 'primary'
}

const resetEditForm = (data) => {
  Object.assign(editForm, {
    slug: data?.slug || '',
    name: data?.name || '',
    description: data?.description || '',
    transport: data?.requires_migration ? 'streamable_http' : data?.transport || 'streamable_http',
    url: data?.url || '',
    headersText: data?.headers ? JSON.stringify(data.headers, null, 2) : '',
    timeout: data?.timeout,
    sse_read_timeout: data?.sse_read_timeout,
    tags: data?.tags || [],
    icon: data?.icon || ''
  })
}

const startEdit = () => {
  if (!server.value) return
  detailTab.value = 'general'
  resetEditForm(server.value)
  isEditing.value = true
}

const cancelEdit = () => {
  isEditing.value = false
  resetEditForm(server.value)
}

const buildEditPayload = () => {
  let headers = null
  if (editForm.headersText.trim()) {
    try {
      headers = JSON.parse(editForm.headersText)
    } catch {
      MessagePlugin.error(t('ext.mcp.form.badHeaders'))
      return null
    }
  }

  return {
    name: editForm.name,
    description: editForm.description || null,
    transport: editForm.transport,
    url: editForm.url || null,
    headers,
    timeout: editForm.timeout || null,
    sse_read_timeout: editForm.sse_read_timeout || null,
    tags: editForm.tags.length > 0 ? editForm.tags : null,
    icon: editForm.icon || null
  }
}

const validateEditPayload = (data) => {
  if (!data.name?.trim()) {
    MessagePlugin.error(t('ext.mcp.form.nameRequired'))
    return false
  }
  if (!data.transport) {
    MessagePlugin.error(t('ext.mcp.form.transportRequired'))
    return false
  }
  if (['sse', 'streamable_http'].includes(data.transport) && !data.url?.trim()) {
    MessagePlugin.error(t('ext.mcp.form.urlRequired'))
    return false
  }
  return true
}

const handleSaveEdit = async () => {
  if (!server.value) return
  const data = buildEditPayload()
  if (!data || !validateEditPayload(data)) return

  try {
    editLoading.value = true
    const result = await mcpApi.updateMcpServer(server.value.slug, data)
    if (result.success) {
      MessagePlugin.success(t('ext.mcp.form.updated'))
      isEditing.value = false
      await fetchServer()
    } else {
      MessagePlugin.error(t('ext.mcp.form.updateFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.form.updateFailed'))
  } finally {
    editLoading.value = false
  }
}

const fetchServer = async () => {
  try {
    loading.value = true
    const result = await mcpApi.getMcpServer(slug.value)
    if (result.success) {
      if (result.data?.enabled === false && !result.data?.requires_migration) {
        server.value = null
        MessagePlugin.info(t('ext.mcp.detail.addFirst'))
        router.replace(knowledgeBasesLocation('mcp'))
        return
      }
      server.value = result.data
    } else {
      MessagePlugin.error(t('ext.mcp.detail.fetchFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.detail.fetchFailed'))
  } finally {
    loading.value = false
  }
}

const fetchTools = async () => {
  if (!server.value) return
  try {
    toolsLoading.value = true
    toolsError.value = null
    const result = await mcpApi.getMcpServerTools(server.value.slug)
    if (result.success) {
      tools.value = result.data || []
    } else {
      toolsError.value = t('ext.mcp.detail.fetchToolsFailed')
      tools.value = []
    }
  } catch {
    toolsError.value = t('ext.mcp.detail.fetchToolsFailed')
    tools.value = []
  } finally {
    toolsLoading.value = false
  }
}

const handleToggleTool = async (tool) => {
  if (!server.value) return
  try {
    toggleToolLoading.value = tool.name
    const result = await mcpApi.toggleMcpServerTool(server.value.slug, tool.name)
    if (result.success) {
      MessagePlugin.success(
        t(
          result.enabled
            ? 'ext.mcp.detail.toolEnabled'
            : 'ext.mcp.detail.toolDisabled',
          { name: tool.name }
        )
      )
      const targetTool = tools.value.find((t) => t.name === tool.name)
      if (targetTool) targetTool.enabled = result.enabled
    } else {
      MessagePlugin.error(t('ext.mcp.form.actionFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.form.actionFailed'))
  } finally {
    toggleToolLoading.value = null
  }
}

const copyToolName = async (toolName) => {
  try {
    await navigator.clipboard.writeText(toolName)
    MessagePlugin.success(t('ext.mcp.detail.copied'))
  } catch {
    MessagePlugin.error(t('ext.mcp.detail.copyFailed'))
  }
}

const handleTestServer = async () => {
  if (!server.value) return
  try {
    testLoading.value = server.value.name
    const result = await mcpApi.testMcpServer(server.value.slug)
    if (result.success) {
      MessagePlugin.success(
        t('ext.mcp.detail.testOk', { count: result.tool_count ?? 0 })
      )
    } else {
      MessagePlugin.warning(t('ext.mcp.detail.connectFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.detail.testFailed'))
  } finally {
    testLoading.value = null
  }
}

const handleDangerAction = async () => {
  if (!server.value) return
  if (server.value.requires_migration) {
    confirmDeleteServer(server.value)
    return
  }
  if (server.value.enabled === false) {
    await handleSetServerEnabled(server.value, true)
    return
  }
  if (server.value.is_builtin) {
    await handleSetServerEnabled(server.value, false)
    return
  }
  confirmDeleteServer(server.value)
}

const handleSetServerEnabled = async (srv, enabled) => {
  try {
    const result = await mcpApi.updateMcpServerStatus(srv.slug, enabled)
    if (result.success) {
      MessagePlugin.success(
        t(enabled ? 'ext.mcp.detail.added' : 'ext.mcp.detail.removed')
      )
      await fetchServer()
    } else {
      MessagePlugin.error(t('ext.mcp.form.actionFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.form.actionFailed'))
  }
}

const confirmDeleteServer = (srv) => {
  const dialog = DialogPlugin.confirm({
    attach: 'body',
    placement: 'center',
    header: t('ext.mcp.deleteTitle'),
    body: t('ext.mcp.deleteContent', { name: srv.name }),
    confirmBtn: { content: t('ext.mcp.delete'), theme: 'danger' },
    cancelBtn: t('ext.cancel'),
    onConfirm: async () => {
      try {
        const result = await mcpApi.deleteMcpServer(srv.slug)
        if (result.success) {
          MessagePlugin.success(t('ext.mcp.deleted'))
          router.push(knowledgeBasesLocation('mcp'))
        } else {
          MessagePlugin.error(t('ext.mcp.deleteFailed'))
        }
      } catch {
        MessagePlugin.error(t('ext.mcp.deleteFailed'))
      } finally {
        dialog.hide()
      }
    }
  })
}

watch(detailTab, (tab) => {
  if (tab === 'tools' && server.value) {
    fetchTools()
  }
})

onMounted(() => {
  fetchServer()
})
</script>

<style lang="less" scoped>
@import '@harness/assets/css/extensions.less';
@import '@harness/assets/css/extension-detail.less';

.edit-panel {
  background: var(--gray-0);
  border: 1px solid var(--gray-150);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.025);

  .edit-panel-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
    margin-bottom: 18px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--gray-100);

    h3 {
      margin: 0 0 4px;
      font-size: 16px;
      font-weight: 600;
      color: var(--gray-900);
    }

    p {
      margin: 0;
      font-size: 13px;
      color: var(--gray-500);
    }
  }

  .inline-edit-form {
    display: flex;
    flex-direction: column;

    :deep(.t-form__item) {
      margin-bottom: 0;
    }

    :deep(.t-form__label) {
      color: var(--gray-700);
      font-size: 13px;
      font-weight: 500;
    }
  }

  .form-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px 0 0;

    & + .form-section {
      margin-top: 18px;
      border-top: 1px solid var(--gray-100);
    }

    &:first-child {
      padding-top: 0;
    }
  }

  .form-section-title {
    display: flex;
    flex-direction: column;
    gap: 3px;

    span {
      font-size: 14px;
      font-weight: 600;
      color: var(--gray-900);
    }

    small {
      font-size: 12px;
      color: var(--gray-500);
    }
  }

  .form-item-full {
    width: 100%;
  }

  .wk-bilingual-label {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    line-height: 20px;

    small {
      font-size: 12px;
      font-weight: 400;
      color: var(--td-text-color-placeholder, var(--gray-500));
    }
  }

  :deep(.mcp-tags-select .t-input__prefix),
  :deep(.mcp-tags-select .t-tag-input__prefix) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  :deep(.mcp-tags-select .t-tag) {
    margin: 0;
  }

  .form-helper {
    margin-top: 6px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--gray-500);
  }

  .config-textarea {
    font-family: @mono-font;
    font-size: 13px;
    line-height: 1.6;
  }

  .env-editor-shell {
    padding: 0;
  }

  .edit-panel-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 18px;
    padding-top: 16px;
    border-top: 1px solid var(--gray-100);
  }
}

/* 工具列表样式 */
.tools-tab {
  .tools-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .empty-tools {
    padding: 40px 0;
  }

  .tools-list {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .tool-card {
      background: var(--gray-0);
      border: 1px solid var(--gray-150);
      border-radius: 8px;
      padding: 12px 16px;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--gray-200);
      }

      &.disabled {
        opacity: 0.6;
      }

      .tool-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;

        .tool-info {
          display: flex;
          align-items: center;
          gap: 8px;

          .tool-name {
            font-weight: 600;
            font-size: 14px;
            color: var(--gray-900);
          }

          .info-icon {
            color: var(--gray-400);
            cursor: pointer;
            &:hover {
              color: var(--gray-600);
            }
          }
        }

        .tool-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
      }

      .tool-description {
        font-size: 13px;
        color: var(--gray-600);
        line-height: 1.4;
        margin-bottom: 8px;
      }

      :deep(.t-collapse) {
        background: transparent;
        border: none;

        .t-collapse-panel__header {
          padding: 8px 0;
          font-size: 13px;
          color: var(--gray-600);
        }
        .t-collapse-panel__content {
          padding: 0;
        }
      }

      .params-list {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .param-item {
          background: var(--gray-50);
          padding: 8px 12px;
          border-radius: 4px;

          .param-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 4px;

            .param-name {
              font-weight: 500;
              font-size: 13px;
              color: var(--gray-900);
              font-family: @mono-font;
            }
            .param-required {
              font-size: 11px;
              color: var(--color-error-500);
              background: var(--color-error-50);
              padding: 1px 6px;
              border-radius: 3px;
            }
            .param-type {
              font-size: 11px;
              color: var(--gray-500);
              background: var(--gray-100);
              padding: 1px 6px;
              border-radius: 3px;
              font-family: @mono-font;
            }
          }

          .param-desc {
            font-size: 12px;
            color: var(--gray-600);
            line-height: 1.4;
          }
        }
      }
    }
  }
}

.mcp-detail {
  .detail-content-wrapper {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    background-color: var(--gray-10);
  }

  .detail-content-inner {
    max-width: 900px;
    margin: 0 auto;
    padding: 16px var(--page-padding);
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
}
</style>
