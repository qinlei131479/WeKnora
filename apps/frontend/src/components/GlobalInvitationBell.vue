<template>
  <!-- 顶栏内"待处理邀请"铃铛。只在 pendingInvitationCount > 0 时渲染。 -->
  <template v-if="pendingInvitationCount > 0">
    <t-badge :count="pendingInvitationCount" :max-count="99" :offset="[6, 4]"
      class="global-invitation-bell">
      <button type="button" class="global-invitation-bell__btn"
        :title="$t('tenantInvitation.inboxTooltip')" @click="openDialog">
        <t-icon name="notification" size="18px" />
      </button>
    </t-badge>
  </template>
  <MyInvitationsDialog v-model:visible="dialogVisible" />
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import MyInvitationsDialog from '@/components/MyInvitationsDialog.vue'

const authStore = useAuthStore()

const pendingInvitationCount = computed(() => authStore.pendingInvitationCount)

const dialogVisible = ref(false)
const openDialog = () => {
  dialogVisible.value = true
}
</script>

<style lang="less" scoped>
.global-invitation-bell {
  position: relative;
  flex-shrink: 0;
}

.global-invitation-bell__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--td-text-color-secondary);
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: var(--td-bg-color-container-hover);
    color: var(--td-text-color-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--td-brand-color-focus);
    outline-offset: 1px;
  }
}
</style>
