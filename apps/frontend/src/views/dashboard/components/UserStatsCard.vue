<template>
  <t-card class="dash-card">
    <template #title>{{ $t('dashboard.users.title') }}</template>
    <template #actions>
      <span class="chart-period">{{ $t('dashboard.users.last7days') }}</span>
    </template>
    <t-loading :loading="loading" size="small">
      <div ref="activityChartRef" class="compact-chart" />
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
.chart-period {
  font-size: 12px;
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
  min-height: 260px;
  width: 100%;
}

@media (max-width: 768px) {
  .compact-chart { min-height: 180px; }
  .chart-period { font-size: 10px; }
}
</style>
