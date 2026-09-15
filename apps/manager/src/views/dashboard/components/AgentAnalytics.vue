<script setup lang="ts">
import type { DashboardAgentAnalyticsVO, DashboardStatsVO, DashboardToolCallStatsVO } from '@/types';

const props = defineProps<{
  data: DashboardAgentAnalyticsVO;
  stats: DashboardStatsVO;
  tools: DashboardToolCallStatsVO;
  loading: boolean;
}>();
</script>

<template>
  <el-card shadow="never" class="agent-card">
    <el-skeleton :loading="props.loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" class="agent-title-skeleton" />
        <div class="agent-layout">
          <div class="agent-image">
            <el-skeleton-item variant="image" class="agent-image-skeleton" />
          </div>
          <div class="agent-metrics">
            <div v-for="item in 3" :key="item" class="agent-metric-loading">
              <el-skeleton-item variant="text" class="agent-label-skeleton" />
              <el-skeleton-item variant="text" class="agent-value-skeleton" />
              <el-skeleton-item v-if="item < 3" variant="text" class="agent-detail-skeleton" />
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <h3 class="agent-title">{{ $t('page.dashboard.agentAnalytics', 'AI智能体分析') }}</h3>
        <div class="agent-layout">
          <div class="agent-image is-loaded">
            <img src="@/assets/images/dashboard/dashboard_agents.png" class="agent-picture" alt="" />
          </div>
          <div class="agent-metrics">
            <div class="agent-metric">
              <div class="agent-label">
                {{ $t('page.dashboard.totalAgents', '智能体总数') }}
              </div>
              <div class="agent-value">
                {{ props.data.totalAgents }}
                <span v-if="props.data.totalAgents != null">{{ $t('page.dashboard.itemUnit', '个') }}</span>
              </div>
              <div v-if="props.data.splitBySystem" class="agent-label">
                {{
                  `${$t('page.dashboard.chat', '对话')}${props.data.weknoraTotalAgents} · ${$t('page.dashboard.work', '工作')}${props.data.yuxiTotalAgents}`
                }}
              </div>
            </div>
            <div class="agent-metric">
              <div class="agent-label">
                {{ $t('page.dashboard.conversationCount', '总对话数') }}
              </div>
              <div class="agent-value is-conversations">
                {{ props.stats.totalConversations }}
                <span v-if="props.stats.totalConversations != null">{{ $t('page.dashboard.callUnit', '次') }}</span>
              </div>
              <div v-if="props.stats.splitBySystem" class="agent-label">
                {{
                  `${$t('page.dashboard.chat', '对话')}${props.stats.weknoraSessions} · ${$t('page.dashboard.work', '工作')}${props.stats.yuxiConversations}`
                }}
              </div>
            </div>
            <div class="agent-tools">
              <div class="agent-label">
                {{ $t('page.dashboard.totalToolCalls', '工具调用总数') }}
              </div>
              <div class="agent-tools-value">
                {{ props.tools.totalCalls }}
                <span v-if="props.tools.totalCalls != null">{{ $t('page.dashboard.callUnit', '次') }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.agent-card {
  height: 360px;
}

.agent-layout {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
  height: 276px;
}

.agent-image,
.agent-metrics {
  flex: 1;
  min-width: 0;
}

.agent-metrics {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.agent-image.is-loaded {
  height: 100%;
}

.agent-picture {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: center;
}

.agent-metric-loading,
.agent-metric,
.agent-tools {
  padding: 12px 16px;
  border-radius: 12px;
  background: var(--layout-bg-color-page);
}

.agent-metric-loading {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.agent-metric {
  min-height: 80px;
}

.agent-tools {
  min-height: 72px;
}

.agent-title {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
}

.agent-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 20px;
}

.agent-value,
.agent-tools-value {
  min-height: 28px;
  font-size: 24px;
  font-weight: 600;
}

.agent-value {
  color: #469ffc;

  &.is-conversations {
    color: #3479eb;
  }
}
.agent-tools-value {
  color: #8c63fb;
}

.agent-title-skeleton {
  width: 144px;
  height: 24px;
}

.agent-image-skeleton {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 50%;
}

.agent-label-skeleton {
  width: 80px;
  max-width: 100%;
  height: 14px;
}

.agent-value-skeleton {
  width: 48px;
  height: 24px;
}

.agent-detail-skeleton {
  width: 100px;
  max-width: 100%;
  height: 12px;
}
</style>
