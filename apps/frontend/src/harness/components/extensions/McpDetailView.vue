<template>
  <div class="mcp-detail extension-detail-page">
    <div v-if="loading" class="loading-bar-wrapper">
      <div class="loading-bar"></div>
    </div>
    <div class="detail-top-bar">
      <button class="detail-back-btn" @click="goBack">
        <ArrowLeft :size="16" />
        <span>{{ t('knowledgeList.extensions.mcp.detail.back') }}</span>
      </button>
      <div class="detail-title-area">
        <span class="detail-icon">{{ server?.icon || '🔌' }}</span>
        <div class="detail-title-text">
          <h2>{{ server?.name || name }}</h2>
          <span class="detail-subtitle">{{ server?.transport || '' }}</span>
        </div>
      </div>
      <div class="detail-actions">
        <a-space :size="8">
          <button
            type="button"
            @click="handleTestServer"
            :disabled="testLoading || server?.requires_migration"
            :title="server?.requires_migration ? t('knowledgeList.extensions.mcp.detail.migrateFirst') : ''"
            class="lucide-icon-btn extension-panel-action extension-panel-action-secondary"
          >
            <Zap :size="14" v-if="!testLoading" />
            <span>{{ t('knowledgeList.extensions.mcp.detail.test') }}</span>
          </button>
          <button
            type="button"
            @click="startEdit"
            :disabled="isEditing || !server || server.is_builtin"
            :title="server?.is_builtin ? t('knowledgeList.extensions.mcp.detail.builtinConfigHint') : ''"
            class="lucide-icon-btn extension-panel-action extension-panel-action-secondary"
          >
            <Pencil :size="14" />
            <span>{{ t('knowledgeList.extensions.mcp.detail.edit') }}</span>
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
        </a-space>
      </div>
    </div>

    <div class="detail-content-wrapper">
      <a-spin :spinning="loading">
        <div v-if="server" class="detail-content-inner">
          <a-alert
            v-if="server.requires_migration"
            type="warning"
            show-icon
            :message="t('knowledgeList.extensions.mcp.detail.migrateAlert')"
          />
          <a-tabs v-model:activeKey="detailTab" class="detail-tabs">
            <a-tab-pane key="general">
              <template #tab>
                <span class="tab-title"><Settings2 :size="14" />{{ t('knowledgeList.extensions.mcp.detail.tabInfo') }}</span>
              </template>
              <div class="tab-content">
                <div v-if="isEditing" class="edit-panel">
                  <div class="edit-panel-header">
                    <div>
                      <h3>{{ t('knowledgeList.extensions.mcp.detail.editHeading') }}</h3>
                      <p>{{ t('knowledgeList.extensions.mcp.detail.editHint') }}</p>
                    </div>
                  </div>

                  <a-form layout="vertical" class="extension-form inline-edit-form">
                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('knowledgeList.extensions.mcp.detail.basicTitle') }}</span>
                        <small>{{ t('knowledgeList.extensions.mcp.detail.basicHint') }}</small>
                      </div>
                      <div class="form-grid form-grid-three">
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.slug')" required class="form-item">
                          <a-input v-model:value="editForm.slug" disabled />
                        </a-form-item>
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.name')" required class="form-item">
                          <a-input
                            v-model:value="editForm.name"
                            :placeholder="t('knowledgeList.extensions.mcp.form.namePlaceholder')"
                          />
                        </a-form-item>
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.transport')" required class="form-item">
                          <a-select v-model:value="editForm.transport">
                            <a-select-option value="streamable_http"
                              >streamable_http</a-select-option
                            >
                            <a-select-option value="sse">sse</a-select-option>
                          </a-select>
                        </a-form-item>
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.icon')" class="form-item">
                          <a-input
                            v-model:value="editForm.icon"
                            :placeholder="t('knowledgeList.extensions.mcp.form.iconPlaceholder')"
                            :maxlength="2"
                          />
                        </a-form-item>
                      </div>
                      <a-form-item :label="t('knowledgeList.extensions.mcp.form.description')" class="form-item form-item-full">
                        <a-textarea
                          v-model:value="editForm.description"
                          :placeholder="t('knowledgeList.extensions.mcp.form.descPlaceholder')"
                          :rows="2"
                        />
                      </a-form-item>
                    </section>

                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('knowledgeList.extensions.mcp.detail.connTitle') }}</span>
                        <small>{{ t('knowledgeList.extensions.mcp.detail.connHint') }}</small>
                      </div>
                      <template
                        v-if="
                          editForm.transport === 'streamable_http' || editForm.transport === 'sse'
                        "
                      >
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.url')" required class="form-item form-item-full">
                          <a-input
                            v-model:value="editForm.url"
                            placeholder="https://example.com/mcp"
                          />
                        </a-form-item>
                        <div class="form-grid">
                          <a-form-item :label="t('knowledgeList.extensions.mcp.form.httpTimeout')" class="form-item">
                            <a-input-number
                              v-model:value="editForm.timeout"
                              :min="1"
                              :max="300"
                              style="width: 100%"
                            />
                          </a-form-item>
                          <a-form-item :label="t('knowledgeList.extensions.mcp.form.sseTimeout')" class="form-item">
                            <a-input-number
                              v-model:value="editForm.sse_read_timeout"
                              :min="1"
                              :max="300"
                              style="width: 100%"
                            />
                          </a-form-item>
                        </div>
                      </template>
                      <a-form-item :label="t('knowledgeList.extensions.mcp.form.tags')" class="form-item form-item-full">
                        <a-select
                          v-model:value="editForm.tags"
                          mode="tags"
                          :placeholder="t('knowledgeList.extensions.mcp.form.tagsPlaceholder')"
                          style="width: 100%"
                        />
                      </a-form-item>
                    </section>

                    <section class="form-section">
                      <div class="form-section-title">
                        <span>{{ t('knowledgeList.extensions.mcp.detail.advancedTitle') }}</span>
                        <small>{{ t('knowledgeList.extensions.mcp.detail.advancedHint') }}</small>
                      </div>
                      <template
                        v-if="
                          editForm.transport === 'streamable_http' || editForm.transport === 'sse'
                        "
                      >
                        <a-form-item :label="t('knowledgeList.extensions.mcp.form.headers')" class="form-item form-item-full">
                          <a-textarea
                            v-model:value="editForm.headersText"
                            :placeholder="t('knowledgeList.extensions.mcp.form.headersPlaceholder')"
                            :rows="4"
                            class="config-textarea"
                          />
                          <div class="form-helper">
                            {{ t('knowledgeList.extensions.mcp.detail.headersHelp') }}
                          </div>
                        </a-form-item>
                      </template>
                    </section>
                  </a-form>

                  <div class="edit-panel-actions">
                    <a-button @click="cancelEdit" :disabled="editLoading" class="lucide-icon-btn">
                      <template #icon><X :size="14" /></template>
                      {{ t('knowledgeList.extensions.mcp.detail.cancel') }}
                    </a-button>
                    <a-button
                      type="primary"
                      @click="handleSaveEdit"
                      :loading="editLoading"
                      class="lucide-icon-btn"
                    >
                      <template #icon><Save :size="14" /></template>
                      {{ t('knowledgeList.extensions.mcp.detail.save') }}
                    </a-button>
                  </div>
                </div>

                <div v-else class="info-grid">
                  <div class="info-item" v-if="server.description">
                    <label>{{ t('knowledgeList.extensions.mcp.form.description') }}</label>
                    <span>{{ server.description }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('knowledgeList.extensions.mcp.form.transport') }}</label>
                    <span>
                      <a-tag :color="getTransportColor(server.transport)">{{
                        server.transport
                      }}</a-tag>
                    </span>
                  </div>
                  <div
                    class="info-item"
                    v-if="Array.isArray(server.tags) && server.tags.length > 0"
                  >
                    <label>{{ t('knowledgeList.extensions.mcp.form.tags') }}</label>
                    <span>
                      <a-tag v-for="tag in server.tags" :key="tag">{{ tag }}</a-tag>
                    </span>
                  </div>
                  <template
                    v-if="server.transport === 'streamable_http' || server.transport === 'sse'"
                  >
                    <div class="info-item" v-if="server.url">
                      <label>{{ t('knowledgeList.extensions.mcp.form.url') }}</label>
                      <span class="code-inline text-break-all">{{ server.url }}</span>
                    </div>
                    <div
                      class="info-item"
                      v-if="server.headers && Object.keys(server.headers).length > 0"
                    >
                      <label>{{ t('knowledgeList.extensions.mcp.form.headers') }}</label>
                      <pre class="code-pre">{{ JSON.stringify(server.headers, null, 2) }}</pre>
                    </div>
                    <div class="info-item" v-if="server.timeout">
                      <label>{{ t('knowledgeList.extensions.mcp.form.httpTimeout') }}</label>
                      <span>{{ t('knowledgeList.extensions.mcp.detail.seconds', { count: server.timeout }) }}</span>
                    </div>
                    <div class="info-item" v-if="server.sse_read_timeout">
                      <label>{{ t('knowledgeList.extensions.mcp.form.sseTimeout') }}</label>
                      <span>{{ t('knowledgeList.extensions.mcp.detail.seconds', { count: server.sse_read_timeout }) }}</span>
                    </div>
                  </template>
                  <template v-if="server.transport === 'stdio'">
                    <div class="info-item" v-if="server.command">
                      <label>{{ t('knowledgeList.extensions.mcp.detail.command') }}</label>
                      <span class="code-inline">{{ server.command }}</span>
                    </div>
                    <div class="info-item" v-if="server.args && server.args.length > 0">
                      <label>{{ t('knowledgeList.extensions.mcp.detail.args') }}</label>
                      <span>
                        <a-tag v-for="(arg, index) in server.args" :key="index" size="small">{{
                          arg
                        }}</a-tag>
                      </span>
                    </div>
                    <div class="info-item" v-if="server.env && Object.keys(server.env).length > 0">
                      <label>{{ t('knowledgeList.extensions.mcp.detail.env') }}</label>
                      <pre class="code-pre">{{ JSON.stringify(server.env, null, 2) }}</pre>
                    </div>
                  </template>
                  <div class="info-item">
                    <label>{{ t('knowledgeList.extensions.mcp.detail.createdAt') }}</label>
                    <span>{{ formatTime(server.created_at) }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('knowledgeList.extensions.mcp.detail.updatedAt') }}</label>
                    <span>{{ formatTime(server.updated_at) }}</span>
                  </div>
                  <div class="info-item">
                    <label>{{ t('knowledgeList.extensions.mcp.detail.creator') }}</label>
                    <span>{{ server.created_by }}</span>
                  </div>
                </div>
              </div>
            </a-tab-pane>

            <a-tab-pane v-if="!server.requires_migration" key="tools">
              <template #tab>
                <span class="tab-title"><Wrench :size="14" />{{ t('knowledgeList.extensions.mcp.detail.tabTools', { count: tools.length }) }}</span>
              </template>
              <div class="tab-content tools-tab">
                <div class="tools-toolbar">
                  <a-input-search
                    v-model:value="toolSearchText"
                    :placeholder="t('knowledgeList.extensions.mcp.detail.searchTools')"
                    style="width: 200px"
                    allowClear
                  />
                  <a-button @click="fetchTools" :loading="toolsLoading" class="lucide-icon-btn">
                    <RotateCw :size="14" />
                    <span>{{ t('knowledgeList.extensions.mcp.detail.refresh') }}</span>
                  </a-button>
                </div>
                <a-spin :spinning="toolsLoading">
                  <div v-if="filteredTools.length === 0" class="empty-tools">
                    <a-empty :description="toolsError || t('knowledgeList.extensions.mcp.detail.noTools')" />
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
                          <a-tooltip :title="`ID: ${tool.id}`">
                            <Info :size="14" class="info-icon" />
                          </a-tooltip>
                        </div>
                        <div class="tool-actions">
                          <a-switch
                            :checked="tool.enabled"
                            @change="handleToggleTool(tool)"
                            :loading="toggleToolLoading === tool.name"
                            size="small"
                          />
                          <a-tooltip :title="t('knowledgeList.extensions.mcp.detail.copyToolName')">
                            <a-button
                              type="text"
                              size="small"
                              @click="copyToolName(tool.name)"
                              class="lucide-icon-btn"
                            >
                              <Copy :size="14" />
                            </a-button>
                          </a-tooltip>
                        </div>
                      </div>
                      <div class="tool-description" v-if="tool.description">
                        {{ tool.description }}
                      </div>
                      <a-collapse
                        v-if="tool.parameters && Object.keys(tool.parameters).length > 0"
                        ghost
                      >
                        <a-collapse-panel key="params" :header="t('knowledgeList.extensions.mcp.detail.params')">
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
                                  >{{ t('knowledgeList.extensions.mcp.detail.required') }}</span
                                >
                                <span class="param-type">{{ param.type || 'any' }}</span>
                              </div>
                              <div class="param-desc" v-if="param.description">
                                {{ param.description }}
                              </div>
                            </div>
                          </div>
                        </a-collapse-panel>
                      </a-collapse>
                    </div>
                  </div>
                </a-spin>
              </div>
            </a-tab-pane>
          </a-tabs>
        </div>
        <div v-else-if="!loading" class="detail-empty">
          <a-empty :description="t('knowledgeList.extensions.mcp.detail.notFound')" />
        </div>
      </a-spin>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
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
import { mcpApi } from '@harness/apis/mcp_api'
import { formatFullDateTime } from '@harness/utils/time'

