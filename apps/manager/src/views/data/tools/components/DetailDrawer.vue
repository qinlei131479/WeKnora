<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import modal from '@/plugins/modal';
import { t, te } from '@/i18n';
import type { AmpBuiltinToolsVO } from '@/types';

interface DetailItem {
  key: keyof AmpBuiltinToolsVO;
  label: string;
  value: string | number | boolean | undefined;
  type?: 'enabled' | 'json';
}

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    row?: AmpBuiltinToolsVO;
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

const jsonRef = ref<HTMLElement | null>(null);

const formatOption = (type: 'category' | 'source', value?: string): string => {
  if (!value) return '';
  const key = `page.data.tools.${type}.${value}`;
  return te(key) ? t(key) : value;
};

const inputSchema = computed(() => {
  const value = props.row.inputSchema;
  if (!value?.trim()) return '';
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed === null ? '' : (JSON.stringify(parsed, null, 2) ?? '');
  } catch {
    return value;
  }
});

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.data.tools.field.id', 'ID'), value: props.row.id },
  { key: 'toolSlug', label: t('page.data.tools.field.toolSlug', '工具标识'), value: props.row.toolSlug },
  { key: 'capabilityKey', label: t('page.data.tools.field.capabilityKey', '能力标识'), value: props.row.capabilityKey },
  { key: 'name', label: t('page.data.tools.field.name', '名称'), value: props.row.name },
  { key: 'description', label: t('page.data.tools.field.description', '描述'), value: props.row.description },
  { key: 'category', label: t('page.data.tools.field.category', '分类'), value: formatOption('category', props.row.category) },
  { key: 'source', label: t('page.data.tools.field.source', '来源'), value: formatOption('source', props.row.source) },
  { key: 'enabled', label: t('page.data.tools.field.enabled', '状态'), value: props.row.enabled, type: 'enabled' },
  { key: 'version', label: t('page.data.tools.field.version', '版本'), value: props.row.version },
  { key: 'createdAt', label: t('page.data.tools.field.createdAt', '创建时间'), value: props.row.createdAt },
  { key: 'updatedAt', label: t('page.data.tools.field.updatedAt', '更新时间'), value: props.row.updatedAt },
  { key: 'inputSchema', label: t('page.data.tools.field.inputSchema', '输入参数结构'), value: inputSchema.value, type: 'json' }
]);

const copyWithTextarea = (text: string) => {
  const focusedElement = document.activeElement;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  (jsonRef.value || document.body).appendChild(textarea);
  try {
    textarea.focus();
    textarea.select();
    if (typeof textarea.setSelectionRange === 'function') textarea.setSelectionRange(0, text.length);
    if (document.execCommand('copy')) {
      modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    textarea.parentNode?.removeChild(textarea);
    if (focusedElement instanceof HTMLElement) focusedElement.focus();
  }
};

const copySchema = () => {
  const text = inputSchema.value;
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard
      .writeText(text)
      .then(() => modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
  }
  copyWithTextarea(text);
};
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="$t('page.data.tools.detail.title', '工具详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.data.tools.detail.title', '工具详情') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <template v-if="item.type === 'enabled'">
          <el-tag v-if="item.value === true" type="success">{{ $t('page.data.tools.status.enabled', '启用') }}</el-tag>
          <el-tag v-else-if="item.value === false" type="info">{{ $t('page.data.tools.status.disabled', '停用') }}</el-tag>
        </template>
        <template v-else-if="item.type === 'json'">
          <div v-if="inputSchema" :ref="(element: unknown) => (jsonRef = element as HTMLElement | null)" class="json-content">
            <el-button size="small" class="json-content__copy" @click="copySchema">
              {{ $t('page.normal.copy', '复制') }}
            </el-button>
            <pre class="json-content__pre">{{ inputSchema }}</pre>
          </div>
        </template>
        <span v-else class="detail-value">{{ item.value ?? '' }}</span>
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
