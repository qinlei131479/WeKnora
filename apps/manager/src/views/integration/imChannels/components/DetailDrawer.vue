<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { ImChannelsVO } from '@/types';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  type?: 'boolean' | 'json' | 'platform';
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: ImChannelsVO;
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

const formatPlatform = (value?: string): string => {
  const labels: Record<string, string> = {
    wecom: t('page.integration.imChannels.platform.wecom', '企业微信'),
    dingtalk: t('page.integration.imChannels.platform.dingtalk', '钉钉'),
    feishu: t('page.integration.imChannels.platform.feishu', '飞书')
  };

  return value ? labels[value] || value : '';
};

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.integration.imChannels.detail.id', 'ID'), value: props.row.id },
  { key: 'name', label: t('page.integration.imChannels.detail.name', '名称'), value: props.row.name },
  {
    key: 'platform',
    label: t('page.integration.imChannels.detail.platform', '平台'),
    value: props.row.platform,
    type: 'platform'
  },
  { key: 'tenantId', label: t('page.integration.imChannels.detail.tenantId', '工作空间（租户）ID'), value: props.row.tenantId },
  {
    key: 'tenantName',
    label: t('page.integration.imChannels.detail.tenantName', '工作空间（租户）'),
    value: props.row.tenant?.name
  },
  { key: 'agentId', label: t('page.integration.imChannels.detail.agentId', '智能体 ID'), value: props.row.agentId },
  { key: 'agentName', label: t('page.integration.imChannels.detail.agentName', '智能体'), value: props.row.agent?.name },
  {
    key: 'enabled',
    label: t('page.integration.imChannels.detail.enabled', '是否启用'),
    value: props.row.enabled,
    type: 'boolean'
  },
  { key: 'mode', label: t('page.integration.imChannels.detail.mode', '工作模式'), value: props.row.mode },
  { key: 'outputMode', label: t('page.integration.imChannels.detail.outputMode', '输出模式'), value: props.row.outputMode },
  {
    key: 'credentials',
    label: t('page.integration.imChannels.detail.credentials', '凭证配置'),
    value: props.row.credentials,
    type: 'json'
  },
  {
    key: 'knowledgeBaseId',
    label: t('page.integration.imChannels.detail.knowledgeBaseId', '知识库 ID'),
    value: props.row.knowledgeBaseId
  },
  {
    key: 'knowledgeBaseName',
    label: t('page.integration.imChannels.detail.knowledgeBaseName', '知识库'),
    value: props.row.knowledgeBase?.name
  },
  { key: 'botIdentity', label: t('page.integration.imChannels.detail.botIdentity', '机器人身份标识'), value: props.row.botIdentity },
  { key: 'sessionMode', label: t('page.integration.imChannels.detail.sessionMode', '会话模式'), value: props.row.sessionMode },
  { key: 'createdAt', label: t('page.integration.imChannels.detail.createdAt', '创建时间'), value: props.row.createdAt },
  { key: 'updatedAt', label: t('page.integration.imChannels.detail.updatedAt', '更新时间'), value: props.row.updatedAt }
]);

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatValue = (value: unknown): string => {
  return hasValue(value) ? String(value) : '';
};

const formatBoolean = (value: unknown): string => {
  if (value === true) return t('page.integration.imChannels.detail.yes', '是');
  if (value === false) return t('page.integration.imChannels.detail.no', '否');
  return '';
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
    :title="$t('page.integration.imChannels.detail.title', 'IM 集成详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.integration.imChannels.detail.title', 'IM 集成详情') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <span v-if="item.type === 'boolean'" class="detail-value">{{ formatBoolean(item.value) }}</span>
        <span v-else-if="item.type === 'platform'" class="detail-value">{{ formatPlatform(formatValue(item.value)) }}</span>
        <div v-else-if="item.type === 'json' && hasValue(item.value)" class="json-content">
          <el-button size="small" class="json-content__copy" @click="copyText(item.value)">
            {{ $t('page.normal.copy', '复制') }}
          </el-button>
          <pre class="json-content__pre">{{ formatJson(item.value) }}</pre>
        </div>
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
