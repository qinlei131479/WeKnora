<script setup lang="ts">
import { API } from '@/api';
import type {
  DashboardAgentAnalyticsVO,
  DashboardConversationVO,
  DashboardStatsVO,
  DashboardKnowledgeStatsVO,
  DashboardTimeSeriesStatsVO,
  DashboardToolCallStatsVO,
  DashboardUserActiveStatsVO
} from '@/types';
import DashboardStats from './components/DashboardStats.vue';
import TimeSeriesStats from './components/TimeSeriesStats.vue';
import AgentAnalytics from './components/AgentAnalytics.vue';
import UsersActiveAnalytics from './components/UsersActiveAnalytics.vue';
import UsersActiveList from './components/UsersActiveList.vue';
import AgentTop3 from './components/AgentTop3.vue';
import ConversationList from './components/ConversationList.vue';
import KnowledgeBaseUsage from './components/KnowledgeBaseUsage.vue';
import ToolsCallMonitoring from './components/ToolsCallMonitoring.vue';

const state = reactive({
  loading: {
    stats: false,
    users: false,
    tools: false,
    knowledge: false,
    timeSeries: false,
    agents: false,
    conversations: false
  },
  params: {
    timeSeries: {
      type: 'agents' as 'models' | 'agents' | 'tokens' | 'tools',
      timeRange: '14days' as '14hours' | '14days' | '14weeks'
    }
  },
  data: {
    stats: {} as DashboardStatsVO,
    users: {} as DashboardUserActiveStatsVO,
    tools: {} as DashboardToolCallStatsVO,
    knowledge: {} as DashboardKnowledgeStatsVO,
    timeSeries: {} as DashboardTimeSeriesStatsVO,
    agents: {} as DashboardAgentAnalyticsVO,
    conversations: [] as DashboardConversationVO[]
  }
});

const spacing = ref(10);
let timeSeriesRequestId = 0;

const queryCallsTimeseries = () => {
  const requestId = ++timeSeriesRequestId;
  const { type, timeRange } = state.params.timeSeries;
  state.loading.timeSeries = true;

  return API.Dashboard.queryCallsTimeseries(type, timeRange)
    .then((res) => {
      // 参数连续变化时，只接受最后一次查询的结果。
      if (requestId === timeSeriesRequestId) {
        state.data.timeSeries = res.data ?? {};
      }
    })
    .catch((error) => {
      if (requestId === timeSeriesRequestId) {
        state.data.timeSeries = {};
        console.error(error);
      }
    })
    .finally(() => {
      if (requestId === timeSeriesRequestId) state.loading.timeSeries = false;
    });
};

watch([() => state.params.timeSeries.type, () => state.params.timeSeries.timeRange], () => {
  queryCallsTimeseries();
});

onMounted(() => {
  state.loading.stats = true;
  API.Dashboard.queryStats()
    .then((res) => {
      state.data.stats = res.data ?? {};
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.stats = false;
    });

  state.loading.users = true;
  API.Dashboard.queryStatsUsers()
    .then((res) => {
      state.data.users = res.data ?? {};
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.users = false;
    });

  state.loading.tools = true;
  API.Dashboard.queryStatsTools()
    .then((res) => {
      state.data.tools = res.data ?? {};
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.tools = false;
    });

  state.loading.knowledge = true;
  API.Dashboard.queryStatsKnowledge()
    .then((res) => {
      state.data.knowledge = res.data ?? {};
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.knowledge = false;
    });

  queryCallsTimeseries();

  state.loading.agents = true;
  API.Dashboard.queryStatsAgents()
    .then((res) => {
      state.data.agents = res.data ?? {};
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.agents = false;
    });

  state.loading.conversations = true;
  API.Dashboard.queryStatsConversations()
    .then((res) => {
      state.data.conversations = res.data ?? [];
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      state.loading.conversations = false;
    });
});

onBeforeUnmount(() => {
  timeSeriesRequestId++;
});
</script>

