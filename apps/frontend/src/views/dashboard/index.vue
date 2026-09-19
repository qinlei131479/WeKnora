<template>
  <div class="dashboard-page">
    <header class="page-header">
      <h1>{{ t('menu.dashboard') }}</h1>
      <p>{{ t('dashboard.subtitle') }}</p>
    </header>

    <StatsOverview :basic-stats="basicStats" :user-stats="allStatsData.users" />

    <div class="dashboard-grid">
      <CallStatsCard class="call-stats" :loading="loading" ref="callStatsRef" />
      <div class="grid-item user-stats">
        <UserStatsCard :user-stats="allStatsData.users" :loading="loading" ref="userStatsRef" />
      </div>
      <div class="grid-item agent-stats">
        <AgentStatsCard :agent-stats="allStatsData.agents" :loading="loading" ref="agentStatsRef" />
      </div>
      <div class="grid-item tool-stats">
        <ToolStatsCard :tool-stats="allStatsData.tools" :loading="loading" ref="toolStatsRef" />
      </div>
      <div class="grid-item knowledge-stats">
        <KnowledgeStatsCard :knowledge-stats="allStatsData.knowledge" :loading="loading" ref="knowledgeStatsRef" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { useTheme } from '@/composables/useTheme'
import { dashboardApi } from '@/api/chat-work/dashboard'
import { initColorPalette } from './chart'
import AgentStatsCard from './components/AgentStatsCard.vue'
import CallStatsCard from './components/CallStatsCard.vue'
import KnowledgeStatsCard from './components/KnowledgeStatsCard.vue'
import StatsOverview from './components/StatsOverview.vue'
import ToolStatsCard from './components/ToolStatsCard.vue'
import UserStatsCard from './components/UserStatsCard.vue'

const { t } = useI18n()
const loading = ref(false)
const basicStats = ref<Record<string, any>>({})
const allStatsData = ref<Record<string, any>>({
  users: null,
  tools: null,
  knowledge: null,
  agents: null,
})

const callStatsRef = ref<{ cleanup?: () => void } | null>(null)
const userStatsRef = ref<{ cleanup?: () => void } | null>(null)
const toolStatsRef = ref<{ cleanup?: () => void } | null>(null)
const knowledgeStatsRef = ref<{ cleanup?: () => void } | null>(null)
const agentStatsRef = ref<{ cleanup?: () => void } | null>(null)

