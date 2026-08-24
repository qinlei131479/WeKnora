<template>
  <div class="grid-item call-stats">
    <a-card class="dashboard-card call-stats-section" :title="t('dashboard.calls.title')" :loading="loading">
      <template #extra>
        <div class="simple-controls">
          <div class="simple-toggle-group">
            <!-- <span class="simple-toggle-label">时间</span> -->
            <span
              v-for="opt in timeRangeOptions"
              :key="opt.value"
              class="simple-toggle"
              :class="{ active: callTimeRange === opt.value }"
              @click="switchTimeRange(opt.value)"
            >{{ opt.label }}</span>
          </div>
          <div class="divider"></div>
          <div class="simple-toggle-group">
            <!-- <span class="simple-toggle-label">类型</span> -->
            <span
              v-for="opt in dataTypeOptions"
              :key="opt.value"
              class="simple-toggle"
              :class="{ active: callDataType === opt.value }"
              @click="switchDataType(opt.value)"
            >{{ opt.label }}</span>
          </div>
          <!-- <div class="subtitle">总计：{{ callStatsData?.total_count || 0 }}</div> -->
        </div>
      </template>

      <div class="call-stats-container">
        <div class="chart-container">
          <div ref="callStatsChartRef" class="chart call-stats-chart echarts-host"></div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, defineExpose, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { dashboardApi } from '@harness/apis/dashboard_api'
import { getColorByIndex, truncateLegend, initColorPalette } from '@harness/utils/chartColors'
import { getCSSVariable } from '@harness/utils/cssVars'
import { useThemeStore } from '@harness/stores/theme'

const { t } = useI18n()

const props = defineProps({
  loading: { type: Boolean, default: false }
})

// theme store
const themeStore = useThemeStore()

// state
const callStatsData = ref(null)
const callStatsLoading = ref(false)
const callTimeRange = ref('14days')
const callDataType = ref('agents')
const timeRangeOptions = computed(() => [
  { value: '14hours', label: t('dashboard.calls.hours') },
  { value: '14days', label: t('dashboard.calls.days') },
  { value: '14weeks', label: t('dashboard.calls.weeks') }
])
const dataTypeOptions = computed(() => [
  { value: 'models', label: t('dashboard.calls.models') },
  { value: 'agents', label: t('dashboard.calls.agents') },
  { value: 'tokens', label: t('dashboard.calls.tokens') },
  { value: 'tools', label: t('dashboard.calls.tools') }
])
const isTokenView = computed(() => callDataType.value === 'tokens')

const formatTokenValue = (value) => {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '0M'
  }
  const millionValue = value / 1_000_000
  const absMillion = Math.abs(millionValue)
  const decimalPlaces = absMillion >= 100 ? 0 : absMillion >= 10 ? 1 : 2
  return `${millionValue.toFixed(decimalPlaces)}M`
}

const formatValueForDisplay = (value) => {
  if (isTokenView.value) {
    return formatTokenValue(value)
  }
  if (typeof value === 'number') {
    return value.toLocaleString()
  }
  return (value ?? 0).toString()
}

const switchTimeRange = (val) => {
  if (callTimeRange.value === val) return
  callTimeRange.value = val
  loadCallStats()
}

const switchDataType = (val) => {
  if (callDataType.value === val) return
  callDataType.value = val
  loadCallStats()
}
const callStatsChartRef = ref(null)
let callStatsChart = null
let retryTimer = null
let resizeObserver = null
let hoveredSeriesName = null
const retryCount = ref(0)
const maxRetry = 20

const loadCallStats = async () => {
  callStatsLoading.value = true
  try {
    const response = await dashboardApi.getCallTimeseries(callDataType.value, callTimeRange.value)
    callStatsData.value = response
    await nextTick()
    renderCallStatsChart()
  } catch (error) {
    console.error('加载调用统计数据失败:', error)
  } finally {
    callStatsLoading.value = false
  }
}

