<template>
  <t-card :title="$t('dashboard.tools.title')" class="dash-card">
    <t-loading :loading="loading" size="small">
      <div class="stat-row">
        <t-statistic class="stat-info" :title="$t('dashboard.tools.totalCalls')" :value="toolStats?.total_calls || 0" />
        <t-statistic class="stat-error" :title="$t('dashboard.tools.failedCalls')" :value="toolStats?.failed_calls || 0" :suffix="$t('dashboard.tools.times')" />
        <t-statistic
          class="stat-rate"
          :class="successRateClass"
          :title="$t('dashboard.tools.successRate')"
          :value="toolStats?.success_rate || 0"
          suffix="%"
        />
      </div>
      <t-divider />
      <h4>{{ $t('dashboard.tools.top10') }}</h4>
      <div ref="toolsChartRef" class="chart" />
      <template v-if="hasErrorData">
        <t-divider />
        <h4>{{ $t('dashboard.tools.errorAnalysis') }}</h4>
        <div class="error-grid">
          <t-table :data="errorData" :columns="errorColumns" size="small" :pagination="false" max-height="200" row-key="tool_name">
            <template #tool_name="{ row }">
              <t-tag theme="primary" variant="light">{{ row.tool_name }}</t-tag>
            </template>
            <template #error_count="{ row }">
              <t-tag :theme="row.error_count > 5 ? 'danger' : 'warning'" variant="light">{{ row.error_count }}</t-tag>
            </template>
          </t-table>
          <div>
            <h4>{{ $t('dashboard.tools.errorDistribution') }}</h4>
            <div ref="errorChartRef" class="chart-small" />
          </div>
        </div>
      </template>
    </t-loading>
  </t-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme'
import { getColorByIndex, getColorPalette, getCSSVariable } from '../chart'

const props = defineProps<{
  toolStats?: Record<string, any>
  loading?: boolean
}>()

const { t } = useI18n()
const { isDark } = useTheme()
const toolsChartRef = ref<HTMLElement | null>(null)
const errorChartRef = ref<HTMLElement | null>(null)
let toolsChart: echarts.ECharts | null = null
let errorChart: echarts.ECharts | null = null

const errorColumns = computed(() => [
  { colKey: 'tool_name', title: t('dashboard.tools.toolName') },
  { colKey: 'error_count', title: t('dashboard.tools.errorCount') },
])
const hasErrorData = computed(() =>
  Boolean(props.toolStats?.tool_error_distribution && Object.keys(props.toolStats.tool_error_distribution).length),
)
const successRateClass = computed(() => {
  const rate = props.toolStats?.success_rate || 0
  if (rate >= 90) return 'stat-success'
  if (rate >= 70) return 'stat-warning'
  return 'stat-error'
})
const errorData = computed(() => {
  const distribution = props.toolStats?.tool_error_distribution
  if (!distribution) return []
  return Object.entries(distribution)
    .map(([tool_name, error_count]) => ({ tool_name, error_count }))
    .sort((a, b) => Number(b.error_count) - Number(a.error_count))
})

const initToolsChart = () => {
  if (!toolsChartRef.value || !props.toolStats?.most_used_tools?.length) return
  toolsChart?.dispose()
  toolsChart = echarts.init(toolsChartRef.value)
  const data = [...props.toolStats.most_used_tools].sort((a: { count: number }, b: { count: number }) => a.count - b.count).slice(0, 10)
  toolsChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: getCSSVariable('--gray-0'),
      borderColor: getCSSVariable('--gray-200'),
      borderWidth: 1,
      textStyle: { color: getCSSVariable('--gray-600') },
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500') },
      splitLine: { lineStyle: { color: getCSSVariable('--gray-150') } },
    },
    yAxis: {
      type: 'category',
      data: data.map((item: { tool_name: string }) => item.tool_name),
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500'), interval: 0 },
    },
    series: [{
      name: t('dashboard.tools.totalCalls'),
      type: 'bar',
      data: data.map((item: { count: number }) => item.count),
      itemStyle: { color: getColorByIndex(0), borderRadius: [0, 4, 4, 0] },
      emphasis: {
        itemStyle: {
          color: getColorByIndex(0),
          shadowBlur: 10,
          shadowColor: getCSSVariable('--color-info-50'),
        },
      },
    }],
  })
}

const initErrorChart = () => {
  if (!errorChartRef.value || !hasErrorData.value) return
  errorChart?.dispose()
  errorChart = echarts.init(errorChartRef.value)
  errorChart.setOption({
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    series: [{
      name: t('dashboard.tools.errorDistribution'),
      type: 'pie',
      radius: ['30%', '70%'],
      center: ['50%', '60%'],
      data: errorData.value.slice(0, 5).map((item) => ({ name: item.tool_name, value: item.error_count })),
      color: getColorPalette(),
    }],
  })
}

const updateCharts = () => {
  nextTick(() => {
    initToolsChart()
    if (hasErrorData.value) initErrorChart()
  })
}

const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  toolsChart?.dispose()
  errorChart?.dispose()
  toolsChart = null
  errorChart = null
}
const handleResize = () => {
  toolsChart?.resize()
  errorChart?.resize()
}
defineExpose({ cleanup })

onMounted(() => {
  updateCharts()
  window.addEventListener('resize', handleResize)
})
watch(() => props.toolStats, updateCharts, { deep: true })
watch(isDark, updateCharts)
onUnmounted(cleanup)
</script>

<style scoped lang="less">
.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-info :deep(.t-statistic-content-value) { color: var(--color-info-500); }
.stat-error :deep(.t-statistic-content-value) { color: var(--color-error-500); }
.stat-warning :deep(.t-statistic-content-value) { color: var(--color-warning-500); }
.stat-success :deep(.t-statistic-content-value) { color: var(--color-success-500); }
.chart-small { height: 180px; width: 100%; }
.error-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 768px) {
  .error-grid { grid-template-columns: 1fr; }
}
</style>
