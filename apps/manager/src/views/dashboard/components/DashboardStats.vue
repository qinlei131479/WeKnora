<script setup lang="ts">
import type { DashboardStatsVO } from '@/types';

const spacing = ref(10);

const props = defineProps<{
  data: DashboardStatsVO;
  loading: boolean;
}>();
</script>

<template>
  <el-row :gutter="spacing">
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="chat" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.totalConversations', '累计会话') }}</div>
                <div class="stats-value">
                  {{ props.data.totalConversations ?? 0 }}
                </div>
                <div>
                  <el-tag v-if="props.data.weknoraSessions != null || props.data.yuxiConversations != null" class="stats-detail-tag" effect="light">
                    {{
                      `${$t('page.dashboard.chat', '对话')}${props.data.weknoraSessions ?? 0} · ${$t('page.dashboard.work', '工作')}${props.data.yuxiConversations ?? 0}`
                    }}
                  </el-tag>
                  <el-tag v-else class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="pulse" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.activeConversations', '活跃会话') }}</div>
                <div class="stats-value">
                  {{ props.data.activeConversations ?? 0 }}
                </div>
                <div>
                  <el-tag class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="letter" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.totalMessages', '总消息数') }}</div>
                <div class="stats-value">
                  {{ props.data.totalMessages ?? 0 }}
                </div>
                <div>
                  <el-tag v-if="props.data.weknoraMessages != null || props.data.yuxiMessages != null" class="stats-detail-tag" effect="light">
                    {{
                      `${$t('page.dashboard.chat', '对话')}${props.data.weknoraMessages ?? 0} · ${$t('page.dashboard.work', '工作')}${props.data.yuxiMessages ?? 0}`
                    }}
                  </el-tag>
                  <el-tag v-else class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="user_group" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.userCount', '用户数') }}</div>
                <div class="stats-value">
                  {{ props.data.totalUsers ?? 0 }}
                </div>
                <div>
                  <el-tag class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="chat2" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.totalFeedbacks', '总反馈数') }}</div>
                <div class="stats-value">
                  {{ props.data.feedbackStats?.totalFeedbacks ?? 0 }}
                </div>
                <div>
                  <el-tag class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
    <el-col :xl="4" :lg="8" :md="12" :sm="24">
      <el-card shadow="never">
        <el-skeleton :loading="props.loading" animated>
          <template #template>
            <div class="stats-layout">
              <el-skeleton-item variant="circle" class="stats-icon" />
              <div class="stats-main">
                <el-skeleton-item variant="text" class="stats-title-skeleton" />
                <el-skeleton-item variant="text" class="stats-value-skeleton" />
                <el-skeleton-item variant="text" class="stats-detail-skeleton" />
              </div>
            </div>
          </template>
          <template #default>
            <div class="stats-layout">
              <div class="stats-icon stats-icon__loaded">
                <svg-icon icon-class="smile" color="currentColor" class="stats-icon-svg" />
              </div>
              <div class="stats-main">
                <div class="stats-title">{{ $t('page.dashboard.satisfaction', '满意度') }}</div>
                <div class="stats-value">{{ props.data.feedbackStats?.satisfactionRate ?? 0 }}<span>%</span></div>
                <div>
                  <el-tag class="stats-detail-tag is-hidden" effect="light" aria-hidden="true"><br /></el-tag>
                </div>
              </div>
            </div>
          </template>
        </el-skeleton>
      </el-card>
    </el-col>
  </el-row>
</template>

<style lang="scss" scoped>
.stats-layout {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stats-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 64px;
  height: 64px;
  border-radius: 50%;

  &__loaded {
    color: var(--el-color-primary);
    background-color: var(--el-color-primary-light-9);
  }
}

.stats-icon-svg {
  width: 40px;
  height: 40px;
}

.stats-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-title {
  font-size: 14px;
  line-height: 16px;
}

.stats-value {
  min-width: 72px;
  font-size: 40px;
  font-weight: 600;
  line-height: 40px;
}

.stats-detail-tag {
  border: 0;
  font-size: 14px;

  &.is-hidden {
    visibility: hidden;
  }
}

.stats-title-skeleton {
  width: 80px;
  height: 14px;
}

.stats-value-skeleton {
  width: 72px;
  height: 40px;
}

.stats-detail-skeleton {
  width: 150px;
  height: 24px;
}
</style>
