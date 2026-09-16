<script setup lang="ts">
import type { DashboardTimeSeriesStatsVO } from '@/types';
import * as echarts from 'echarts';
import { t, locale } from '@/i18n';

const props = defineProps<{
  data: DashboardTimeSeriesStatsVO;
  loading: boolean;
}>();

const type = defineModel<'models' | 'agents' | 'tokens' | 'tools'>('type', { required: true });
const timeRange = defineModel<'14hours' | '14days' | '14weeks'>('timeRange', { required: true });

const formatXAxisLabel = (value: string): string => {
  if (!value) return '';

  if (timeRange.value === '14weeks') {
    const week = value.match(/^\d{4}-(\d{1,2})$/)?.[1];
    return week ? t('page.dashboard.weekLabel', { week: Number(week) }, '第{week}周') : value;
  }

  const date = echarts.time.parse(value);
  if (Number.isNaN(date.getTime())) return value;

  return echarts.time.format(date, timeRange.value === '14hours' ? '{HH}:{mm}' : '{MM}-{dd}', false);
};

const callsChartRef = ref<HTMLDivElement>();
let callsChart: echarts.ECharts | undefined;
let chartResizeObserver: ResizeObserver | undefined;

const resizeChart = () => {
  callsChart?.resize();
};

onMounted(() => {
  if (!callsChartRef.value) return;

  const labelColor = '#909399';
  const borderColor = '#ebeef5';

  callsChart = echarts.init(callsChartRef.value, undefined, { renderer: 'svg' });
  callsChart.setOption({
    animation: false,
    color: ['#409EFF', '#67c23a', '#e6a23c', '#f56c6c', '#909399', '#9fceff', '#b3e19d', '#f3d19e', '#fab6b6', '#c8c9cc'],
    tooltip: { trigger: 'axis' },
    legend: {
      type: 'scroll',
      bottom: 0,
      left: 'center',
      icon: 'roundRect',
      itemWidth: 16,
      itemHeight: 10,
      textStyle: { color: labelColor },
      pageTextStyle: { color: labelColor },
      data: []
    },
    grid: { top: 16, right: 12, bottom: 40, left: 8, containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [],
      axisLine: { lineStyle: { color: borderColor } },
      axisTick: { show: false },
      axisLabel: { color: labelColor, formatter: formatXAxisLabel }
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: { color: labelColor },
      splitLine: { lineStyle: { color: borderColor, type: 'dashed' } }
    },
    series: []
  });

  watch(
    [() => props.data, timeRange, locale] as const,
    ([data]) => {
      const points = data.data ?? [];
      const categories = data.categories?.length
        ? data.categories
        : [
            ...new Set(
              points
                .flatMap((point) => point.data ?? [])
                .map((item) => item.category)
                .filter((category): category is string => category != null)
            )
          ];
      const agentNames = new Map((data.agentNames ?? []).map((agent) => [agent.id, agent.name]));
      const series: echarts.LineSeriesOption[] = categories.length
        ? categories.map((category) => ({
            id: category,
            name: agentNames.get(category) ?? category,
            type: 'line' as const,
            smooth: true,
            showSymbol: false,
            emphasis: { focus: 'series' },
            blur: { lineStyle: { opacity: 0.15 }, itemStyle: { opacity: 0.15 } },
            data: points.map((point) => point.data?.find((item) => item.category === category)?.count ?? null)
          }))
        : points.length
          ? [
              {
                id: 'total',
                name: type.value,
                type: 'line' as const,
                smooth: true,
                showSymbol: false,
                emphasis: { focus: 'series' },
                blur: { lineStyle: { opacity: 0.15 }, itemStyle: { opacity: 0.15 } },
                data: points.map((point) => point.total ?? null)
              }
            ]
          : [];

      callsChart?.setOption(
        {
          legend: { data: series.map((item) => item.name as string) },
          xAxis: { data: points.map((point) => point.date ?? '') },
          series
        },
        { replaceMerge: ['series'] }
      );
    },
    { immediate: true, deep: true, flush: 'post' }
  );

  if (typeof ResizeObserver !== 'undefined') {
    chartResizeObserver = new ResizeObserver(resizeChart);
    chartResizeObserver.observe(callsChartRef.value);
  }
  window.addEventListener('resize', resizeChart);
});

