<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { AmpParserEnginesVO } from '@/types';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  type?: 'enabled' | 'fileTypes' | 'json';
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: AmpParserEnginesVO;
  }>(),
  {
    modelValue: false,
    row: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const { proxy } = getCurrentInstance() as any;

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const formatCheckType = (value?: string): string => {
  const labels: Record<string, string> = {
    none: t('page.data.ampParserEngines.checkType.none', '无需检测'),
    docreader: t('page.data.ampParserEngines.checkType.docreader', '依赖 DocReader 连接'),
    config: t('page.data.ampParserEngines.checkType.config', '检查配置项'),
    http_ping: t('page.data.ampParserEngines.checkType.httpPing', 'HTTP 探测')
  };

  return value ? labels[value] || value : '';
};

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.data.ampParserEngines.detail.id', 'ID'), value: props.row.id },
  { key: 'name', label: t('page.data.ampParserEngines.detail.name', '名称'), value: props.row.name },
  { key: 'description', label: t('page.data.ampParserEngines.detail.description', '描述'), value: props.row.description },
  {
    key: 'fileTypes',
    label: t('page.data.ampParserEngines.detail.fileTypes', '支持的文件类型'),
    value: props.row.fileTypes,
    type: 'fileTypes'
  },
  {
    key: 'engineConfig',
    label: t('page.data.ampParserEngines.detail.engineConfig', '引擎配置'),
    value: props.row.engineConfig,
    type: 'json'
  },
  {
    key: 'checkType',
    label: t('page.data.ampParserEngines.detail.checkType', '可用性检测方式'),
    value: formatCheckType(props.row.checkType)
  },
  { key: 'configKey', label: t('page.data.ampParserEngines.detail.configKey', '租户配置项名称'), value: props.row.configKey },
  { key: 'sortOrder', label: t('page.data.ampParserEngines.detail.sortOrder', '排序序号'), value: props.row.sortOrder },
  {
    key: 'enabled',
    label: t('page.data.ampParserEngines.detail.enabled', '状态'),
    value: props.row.enabled,
    type: 'enabled'
  },
  { key: 'createdAt', label: t('page.data.ampParserEngines.detail.createdAt', '创建时间'), value: props.row.createdAt },
  { key: 'updatedAt', label: t('page.data.ampParserEngines.detail.updatedAt', '更新时间'), value: props.row.updatedAt }
]);

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatValue = (value: unknown): string => {
  return hasValue(value) ? String(value) : '';
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

const formatFileTypes = (value: unknown): string[] => {
  if (!hasValue(value)) return [];

  if (Array.isArray(value)) return value.map(String);

  if (typeof value === 'string') {
    try {
      const parsedValue = JSON.parse(value);
      return Array.isArray(parsedValue) ? parsedValue.map(String) : [value];
    } catch {
      return [value];
    }
  }

  return [String(value)];
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
    :title="$t('page.data.ampParserEngines.detail.title', '解析引擎详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.data.ampParserEngines.detail.title', '解析引擎详情') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <template v-if="item.type === 'enabled'">
          <el-tag v-if="item.value === true" type="success">
            {{ $t('page.data.ampParserEngines.status.enabled', '启用') }}
          </el-tag>
          <el-tag v-else-if="item.value === false" type="danger">
            {{ $t('page.data.ampParserEngines.status.disabled', '禁用') }}
          </el-tag>
        </template>
        <el-space v-else-if="item.type === 'fileTypes' && hasValue(item.value)" wrap>
          <el-tag v-for="fileType in formatFileTypes(item.value)" :key="fileType" type="info">
            {{ fileType }}
          </el-tag>
        </el-space>
        <div v-else-if="item.type === 'json' && hasValue(item.value)" class="json-content">
          <el-button size="small" class="json-content__copy" @click="copyText(item.value)">
            {{ $t('page.normal.copy', '复制') }}
          </el-button>
          <pre class="json-content__pre">{{ formatJson(item.value) }}</pre>
        </div>
        <span v-else-if="item.type !== 'fileTypes' && item.type !== 'json'" class="detail-value">{{ formatValue(item.value) }}</span>
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