const { t } = useI18n()
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
  if (server.value?.requires_migration) return t('knowledgeList.extensions.mcp.detail.delete')
  if (server.value?.enabled === false) return t('knowledgeList.extensions.mcp.detail.add')
  return server.value?.is_builtin
    ? t('knowledgeList.extensions.mcp.detail.remove')
    : t('knowledgeList.extensions.mcp.detail.delete')
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
  router.push({ path: '/platform/knowledge-bases', query: { surface: 'mcp' } })
}

const formatTime = (timeStr) => formatFullDateTime(timeStr)

const getTransportColor = (transport) => {
  const colors = { sse: 'orange', stdio: 'green', streamable_http: 'blue' }
  return colors[transport] || 'blue'
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
      message.error(t('knowledgeList.extensions.mcp.form.badHeaders'))
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
    message.error(t('knowledgeList.extensions.mcp.form.nameRequired'))
    return false
  }
  if (!data.transport) {
    message.error(t('knowledgeList.extensions.mcp.form.transportRequired'))
    return false
  }
  if (['sse', 'streamable_http'].includes(data.transport) && !data.url?.trim()) {
    message.error(t('knowledgeList.extensions.mcp.form.urlRequired'))
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
      message.success(t('knowledgeList.extensions.mcp.form.updated'))
      isEditing.value = false
      await fetchServer()
    } else {
      message.error(t('knowledgeList.extensions.mcp.form.updateFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.form.updateFailed'))
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
        message.info(t('knowledgeList.extensions.mcp.detail.addFirst'))
        router.replace({ path: '/platform/knowledge-bases', query: { surface: 'mcp' } })
        return
      }
      server.value = result.data
    } else {
      message.error(t('knowledgeList.extensions.mcp.detail.fetchFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.detail.fetchFailed'))
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
  if (!server.value) return
  try {
    toggleToolLoading.value = tool.name
    const result = await mcpApi.toggleMcpServerTool(server.value.slug, tool.name)
    if (result.success) {
      message.success(
        t(
          result.enabled
            ? 'knowledgeList.extensions.mcp.detail.toolEnabled'
            : 'knowledgeList.extensions.mcp.detail.toolDisabled',
          { name: tool.name }
        )
      )
      const targetTool = tools.value.find((t) => t.name === tool.name)
      if (targetTool) targetTool.enabled = result.enabled
    } else {
      message.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
  } finally {
    toggleToolLoading.value = null
  }
}

const copyToolName = async (toolName) => {
  try {
    await navigator.clipboard.writeText(toolName)
    message.success(t('knowledgeList.extensions.mcp.detail.copied'))
  } catch {
    message.error(t('knowledgeList.extensions.mcp.detail.copyFailed'))
  }
}

const handleTestServer = async () => {
  if (!server.value) return
  try {
    testLoading.value = server.value.name
    const result = await mcpApi.testMcpServer(server.value.slug)
    if (result.success) {
      message.success(
        t('knowledgeList.extensions.mcp.detail.testOk', { count: result.tool_count ?? 0 })
      )
    } else {
      message.warning(t('knowledgeList.extensions.mcp.detail.connectFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.detail.testFailed'))
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
      message.success(
        t(enabled ? 'knowledgeList.extensions.mcp.detail.added' : 'knowledgeList.extensions.mcp.detail.removed')
      )
      await fetchServer()
    } else {
      message.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.form.actionFailed'))
  }
}

const confirmDeleteServer = (srv) => {
  Modal.confirm({
    title: t('knowledgeList.extensions.mcp.deleteTitle'),
    content: t('knowledgeList.extensions.mcp.deleteContent', { name: srv.name }),
    okText: t('knowledgeList.extensions.mcp.delete'),
    okType: 'danger',
    cancelText: t('knowledgeList.extensions.cancel'),
    async onOk() {
      try {
        const result = await mcpApi.deleteMcpServer(srv.slug)
        if (result.success) {
          message.success(t('knowledgeList.extensions.mcp.deleted'))
          router.push({ path: '/platform/knowledge-bases', query: { surface: 'mcp' } })
        } else {
          message.error(t('knowledgeList.extensions.mcp.deleteFailed'))
        }
      } catch {
        message.error(t('knowledgeList.extensions.mcp.deleteFailed'))
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

    :deep(.ant-form-item) {
      margin-bottom: 0;
    }

    :deep(.ant-form-item-label > label) {
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

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }

  .form-grid-three {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(120px, 0.45fr);
  }

  .form-item-full {
    width: 100%;
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

      :deep(.ant-collapse) {
        background: transparent;
        border: none;

        .ant-collapse-header {
          padding: 8px 0;
          font-size: 13px;
          color: var(--gray-600);
        }
        .ant-collapse-content-box {
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
}
</style>
