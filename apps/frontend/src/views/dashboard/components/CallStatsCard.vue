<template>
  <div class="grid-item call-stats">
    <t-card :title="t('dashboard.calls.title')" class="dash-card">
      <template #actions>
        <div class="simple-controls">
          <div class="simple-toggle-group">
            <span
              v-for="opt in timeRangeOptions"
              :key="opt.value"
              class="simple-toggle"
              :class="{ active: callTimeRange === opt.value }"
              @click="switchTimeRange(opt.value)"
            >{{ opt.label }}</span>
          </div>
          <div class="divider" />
          <div class="simple-toggle-group">
            <span
              v-for="opt in dataTypeOptions"
              :key="opt.value"
              class="simple-toggle"
              :class="{ active: callDataType === opt.value }"
              @click="switchDataType(opt.value)"
            >{{ opt.label }}</span>
          </div>
        </div>
      </template>
      <t-loading :loading="callStatsLoading || loading" size="small">
        <div ref="callStatsChartRef" class="chart" />
      </t-loading>
    </t-card>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { dashboardApi } from '@/api/chat-work/dashboard'
import { useTheme } from '@/composables/useTheme'
import { getColorByIndex, getCSSVariable, initColorPalette, truncateLegend } from '../chart'

const props = defineProps<{ loading?: boolean }>()
const { t } = useI18n()
const { isDark } = useTheme()

const callStatsData = ref<any>(null)
const callStatsLoading = ref(false)
const callTimeRange = ref('14days')
const callDataType = ref('agents')
const callStatsChartRef = ref<HTMLElement | null>(null)
let callStatsChart: echarts.ECharts | null = null
let retryTimer: ReturnType<typeof setTimeout> | null = null
let resizeObserver: ResizeObserver | null = null
let hoveredSeriesName: string | null = null
const retryCount = ref(0)

const timeRangeOptions = computed(() => [
  { value: '14hours', label: t('dashboard.calls.hours') },
  { value: '14days', label: t('dashboard.calls.days') },
  { value: '14weeks', label: t('dashboard.calls.weeks') },
])
const dataTypeOptions = computed(() => [
  { value: 'models', label: t('dashboard.calls.models') },
  { value: 'agents', label: t('dashboard.calls.agents') },
  { value: 'tokens', label: t('dashboard.calls.tokens') },
  { value: 'tools', label: t('dashboard.calls.tools') },
])
const isTokenView = computed(() => callDataType.value === 'tokens')

const formatTokenValue = (value: number) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '0'
  const abs = Math.abs(value)
  if (abs < 1000) return `${Math.round(value)}`
  if (abs < 1_000_000) {
    const kilo = value / 1000
    return `${Math.abs(kilo) >= 10 ? kilo.toFixed(0) : kilo.toFixed(1)}K`
  }
  const millionValue = value / 1_000_000
  const absMillion = Math.abs(millionValue)
  const decimalPlaces = absMillion >= 100 ? 0 : absMillion >= 10 ? 1 : 2
  return `${millionValue.toFixed(decimalPlaces)}M`
}

const formatValueForDisplay = (value: number) => {
  if (isTokenView.value) return formatTokenValue(value)
  return typeof value === 'number' ? value.toLocaleString() : String(value ?? 0)
}

const switchTimeRange = (val: string) => {
  if (callTimeRange.value === val) return
  callTimeRange.value = val
  loadCallStats()
}

const switchDataType = (val: string) => {
  if (callDataType.value === val) return
  callDataType.value = val
  loadCallStats()
}

const loadCallStats = async () => {
  callStatsLoading.value = true
  try {
    callStatsData.value = await dashboardApi.getCallTimeseries(callDataType.value, callTimeRange.value)
    await nextTick()
    renderCallStatsChart()
  } catch (error) {
    console.error('加载调用统计数据失败:', error)
  } finally {
    callStatsLoading.value = false
  }
}

const scheduleRetry = () => {
  if (retryCount.value >= 20) return
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    retryCount.value += 1
    renderCallStatsChart()
  }, 100)
}

