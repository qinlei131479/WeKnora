<script setup lang="ts">
import type { DashboardConversationVO } from '@/types';
import { formatDate } from '@/utils';

const props = defineProps<{
  data: DashboardConversationVO[];
  loading: boolean;
}>();
</script>

<template>
  <el-card shadow="never" class="conversation-card">
    <el-skeleton :loading="props.loading" animated>
      <template #template>
        <el-skeleton-item variant="h3" class="conversation-title-skeleton" />
        <div class="conversation-table-wrap">
          <table class="conversation-table-skeleton">
            <colgroup>
              <col class="conversation-index-column" />
              <col />
              <col class="conversation-agent-column" />
              <col class="conversation-time-column" />
            </colgroup>
            <thead>
              <tr>
                <th v-for="column in 4" :key="column">
                  <el-skeleton-item variant="text" class="conversation-header-skeleton" />
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in 5" :key="row">
                <td v-for="column in 4" :key="column">
                  <el-skeleton-item variant="text" class="conversation-cell-skeleton" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template #default>
        <h3 class="conversation-title">{{ $t('page.dashboard.recentMessages', '最近对话消息') }}</h3>
        <el-table :data="props.data.slice(0, 10)" show-overflow-tooltip class="conversation-table">
          <el-table-column type="index" :index="1" :label="$t('page.dashboard.messageIndex', '序号')" width="70" />
          <el-table-column prop="title" :label="$t('page.dashboard.messageTitle', '对话标题')" min-width="360">
            <template #default="{ row }">
              <span v-if="row.title?.trim()">{{ row.title }}</span>
              <span v-else class="conversation-placeholder">{{ $t('page.dashboard.newConversation', '[新对话]') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="agentName" :label="$t('page.dashboard.messageAgent', '智能体名称')" width="180">
            <template #default="{ row }">
              <span v-if="row.agentName?.trim()">{{ row.agentName }}</span>
              <span v-else class="conversation-placeholder">{{ $t('page.dashboard.noAgent', '[无]') }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" :label="$t('page.dashboard.messageTime', '时间')" width="200">
            <template #default="{ row }">{{ formatDate(row.updatedAt) }}</template>
          </el-table-column>
          <template #empty>
            <el-empty :description="$t('page.normal.noData', '暂无数据')" :image-size="80" class="conversation-empty" />
          </template>
        </el-table>
      </template>
    </el-skeleton>
  </el-card>
</template>

<style lang="scss" scoped>
.conversation-card {
  min-height: 470px;
}

.conversation-title {
  margin: 0 0 20px;
  font-size: 18px;
  line-height: 24px;
}

.conversation-title-skeleton {
  width: 144px;
  height: 24px;
  margin-bottom: 20px;
}

.conversation-table-wrap {
  overflow-x: auto;
}

.conversation-table-skeleton {
  width: 100%;
  min-width: 810px;
  border-spacing: 0;
  table-layout: fixed;

  th {
    padding: 0 16px;
    text-align: left;

    &:first-child {
      border-radius: 12px 0 0 12px;
    }

    &:last-child {
      border-radius: 0 12px 12px 0;
    }
  }

  thead tr {
    height: 54px;
    background: var(--el-color-primary-light-9);
  }

  tbody tr {
    height: 64px;
  }

  td {
    padding: 0 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    &:first-child .conversation-cell-skeleton {
      width: 24px;
    }
  }
}

.conversation-index-column {
  width: 70px;
}

.conversation-agent-column {
  width: 180px;
}

.conversation-time-column {
  width: 200px;
}

.conversation-header-skeleton {
  width: 64px;
  max-width: 100%;
  height: 16px;
}

.conversation-cell-skeleton {
  width: 88%;
  max-width: 100%;
  height: 16px;
}

.conversation-table {
  width: 100%;

  :deep(.el-table__header th.el-table__cell) {
    background: var(--el-color-primary-light-9);
    color: var(--el-text-color-secondary);
  }
}

.conversation-empty {
  min-height: 320px;
}

.conversation-placeholder {
  font-style: italic;
}
</style>
