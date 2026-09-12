<template>
  <div class="mcp-cards-page extension-page-root">
    <Teleport defer to="#extension-page-header-actions">
      <t-button theme="primary" @click="handleMcpAdd">
        <template #icon><t-icon name="add" /></template>
        {{ t('ext.mcp.create') }}
      </t-button>
    </Teleport>

    <PageShoulder :search-placeholder="t('ext.mcp.searchPlaceholder')" v-model:search="searchQuery" />

    <div class="extension-page-body">
    <div
      v-if="filteredEnabledServers.length === 0 && filteredDisabledServers.length === 0"
      class="extension-card-grid-empty-state"
    >
      <t-empty
        :description="searchQuery ? t('ext.mcp.emptySearch') : t('ext.mcp.empty')"
      />
    </div>

    <template v-else>
      <ExtensionCardGrid v-if="filteredEnabledServers.length" :min-width="240" :gap="12">
        <InfoCard
          v-for="server in filteredEnabledServers"
          :key="server.slug"
          layout="kb"
          :title="formatExtensionCardTitle(server.name)"
          :subtitle="server.slug"
          :description="server.description || t('ext.noDescription')"
          :tags="mcpCardTags(server)"
          @click="handleCardClick(server)"
        >
          <template #icon>
            <span class="info-card-emoji-icon">{{ server.icon || '🔌' }}</span>
          </template>
          <template #actions>
            <button
              type="button"
              class="mcp-enabled-action enabled"
              :disabled="isActionLoading(server)"
              :aria-label="server.is_builtin ? t('ext.mcp.remove') : t('ext.mcp.delete')"
              @click.stop="handleRemoveServer(server)"
            >
              <Check :size="15" class="action-icon action-icon-check" />
              <Minus :size="15" class="action-icon action-icon-minus" />
            </button>
          </template>
        </InfoCard>
      </ExtensionCardGrid>

      <ExtensionCardGrid v-if="filteredDisabledServers.length" :min-width="240" :gap="12">
        <InfoCard
          v-for="server in filteredDisabledServers"
          :key="server.slug"
          layout="kb"
          :title="formatExtensionCardTitle(server.name)"
          :subtitle="server.slug"
          :description="server.requires_migration ? t('ext.mcp.needsMigration') : server.description || t('ext.noDescription')"
          :tags="mcpCardTags(server)"
          @click="handleCardClick(server)"
        >
          <template #icon>
            <span class="info-card-emoji-icon">{{ server.icon || '🔌' }}</span>
          </template>
          <template #actions>
            <button
              type="button"
              class="mcp-enabled-action"
              :class="{ enabled: server.requires_migration }"
              :disabled="isActionLoading(server)"
              :aria-label="server.requires_migration ? t('ext.mcp.delete') : t('ext.mcp.add')"
              @click.stop="
                server.requires_migration
                  ? handleRemoveServer(server)
                  : handleSetServerEnabled(server, true)
              "
            >
              <template v-if="server.requires_migration">
                <Check :size="15" class="action-icon action-icon-check" />
                <Minus :size="15" class="action-icon action-icon-minus" />
              </template>
              <Plus v-else :size="15" class="action-icon" />
            </button>
          </template>
        </InfoCard>
      </ExtensionCardGrid>
    </template>
    </div>

    <t-dialog
      v-model:visible="basicInfoVisible"
      attach="body"
      placement="center"
      class="mcp-basic-info-modal"
      :footer="false"
      :width="560"
      :destroy-on-close="true"
      @close="closeBasicInfo"
    >
      <div v-if="previewServer" class="mcp-basic-info-panel">
        <div class="mcp-basic-info-header">
          <div class="mcp-basic-info-icon">
            <span>{{ previewServer.icon || '🔌' }}</span>
          </div>
          <div class="mcp-basic-info-title-area">
            <div class="mcp-basic-info-title">
              {{ formatExtensionCardTitle(previewServer.name) }}
            </div>
            <div class="mcp-basic-info-meta">
              <span>{{ previewServer.transport || t('ext.mcp.unknownTransport') }}</span>
              <span v-if="previewServer.is_builtin" class="mcp-basic-info-tag">
                {{ t('ext.mcp.builtin') }}
              </span>
            </div>
          </div>
        </div>

        <div class="mcp-basic-info-body">
          <div class="mcp-basic-info-row">
            <label>{{ t('ext.mcp.description') }}</label>
            <span>{{ previewServer.description || t('ext.noDescription') }}</span>
          </div>
          <div class="mcp-basic-info-row">
            <label>{{ t('ext.mcp.transport') }}</label>
            <span>{{ previewServer.transport || '-' }}</span>
          </div>
          <div
            v-if="Array.isArray(previewServer.tags) && previewServer.tags.length > 0"
            class="mcp-basic-info-row"
          >
            <label>{{ t('ext.mcp.tags') }}</label>
            <span class="mcp-basic-info-tags wk-chip-row">
              <t-tag v-for="tag in previewServer.tags" :key="tag" size="small" variant="light-outline" class="wk-chip">{{ tag }}</t-tag>
            </span>
          </div>
          <div class="mcp-basic-info-row">
            <label>{{ t('ext.mcp.creator') }}</label>
            <span>{{ previewServer.created_by || '-' }}</span>
          </div>
        </div>

        <div class="mcp-basic-info-footer">
          <t-button @click="closeBasicInfo">{{ t('ext.close') }}</t-button>
          <t-button
            theme="primary"
            class="lucide-icon-btn"
            :loading="isActionLoading(previewServer)"
            @click="handleSetServerEnabled(previewServer, true)"
          >
            <template #icon><Plus :size="14" /></template>
            {{ t('ext.mcp.add') }}
          </t-button>
        </div>
      </div>
    </t-dialog>

    <McpFormModal
      v-model:open="formModalVisible"
      :edit-mode="!!editingServer"
      :edit-data="editingServer"
      @submitted="handleFormSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin, DialogPlugin } from 'tdesign-vue-next'
