<template>
  <t-card :title="$t('dashboard.agents.title')" class="dash-card">
    <t-loading :loading="loading" size="small">
      <div class="stat-row">
        <div>
          <t-statistic class="stat-info" :title="$t('dashboard.agents.total')" :value="agentStats?.total_agents || 0" :suffix="$t('dashboard.agents.unit')" />
          <div v-if="agentStats?.split_by_system" class="stat-split">
            {{ $t('dashboard.stats.chat') }} {{ agentStats?.weknora_total_agents || 0 }}
            ·
            {{ $t('dashboard.stats.work') }} {{ agentStats?.yuxi_total_agents || 0 }}
          </div>
        </div>
        <div>
          <t-statistic class="stat-accent" :title="$t('dashboard.agents.conversations')" :value="totalConversations" :suffix="$t('dashboard.agents.times')" />
          <div v-if="agentStats?.split_by_system" class="stat-split">
            {{ $t('dashboard.stats.chat') }} {{ chatConversations }}
            ·
            {{ $t('dashboard.stats.work') }} {{ workConversations }}
          </div>
        </div>
        <t-statistic class="stat-warning" :title="$t('dashboard.agents.toolCalls')" :value="totalToolUsage" :suffix="$t('dashboard.agents.times')" />
      </div>
      <t-divider />
      <h4>{{ $t('dashboard.agents.distribution') }}</h4>
      <div ref="conversationToolChartRef" class="chart" />
      <t-divider />
      <h4>{{ $t('dashboard.agents.topPerformers') }}</h4>
      <t-table :data="topPerformers" :columns="performerColumns" size="small" row-key="agent_id">
        <template #rank="{ rowIndex }">
          <span class="rank-number" :class="{ featured: rowIndex < 3 }">{{ rowIndex + 1 }}</span>
        </template>
        <template #agent_id="{ row }">
          <span class="agent-name" :title="resolveAgentName(row.agent_id)">{{ resolveAgentName(row.agent_id) }}</span>
        </template>
        <template #score="{ row }">
          <span>{{ Number(row.score || 0).toFixed(2) }}</span>
        </template>
      </t-table>
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
  agentStats?: Record<string, any>
  loading?: boolean
}>()

const { t } = useI18n()
const { isDark } = useTheme()
const conversationToolChartRef = ref<HTMLElement | null>(null)
let conversationToolChart: echarts.ECharts | null = null

const performerColumns = computed(() => [
  { colKey: 'rank', title: t('dashboard.agents.rank'), width: 80, align: 'center' },
  { colKey: 'agent_id', title: t('dashboard.agents.agent'), width: 160 },
  { colKey: 'score', title: t('dashboard.agents.score'), align: 'center' },
  { colKey: 'conversation_count', title: t('dashboard.agents.conversationCount'), align: 'center' },
])

const chatConversations = computed(() =>
  (props.agentStats?.weknora_agent_conversation_counts || []).reduce((sum: number, item: { conversation_count: number }) => sum + item.conversation_count, 0),
)
const workConversations = computed(() =>
  (props.agentStats?.agent_conversation_counts || []).reduce((sum: number, item: { conversation_count: number }) => sum + item.conversation_count, 0),
)
const totalConversations = computed(() => chatConversations.value + workConversations.value)
const totalToolUsage = computed(() =>
  (props.agentStats?.agent_tool_usage || []).reduce((sum: number, item: { tool_usage_count: number }) => sum + item.tool_usage_count, 0),
)
const topPerformers = computed(() => props.agentStats?.top_performing_agents || [])
const agentNames = computed(() => props.agentStats?.agent_names || {})
const weknoraAgentNames = computed(() => props.agentStats?.weknora_agent_names || {})
const resolveAgentName = (agentId: string) =>
  agentNames.value[agentId] || weknoraAgentNames.value[agentId] || agentId