onActivated(resizeChart);

onBeforeUnmount(() => {
  chartResizeObserver?.disconnect();
  window.removeEventListener('resize', resizeChart);
  callsChart?.dispose();
});
</script>

<template>
  <el-card shadow="never" class="time-series-card">
    <template #header>
      <el-skeleton :loading="props.loading" animated>
        <template #template>
          <el-row class="time-series-header" align="middle" justify="space-between">
            <el-skeleton-item variant="h3" class="time-series-title-skeleton" />
            <el-space>
              <el-skeleton-item variant="button" class="time-series-range-skeleton" />
              <el-divider direction="vertical" class="time-series-divider" />
              <el-skeleton-item variant="button" class="time-series-type-skeleton" />
            </el-space>
          </el-row>
        </template>
        <template #default>
          <el-row class="time-series-header" align="middle" justify="space-between">
            <h3 class="time-series-title">{{ $t('page.dashboard.calls', '调用统计') }}</h3>
            <el-space>
              <el-radio-group v-model="timeRange" size="small" fill="var(--el-color-success)">
                <el-radio-button value="14hours">{{ $t('page.dashboard.last14Hours', '近14小时') }}</el-radio-button>
                <el-radio-button value="14days">{{ $t('page.dashboard.last14Days', '近14天') }}</el-radio-button>
                <el-radio-button value="14weeks">{{ $t('page.dashboard.last14Weeks', '近14周') }}</el-radio-button>
              </el-radio-group>
              <el-divider direction="vertical" class="time-series-divider" />
              <el-radio-group v-model="type" size="small" fill="var(--el-color-success)">
                <el-radio-button value="models">{{ $t('page.dashboard.modelCalls', '模型调用') }}</el-radio-button>
                <el-radio-button value="agents">{{ $t('page.dashboard.agentCalls', '智能体调用') }}</el-radio-button>
                <el-radio-button value="tokens">{{ $t('page.dashboard.tokenUsage', 'Token消耗') }}</el-radio-button>
                <el-radio-button value="tools">{{ $t('page.dashboard.toolCalls', '工具调用') }}</el-radio-button>
              </el-radio-group>
            </el-space>
          </el-row>
        </template>
      </el-skeleton>
    </template>
    <div ref="callsChartRef" class="time-series-chart" aria-hidden="true"></div>
  </el-card>
</template>

<style lang="scss" scoped>
.time-series-card {
  height: 360px;

  :deep(.el-card__header) {
    flex-shrink: 0;
    padding: 0 var(--layout-padding);
  }

  :deep(.el-card__body) {
    flex: 1;
    min-height: 0;
    padding: var(--layout-padding);
  }

  :deep(.el-radio-group) {
    flex-wrap: nowrap;
  }

  :deep(.el-radio-button__original-radio:focus-visible + .el-radio-button__inner) {
    outline: 2px solid var(--el-color-success);
  }
}

.time-series-header {
  min-height: 76px;
  flex-wrap: nowrap;
  gap: var(--layout-padding);
}

.time-series-title {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
  flex-shrink: 0;
}

.time-series-divider {
  margin: 0;
}

.time-series-chart {
  width: 100%;
  height: 100%;
}

.time-series-title-skeleton {
  width: 104px;
  height: 24px;
  flex-shrink: 0;
}

.time-series-range-skeleton {
  width: 176px;
  height: 28px;
}

.time-series-type-skeleton {
  width: 268px;
  height: 28px;
}
</style>
