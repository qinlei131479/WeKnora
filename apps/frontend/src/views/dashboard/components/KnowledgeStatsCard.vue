<template>
  <t-card :title="$t('dashboard.knowledge.title')" class="dash-card">
    <template v-if="knowledgeStats?.source === 'weknora'" #actions>
      <span class="knowledge-source">{{ $t('dashboard.knowledge.sourcePlatform') }}</span>
    </template>
    <t-loading :loading="loading" size="small">
      <div class="stat-row">
        <t-statistic class="stat-info" :title="$t('dashboard.knowledge.total')" :value="knowledgeStats?.total_databases || 0" :suffix="$t('dashboard.knowledge.unit')" />
        <t-statistic class="stat-success" :title="$t('dashboard.knowledge.files')" :value="knowledgeStats?.total_files || 0" :suffix="$t('dashboard.knowledge.unit')" />
        <t-statistic class="stat-warning" :title="$t('dashboard.knowledge.storage')" :value="storageDisplaySize" :decimal-places="storageSizeDecimalPlaces" :unit="storageSizeUnit" />
      </div>
      <t-divider />
      <h4>{{ $t('dashboard.knowledge.fileTypes') }}</h4>
      <div class="donut-section">
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
        <div v-if="fileTypeData.length" class="file-type-legend">
          <span v-for="(item, index) in fileTypeData" :key="item.name" class="legend-item">
            <span class="legend-marker" :style="{ backgroundColor: getColorByIndex(index) }" />
            <span class="legend-text">{{ item.name }}</span>
          </span>
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
import { getColorByIndex, getCSSVariable } from '../chart'

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

const storageSize = computed(() => {
  const size = Number(props.knowledgeStats?.total_storage_size || 0)
  return Number.isFinite(size) && size > 0 ? size : 0
})

const storageSizeUnit = computed(() => {
  if (storageSize.value < 1024) return 'B'
  if (storageSize.value < 1024 * 1024) return 'KB'
  if (storageSize.value < 1024 * 1024 * 1024) return 'MB'
  return 'GB'
})

const storageDisplaySize = computed(() => {
  if (storageSizeUnit.value === 'KB') return storageSize.value / 1024
  if (storageSizeUnit.value === 'MB') return storageSize.value / (1024 * 1024)
  if (storageSizeUnit.value === 'GB') return storageSize.value / (1024 * 1024 * 1024)
  return storageSize.value
})

const storageSizeDecimalPlaces = computed(() => (storageSize.value < 1024 ? 0 : 2))

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
      color: entries.length
        ? entries.map((_, index) => getColorByIndex(index))
        : [getCSSVariable('--main-500')],
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
.stat-warning :deep(.t-statistic-content-unit) {
  color: var(--color-warning-500);
  font-size: var(--td-font-size-headline-medium);
  line-height: var(--td-line-height-headline-medium);
}
.donut { position: relative; }
.donut-section {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-width: 0;
}
.file-type-legend {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: center;
  gap: 6px 16px;
  margin-top: 6px;
  min-width: 0;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  min-width: 0;
  font-size: 11px;
  color: var(--gray-600);
}
.legend-marker {
  flex: 0 0 auto;
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.legend-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
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