const renderCallStatsChart = () => {
  const container = callStatsChartRef.value
  if (!container || !callStatsData.value) return

  // 若父卡片仍在 loading，等待 loading 结束
  if (props.loading) {
    scheduleRetry()
    return
  }

  const { clientWidth, clientHeight } = container
  if (!clientWidth || !clientHeight) {
    scheduleRetry()
    return
  }

  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  retryCount.value = 0

  if (callStatsChart) {
    callStatsChart.dispose()
  }
  hoveredSeriesName = null

  callStatsChart = echarts.init(container)

  const data = callStatsData.value.data || []
  const categories = callStatsData.value.categories || []

  const xAxisData = data.map((item) => {
    const date = item.date
    if (callTimeRange.value === '14hours') {
      return date.split(' ')[1]
    } else if (callTimeRange.value === '14weeks') {
      return t('dashboard.calls.weekLabel', { week: date.split('-')[1] })
    } else {
      return date.split('-').slice(1).join('-')
    }
  })

  const agentNames = callStatsData.value.agent_names || {}

  const resolveCategoryLabel = (cat) => {
    if (cat === 'None') return t('dashboard.calls.unknownModel')
    return agentNames[cat] || cat
  }

  const series = categories.map((category, index) => ({
    name: resolveCategoryLabel(category),
    type: 'bar',
    stack: 'total',
    emphasis: { focus: 'series' },
    data: data.map((item) => item.data[category] || 0),
    itemStyle: {
      color: getColorByIndex(index),
      borderRadius: 0
    }
  }))

  const option = {
    grid: {
      left: '3%',
      right: '4%',
      top: '5%' /* 减少顶部留白 */,
      bottom: 50 /* 减少底部留白，从60减少到50 */,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') || '#e4e6e6' } },
      axisTick: { show: false },
      axisLabel: {
        color: getCSSVariable('--gray-500') || '#979999',
        fontSize: 12,
        hideOverlap: true,
        margin: 10
      }
    },
    yAxis: {
      type: 'value',
      minInterval: isTokenView.value ? undefined : 1,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: {
        color: getCSSVariable('--gray-500') || '#979999',
        fontSize: 12,
        formatter: (value) => (isTokenView.value ? formatTokenValue(value) : value)
      },
      splitLine: { lineStyle: { color: getCSSVariable('--gray-100') || '#eff2f2' } }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: getCSSVariable('--gray-0'),
      borderColor: getCSSVariable('--gray-200'),
      borderWidth: 1,
      textStyle: { color: getCSSVariable('--gray-600'), fontSize: 12 },
      formatter: (params) => {
        if (!params?.length) return ''
        const visibleParams = params.filter((param) => Number(param.value) !== 0)
        if (!visibleParams.length) return ''
        let total = 0
        let result = `${visibleParams[0].name}<br/>`
        visibleParams.forEach((param) => {
          total += param.value
          const truncatedName = truncateLegend(param.seriesName)
          const isHovered = param.seriesName === hoveredSeriesName
          const itemStyle = isHovered ? 'font-weight:700;color:var(--gray-900)' : ''
          result += `<span style="display:inline-block;margin-right:5px;border-radius:10px;width:10px;height:10px;background-color:${param.color}"></span>`
          result += `<span style="${itemStyle}">${truncatedName}: ${formatValueForDisplay(param.value)}</span><br/>`
        })
        const labelMap = {
          models: t('dashboard.calls.models'),
          agents: t('dashboard.calls.agents'),
          tokens: t('dashboard.calls.tokens'),
          tools: t('dashboard.calls.tools')
        }
        const formattedTotal = formatValueForDisplay(total)
        return `<div style="font-weight:bold;margin-bottom:5px">${labelMap[callDataType.value]}</div>${result}<strong>${t('dashboard.calls.total', { value: formattedTotal })}</strong>`
      }
    },
    legend: {
      type: 'scroll',
      data: categories.map(resolveCategoryLabel),
      bottom: 5 /* 调整图例位置，从0改为5 */,
      textStyle: { color: getCSSVariable('--gray-500'), fontSize: 12 },
      itemWidth: 14,
      itemHeight: 14,
      formatter: (name) => truncateLegend(name),
      pageIconSize: 12,
      pageIconColor: getCSSVariable('--gray-500'),
      pageIconInactiveColor: getCSSVariable('--gray-300'),
      pageTextStyle: { color: getCSSVariable('--gray-500') }
    },
    series
  }

  callStatsChart.setOption(option)
  bindChartResize(container)
  nextTick(() => handleResize())
  callStatsChart.on('mouseover', (event) => {
    hoveredSeriesName = event?.seriesName || null
  })
  callStatsChart.on('mouseout', () => {
    hoveredSeriesName = null
  })

  window.removeEventListener('resize', handleResize, resizeListenerOptions)
  window.addEventListener('resize', handleResize, resizeListenerOptions)
}