<template>
  <section class="dashboard">
    <el-scrollbar class="dashboard-inner" always>
      <page-content>
        <el-space :size="spacing" direction="vertical" alignment="stretch" style="width: 100%">
          <!-- 顶部数据总览 -->
          <DashboardStats :data="state.data.stats" :loading="state.loading.stats" />

          <el-row :gutter="spacing">
            <!-- 左侧主区 -->
            <el-col :xl="18" :lg="24">
              <el-space :size="spacing" class="dashboard-stack" direction="vertical" alignment="stretch">
                <el-row :gutter="spacing">
                  <!-- 调用统计 -->
                  <el-col :xl="13" :lg="24">
                    <TimeSeriesStats
                      v-model:type="state.params.timeSeries.type"
                      v-model:time-range="state.params.timeSeries.timeRange"
                      :data="state.data.timeSeries"
                      :loading="state.loading.timeSeries"
                    />
                  </el-col>

                  <!-- AI 智能体分析 -->
                  <el-col :xl="11" :lg="24">
                    <AgentAnalytics :data="state.data.agents" :stats="state.data.stats" :tools="state.data.tools" :loading="state.loading.agents" />
                  </el-col>
                </el-row>

                <el-row :gutter="spacing">
                  <el-col :xl="16" :lg="24">
                    <el-space :size="spacing" class="dashboard-stack" direction="vertical" alignment="stretch">
                      <!-- 用户活跃度分析 -->
                      <UsersActiveAnalytics :data="state.data.users" :loading="state.loading.users" />

                      <!-- 表现最佳智能体 TOP 3 -->
                      <AgentTop3 :data="state.data.agents" :loading="state.loading.agents" />
                    </el-space>
                  </el-col>

                  <!-- 活跃用户排行 -->
                  <el-col :xl="8" :lg="24">
                    <UsersActiveList :data="state.data.users" :loading="state.loading.users" />
                  </el-col>
                </el-row>

                <!-- 最近对话消息 -->
                <ConversationList :data="state.data.conversations" :loading="state.loading.conversations" />
              </el-space>
            </el-col>

            <!-- 右侧知识库、工具监控 -->
            <el-col :xl="6" :lg="24">
              <el-space :size="spacing" class="dashboard-stack" direction="vertical" alignment="stretch">
                <KnowledgeBaseUsage :data="state.data.knowledge" :loading="state.loading.knowledge" />
                <ToolsCallMonitoring :data="state.data.tools" :loading="state.loading.tools" />
              </el-space>
            </el-col>
          </el-row>
        </el-space>
      </page-content>
    </el-scrollbar>
  </section>
</template>

<style lang="scss" scoped>
:global(.app-main:has(.dashboard)) {
  width: 100%;
  min-height: calc(100% - var(--navbar-height)) !important;
  height: calc(100% - var(--navbar-height)) !important;
  overflow: hidden !important;
}

.dashboard {
  height: 100%;
  padding: var(--layout-padding) 0;
  box-sizing: border-box;
  overflow: hidden;
}

.dashboard-inner {
  height: 100%;
  box-sizing: border-box;
}

// 右侧留白放在滚动内容内，容纳栅格 gutter 的外侧负边距。
.dashboard-inner > :deep(.el-scrollbar__wrap > .el-scrollbar__view) {
  padding-right: var(--layout-padding);
}

.dashboard-inner > :deep(.el-scrollbar__bar.is-vertical) {
  right: 0;
}

.page-content {
  background-color: transparent;
  padding: 0;
  border-width: 0;
  border-radius: 0;
  height: auto;
}

.page-content :deep(.page-content-body) {
  overflow: visible;
}

.dashboard :deep(.el-row) {
  row-gap: var(--layout-padding);
}

.dashboard-stack {
  width: 100%;
  height: 100%;
  min-width: 0;
}

.dashboard-stack > :deep(.el-space__item:last-child) {
  flex: 1;
}

.dashboard :deep(.el-card) {
  --el-card-padding: 0;
  width: 100%;
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  border-radius: var(--layout-radius);
}
</style>
