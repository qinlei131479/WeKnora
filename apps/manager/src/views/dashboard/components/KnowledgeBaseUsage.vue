<script setup lang="ts">
import type { DashboardKnowledgeStatsVO } from '@/types';
import knowledgeIcon1 from '@/assets/images/dashboard/dashboard_kb_1.png';
import knowledgeIcon2 from '@/assets/images/dashboard/dashboard_kb_2.png';
import knowledgeIcon3 from '@/assets/images/dashboard/dashboard_kb_3.png';
import knowledgeIcon4 from '@/assets/images/dashboard/dashboard_kb_4.png';
import * as echarts from 'echarts';
import { computed, watch } from 'vue';

interface FileTypeItem {
  name: string;
  value: number;
}

const props = defineProps<{
  data: DashboardKnowledgeStatsVO;
  loading: boolean;
}>();

const spacing = ref(10);
const knowledgeIcons = [knowledgeIcon1, knowledgeIcon2, knowledgeIcon3, knowledgeIcon4];
const chartColors = [
  '#E63946', '#457B9D', '#F77F00', '#00B4D8', '#FFD60A',
  '#7209B7', '#F4A261', '#2A9D8F', '#E9C46A', '#3A0CA3',
  '#D62828', '#4CC9F0', '#FCBF49', '#560BAD', '#F08080',
  '#0077B6', '#FFB703', '#4361EE', '#E76F51', '#06D6A0'
];
const storageSize = computed(() => {
  const bytes = props.data.totalStorageSize;
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '';

  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB', 'RiB', 'QiB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }

  let rounded = Math.round(value * 10) / 10;
  // 四舍五入达到 1024 时，继续进位，避免显示 1024 KiB。
  if (rounded >= 1024 && unit < units.length - 1) {
    rounded = Math.round((rounded / 1024) * 10) / 10;
    unit++;
  }
  return `${rounded} ${units[unit]}`;
});

const fileTypes = computed<FileTypeItem[]>(() =>
  Object.entries<number>(props.data.fileTypeDistribution ?? {})
    .filter(([, value]) => Number.isFinite(value) && value > 0)
    .map(([name, value]) => ({ name, value }))
    .sort((left, right) => right.value - left.value)
);
const knowledgeChartRef = ref<HTMLDivElement>();
let knowledgeChart: echarts.ECharts | undefined;
let chartResizeObserver: ResizeObserver | undefined;

const resizeChart = () => {
  knowledgeChart?.resize();
};

onMounted(() => {
  if (!knowledgeChartRef.value) return;

  const styles = getComputedStyle(document.documentElement);
  const emptyColor = styles.getPropertyValue('--el-fill-color').trim() || '#f0f2f5';

  knowledgeChart = echarts.init(knowledgeChartRef.value, undefined, { renderer: 'svg' });
  knowledgeChart.setOption({
    animation: false,
    color: chartColors,
    tooltip: { trigger: 'item' },
    series: [
      {
        type: 'pie',
        clockwise: false,
        radius: ['58%', '82%'],
        center: ['50%', '50%'],
        padAngle: 2,
        itemStyle: { borderRadius: 6 },
        emphasis: { scale: true, scaleSize: 5 },
        showEmptyCircle: true,
        emptyCircleStyle: { color: emptyColor },
        label: { show: false },
        labelLine: { show: false },
        data: []
      }
    ]
  });

  watch(
    fileTypes,
    (data: FileTypeItem[]) => {
      knowledgeChart?.setOption({ series: [{ type: 'pie', data }] });
    },
    { immediate: true, deep: true, flush: 'post' }
  );

  if (typeof ResizeObserver !== 'undefined') {
    chartResizeObserver = new ResizeObserver(resizeChart);
    chartResizeObserver.observe(knowledgeChartRef.value);
  }
  window.addEventListener('resize', resizeChart);
});

onActivated(resizeChart);

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  knowledgeChart?.dispose();
});
</script>

