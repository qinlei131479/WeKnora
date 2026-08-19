<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PageHeader from '@harness/components/shared/PageHeader.vue'
import AgentManagePanel from '@harness/components/model-management/AgentManagePanel.vue'
import ModelProviderManagePanel from '@harness/components/model-management/ModelProviderManagePanel.vue'
import { useI18n } from 'vue-i18n'
import { useUserStore } from '@harness/stores/user'

defineProps({
  embedded: { type: Boolean, default: false }
})

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('agents')
const agentPanelRef = ref(null)
const providerPanelRef = ref(null)

const modelManageTabs = computed(() => {
  const tabs = [{ key: 'agents', label: t('agent.tabs.runtime') }]
  if (userStore.isAdmin) tabs.push({ key: 'providers', label: t('agent.tabs.providers') })
  return tabs
})

const activePanel = computed(() =>
  activeTab.value === 'providers' ? providerPanelRef.value : agentPanelRef.value
)

const activeLoading = computed(() => activePanel.value?.loading || false)
const activeStats = computed(() => activePanel.value?.stats || {})

const normalizeTab = (tab) => {
  if (tab === 'providers' && userStore.isAdmin) return 'providers'
  return 'agents'
}

watch(
  () => [route.query.tab, userStore.isAdmin],
  ([tab]) => {
    const nextTab = normalizeTab(tab)
    if (activeTab.value !== nextTab) activeTab.value = nextTab
  },
  { immediate: true }
)

watch(activeTab, (tab) => {
  const nextTab = normalizeTab(tab)
  if (nextTab !== tab) {
    activeTab.value = nextTab
    return
  }
  if (route.query.tab === nextTab) return
  router.replace({ query: { ...route.query, tab: nextTab } })
})
</script>

<template>
  <div class="agent-manage-view">
    <PageHeader
      v-if="!embedded || modelManageTabs.length > 1"
      v-model:active-key="activeTab"
      :title="embedded ? '' : t('agent.tabs.runtime')"
      :tabs="modelManageTabs"
      :loading="activeLoading"
      :show-border="!embedded"
      aria-label="智能体管理视图切换"
    >
      <template #info>
        <div v-if="activeTab === 'agents'" class="summary-strip">
          <span>{{ activeStats.total || 0 }} 个智能体</span>
          <span>{{ activeStats.global || 0 }} 个全局</span>
          <span v-if="activeStats.builtin">{{ activeStats.builtin }} 个内置</span>
          <span>{{ activeStats.manageable || 0 }} 个可管理</span>
        </div>
        <div v-else class="summary-strip">
          <span>{{ activeStats.total || 0 }} 个供应商</span>
          <span>{{ activeStats.enabled || 0 }} 个启用</span>
          <span v-if="activeStats.warning > 0" class="warning-count">
            {{ activeStats.warning }} 个凭证缺失
          </span>
          <span>{{ activeStats.models || 0 }} 个模型</span>
        </div>
      </template>
    </PageHeader>

    <div class="agent-manage-content">
      <div v-show="activeTab === 'agents'" class="tab-panel">
        <AgentManagePanel ref="agentPanelRef" />
      </div>
      <div v-if="userStore.isAdmin && activeTab === 'providers'" class="tab-panel">
        <ModelProviderManagePanel ref="providerPanelRef" />
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.agent-manage-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  background: var(--gray-0);
  color: var(--gray-1000);
}

.agent-manage-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;

  .tab-panel {
    height: 100%;
    min-height: 0;
    overflow-y: auto;
  }
}

.summary-strip {
  display: flex;
  gap: 8px;

  span {
    padding: 6px 10px;
    border: 1px solid var(--gray-100);
    border-radius: 7px;
    background: var(--gray-10);
    color: var(--gray-700);
    font-size: 12px;
    line-height: 18px;
  }

  .warning-count {
    background: var(--color-warning-50);
    border-color: var(--color-warning-100);
    color: var(--color-warning-700);
  }
}
</style>
