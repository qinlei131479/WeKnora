<script setup>
import { ref } from 'vue'

import AgentManagePanel from '@harness/components/model-management/AgentManagePanel.vue'

defineProps({
  embedded: { type: Boolean, default: false }
})

const agentPanelRef = ref(null)

defineExpose({
  openCreate: () => agentPanelRef.value?.openCreate?.()
})
</script>

<template>
  <div class="agent-manage-view">
    <AgentManagePanel ref="agentPanelRef" />
  </div>
</template>

<style lang="less" scoped>
.agent-manage-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--td-bg-color-container, var(--gray-0));
  color: var(--td-text-color-primary, var(--gray-1000));
}
</style>