const loadAllStats = async () => {
  loading.value = true
  try {
    const response = await dashboardApi.getAllStats() as Record<string, any>
    basicStats.value = response.basic
    allStatsData.value = {
      users: response.users,
      tools: response.tools,
      knowledge: response.knowledge,
      agents: response.agents,
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
    MessagePlugin.error(t('dashboard.loadFailed'))
    try {
      basicStats.value = await dashboardApi.getStats() as Record<string, any>
      MessagePlugin.warning(t('dashboard.loadPartial'))
    } catch (basicError) {
      console.error('加载基础统计数据也失败:', basicError)
      MessagePlugin.error(t('dashboard.loadNone'))
    }
  } finally {
    loading.value = false
  }
}

const { isDark } = useTheme()
watch(isDark, () => initColorPalette())

onMounted(() => {
  initColorPalette()
  loadAllStats()
})

onUnmounted(() => {
  callStatsRef.value?.cleanup?.()
  userStatsRef.value?.cleanup?.()
  toolStatsRef.value?.cleanup?.()
  knowledgeStatsRef.value?.cleanup?.()
  agentStatsRef.value?.cleanup?.()
})
</script>

<style scoped lang="less">
.dashboard-page {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  background: var(--gray-25);
  box-sizing: border-box;
}

.page-header {
  padding: 20px var(--page-padding) 16px;
  h1 {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    line-height: 32px;
    color: var(--td-text-color-primary, var(--gray-1000));
  }
  p {
    margin: 4px 0 0;
    font-size: 14px;
    line-height: 20px;
    color: var(--td-text-color-placeholder, var(--gray-500));
  }
}

.dashboard-grid {
  display: grid;
  padding: 16px var(--page-padding) var(--page-padding);
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  grid-template-rows: auto auto;
  gap: 16px;
  align-items: stretch;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
}

.grid-item {
  display: flex;
  flex-direction: column;
  min-width: 0;
  max-width: 100%;
  height: 100%;
}

.call-stats { grid-column: 1 / 3; grid-row: 1 / 2; }
.user-stats { grid-column: 3 / 4; grid-row: 1 / 2; }
.agent-stats { grid-column: 1 / 2; grid-row: 2 / 3; }
.tool-stats { grid-column: 2 / 3; grid-row: 2 / 3; }
.knowledge-stats { grid-column: 3 / 4; grid-row: 2 / 3; }

@media (max-width: 1200px) {
  .dashboard-grid {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: auto auto auto;
  }
  .call-stats { grid-column: 1 / 3; grid-row: 1 / 2; }
  .user-stats { grid-column: 1 / 2; grid-row: 2 / 3; }
  .agent-stats { grid-column: 2 / 3; grid-row: 2 / 3; }
  .tool-stats { grid-column: 1 / 2; grid-row: 3 / 4; }
  .knowledge-stats { grid-column: 2 / 3; grid-row: 3 / 4; }
}

@media (max-width: 768px) {
  .dashboard-grid { grid-template-columns: 1fr; gap: 16px; }
  .call-stats,
  .user-stats,
  .agent-stats,
  .tool-stats,
  .knowledge-stats {
    grid-column: 1;
    grid-row: auto;
  }
}
</style>

<style lang="less">
.dashboard-page {
  --page-padding: 22px;
  --main-500: #07c05f;
  --main-100: #b7ebc8;
  --main-50: #e9f8ec;
  --main-20: #f7fcf8;
  --main-0: #ffffff;
  --main-color: #07c05f;

  --gray-1000: #151616;
  --gray-900: #1e1f1f;
  --gray-700: #4c4d4d;
  --gray-600: #697070;
  --gray-500: #979999;
  --gray-200: #e4e6e6;
  --gray-150: #eef0f0;
  --gray-100: #eff2f2;
  --gray-50: #f5f7f7;
  --gray-25: #f8fafa;
  --gray-0: #ffffff;

  --color-primary-50: #e9f8ec;
  --color-success-50: #e6f7e6;
  --color-success-500: #52c41a;
  --color-success-700: #389e0d;
  --color-error-50: #fff2f0;
  --color-error-500: #ff4d4f;
  --color-error-700: #cf1322;
  --color-warning-50: #fffbe6;
  --color-warning-500: #faad14;
  --color-warning-700: #d48806;
  --color-info-50: #e6f7ff;
  --color-info-500: #1890ff;
  --color-info-700: #096dd9;
  --color-accent-50: #e6fffb;
  --color-accent-500: #13c2c2;
  --color-accent-700: #08979c;

  --chart-palette-1: var(--main-500);
  --chart-palette-2: #5ad8a6;
  --chart-palette-3: #f6bd16;
  --chart-palette-4: #f27c7c;
  --chart-palette-5: #9581cc;
  --chart-palette-6: #6dc8ec;
  --chart-palette-7: #ff9d4d;
  --chart-palette-8: #92d050;
  --chart-palette-9: #e885ba;
  --chart-palette-10: #8c8c8c;

  --shadow-1: rgba(0, 0, 0, 0.05);
  --shadow-3: rgba(0, 0, 0, 0.12);
}

html[theme-mode="dark"] .dashboard-page {
  --main-500: #06b04d;
  --main-100: #015e0d;
  --main-50: #06b04d20;
  --main-20: #06110a;
  --main-0: var(--td-bg-color-page, #181818);
  --main-color: var(--td-brand-color, #06b04d);

  --gray-1000: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-900: var(--td-text-color-primary, rgba(255, 255, 255, 0.9));
  --gray-700: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-600: var(--td-text-color-secondary, rgba(255, 255, 255, 0.55));
  --gray-500: var(--td-text-color-placeholder, rgba(255, 255, 255, 0.35));
  --gray-200: var(--td-component-border, #5e5e5e);
  --gray-150: var(--td-component-stroke, #383838);
  --gray-100: var(--td-component-stroke, #383838);
  --gray-50: var(--td-bg-color-container-hover, #2c2c2c);
  --gray-25: var(--td-bg-color-page, #181818);
  --gray-0: var(--td-bg-color-page, #181818);

  --color-primary-50: #06b04d20;
  --color-success-50: #162312;
  --color-success-500: #52c41a;
  --color-success-700: #73d13d;
  --color-error-50: #2a1215;
  --color-error-500: #ff4d4f;
  --color-error-700: #ff7875;
  --color-warning-50: #2b2111;
  --color-warning-500: #faad14;
  --color-warning-700: #ffc53d;
  --color-info-50: #111b26;
  --color-info-500: #3d8fff;
  --color-info-700: #40a9ff;
  --color-accent-50: #0f2e2e;
  --color-accent-500: #13c2c2;
  --color-accent-700: #36cfc9;

  --chart-palette-1: #038626;
  --chart-palette-2: #3ea896;
  --chart-palette-3: #d6ad37;
  --chart-palette-4: #cf6666;
  --chart-palette-5: #8672b4;
  --chart-palette-6: #529ab8;
  --chart-palette-7: #d48242;
  --chart-palette-8: #82b354;
  --chart-palette-9: #c46e9e;
  --chart-palette-10: #7a7a7a;

  --shadow-1: rgba(255, 255, 255, 0.05);
  --shadow-3: rgba(255, 255, 255, 0.12);
}

@media (min-width: 1600px) {
  .dashboard-page { --page-padding: 30px; }
}
@media (max-width: 1200px) {
  .dashboard-page { --page-padding: 18px; }
}
@media (max-width: 768px) {
  .dashboard-page { --page-padding: 14px; }
}

.dashboard-page .grid-item > .t-card.dash-card,
.dashboard-page .dash-card.t-card {
  background: var(--gray-0);
  border: 1px solid var(--gray-100);
  border-radius: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  box-shadow: none;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.dashboard-page .dash-card.t-card:hover {
  border-color: var(--gray-200);
  box-shadow: 0 1px 3px 0 var(--shadow-1);
}

.dashboard-page .dash-card .t-card__header {
  min-height: 56px;
  padding: 16px 20px;
  background: var(--gray-0);
  border-bottom: 1px solid var(--gray-100);
  flex-shrink: 0;
}

.dashboard-page .dash-card .t-card__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--gray-1000);
}

.dashboard-page .dash-card .t-card__body {
  padding: 16px 20px 20px;
  background: var(--gray-0);
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.dashboard-page .dash-card .t-card__body > .t-loading {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  width: 100%;
  background: transparent;
}

.dashboard-page .dash-card .t-statistic .t-statistic-title {
  color: var(--gray-600);
  font-weight: 500;
}

.dashboard-page .dash-card .t-statistic .t-statistic-content-value {
  font-weight: 700;
}

.dashboard-page .dash-card h4,
.dashboard-page .dash-card .t-divider,
.dashboard-page .dash-card .stat-row {
  flex-shrink: 0;
}

.dashboard-page .dash-card .chart {
  flex: 1 1 auto;
  width: 100%;
  min-height: 220px;
  height: auto;
  box-sizing: border-box;
  background: transparent;
  border: none;
  padding: 0;
}
</style>
