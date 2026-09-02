<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { EmbedChannelsVO } from '@/types';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  type?: 'boolean' | 'json';
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: EmbedChannelsVO;
  }>(),
  {
    modelValue: false,
    row: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const { proxy } = getCurrentInstance()!;

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.integration.embedChannels.detail.id', 'ID'), value: props.row.id },
  { key: 'name', label: t('page.integration.embedChannels.detail.name', '名称'), value: props.row.name },
  {
    key: 'tenantId',
    label: t('page.integration.embedChannels.detail.tenantId', '工作空间（租户）ID'),
    value: props.row.tenantId
  },
  {
    key: 'tenantName',
    label: t('page.integration.embedChannels.detail.tenantName', '工作空间（租户）'),
    value: props.row.tenant?.name
  },
  { key: 'agentId', label: t('page.integration.embedChannels.detail.agentId', '智能体 ID'), value: props.row.agentId },
  { key: 'agentName', label: t('page.integration.embedChannels.detail.agentName', '智能体'), value: props.row.agent?.name },
  {
    key: 'enabled',
    label: t('page.integration.embedChannels.detail.enabled', '是否启用'),
    value: props.row.enabled,
    type: 'boolean'
  },
  { key: 'publishToken', label: t('page.integration.embedChannels.detail.publishToken', '发布令牌'), value: props.row.publishToken },
  {
    key: 'allowedOrigins',
    label: t('page.integration.embedChannels.detail.allowedOrigins', '允许的来源'),
    value: props.row.allowedOrigins,
    type: 'json'
  },
  {
    key: 'welcomeMessage',
    label: t('page.integration.embedChannels.detail.welcomeMessage', '欢迎语'),
    value: props.row.welcomeMessage
  },
  {
    key: 'rateLimitPerMinute',
    label: t('page.integration.embedChannels.detail.rateLimitPerMinute', '每分钟速率限制'),
    value: props.row.rateLimitPerMinute
  },
  {
    key: 'rateLimitPerDay',
    label: t('page.integration.embedChannels.detail.rateLimitPerDay', '每日速率限制'),
    value: props.row.rateLimitPerDay
  },
  { key: 'primaryColor', label: t('page.integration.embedChannels.detail.primaryColor', '主题主色'), value: props.row.primaryColor },
  { key: 'pageTitle', label: t('page.integration.embedChannels.detail.pageTitle', '页面标题'), value: props.row.pageTitle },
  {
    key: 'headerTitleMode',
    label: t('page.integration.embedChannels.detail.headerTitleMode', '页头标题展示模式'),
    value: props.row.headerTitleMode
  },
  {
    key: 'showSuggestedQuestions',
    label: t('page.integration.embedChannels.detail.showSuggestedQuestions', '是否展示建议问题'),
    value: props.row.showSuggestedQuestions,
    type: 'boolean'
  },
  {
    key: 'widgetPosition',
    label: t('page.integration.embedChannels.detail.widgetPosition', '挂件位置'),
    value: props.row.widgetPosition
  },
  {
    key: 'allowWebSearch',
    label: t('page.integration.embedChannels.detail.allowWebSearch', '是否允许联网搜索'),
    value: props.row.allowWebSearch,
    type: 'boolean'
  },
  {
    key: 'allowMemory',
    label: t('page.integration.embedChannels.detail.allowMemory', '是否允许使用智能体记忆'),
    value: props.row.allowMemory,
    type: 'boolean'
  },
  {
    key: 'allowFileUpload',
    label: t('page.integration.embedChannels.detail.allowFileUpload', '是否允许上传文件'),
    value: props.row.allowFileUpload,
    type: 'boolean'
  },
  {
    key: 'defaultLocale',
    label: t('page.integration.embedChannels.detail.defaultLocale', '默认语言区域'),
    value: props.row.defaultLocale
  },
  { key: 'webhookUrl', label: t('page.integration.embedChannels.detail.webhookUrl', 'Webhook 地址'), value: props.row.webhookUrl },
  {
    key: 'webhookSecret',
    label: t('page.integration.embedChannels.detail.webhookSecret', 'Webhook 签名密钥'),
    value: props.row.webhookSecret
  },
  { key: 'createdAt', label: t('page.integration.embedChannels.detail.createdAt', '创建时间'), value: props.row.createdAt },
  { key: 'updatedAt', label: t('page.integration.embedChannels.detail.updatedAt', '更新时间'), value: props.row.updatedAt }
]);

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatValue = (value: unknown): string => {
  return hasValue(value) ? String(value) : '';
};

const formatBoolean = (value: unknown): string => {
  if (typeof value !== 'boolean') return formatValue(value);
  return value ? t('page.integration.embedChannels.detail.yes', '是') : t('page.integration.embedChannels.detail.no', '否');
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
      proxy.$modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      proxy.$modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    proxy.$modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyText = (value: unknown) => {
  const text = formatJson(value);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => proxy.$modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
    return;
  }

  copyWithTextarea(text);
};
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="$t('page.integration.embedChannels.detail.title', '网页嵌入详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.integration.embedChannels.detail.title', '网页嵌入详情') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <div v-if="item.type === 'json' && hasValue(item.value)" class="json-content">
          <el-button size="small" class="json-content__copy" @click="copyText(item.value)">
            {{ $t('page.normal.copy', '复制') }}
          </el-button>
          <pre class="json-content__pre">{{ formatJson(item.value) }}</pre>
        </div>
        <span v-else-if="item.type === 'boolean'" class="detail-value">{{ formatBoolean(item.value) }}</span>
        <span v-else-if="item.type !== 'json'" class="detail-value">{{ formatValue(item.value) }}</span>
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