import { Check, Minus, Plus } from 'lucide-vue-next'
import { mcpApi } from '@/api/chat-work/mcp'
import ExtensionCardGrid from '@/components/harness/extensions/ExtensionCardGrid.vue'
import InfoCard from '@/components/harness/shared/InfoCard.vue'
import PageShoulder from '@/components/harness/shared/PageShoulder.vue'
import McpFormModal from './McpFormModal.vue'
import { formatExtensionCardTitle } from '@/utils/harness/extensionDisplayName'

const { t } = useI18n()

const emit = defineEmits(['loading-change'])

const loading = ref(false)
const servers = ref([])
const searchQuery = ref('')
const formModalVisible = ref(false)
const editingServer = ref(null)
const basicInfoVisible = ref(false)
const previewServer = ref(null)
const actionLoadingSlug = ref('')

watch(loading, (v) => emit('loading-change', v), { immediate: true })

const filteredServers = computed(() => {
  const sorted = [...servers.value].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN', {
      sensitivity: 'base',
      numeric: true
    })
  )
  if (!searchQuery.value) return sorted
  const q = searchQuery.value.toLowerCase()
  return sorted.filter(
    (s) => s.name.toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q)
  )
})

const filteredEnabledServers = computed(() =>
  filteredServers.value.filter((item) => !!item.enabled)
)
const filteredDisabledServers = computed(() =>
  filteredServers.value.filter((item) => !item.enabled)
)
const handleCardClick = (server) => {
  if (server.enabled || server.requires_migration) {
    editingServer.value = server
    formModalVisible.value = true
    return
  }
  openBasicInfo(server)
}

const openBasicInfo = (server) => {
  previewServer.value = server
  basicInfoVisible.value = true
}

const closeBasicInfo = () => {
  basicInfoVisible.value = false
  previewServer.value = null
}

const isActionLoading = (server) => actionLoadingSlug.value === server?.slug

const mcpCardTags = (server) => {
  const tags = []
  if (server?.is_builtin) tags.push(t('ext.mcp.builtin'))
  if (server?.transport) tags.push(server.transport)
  ;(server?.tags || []).slice(0, 2).forEach((tag) => {
    if (tag && !tags.includes(tag)) tags.push(tag)
  })
  return tags
}

