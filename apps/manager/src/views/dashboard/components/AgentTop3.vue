<script setup lang="ts">
import type { DashboardAgentAnalyticsVO } from '@/types';
import agentAvatar1 from '@/assets/images/dashboard/dashboard_agent_avatar_1.png';
import agentAvatar2 from '@/assets/images/dashboard/dashboard_agent_avatar_2.png';
import agentAvatar3 from '@/assets/images/dashboard/dashboard_agent_avatar_3.png';

const props = defineProps<{
  data: DashboardAgentAnalyticsVO;
  loading: boolean;
}>();

const spacing = ref(10);
const agentAvatars = [agentAvatar1, agentAvatar2, agentAvatar3];
</script>

<template>
  <el-card shadow="never" class="top3-card">
    <el-skeleton :loading="props.loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" class="top3-title-skeleton" />
        <el-row :gutter="spacing">
          <el-col :span="8" v-for="item in 3" :key="item">
            <div class="top3-item">
              <el-skeleton-item variant="image" class="top3-avatar-skeleton" />
              <el-skeleton-item variant="h3" class="top3-name-skeleton" />
              <el-skeleton-item variant="text" class="top3-description-skeleton" />
              <div class="top3-metrics">
                <el-skeleton-item variant="text" class="top3-satisfaction-skeleton" />
                <el-skeleton-item variant="text" class="top3-conversations-skeleton" />
              </div>
            </div>
          </el-col>
        </el-row>
      </template>
      <template #default>
        <h3 class="top3-title">{{ $t('page.dashboard.topAgents', '表现最佳智能体 TOP 3') }}</h3>
        <el-row :gutter="spacing">
          <el-col :span="8" v-for="item in 3" :key="item">
            <div class="top3-item">
              <img :src="agentAvatars[item - 1]" class="top3-avatar" alt="" />
              <div class="top3-name">
                {{
                  props.data.agentNames?.find(
                    (agent: DashboardAgentAnalyticsVO.AgentName) => agent.id === props.data.topPerformingAgents?.[item - 1]?.agentId
                  )?.name
                }}
              </div>
              <div class="top3-description">
                {{
                  props.data.agentNames?.find(
                    (agent: DashboardAgentAnalyticsVO.AgentName) => agent.id === props.data.topPerformingAgents?.[item - 1]?.agentId
                  )?.description
                }}
              </div>
              <div class="top3-metrics is-loaded">
                <span>
                  {{ $t('page.dashboard.satisfaction', '满意度') }}
                  <span class="top3-satisfaction">
                    {{ props.data.topPerformingAgents?.[item - 1]?.satisfactionRate }}
                    <span v-if="props.data.topPerformingAgents?.[item - 1]?.satisfactionRate != null">%</span>
                  </span>
                </span>
                <span>
                  {{ $t('page.dashboard.agentConversations', '对话数') }}
                  <span class="top3-conversations">{{ props.data.topPerformingAgents?.[item - 1]?.conversationCount }}</span>
                </span>
              </div>
            </div>
          </el-col>
        </el-row>
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.top3-card {
  flex: 1;
  min-height: 0;
  align-self: flex-start;
}

.top3-title {
  margin: 0 0 20px;
  font-size: 18px;
  line-height: 24px;
}

.top3-title-skeleton {
  width: 220px;
  height: 24px;
  margin-bottom: 20px;
}

.top3-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: 100%;
  padding: 16px;
  border-radius: 14px;
  background: var(--layout-bg-color-page);
}

.top3-avatar,
.top3-avatar-skeleton {
  width: 100%;
  height: auto;
  aspect-ratio: 1;
  border-radius: 12px;
}

.top3-avatar {
  display: block;
  object-fit: cover;
}

.top3-name {
  min-height: 20px;
  margin-top: 4px;
  font-size: 16px;
  font-weight: 600;
}

.top3-name-skeleton {
  width: 80%;
  height: 20px;
  margin-top: 4px;
}

.top3-description {
  min-height: 14px;
  overflow: hidden;
  color: var(--el-text-color-placeholder);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.top3-description-skeleton {
  width: 100%;
  height: 14px;
}

.top3-metrics {
  display: flex;
  gap: 10px;

  &.is-loaded {
    flex-wrap: wrap;
    font-size: 14px;
  }
}

.top3-satisfaction {
  color: var(--el-color-success);
}

.top3-conversations {
  color: var(--el-color-primary);
}

.top3-satisfaction-skeleton {
  width: 48%;
  height: 16px;
}

.top3-conversations-skeleton {
  width: 40%;
  height: 16px;
}
</style>