const initConversationToolChart = () => {
  if (!conversationToolChartRef.value) return
  const conversationData = [
    ...(props.agentStats?.weknora_agent_conversation_counts || []),
    ...(props.agentStats?.agent_conversation_counts || []),
  ]
  const toolData = props.agentStats?.agent_tool_usage || []
  if (!conversationData.length && !toolData.length) return
  conversationToolChart?.dispose()
  conversationToolChart = echarts.init(conversationToolChartRef.value)
  const allAgentStats: Record<string, { conversation: number; tool: number; total: number }> = {}
  conversationData.forEach((item: { agent_id: string; conversation_count: number }) => {
    allAgentStats[item.agent_id] = allAgentStats[item.agent_id] || { conversation: 0, tool: 0, total: 0 }
    allAgentStats[item.agent_id].conversation = item.conversation_count
    allAgentStats[item.agent_id].total += item.conversation_count
  })
  toolData.forEach((item: { agent_id: string; tool_usage_count: number }) => {
    allAgentStats[item.agent_id] = allAgentStats[item.agent_id] || { conversation: 0, tool: 0, total: 0 }
    allAgentStats[item.agent_id].tool = item.tool_usage_count
    allAgentStats[item.agent_id].total += item.tool_usage_count
  })
  const topAgentIds = Object.entries(allAgentStats)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 3)
    .map(([agentId]) => agentId)
  conversationToolChart.setOption({
    tooltip: {
      trigger: 'axis',
      backgroundColor: getCSSVariable('--gray-0'),
      borderColor: getCSSVariable('--gray-200'),
      borderWidth: 1,
      textStyle: { color: getCSSVariable('--gray-600') },
    },
    legend: {
      data: [t('dashboard.agents.conversationCount'), t('dashboard.agents.toolCallCount')],
      right: '0%',
      top: '0%',
      orient: 'horizontal',
      textStyle: { color: getCSSVariable('--gray-500') },
    },
    grid: { left: '3%', right: '15%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: topAgentIds.map(resolveAgentName),
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500'), interval: 0 },
    },
    yAxis: {
      type: 'value',
      axisLine: { lineStyle: { color: getCSSVariable('--gray-200') } },
      axisLabel: { color: getCSSVariable('--gray-500') },
      splitLine: { lineStyle: { color: getCSSVariable('--gray-150') } },
    },
    series: [
      {
        name: t('dashboard.agents.conversationCount'),
        type: 'bar',
        data: topAgentIds.map((agentId) => allAgentStats[agentId]?.conversation || 0),
        itemStyle: { color: getColorByIndex(0), borderRadius: [4, 4, 0, 0] },
        emphasis: {
          itemStyle: {
            color: getColorByIndex(0),
            shadowBlur: 10,
            shadowColor: getCSSVariable('--color-info-50'),
          },
        },
      },
      {
        name: t('dashboard.agents.toolCallCount'),
        type: 'bar',
        data: topAgentIds.map((agentId) => allAgentStats[agentId]?.tool || 0),
        itemStyle: { color: getColorByIndex(1), borderRadius: [4, 4, 0, 0] },
        emphasis: {
          itemStyle: {
            color: getColorByIndex(1),
            shadowBlur: 10,
            shadowColor: getCSSVariable('--color-info-50'),
          },
        },
      },
    ],
  })
}

const cleanup = () => {
  window.removeEventListener('resize', handleResize)
  conversationToolChart?.dispose()
  conversationToolChart = null
}
const handleResize = () => conversationToolChart?.resize()
defineExpose({ cleanup })

onMounted(() => {
  nextTick(() => initConversationToolChart())
  window.addEventListener('resize', handleResize)
})
watch(() => props.agentStats, () => nextTick(() => initConversationToolChart()), { deep: true })
watch(isDark, () => nextTick(() => initConversationToolChart()))
onUnmounted(cleanup)
</script>

<style scoped lang="less">
.stat-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.stat-info :deep(.t-statistic-content-value) { color: var(--color-info-500); }
.stat-accent :deep(.t-statistic-content-value) { color: var(--color-accent-500); }
.stat-warning :deep(.t-statistic-content-value) { color: var(--color-warning-500); }
.stat-split { margin-top: 4px; font-size: 12px; color: var(--gray-500); font-weight: 500; }
.rank-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gray-50);
  border: 1px solid var(--gray-150);
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
}
.rank-number.featured { background: var(--main-20); border-color: var(--main-100); color: var(--main-color); }
.agent-name { display: inline-block; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