const renderCallStatsChart = () => {
  const container = callStatsChartRef.value
  if (!container || !callStatsData.value) return
  if (props.loading || !container.clientWidth || !container.clientHeight) {
    scheduleRetry()
    return
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  retryCount.value = 0
  callStatsChart?.dispose()
  hoveredSeriesName = null
  callStatsChart = echarts.init(container)

  const data = callStatsData.value.data || []
  const categories = callStatsData.value.categories || []
  const agentNames = callStatsData.value.agent_names || {}
  const xAxisData = data.map((item: { date: string }) => {
    const date = item.date
    if (callTimeRange.value === '14hours') return date.split(' ')[1]
    if (callTimeRange.value === '14weeks') return t('dashboard.calls.weekLabel', { week: date.split('-')[1] })
    return date.split('-').slice(1).join('-')
  })
  const resolveCategoryLabel = (cat: string) => {
    if (cat === 'input' || cat === 'input_tokens') return t('dashboard.calls.input')
    if (cat === 'output' || cat === 'output_tokens') return t('dashboard.calls.output')
    if (cat === 'None' || cat === 'unknown' || cat === 'unknown_model') return t('dashboard.calls.unknownModel')
    return agentNames[cat] || cat
  }
  const series = categories.map((category: string, index: number) => ({
    name: resolveCategoryLabel(category),
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: data.map((item: { data: Record<string, number> }) => item.data[category] || 0),
    itemStyle: { color: getColorByIndex(index) },
  }))

  callStatsChart.setOption({
    grid: { left: '3%', right: '4%', top: '5%', bottom: 50, containLabel: true },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') || '#e4e6e6' } },
      axisTick: { show: false },
      axisLabel: { color: getCSSVariable('--gray-500') || '#979999', fontSize: 12, hideOverlap: true, margin: 10 },
    },
    yAxis: {
      type: 'value',
      minInterval: isTokenView.value ? undefined : 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: getCSSVariable('--gray-500') || '#979999',
        fontSize: 12,
        formatter: (value: number) => (isTokenView.value ? formatTokenValue(value) : value),
      },
      splitLine: { lineStyle: { color: getCSSVariable('--gray-100') || '#eff2f2' } },
    },
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        if (!params?.length) return ''
        const visibleParams = params.filter((param) => Number(param.value) !== 0)
        if (!visibleParams.length) return ''
        let total = 0
        let result = `${visibleParams[0].name}<br/>`
        const bucket = data[visibleParams[0].dataIndex]
        const modelStats = bucket?.models && typeof bucket.models === 'object' ? bucket.models : null
        if (isTokenView.value && modelStats) {
          Object.entries(modelStats as Record<string, { input?: number; output?: number }>).forEach(([modelName, item]) => {
            result += `${truncateLegend(modelName)} ${t('dashboard.calls.input')}: ${formatValueForDisplay(Number(item?.input || 0))}<br/>`
            result += `${truncateLegend(modelName)} ${t('dashboard.calls.output')}: ${formatValueForDisplay(Number(item?.output || 0))}<br/>`
          })
        }
        visibleParams.forEach((param) => {
          total += param.value
          const itemStyle = param.seriesName === hoveredSeriesName ? 'font-weight:700' : ''
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color}"></span>`
          result += `<span style="${itemStyle}">${truncateLegend(param.seriesName)}: ${formatValueForDisplay(param.value)}</span><br/>`
        })
        const labelMap: Record<string, string> = {
          models: t('dashboard.calls.models'),
          agents: t('dashboard.calls.agents'),
          tokens: t('dashboard.calls.tokens'),
          tools: t('dashboard.calls.tools'),
        }
        return `<div style="font-weight:bold;margin-bottom:5px">${labelMap[callDataType.value]}</div>${result}<strong>${t('dashboard.calls.total', { value: formatValueForDisplay(total) })}</strong>`
      },
    },
    legend: {
      type: 'scroll',
      data: categories.map(resolveCategoryLabel),
      bottom: 5,
      formatter: (name: string) => truncateLegend(name),
    },
    series,
  })
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver?.disconnect()
    resizeObserver = new ResizeObserver(() => callStatsChart?.resize())
    resizeObserver.observe(container)
  }
  callStatsChart.on('mouseover', (event: any) => {
    hoveredSeriesName = event?.seriesName || null
  })
  callStatsChart.on('mouseout', () => {
    hoveredSeriesName = null
  })
}

const cleanup = () => {
  resizeObserver?.disconnect()
  resizeObserver = null
  if (retryTimer) clearTimeout(retryTimer)
  callStatsChart?.dispose()
  callStatsChart = null
}

defineExpose({ cleanup })

onMounted(() => {
  initColorPalette()
  loadCallStats()
})

watch(() => props.loading, (now) => {
  if (!now && callStatsData.value) nextTick(() => renderCallStatsChart())
})

watch(isDark, () => {
  initColorPalette()
  if (callStatsData.value && callStatsChart) nextTick(() => renderCallStatsChart())
})

onUnmounted(cleanup)
</script>

<style scoped lang="less">
.chart { min-height: 280px; }
.simple-controls { display: flex; align-items: center; gap: 10px; }
.simple-toggle-group { display: flex; gap: 4px; }
.simple-toggle {
  padding: 4px 8px;
  font-size: 12px;
  color: var(--gray-600);
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
}
.simple-toggle:hover { background: var(--gray-50); }
.simple-toggle.active { background: var(--main-500); color: #fff; }
.divider { width: 1px; height: 16px; background: var(--gray-200); }
</style>
