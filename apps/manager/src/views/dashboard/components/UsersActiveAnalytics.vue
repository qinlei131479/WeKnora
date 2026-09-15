<script setup lang="ts">
import type { DashboardUserActiveStatsVO } from '@/types';

const props = defineProps<{
  data: DashboardUserActiveStatsVO;
  loading: boolean;
}>();
</script>

<template>
  <el-card shadow="never" class="active-card">
    <el-skeleton :loading="props.loading" animated>
      <template #template>
        <div class="active-layout">
          <el-skeleton-item variant="image" class="active-icon" />
          <div class="active-summary is-loading">
            <el-skeleton-item variant="h3" class="active-title-skeleton" />
            <div class="active-total">
              <el-skeleton-item variant="text" class="active-label-skeleton" />
              <el-skeleton-item variant="text" class="active-value-skeleton" />
            </div>
          </div>
          <div class="active-progress">
            <el-skeleton-item variant="text" class="active-progress-skeleton" />
            <div class="active-details-skeleton">
              <el-skeleton-item variant="text" class="active-detail-skeleton" />
              <el-skeleton-item variant="text" class="active-detail-skeleton" />
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <div class="active-layout">
          <img src="@/assets/images/dashboard/dashboard_users_active.png" class="active-icon" alt="" />
          <div class="active-summary">
            <h3 class="active-title">
              {{ $t('page.dashboard.userActivity', '用户活跃度分析') }}
            </h3>
            <div class="active-total">
              <span class="active-label">{{ $t('page.dashboard.totalUsers', '总用户') }}</span>
              <span class="active-value">
                {{ `${props.data.totalUsers ?? 0} ${$t('page.dashboard.itemUnit', '个')}` }}
              </span>
            </div>
          </div>
          <div class="active-progress is-loaded">
            <el-progress
              class="active-progress-bar"
              :percentage="props.data.activeUsers30d ? Math.max(0, Math.min(100, ((props.data.activeUsers24h ?? 0) / props.data.activeUsers30d) * 100)) : 0"
              :show-text="false"
              :stroke-width="20"
              color="var(--el-color-primary)"
            />
            <div class="active-details">
              <span>
                <el-tag class="active-detail-tag" size="small" effect="light" color="var(--el-color-primary)">&emsp;</el-tag>
                <span class="active-label">{{ $t('page.dashboard.activeUsers24h', '24H活跃') }}</span> {{ props.data.activeUsers24h }}
              </span>
              <span>
                <el-tag class="active-detail-tag" size="small" effect="light" color="var(--el-color-primary-light-7)">&emsp;</el-tag>
                <span class="active-label">{{ $t('page.dashboard.activeUsers30d', '30天活跃') }}</span> {{ props.data.activeUsers30d }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.active-card {
  min-height: 104px;
}

.active-layout {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
  min-height: 64px;
}

.active-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  flex-shrink: 0;
}

.active-summary {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &.is-loading {
    gap: 16px;
  }
}

.active-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 20px;
}

.active-total {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-label {
  color: var(--el-text-color-secondary);
  font-weight: 600;
}

.active-value {
  color: var(--el-color-primary);
  font-size: 24px;
  font-weight: 600;
  line-height: 24px;
}

.active-progress {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &.is-loaded {
    gap: 12px;
  }
}

.active-progress-bar {
  // 底槽背景
  :deep(.el-progress-bar__outer) {
    background-color: var(--el-color-primary-light-7);
  }

  // 底槽和进度填充部分的圆角
  :deep(.el-progress-bar__outer),
  :deep(.el-progress-bar__inner) {
    border-radius: 4px;
  }
}

.active-details,
.active-details-skeleton {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.active-details {
  flex-wrap: wrap;
  gap: 12px;
  font-size: 14px;
  line-height: 24px;
}

.active-details-skeleton {
  gap: 20px;
}

.active-detail-tag {
  margin-right: 10px;
}

.active-title-skeleton {
  width: 160px;
  height: 24px;
}

.active-label-skeleton {
  width: 44px;
  height: 14px;
}

.active-value-skeleton {
  width: 48px;
  height: 24px;
}

.active-progress-skeleton {
  width: 100%;
  height: 20px;
}

.active-detail-skeleton {
  width: 42%;
  height: 16px;
}
</style>
