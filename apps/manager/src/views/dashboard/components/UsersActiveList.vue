<script setup lang="ts">
import type { DashboardUserActiveStatsVO } from '@/types';

const props = defineProps<{
  data: DashboardUserActiveStatsVO;
  loading: boolean;
}>();
</script>

<template>
  <el-card shadow="never" class="users-active-card">
    <el-skeleton :loading="props.loading" animated class="users-active-skeleton">
      <template #template>
        <el-skeleton-item variant="h3" class="users-active-title-skeleton" />
        <div class="users-active-list">
          <div v-for="item in 6" :key="item" class="users-active-item">
            <el-skeleton-item variant="circle" class="users-active-avatar-skeleton" />
            <div class="users-active-content">
              <div class="users-active-header">
                <el-skeleton-item variant="text" class="users-active-name-skeleton" />
                <el-skeleton-item variant="text" class="users-active-score-skeleton" />
              </div>
              <el-skeleton-item variant="text" class="users-active-email-skeleton" />
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <h3 class="users-active-title">{{ $t('page.dashboard.activeUserRanking', '活跃用户排行') }}</h3>
        <div v-if="props.data.activeUsers?.length" class="users-active-list">
          <div v-for="(user, index) in props.data.activeUsers?.slice(0, 6)" :key="user.id ?? index" class="users-active-item">
            <el-avatar :src="user.avatar" :size="56" class="users-active-avatar">{{ user.username?.slice(0, 1) }}</el-avatar>
            <div class="users-active-content">
              <div class="users-active-header">
                <span class="users-active-name">{{ user.username }}</span>
                <span class="users-active-score">{{ $t('page.dashboard.activeScore', '活跃度') }} {{ user.score ?? 0 }}</span>
              </div>
              <div class="users-active-email">{{ user.email }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('page.normal.noData', '暂无数据')" :image-size="80" class="users-active-empty" />
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.users-active-card {
  height: 100%;
  min-height: 0;
}

.users-active-card :deep(.el-card__body),
.users-active-skeleton {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.users-active-title {
  margin: 0 0 20px;
  font-size: 18px;
  line-height: 24px;
}

.users-active-title-skeleton {
  width: 144px;
  height: 24px;
  margin-bottom: 20px;
}

.users-active-list {
  display: grid;
  grid-template-rows: repeat(6, 56px);
  row-gap: 20px;
  align-items: center;
  flex: 1;
}

.users-active-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 56px;
}

.users-active-avatar,
.users-active-avatar-skeleton {
  flex-shrink: 0;
}

.users-active-avatar {
  font-size: 18px;
}

.users-active-avatar-skeleton {
  width: 56px;
  height: 56px;
}

.users-active-item:nth-child(6n + 1) .users-active-avatar {
  background-color: #409eff;
}

.users-active-item:nth-child(6n + 2) .users-active-avatar {
  background-color: #ffb347;
}

.users-active-item:nth-child(6n + 3) .users-active-avatar {
  background-color: #2ec4b6;
}

.users-active-item:nth-child(6n + 4) .users-active-avatar {
  background-color: #ff6b6b;
}

.users-active-item:nth-child(6n + 5) .users-active-avatar {
  background-color: #9b7ede;
}

.users-active-item:nth-child(6n + 6) .users-active-avatar {
  background-color: #ffd166;
}

.users-active-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.users-active-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.users-active-name {
  min-width: 0;
  overflow: hidden;
  font-size: 16px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.users-active-score {
  flex-shrink: 0;
  color: var(--el-color-primary);
  font-size: 14px;
  white-space: nowrap;
}

.users-active-email {
  min-height: 14px;
  overflow: hidden;
  color: var(--el-text-color-secondary);
  font-size: 14px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.users-active-name-skeleton {
  width: 64px;
  height: 18px;
}

.users-active-score-skeleton {
  width: 72px;
  height: 14px;
}

.users-active-email-skeleton {
  width: 100%;
  height: 14px;
}

.users-active-empty {
  flex: 1;
  min-height: 0;
}
</style>
