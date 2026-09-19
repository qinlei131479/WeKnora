<template>
  <div class="stats-overview">
    <div class="stats-grid">
      <div class="stat-card primary">
        <div class="stat-icon"><ChatIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ basicStats?.total_conversations || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.stats.conversations') }}</div>
          <div v-if="basicStats?.split_by_system" class="stat-split">
            {{ $t('dashboard.stats.chat') }} {{ basicStats?.weknora_sessions || 0 }}
            ·
            {{ $t('dashboard.stats.work') }} {{ basicStats?.yuxi_conversations || 0 }}
          </div>
          <div v-if="basicStats?.conversation_trend" class="stat-trend">
            <ArrowUpIcon v-if="basicStats.conversation_trend > 0" class="trend-icon up" />
            <ArrowDownIcon v-else-if="basicStats.conversation_trend < 0" class="trend-icon down" />
            <span class="trend-text">{{ Math.abs(basicStats.conversation_trend) }}%</span>
          </div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon"><ChartIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ basicStats?.active_conversations || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.stats.activeConversations') }}</div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon"><MailIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ basicStats?.total_messages || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.stats.messages') }}</div>
          <div v-if="basicStats?.split_by_system" class="stat-split">
            {{ $t('dashboard.stats.chat') }} {{ basicStats?.weknora_messages || 0 }}
            ·
            {{ $t('dashboard.stats.work') }} {{ basicStats?.yuxi_messages || 0 }}
          </div>
        </div>
      </div>

      <div class="stat-card warning">
        <div class="stat-icon"><UserIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ basicStats?.total_users || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.stats.users') }}</div>
        </div>
      </div>

      <div class="stat-card info">
        <div class="stat-icon"><TimeIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ userStats?.active_users_24h || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.users.active24h') }}</div>
        </div>
      </div>

      <div class="stat-card success">
        <div class="stat-icon"><CalendarIcon /></div>
        <div class="stat-content">
          <div class="stat-value">{{ userStats?.active_users_30d || 0 }}</div>
          <div class="stat-label">{{ $t('dashboard.users.active30d') }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CalendarIcon,
  ChartIcon,
  ChatIcon,
  MailIcon,
  TimeIcon,
  UserIcon,
} from 'tdesign-icons-vue-next'

defineProps<{
  basicStats?: Record<string, any>
  userStats?: Record<string, any>
}>()
</script>

<style scoped lang="less">
.stats-overview {
  margin-top: 8px;
  margin-bottom: 0;
  max-width: 100%;
  overflow-x: hidden;
}

.stats-grid {
  display: grid;
  padding: 0 var(--page-padding);
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--gray-0);
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--gray-100);
  display: flex;
  align-items: center;
  min-height: 80px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  border-color: var(--gray-200);
  box-shadow: 0 1px 3px 0 var(--shadow-1);
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  flex-shrink: 0;
  font-size: 20px;
}

.stat-card.primary .stat-icon { background: var(--color-primary-50); color: var(--main-color); }
.stat-card.success .stat-icon { background: var(--color-success-50); color: var(--color-success-700); }
.stat-card.info .stat-icon { background: var(--color-info-50); color: var(--color-info-700); }
.stat-card.warning .stat-icon { background: var(--color-warning-50); color: var(--color-warning-700); }

.stat-content {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--gray-1000);
  line-height: 1.1;
}

.stat-label {
  font-size: 13px;
  color: var(--gray-600);
  font-weight: 500;
  margin-top: 4px;
}

.stat-split {
  font-size: 12px;
  color: var(--gray-500);
  font-weight: 500;
  margin-top: 4px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  font-size: 12px;
  color: var(--gray-600);
}

.trend-icon.up { color: var(--color-success-700); }
.trend-icon.down { color: var(--color-error-700); }

@media (max-width: 1200px) {
  .stats-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 768px) {
  .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; padding: 0 var(--page-padding); }
}
</style>
