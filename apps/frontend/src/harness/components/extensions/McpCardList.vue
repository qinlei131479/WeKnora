<template>
  <div class="mcp-cards-page extension-page-root">
    <PageShoulder :search-placeholder="t('knowledgeList.extensions.mcp.searchPlaceholder')" v-model:search="searchQuery">
      <template #actions>
        <a-button type="primary" @click="handleMcpAdd" class="lucide-icon-btn">
          <Plus :size="14" />
          <span>{{ t('knowledgeList.extensions.mcp.add') }}</span>
        </a-button>
        <a-tooltip :title="t('knowledgeList.extensions.mcp.refresh')" placement="bottom">
          <a-button class="lucide-icon-btn" :disabled="loading" @click="fetchServers">
            <RefreshCw :size="14" />
          </a-button>
        </a-tooltip>
      </template>
    </PageShoulder>

    <div class="extension-page-body">
    <div
      v-if="filteredEnabledServers.length === 0 && filteredDisabledServers.length === 0"
      class="extension-card-grid-empty-state"
    >
      <a-empty
        :image="false"
        :description="searchQuery ? t('knowledgeList.extensions.mcp.emptySearch') : t('knowledgeList.extensions.mcp.empty')"
      />
    </div>

    <template v-else>
      <div
        v-if="filteredEnabledServers.length"
        class="extension-section-header is-toggle"
        role="button"
        tabindex="0"
        @click="toggleMcpSection('added')"
        @keydown.enter.prevent="toggleMcpSection('added')"
        @keydown.space.prevent="toggleMcpSection('added')"
      >
        <span>{{ t('knowledgeList.extensions.mcp.added') }}</span>
        <span class="section-count">{{ filteredEnabledServers.length }}</span>
        <ChevronRight v-if="isMcpSectionCollapsed('added')" :size="14" class="section-toggle" />
        <ChevronDown v-else :size="14" class="section-toggle" />
      </div>
      <ExtensionCardGrid
        v-if="filteredEnabledServers.length"
        v-show="!isMcpSectionCollapsed('added')"
        :min-width="300"
      >
        <InfoCard
          v-for="server in filteredEnabledServers"
          :key="server.slug"
          variant="mini"
          :title="formatExtensionCardTitle(server.name)"
          :description="server.description || t('knowledgeList.extensions.noDescription')"
          @click="handleCardClick(server)"
        >
          <template #icon>
            <span class="info-card-emoji-icon">{{ server.icon || '🔌' }}</span>
          </template>
          <template #action>
            <button
              type="button"
              class="mcp-card-action mcp-card-action-danger"
              :disabled="isActionLoading(server)"
              :aria-label="server.is_builtin ? t('knowledgeList.extensions.mcp.remove') : t('knowledgeList.extensions.mcp.delete')"
              @click.stop="handleRemoveServer(server)"
            >
              <Check :size="15" class="action-icon action-icon-check" />
              <Trash2 :size="15" class="action-icon action-icon-trash" />
            </button>
          </template>
        </InfoCard>
      </ExtensionCardGrid>

      <div
        v-if="filteredDisabledServers.length"
        class="extension-section-header is-toggle"
        role="button"
        tabindex="0"
        @click="toggleMcpSection('available')"
        @keydown.enter.prevent="toggleMcpSection('available')"
        @keydown.space.prevent="toggleMcpSection('available')"
      >
        <span>{{ t('knowledgeList.extensions.mcp.available') }}</span>
        <span class="section-count">{{ filteredDisabledServers.length }}</span>
        <ChevronRight v-if="isMcpSectionCollapsed('available')" :size="14" class="section-toggle" />
        <ChevronDown v-else :size="14" class="section-toggle" />
      </div>
      <ExtensionCardGrid
        v-if="filteredDisabledServers.length"
        v-show="!isMcpSectionCollapsed('available')"
        :min-width="300"
      >
        <InfoCard
          v-for="server in filteredDisabledServers"
          :key="server.slug"
          variant="mini"
          :title="formatExtensionCardTitle(server.name)"
          :description="server.requires_migration ? t('knowledgeList.extensions.mcp.needsMigration') : server.description || t('knowledgeList.extensions.noDescription')"
          @click="handleCardClick(server)"
        >
          <template #icon>
            <span class="info-card-emoji-icon">{{ server.icon || '🔌' }}</span>
          </template>
          <template #action>
            <button
              type="button"
              :class="[
                'mcp-card-action',
                { 'mcp-card-action-danger': server.requires_migration }
              ]"
              :disabled="isActionLoading(server)"
              :aria-label="server.requires_migration ? t('knowledgeList.extensions.mcp.delete') : t('knowledgeList.extensions.mcp.add')"
              @click.stop="
                server.requires_migration
                  ? handleRemoveServer(server)
                  : handleSetServerEnabled(server, true)
              "
            >
              <Trash2 v-if="server.requires_migration" :size="15" class="action-icon" />
              <Plus v-else :size="15" class="action-icon" />
            </button>
          </template>
        </InfoCard>
      </ExtensionCardGrid>
    </template>
    </div>

    <a-modal
      v-model:open="basicInfoVisible"
      class="mcp-basic-info-modal"
      :footer="null"
      width="560px"
      :destroy-on-close="true"
      @cancel="closeBasicInfo"
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
              <span>{{ previewServer.transport || t('knowledgeList.extensions.mcp.unknownTransport') }}</span>
              <span v-if="previewServer.is_builtin" class="mcp-basic-info-tag">
                {{ t('knowledgeList.extensions.mcp.builtin') }}
              </span>
            </div>
          </div>
        </div>

        <div class="mcp-basic-info-body">
          <div class="mcp-basic-info-row">
            <label>{{ t('knowledgeList.extensions.mcp.description') }}</label>
            <span>{{ previewServer.description || t('knowledgeList.extensions.noDescription') }}</span>
          </div>
          <div class="mcp-basic-info-row">
            <label>{{ t('knowledgeList.extensions.mcp.transport') }}</label>
            <span>{{ previewServer.transport || '-' }}</span>
          </div>
          <div
            v-if="Array.isArray(previewServer.tags) && previewServer.tags.length > 0"
            class="mcp-basic-info-row"
          >
            <label>{{ t('knowledgeList.extensions.mcp.tags') }}</label>
            <span class="mcp-basic-info-tags">
              <a-tag v-for="tag in previewServer.tags" :key="tag">{{ tag }}</a-tag>
            </span>
          </div>
          <div class="mcp-basic-info-row">
            <label>{{ t('knowledgeList.extensions.mcp.creator') }}</label>
            <span>{{ previewServer.created_by || '-' }}</span>
          </div>
        </div>

        <div class="mcp-basic-info-footer">
          <a-button @click="closeBasicInfo">{{ t('knowledgeList.extensions.close') }}</a-button>
          <a-button
            type="primary"
            class="lucide-icon-btn"
            :loading="isActionLoading(previewServer)"
            @click="handleSetServerEnabled(previewServer, true)"
          >
            <template #icon><Plus :size="14" /></template>
            {{ t('knowledgeList.extensions.mcp.add') }}
          </a-button>
        </div>
      </div>
    </a-modal>

    <McpFormModal
      v-model:open="formModalVisible"
      :edit-mode="false"
      @submitted="handleFormSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { Check, ChevronDown, ChevronRight, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'