const handleMcpAdd = () => {
  editingServer.value = null
  formModalVisible.value = true
}

const handleFormSubmitted = async () => {
  formModalVisible.value = false
  editingServer.value = null
  await fetchServers()
}

const handleSetServerEnabled = async (server, enabled) => {
  try {
    actionLoadingSlug.value = server.slug
    const result = await mcpApi.updateMcpServerStatus(server.slug, enabled)
    if (result.success) {
      MessagePlugin.success(t(enabled ? 'ext.mcp.addedOk' : 'ext.mcp.removedOk'))
      if (enabled) closeBasicInfo()
      await fetchServers()
    } else {
      MessagePlugin.error(t('ext.mcp.actionFailed'))
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.actionFailed'))
  } finally {
    actionLoadingSlug.value = ''
  }
}

const handleRemoveServer = (server) => {
  if (server.is_builtin) {
    handleSetServerEnabled(server, false)
    return
  }
  confirmDeleteServer(server)
}

const confirmDeleteServer = (server) => {
  const dialog = DialogPlugin.confirm({
    attach: 'body',
    placement: 'center',
    header: t('ext.mcp.deleteTitle'),
    body: t('ext.mcp.deleteContent', { name: server.name }),
    confirmBtn: { content: t('ext.mcp.delete'), theme: 'danger' },
    cancelBtn: t('ext.cancel'),
    onConfirm: async () => {
      try {
        actionLoadingSlug.value = server.slug
        const result = await mcpApi.deleteMcpServer(server.slug)
        if (result.success) {
          MessagePlugin.success(t('ext.mcp.deleted'))
          await fetchServers()
        } else {
          MessagePlugin.error(t('ext.mcp.deleteFailed'))
        }
      } catch {
        MessagePlugin.error(t('ext.mcp.deleteFailed'))
      } finally {
        actionLoadingSlug.value = ''
        dialog.hide()
      }
    }
  })
}

const fetchServers = async () => {
  try {
    loading.value = true
    const result = await mcpApi.getMcpServers()
    if (result.success) {
      servers.value = result.data || []
    }
  } catch {
    MessagePlugin.error(t('ext.mcp.loadFailed'))
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchServers()
})

defineExpose({ fetchServers, loading })
</script>

<style lang="less" scoped>
@import '@/assets/harness/css/extensions.less';

.info-card-emoji-icon {
  font-size: 18px;
  line-height: 1;
}

:deep(.t-button) {
  display: inline-flex;
  align-items: center;
}

.mcp-enabled-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
  color: var(--gray-600);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus {
    outline: none;
    border-color: var(--gray-300);
    background: var(--gray-50);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &.enabled {
    color: var(--color-success-700, var(--td-brand-color, #07c05f));

    .action-icon-minus {
      display: none;
    }

    &:hover,
    &:focus {
      border-color: var(--color-error-200, #ffccc7);
      background: var(--color-error-50, #fff2f0);
      color: var(--color-error-700, #cf1322);

      .action-icon-check {
        display: none;
      }

      .action-icon-minus {
        display: block;
      }
    }
  }
}

.action-icon {
  flex-shrink: 0;
}

.mcp-basic-info-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.mcp-basic-info-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mcp-basic-info-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  border: 1px solid var(--gray-150);
  background: var(--main-50);
  color: var(--main-color);
  font-size: 18px;
}

.mcp-basic-info-title-area {
  min-width: 0;
}

.mcp-basic-info-title {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 16px;
  font-weight: 700;
  line-height: 22px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mcp-basic-info-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 18px;
}

.mcp-basic-info-tag {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 6px;
  border-radius: 999px;
  background: var(--gray-100);
  color: var(--gray-600);
  font-size: 11px;
  font-weight: 600;
}

.mcp-basic-info-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--gray-150);
  border-radius: 12px;
  background: var(--gray-25);
}

.mcp-basic-info-row {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  gap: 12px;
  color: var(--gray-700);
  font-size: 13px;
  line-height: 20px;

  label {
    color: var(--gray-500);
    font-weight: 600;
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
}

.mcp-basic-info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.mcp-basic-info-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
