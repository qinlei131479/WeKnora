<script setup lang="ts">
import modal from '@/plugins/modal';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { StorageBackendsVO } from '@/types';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  type?: 'status' | 'default' | 'json';
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: StorageBackendsVO;
  }>(),
  {
    modelValue: false,
    row: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.data.storage.detail.id', 'ID'), value: props.row.id },
  { key: 'name', label: t('page.data.storage.detail.name', '名称'), value: props.row.name },
  { key: 'provider', label: t('page.data.storage.detail.provider', '提供商'), value: props.row.provider },
  { key: 'source', label: t('page.data.storage.detail.source', '来源'), value: props.row.source },
  { key: 'tenantId', label: t('page.data.storage.detail.tenantId', '工作空间（租户）ID'), value: props.row.tenantId },
  { key: 'tenantName', label: t('page.data.storage.detail.tenantName', '工作空间（租户）'), value: props.row.tenantName },
  { key: 'status', label: t('page.data.storage.detail.status', '状态'), value: props.row.status, type: 'status' },
  { key: 'isDefault', label: t('page.data.storage.detail.isDefault', '是否默认'), value: props.row.isDefault, type: 'default' },
  { key: 'createdAt', label: t('page.data.storage.detail.createdAt', '创建时间'), value: props.row.createdAt },
  { key: 'updatedAt', label: t('page.data.storage.detail.updatedAt', '更新时间'), value: props.row.updatedAt },
  { key: 'config', label: t('page.data.storage.detail.config', '配置'), value: props.row.config, type: 'json' }
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
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="$t('page.data.storage.detail.title', '存储引擎详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.data.storage.detail.title', '存储引擎详情') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <template v-if="item.type === 'status'">
          <el-tag v-if="item.value === 'active'" type="primary">
            {{ $t('page.data.storage.table.status_active', '活动') }}
          </el-tag>
          <el-tag v-else-if="item.value === 'disabled'" type="danger">
            {{ $t('page.data.storage.table.status_disabled', '禁用') }}
          </el-tag>
        </template>
        <template v-else-if="item.type === 'default'">
          <el-tag v-if="item.value === true" type="success">
            {{ $t('page.data.storage.table.isDefault_true', '默认') }}
          </el-tag>
        </template>
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
