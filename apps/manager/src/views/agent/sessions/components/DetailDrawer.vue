<script setup lang="ts">
import modal from '@/plugins/modal';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { SessionsVO } from '@/types';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  json?: boolean;
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    session?: SessionsVO;
  }>(),
  {
    modelValue: false,
    session: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const drawerTitle = computed(() => {
  const title = props.session.title || t('page.agent.sessions.table.newSession', '新对话');
  return `${title} ${t('page.normal.detail', '详情')}`;
});

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.agent.sessions.detail.id', '对话 ID'), value: props.session.id },
  { key: 'title', label: t('page.agent.sessions.detail.title', '对话标题'), value: props.session.title },
  { key: 'description', label: t('page.agent.sessions.detail.description', '对话描述'), value: props.session.description },
  { key: 'tenantId', label: t('page.agent.sessions.detail.tenantId', '工作空间（租户）ID'), value: props.session.tenantId },
  { key: 'tenantName', label: t('page.agent.sessions.detail.tenantName', '工作空间（租户）'), value: props.session.tenantName },
  { key: 'userId', label: t('page.agent.sessions.detail.userId', '用户 ID'), value: props.session.userId },
  { key: 'username', label: t('page.agent.sessions.detail.username', '用户名'), value: props.session.username },
  { key: 'knowledgeBaseId', label: t('page.agent.sessions.detail.knowledgeBaseId', '知识库 ID'), value: props.session.knowledgeBaseId },
  { key: 'agentId', label: t('page.agent.sessions.detail.agentId', '智能体 ID'), value: props.session.agentId },
  { key: 'maxRounds', label: t('page.agent.sessions.detail.maxRounds', '最大对话轮数'), value: props.session.maxRounds },
  { key: 'enableRewrite', label: t('page.agent.sessions.detail.enableRewrite', '是否启用查询改写'), value: props.session.enableRewrite },
  { key: 'fallbackStrategy', label: t('page.agent.sessions.detail.fallbackStrategy', '兜底策略'), value: props.session.fallbackStrategy },
  { key: 'fallbackResponse', label: t('page.agent.sessions.detail.fallbackResponse', '兜底回复'), value: props.session.fallbackResponse },
  { key: 'keywordThreshold', label: t('page.agent.sessions.detail.keywordThreshold', '关键词检索阈值'), value: props.session.keywordThreshold },
  { key: 'vectorThreshold', label: t('page.agent.sessions.detail.vectorThreshold', '向量检索阈值'), value: props.session.vectorThreshold },
  { key: 'rerankModelId', label: t('page.agent.sessions.detail.rerankModelId', '重排模型 ID'), value: props.session.rerankModelId },
  { key: 'embeddingTopK', label: t('page.agent.sessions.detail.embeddingTopK', '向量检索返回条数 TopK'), value: props.session.embeddingTopK },
  { key: 'rerankTopK', label: t('page.agent.sessions.detail.rerankTopK', '重排后保留条数 TopK'), value: props.session.rerankTopK },
  { key: 'rerankThreshold', label: t('page.agent.sessions.detail.rerankThreshold', '重排分数阈值'), value: props.session.rerankThreshold },
  { key: 'summaryModelId', label: t('page.agent.sessions.detail.summaryModelId', '摘要模型 ID'), value: props.session.summaryModelId },
  {
    key: 'summaryParameters',
    label: t('page.agent.sessions.detail.summaryParameters', '摘要参数'),
    value: props.session.summaryParameters,
    json: true
  },
  {
    key: 'agentConfig',
    label: t('page.agent.sessions.detail.agentConfig', '智能体配置'),
    value: props.session.agentConfig,
    json: true
  },
  {
    key: 'contextConfig',
    label: t('page.agent.sessions.detail.contextConfig', '上下文配置'),
    value: props.session.contextConfig,
    json: true
  },
  { key: 'isPinned', label: t('page.agent.sessions.detail.isPinned', '是否置顶'), value: props.session.isPinned },
  { key: 'pinnedAt', label: t('page.agent.sessions.detail.pinnedAt', '置顶时间'), value: props.session.pinnedAt },
  { key: 'createdAt', label: t('page.agent.sessions.detail.createdAt', '创建时间'), value: props.session.createdAt },
  { key: 'updatedAt', label: t('page.agent.sessions.detail.updatedAt', '更新时间'), value: props.session.updatedAt },
  { key: 'deletedAt', label: t('page.agent.sessions.detail.deletedAt', '删除时间'), value: props.session.deletedAt }
]);

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatValue = (value: unknown): string => {
  if (!hasValue(value)) return '';
  if (typeof value === 'boolean') {
    return value ? t('page.agent.sessions.detail.yes', '是') : t('page.agent.sessions.detail.no', '否');
  }
  return String(value);
};

const formatJson = (value: unknown): string => {
  if (!hasValue(value)) return '';

  try {
    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsedValue, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const copyWithTextarea = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  if (typeof textarea.setSelectionRange === 'function') {
    textarea.setSelectionRange(0, textarea.value.length);
  }

  try {
    if (document.execCommand('copy')) {
      modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyText = (value: unknown) => {
  const text = formatJson(value);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
    return;
  }

  copyWithTextarea(text);
};
</script>

<template>
  <KjscRtlDrawer v-model="visible" :size="800" :title="drawerTitle" :show-cancel="false" :show-confirm="false">
    <template #header>
      <el-text v-if="props.session.title">{{ props.session.title }} {{ $t('page.normal.detail', '详情') }}</el-text>
      <span v-else>
        <el-text type="info" style="font-style: italic">{{ $t('page.agent.sessions.table.newSession', '新对话') }}</el-text>
        <el-text>&nbsp;{{ $t('page.normal.detail', '详情') }}</el-text>
      </span>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <div v-if="item.json && hasValue(item.value)" class="json-content">
          <el-button size="small" class="json-content__copy" @click="copyText(item.value)">
            {{ $t('page.normal.copy', '复制') }}
          </el-button>
          <pre class="json-content__pre">{{ formatJson(item.value) }}</pre>
        </div>
        <span v-else-if="!item.json" class="detail-value">{{ formatValue(item.value) }}</span>
      </el-descriptions-item>
    </el-descriptions>
  </KjscRtlDrawer>
</template>

<style lang="scss" scoped>
:deep(.el-descriptions__label),
:deep(.el-descriptions__content) {
  vertical-align: top;
}

.detail-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.json-content {
  position: relative;
  height: max-content;
  background-color: var(--el-bg-color-page);
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  border-radius: var(--el-border-radius-base);

  &__copy {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 1;
  }

  &__pre {
    margin: 0;
    padding: 0.75em 5em 0.75em 0.75em;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
