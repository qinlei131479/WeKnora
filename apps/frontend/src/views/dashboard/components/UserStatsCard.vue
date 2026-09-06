<template>
  <t-card :title="$t('dashboard.users.title')" class="dash-card">
    <t-loading :loading="loading" size="small">
      <div class="compact-stats-grid">
        <div class="mini-stat-card">
          <div class="mini-stat-value">{{ userStats?.total_users || 0 }}</div>
          <div class="mini-stat-label">{{ $t('dashboard.users.total') }}</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-stat-value">{{ userStats?.active_users_24h || 0 }}</div>
          <div class="mini-stat-label">{{ $t('dashboard.users.active24h') }}</div>
        </div>
        <div class="mini-stat-card">
          <div class="mini-stat-value">{{ userStats?.active_users_30d || 0 }}</div>
          <div class="mini-stat-label">{{ $t('dashboard.users.active30d') }}</div>
        </div>
      </div>
      <div class="compact-chart-container">
        <div class="chart-header">
          <span class="chart-title">{{ $t('dashboard.users.trend') }}</span>
          <span class="chart-subtitle">{{ $t('dashboard.users.last7days') }}</span>
        </div>
        <div ref="activityChartRef" class="compact-chart" />
      </div>
    </t-loading>
  </t-card>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme'
import { getCSSVariable } from '../chart'

const props = defineProps<{
  userStats?: Record<string, any>
  loading?: boolean
}>()

const { t } = useI18n()
const { isDark } = useTheme()
const activityChartRef = ref<HTMLElement | null>(null)
let activityChart: echarts.ECharts | null = null
let resizeObserver: ResizeObserver | null = null

const initActivityChart = () => {
  if (!activityChartRef.value || !props.userStats?.daily_active_users) return
  activityChart?.dispose()
  activityChart = echarts.init(activityChartRef.value)
  if (typeof ResizeObserver !== 'undefined' && activityChartRef.value) {
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => activityChart?.resize())
    resizeObserver.observe(activityChartRef.value)
  }
  activityChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: getCSSVariable('--gray-0'),
      borderColor: getCSSVariable('--gray-200'),
      borderWidth: 1,
      textStyle: { color: getCSSVariable('--gray-600') },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: props.userStats.daily_active_users.map((item: { date: string }) => item.date),
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500') },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500') },
      splitLine: { lineStyle: { color: getCSSVariable('--gray-100') } },
    },
    series: [{
      name: t('dashboard.users.series'),
      type: 'line',
      data: props.userStats.daily_active_users.map((item: { active_users: number }) => item.active_users),
      smooth: true,
      lineStyle: { color: getCSSVariable('--main-color'), width: 3 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: getCSSVariable('--main-500') },
            { offset: 1, color: getCSSVariable('--main-0') },
          ],
        },
      },
      itemStyle: {
        color: getCSSVariable('--main-color'),
        borderWidth: 2,
        borderColor: getCSSVariable('--gray-0'),
      },
      emphasis: {
        itemStyle: {
          color: getCSSVariable('--main-color'),
          borderWidth: 3,
          borderColor: getCSSVariable('--gray-0'),
          shadowBlur: 10,
          shadowColor: getCSSVariable('--shadow-1'),
        },
      },
    }],
  })
}

const cleanup = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', handleResize)
  activityChart?.dispose()
  activityChart = null
}

const handleResize = () => activityChart?.resize()

defineExpose({ cleanup })

onMounted(() => {
  nextTick(() => initActivityChart())
  window.addEventListener('resize', handleResize)
})

watch(() => props.userStats, () => nextTick(() => initActivityChart()), { deep: true })
watch(isDark, () => {
  if (props.userStats?.daily_active_users) nextTick(() => initActivityChart())
})
onUnmounted(cleanup)
</script>

<style scoped lang="less">
.compact-stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-bottom: 16px;
  flex-shrink: 0;
}

.mini-stat-card {
  background: var(--gray-0);
  border: 1px solid var(--gray-100);
  border-radius: 6px;
  padding: 16px;
  text-align: center;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--gray-200);
  }
}

.mini-stat-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--gray-1000);
  line-height: 1.2;
  margin-bottom: 4px;
}

.mini-stat-label {
  font-size: 12px;
  color: var(--gray-600);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.compact-chart-container {
  background: var(--gray-0);
  border: 1px solid var(--gray-100);
  border-radius: 6px;
  padding: 16px;
  flex: 1 1 auto;
  min-height: 240px;
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--gray-200);
  }
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-1000);
}

.chart-subtitle {
  font-size: 11px;
  color: var(--gray-600);
  background: var(--gray-100);
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.compact-chart {
  flex: 1 1 auto;
  min-height: 180px;
  width: 100%;
}

@media (max-width: 1200px) {
  .compact-stats-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .compact-stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 6px;
  }
  .mini-stat-card { padding: 8px; }
  .mini-stat-value { font-size: 16px; }
  .mini-stat-label { font-size: 10px; }
  .compact-chart-container {
    min-height: 180px;
    padding: 8px;
  }
  .compact-chart { min-height: 130px; }
  .chart-header { margin-bottom: 4px; }
  .chart-title { font-size: 11px; }
  .chart-subtitle { font-size: 9px; }
}
</style>
