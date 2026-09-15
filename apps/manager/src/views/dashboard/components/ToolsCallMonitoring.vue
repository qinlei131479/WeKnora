<script setup lang="ts">
import type { DashboardToolCallStatsVO } from '@/types';
import * as echarts from 'echarts';

const props = defineProps<{
  data: DashboardToolCallStatsVO;
  loading: boolean;
}>();

const spacing = ref(10);
const toolsChartRef = ref<HTMLDivElement>();
let toolsChart: echarts.ECharts | undefined;
let chartResizeObserver: ResizeObserver | undefined;

const resizeChart = () => {
  toolsChart?.resize();
};

onMounted(() => {
  if (!toolsChartRef.value) return;

  const styles = getComputedStyle(document.documentElement);
  const primaryColor = styles.getPropertyValue('--el-color-primary').trim() || '#409eff';
  const labelColor = styles.getPropertyValue('--el-text-color-secondary').trim() || '#909399';
  const borderColor = styles.getPropertyValue('--el-border-color-lighter').trim() || '#ebeef5';

  toolsChart = echarts.init(toolsChartRef.value, undefined, { renderer: 'svg' });
  toolsChart.setOption({
    animation: false,
    color: [primaryColor],
    tooltip: { trigger: 'axis' },
    grid: { top: 16, right: 8, bottom: 12, left: 8, containLabel: true },
    xAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, type: 'dashed' } }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      data: [],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: labelColor }
    },
    series: [{ type: 'bar', barMaxWidth: 10, itemStyle: { borderRadius: [0, 3, 3, 0] }, data: [] }]
  });

  watch(
    () => props.data,
    (data: DashboardToolCallStatsVO) => {
      const tools = [...(data.mostUsedTools ?? [])].sort((left, right) => (right.count ?? 0) - (left.count ?? 0)).slice(0, 10);
      toolsChart?.setOption({
        yAxis: { data: tools.map((tool) => tool.toolName ?? '') },
        series: [{ type: 'bar', data: tools.map((tool) => tool.count ?? null) }]
      });
    },
    { immediate: true, deep: true, flush: 'post' }
  );

  if (typeof ResizeObserver !== 'undefined') {
    chartResizeObserver = new ResizeObserver(resizeChart);
    chartResizeObserver.observe(toolsChartRef.value);
  }
  window.addEventListener('resize', resizeChart);
});

onActivated(resizeChart);

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  toolsChart?.dispose();
});
</script>

<template>
  <el-card shadow="never" class="tools-card">
    <div class="tools-summary">
      <el-skeleton :loading="props.loading" animated>
        <template #template>
          <el-skeleton-item variant="h3" class="tools-title-skeleton" />
          <el-row :gutter="spacing">
            <el-col :span="8" v-for="item in 3" :key="item" class="tools-metric-skeleton">
              <el-skeleton-item variant="text" class="tools-label-skeleton" />
              <el-skeleton-item variant="text" class="tools-value-skeleton" />
            </el-col>
          </el-row>
        </template>
        <template #default>
          <h3 class="tools-title">
            {{ $t('page.dashboard.toolMonitoring', '工具调用监控') }}
          </h3>
          <el-row :gutter="spacing">
            <el-col :span="8">
              <div class="tools-label">
                {{ $t('page.dashboard.totalCalls', '总调用次数') }}
              </div>
              <div class="tools-value tools-total">
                {{ props.data.totalCalls
                }}<span v-if="props.data.totalCalls != null">{{ $t('page.dashboard.callUnit', '次') }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="tools-label">
                {{ $t('page.dashboard.failedCalls', '失败调用') }}
              </div>
              <div class="tools-value tools-failed">
                {{ props.data.failedCalls
                }}<span v-if="props.data.failedCalls != null">{{ $t('page.dashboard.callUnit', '次') }}</span>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="tools-label">
                {{ $t('page.dashboard.successRate', '成功率') }}
              </div>
              <div class="tools-value tools-success">
                {{ props.data.successRate }}<span v-if="props.data.successRate != null">%</span>
              </div>
            </el-col>
          </el-row>
        </template>
      </el-skeleton>
    </div>
    <div class="tools-distribution">
      <div class="tools-chart-heading">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <el-skeleton-item variant="h3" class="tools-chart-title-skeleton" />
          </template>
          <template #default>
            <h3 class="tools-chart-title">{{ $t('page.dashboard.mostUsedTools', '最常用工具 TOP 10') }}</h3>
          </template>
        </el-skeleton>
      </div>
      <div ref="toolsChartRef" class="tools-chart" aria-hidden="true"></div>
    </div>
  </el-card>
</template>

<style lang="scss" scoped>
.tools-card {
  flex: 1;
  min-height: 600px;
}

.tools-summary {
  height: 116px;
}

.tools-title-skeleton {
  width: 144px;
  height: 24px;
  margin-bottom: 22px;
}

.tools-metric-skeleton {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools-label-skeleton {
  width: 72px;
  max-width: 100%;
  height: 14px;
}

.tools-value-skeleton {
  width: 56px;
  max-width: 100%;
  height: 24px;
}

.tools-title {
  margin: 0 0 22px;
  font-size: 18px;
  line-height: 24px;
}

.tools-label {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  line-height: 20px;
}

.tools-distribution {
  padding: 20px;
  border-radius: 14px;
  background: var(--layout-bg-color-page);
}

.tools-chart-heading {
  height: 32px;
}

.tools-chart-title-skeleton {
  width: 144px;
  max-width: 100%;
  height: 20px;
}

.tools-chart-title {
  margin: 0;
  font-size: 16px;
  line-height: 20px;
}

.tools-chart {
  width: 100%;
  height: 376px;
}

.tools-value {
  min-height: 28px;
  margin-top: 8px;
  font-size: 24px;
  font-weight: 600;
}

.tools-total {
  color: var(--el-color-primary);
}

.tools-failed {
  color: var(--el-color-danger);
}

.tools-success {
  color: var(--el-color-success);
}
</style>