const scheduleRetry = () => {
  if (retryCount.value >= maxRetry) return
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = setTimeout(() => {
    retryCount.value += 1
    renderCallStatsChart()
  }, 100)
}

const handleResize = () => {
  if (callStatsChart) callStatsChart.resize()
}

const bindChartResize = (container) => {
  if (typeof ResizeObserver === 'undefined' || !container) return
  if (resizeObserver) resizeObserver.disconnect()
  resizeObserver = new ResizeObserver(() => handleResize())
  resizeObserver.observe(container)
}

const resizeListenerOptions = { passive: true }

const cleanup = () => {
  window.removeEventListener('resize', handleResize, resizeListenerOptions)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (retryTimer) {
    clearTimeout(retryTimer)
    retryTimer = null
  }
  retryCount.value = 0
  if (callStatsChart) {
    callStatsChart.dispose()
    callStatsChart = null
  }
}

defineExpose({ cleanup })

onMounted(() => {
  initColorPalette()
  loadCallStats()
})

watch(
  () => props.loading,
  (now) => {
    if (!now) {
      if (callStatsData.value) {
        nextTick().then(() => renderCallStatsChart())
      }
    }
  }
)

// 监听主题变化，重新渲染图表
watch(
  () => themeStore.isDark,
  () => {
    if (callStatsData.value && callStatsChart) {
      nextTick(() => {
        renderCallStatsChart()
      })
    }
  }
)

onUnmounted(() => {
  cleanup()
})
</script>

<style scoped lang="less">
/* 复用 dashboard.css 样式：此处仅做最小覆盖以避免重复 */
.call-stats-section {
  background-color: var(--gray-0);
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ant-card-body) {
  flex: 1;
  display: flex;
  min-width: 0;
  padding: 16px;
  overflow: hidden;
}

.call-stats-container {
  height: 100%;
  display: flex;
  flex: 1;
}

.call-stats .chart-container {
  height: 280px;
  flex: 1;
  min-width: 0;
  padding: 0;
}

.call-stats .chart,
.call-stats .call-stats-chart {
  height: 280px !important;
  width: 100% !important;
  min-width: 0;
  padding: 0 !important;
  border: none !important;
  background-color: transparent !important;
}

:deep(.ant-card-head-wrapper) {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  width: 100%;
}

:deep(.ant-card-head-title) {
  flex: 0 1 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-card-extra) {
  margin-inline-start: auto;
  flex: 1 0 auto;
  max-width: none;
  min-width: 0;
}

.simple-controls {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.simple-toggle-group {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 4px;
}

.simple-toggle-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-right: 4px;
}

.simple-toggle {
  padding: 4px 8px;
  font-size: 12px;
  line-height: 18px;
  color: var(--gray-500);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;
  white-space: nowrap;
}

.simple-toggle:hover {
  background-color: var(--gray-100);
  color: var(--gray-700);
}

.simple-toggle.active {
  background-color: var(--main-600);
  color: var(--gray-0);
}

.divider {
  width: 1px;
  height: 16px;
  background-color: var(--gray-200);
}
</style>
