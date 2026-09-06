<template>
  <t-card :title="$t('dashboard.knowledge.title')" class="dash-card">
    <template v-if="knowledgeStats?.source === 'weknora'" #actions>
      <span class="knowledge-source">{{ $t('dashboard.knowledge.sourceWeKnora') }}</span>
    </template>
    <t-loading :loading="loading" size="small">
      <div class="stat-row">
        <t-statistic class="stat-info" :title="$t('dashboard.knowledge.total')" :value="knowledgeStats?.total_databases || 0" :suffix="$t('dashboard.knowledge.unit')" />
        <t-statistic class="stat-success" :title="$t('dashboard.knowledge.files')" :value="knowledgeStats?.total_files || 0" :suffix="$t('dashboard.knowledge.unit')" />
        <t-statistic class="stat-warning" :title="$t('dashboard.knowledge.storage')" :value="formattedStorageSize" />
      </div>
      <t-divider />
      <h4>{{ $t('dashboard.knowledge.fileTypes') }}</h4>
      <div ref="fileTypeChartRef" class="chart donut">
        <div v-if="fileTypeData.length" class="carousel-info">
          <div
            v-for="(item, index) in fileTypeData"
            :key="item.name"
            class="carousel-item"
            :class="{ active: currentCarouselIndex === index }"
          >
            <div class="carousel-label">{{ item.name }}</div>
            <div class="carousel-value">{{ item.value }}</div>
            <div class="carousel-percent">{{ ((item.value / totalFiles) * 100).toFixed(1) }}%</div>
          </div>
        </div>
      </div>
    </t-loading>
  </t-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import * as echarts from 'echarts'
import { useTheme } from '@/composables/useTheme'
import { getColorPalette, getCSSVariable } from '../chart'

const props = defineProps<{
  knowledgeStats?: Record<string, any>
  loading?: boolean
}>()

const { t } = useI18n()
const { isDark } = useTheme()
const fileTypeChartRef = ref<HTMLElement | null>(null)
let fileTypeChart: echarts.ECharts | null = null
const fileTypeData = ref<Array<{ name: string; value: number }>>([])
const totalFiles = ref(0)
const currentCarouselIndex = ref(0)
let carouselTimer: ReturnType<typeof setInterval> | null = null

const formattedStorageSize = computed(() => {
  const size = props.knowledgeStats?.total_storage_size || 0
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
})

const stopCarousel = () => {
  if (carouselTimer) {
    clearInterval(carouselTimer)
    carouselTimer = null
  }
}

const startCarousel = () => {
  stopCarousel()
  if (fileTypeData.value.length <= 1) return
  currentCarouselIndex.value = 0
  carouselTimer = setInterval(() => {
    currentCarouselIndex.value = (currentCarouselIndex.value + 1) % fileTypeData.value.length
  }, 3000)
}

const initFileTypeChart = () => {
  if (!fileTypeChartRef.value) return
  fileTypeChart?.dispose()
  fileTypeChart = echarts.init(fileTypeChartRef.value)
  const fileTypesData = props.knowledgeStats?.file_type_distribution || {}
  const entries = Object.entries(fileTypesData)
    .map(([type, count]) => ({ name: type || t('dashboard.knowledge.unknownType'), value: Number(count) }))
    .sort((a, b) => b.value - a.value)
  if (entries.length) {
    fileTypeData.value = entries
    totalFiles.value = entries.reduce((sum, item) => sum + item.value, 0)
    startCarousel()
  } else {
    fileTypeData.value = []
    totalFiles.value = 0
    stopCarousel()
  }
  fileTypeChart.setOption({
    tooltip: {
      trigger: 'item',
      backgroundColor: getCSSVariable('--gray-0'),
      borderColor: getCSSVariable('--gray-200'),
      borderWidth: 1,
      textStyle: { color: getCSSVariable('--gray-600') },
      formatter: '{a} <br/>{b}: {c} ({d}%)',
    },
    legend: {
      orient: 'horizontal',
      bottom: '5%',
      left: 'center',
      itemGap: 16,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: { fontSize: 11, color: getCSSVariable('--gray-600') },
    },
    series: [{
      name: t('dashboard.knowledge.fileTypes'),
      type: 'pie',
      radius: ['45%', '75%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: {
        borderRadius: 8,
        borderColor: getCSSVariable('--gray-0'),
        borderWidth: 2,
      },
      label: { show: false },
      labelLine: { show: false },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: getCSSVariable('--shadow-3'),
        },
      },
      data: entries.length ? entries : [{ name: t('dashboard.knowledge.noData'), value: 1 }],
      color: entries.length ? getColorPalette() : [getCSSVariable('--main-500')],
    }],
  })
}

const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  stopCarousel()
  fileTypeChart?.dispose()
  fileTypeChart = null
}
const handleResize = () => fileTypeChart?.resize()
defineExpose({ cleanup })

onMounted(() => {
  nextTick(() => initFileTypeChart())
  window.addEventListener('resize', handleResize)
})
watch(() => props.knowledgeStats, () => nextTick(() => initFileTypeChart()), { deep: true })
watch(isDark, () => nextTick(() => initFileTypeChart()))
onUnmounted(cleanup)
</script>

<style scoped lang="less">
.knowledge-source { font-size: 12px; color: var(--gray-500); }
.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-info :deep(.t-statistic-content-value) { color: var(--color-info-500); }
.stat-success :deep(.t-statistic-content-value) { color: var(--color-success-500); }
.stat-warning :deep(.t-statistic-content-value) { color: var(--color-warning-500); }
.donut { position: relative; }
.carousel-info {
  position: absolute;
  top: 42%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}
.carousel-item { opacity: 0; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); }
.carousel-item.active { opacity: 1; }
.carousel-label { font-size: 14px; color: var(--gray-600); }
.carousel-value { font-size: 24px; font-weight: 700; color: var(--gray-1000); }
.carousel-percent { font-size: 12px; color: var(--gray-500); }
</style>