<template>
  <el-card shadow="never" class="knowledge-card">
    <!-- 知识库使用情况 -->
    <div class="knowledge-summary">
      <el-skeleton :loading="props.loading" animated>
        <template #template>
          <el-skeleton-item variant="h3" class="knowledge-title-skeleton" />
          <el-row :gutter="spacing">
            <el-col v-for="item in 3" :key="item" :span="8" class="knowledge-metric-skeleton">
              <el-skeleton-item variant="text" class="knowledge-label-skeleton" />
              <el-skeleton-item variant="text" class="knowledge-value-skeleton" />
            </el-col>
          </el-row>
        </template>
        <template #default>
          <h3 class="knowledge-title">{{ $t('page.dashboard.knowledgeUsage', '知识库使用情况') }}</h3>
          <el-row :gutter="spacing">
            <el-col :span="8">
              <div class="knowledge-label">{{ $t('page.dashboard.totalKnowledgeBases', '知识库总数') }}</div>
              <div class="knowledge-value knowledge-total">
                {{ props.data.totalDatabases }}<span v-if="props.data.totalDatabases != null">{{ $t('page.dashboard.itemUnit', '个') }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="knowledge-label">{{ $t('page.dashboard.totalFiles', '文件总数') }}</div>
              <div class="knowledge-value knowledge-files">
                {{ props.data.totalFiles }}<span v-if="props.data.totalFiles != null">{{ $t('page.dashboard.itemUnit', '个') }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="knowledge-label">{{ $t('page.dashboard.storageSize', '存储容量') }}</div>
              <div class="knowledge-value knowledge-storage">{{ storageSize }}</div>
            </el-col>
          </el-row>
        </template>
      </el-skeleton>
    </div>

    <!-- 文件类型分布：标题和图例按内容自然撑开。 -->
    <div class="knowledge-distribution">
      <el-skeleton :loading="props.loading" animated>
        <template #template>
          <el-skeleton-item variant="h3" class="knowledge-distribution-title-skeleton" />
          <div class="knowledge-legend">
            <span v-for="item in 3" :key="item" class="knowledge-legend-item">
              <svg class="knowledge-legend-color" viewBox="0 0 8 8" aria-hidden="true">
                <rect width="8" height="8" rx="2" :fill="chartColors[(item - 1) % chartColors.length]" />
              </svg>
              <el-skeleton-item variant="text" class="knowledge-legend-skeleton" />
            </span>
          </div>
        </template>
        <template #default>
          <h3 class="knowledge-distribution-title">{{ $t('page.dashboard.fileTypeDistribution', '文件类型分布') }}</h3>
          <div class="knowledge-legend">
            <span v-for="(fileType, index) in fileTypes" :key="fileType.name" class="knowledge-legend-item">
              <svg class="knowledge-legend-color" viewBox="0 0 8 8" aria-hidden="true">
                <rect width="8" height="8" rx="2" :fill="chartColors[index % chartColors.length]" />
              </svg>
              {{ fileType.name }}
            </span>
          </div>
        </template>
      </el-skeleton>
      <div class="knowledge-chart-container">
        <div ref="knowledgeChartRef" class="knowledge-chart" aria-hidden="true"></div>
        <div class="knowledge-chart-center">
          <el-skeleton :loading="props.loading" animated>
            <template #template>
              <div class="knowledge-chart-summary">
                <el-skeleton-item variant="text" class="knowledge-chart-label-skeleton" />
                <el-skeleton-item variant="text" class="knowledge-chart-value-skeleton" />
                <el-skeleton-item variant="text" class="knowledge-chart-detail-skeleton" />
              </div>
            </template>
            <template #default>
              <div class="knowledge-label">{{ $t('page.dashboard.totalFiles', '文件总数') }}</div>
              <div class="knowledge-chart-value">{{ props.data.totalFiles }}</div>
            </template>
          </el-skeleton>
        </div>
      </div>
    </div>

    <!-- 常用知识库 -->
    <el-divider class="knowledge-divider" />
    <el-skeleton :loading="props.loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" class="knowledge-common-title-skeleton" />
        <div class="knowledge-list">
          <div v-for="item in 4" :key="item" class="knowledge-item">
            <el-skeleton-item variant="image" class="knowledge-icon-skeleton" />
            <div class="knowledge-content">
              <el-skeleton-item variant="text" class="knowledge-type-skeleton" />
              <el-skeleton-item variant="text" class="knowledge-name-skeleton" />
              <el-skeleton-item variant="text" class="knowledge-description-skeleton" />
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <h3 class="knowledge-common-title">{{ $t('page.dashboard.commonKnowledge', '常用知识库') }}</h3>
        <div v-if="props.data.activeKnowledgeBases?.length" class="knowledge-list">
          <div v-for="(knowledge, index) in props.data.activeKnowledgeBases.slice(0, 4)" :key="knowledge.id ?? index" class="knowledge-item">
            <img :src="knowledgeIcons[index]" alt="" class="knowledge-icon" />
            <div class="knowledge-content">
              <div class="knowledge-type">
                <el-tag v-if="knowledge.type === 'document' || knowledge.type === 'docment'" type="primary" size="small">
                  {{ $t('page.dashboard.documentKnowledge', '文档知识库') }}
                </el-tag>
                <el-tag v-else-if="knowledge.type === 'faq'" type="warning" size="small">{{ $t('page.dashboard.faqKnowledge', 'FAQ知识库') }}</el-tag>
                <el-tag v-else-if="knowledge.type === 'wiki'" type="success" size="small">{{ $t('page.dashboard.wikiKnowledge', 'WIKI知识库') }}</el-tag>
              </div>
              <div class="knowledge-name" :title="knowledge.name">{{ knowledge.name }}</div>
              <div class="knowledge-description" :title="knowledge.description">{{ knowledge.description }}</div>
            </div>
          </div>
        </div>
        <el-empty v-else :description="$t('page.normal.noData', '暂无数据')" :image-size="80" class="knowledge-empty" />
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.knowledge-card {
  min-height: 940px;
}

.knowledge-summary {
  margin-bottom: 20px;
}

.knowledge-title {
  margin: 0 0 22px;
  font-size: 18px;
  line-height: 24px;
}

.knowledge-title-skeleton {
  width: 160px;
  height: 24px;
  margin-bottom: 22px;
}

.knowledge-metric-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.knowledge-label-skeleton {
  width: 72px;
  max-width: 100%;
  height: 14px;
}

.knowledge-value-skeleton {
  width: 56px;
  max-width: 100%;
  height: 24px;
}

.knowledge-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 20px;
}

.knowledge-value {
  min-height: 28px;
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.knowledge-total {
  color: var(--el-color-primary);
}

.knowledge-files {
  color: #ff9800;
}

.knowledge-storage {
  color: #8b5cf6;
}

.knowledge-distribution {
  padding: 20px;
  border-radius: 14px;
  background: var(--layout-bg-color-page);
}

.knowledge-distribution-title {
  margin: 0 0 18px;
  font-size: 16px;
  line-height: 20px;
}

.knowledge-distribution-title-skeleton {
  width: 120px;
  height: 20px;
  margin-bottom: 18px;
}

.knowledge-legend {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.knowledge-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
}

.knowledge-legend-color {
  width: 8px;
  height: 8px;
  flex-shrink: 0;
}

.knowledge-legend-skeleton {
  width: 52px;
  max-width: 100%;
  height: 14px;
}

.knowledge-chart-container {
  position: relative;
}

.knowledge-chart {
  width: 100%;
  aspect-ratio: 1;
}

.knowledge-chart-center {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 64px;
  transform: translate(-50%, -50%);
  pointer-events: none;
  text-align: center;
}

.knowledge-chart-summary {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.knowledge-chart-label-skeleton {
  width: 40px;
  height: 14px;
}

.knowledge-chart-value-skeleton {
  width: 32px;
  height: 24px;
}

.knowledge-chart-detail-skeleton {
  width: 44px;
  height: 14px;
}

.knowledge-chart-value {
  min-height: 28px;
  margin-top: 12px;
  font-size: 24px;
  font-weight: 600;
}

.knowledge-divider {
  margin: 20px 0;
}

.knowledge-common-title {
  margin: 0 0 20px;
  font-size: 18px;
  line-height: 24px;
}

.knowledge-common-title-skeleton {
  width: 128px;
  height: 24px;
  margin-bottom: 20px;
}

.knowledge-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.knowledge-item {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 82px;
}

.knowledge-icon,
.knowledge-icon-skeleton {
  width: 64px;
  height: 72px;
  flex-shrink: 0;
  border-radius: 12px;
}

.knowledge-icon {
  object-fit: contain;
}

.knowledge-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.knowledge-type {
  min-height: 20px;
  line-height: 20px;
}

.knowledge-name,
.knowledge-description {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.knowledge-name {
  min-height: 20px;
  font-size: 16px;
  line-height: 20px;
  font-weight: 600;
}

.knowledge-description {
  min-height: 20px;
  color: var(--el-text-color-placeholder);
  font-size: 14px;
  line-height: 20px;
}

.knowledge-type-skeleton {
  width: 64px;
  height: 20px;
}

.knowledge-name-skeleton {
  width: 84%;
  height: 20px;
}

.knowledge-description-skeleton {
  width: 100%;
  height: 20px;
}

.knowledge-empty {
  min-height: 350px;
}
</style>