import { mcpApi } from '@harness/apis/mcp_api'
import ExtensionCardGrid from './ExtensionCardGrid.vue'
import InfoCard from '@harness/components/shared/InfoCard.vue'
import PageShoulder from '@harness/components/shared/PageShoulder.vue'
import McpFormModal from './McpFormModal.vue'
import { formatExtensionCardTitle } from '@harness/utils/extensionDisplayName'

const { t } = useI18n()
const router = useRouter()

const loading = ref(false)
const servers = ref([])
const searchQuery = ref('')
const formModalVisible = ref(false)
const basicInfoVisible = ref(false)
const previewServer = ref(null)
const actionLoadingSlug = ref('')

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
const collapsedMcpSections = ref(new Set())
const isMcpSectionCollapsed = (key) => collapsedMcpSections.value.has(key)
const toggleMcpSection = (key) => {
  const next = new Set(collapsedMcpSections.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  collapsedMcpSections.value = next
}

const navigateToDetail = (server) => {
  router.push({ path: `/platform/harness/extensions/mcp/${encodeURIComponent(server.slug)}` })
}

const handleCardClick = (server) => {
  if (server.enabled || server.requires_migration) {
    navigateToDetail(server)
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

const handleMcpAdd = () => {
  formModalVisible.value = true
}

const handleFormSubmitted = async () => {
  formModalVisible.value = false
  await fetchServers()
}

const handleSetServerEnabled = async (server, enabled) => {
  try {
    actionLoadingSlug.value = server.slug
    const result = await mcpApi.updateMcpServerStatus(server.slug, enabled)
    if (result.success) {
      message.success(t(enabled ? 'knowledgeList.extensions.mcp.addedOk' : 'knowledgeList.extensions.mcp.removedOk'))
      if (enabled) closeBasicInfo()
      await fetchServers()
    } else {
      message.error(t('knowledgeList.extensions.mcp.actionFailed'))
    }
  } catch {
    message.error(t('knowledgeList.extensions.mcp.actionFailed'))
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
  Modal.confirm({
    title: t('knowledgeList.extensions.mcp.deleteTitle'),
    content: t('knowledgeList.extensions.mcp.deleteContent', { name: server.name }),
    okText: t('knowledgeList.extensions.mcp.delete'),
    okType: 'danger',
    cancelText: t('knowledgeList.extensions.cancel'),
    async onOk() {
      try {
        actionLoadingSlug.value = server.slug
        const result = await mcpApi.deleteMcpServer(server.slug)
        if (result.success) {
          message.success(t('knowledgeList.extensions.mcp.deleted'))
          await fetchServers()
        } else {
          message.error(t('knowledgeList.extensions.mcp.deleteFailed'))
        }
      } catch {
        message.error(t('knowledgeList.extensions.mcp.deleteFailed'))
      } finally {
        actionLoadingSlug.value = ''
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
    message.error(t('knowledgeList.extensions.mcp.loadFailed'))
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
@import '@harness/assets/css/extensions.less';

.info-card-emoji-icon {
  font-size: 18px;
  line-height: 1;
}

.mcp-card-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--gray-150);
  border-radius: 8px;
  background: var(--gray-0);
  color: var(--main-color);
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    color 0.18s ease;

  &:hover,
  &:focus {
    outline: none;
    border-color: var(--main-200);
    background: var(--main-50);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }

  &.mcp-card-action-danger {
    color: var(--color-success-700);

    .action-icon-trash {
      display: none;
    }

    &:hover,
    &:focus {
      border-color: var(--color-error-100);
      background: var(--color-error-50);
      color: var(--color-error-700);

      .action-icon-check {
        display: none;
      }

      .action-icon-trash {
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
  gap: 6px;
}

.mcp-basic-info-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
