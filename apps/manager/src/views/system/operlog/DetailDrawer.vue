<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import modal from '@/plugins/modal';
import { t } from '@/i18n';
import { useDict } from '@/utils/dict';
import { selectDictLabel } from '@/utils/ruoyi';
import type { SysOperLog } from '@/types/api/system/operlog';

interface DetailItem {
  key: keyof SysOperLog;
  label: string;
  value: unknown;
  type?: 'status' | 'address' | 'request' | 'duration' | 'json';
}

const props = defineProps<{
  visible: boolean;
  row: SysOperLog;
}>();

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
}>();

const visible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value)
});

const { sys_oper_type } = useDict('sys_oper_type');
const form = computed<SysOperLog>(() => props.row || {});

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const detailItems = computed<DetailItem[]>(() => {
  const items: DetailItem[] = [
    { key: 'title', label: t('page.system.operlog.detailDrawer.module', '操作模块'), value: form.value.title },
    {
      key: 'businessType',
      label: t('page.system.operlog.detailDrawer.businessType', '业务类型'),
      value: selectDictLabel(sys_oper_type.value, form.value.businessType)
    },
    { key: 'operTime', label: t('page.system.operlog.detailDrawer.operTime', '操作时间'), value: form.value.operTime },
    { key: 'status', label: t('page.system.operlog.detailDrawer.status', '执行状态'), value: form.value.status, type: 'status' },
    { key: 'operName', label: t('page.system.operlog.detailDrawer.operName', '操作人员'), value: form.value.operName },
    { key: 'deptName', label: t('page.system.operlog.detailDrawer.deptName', '所属部门'), value: form.value.deptName },
    { key: 'operIp', label: t('page.system.operlog.detailDrawer.operIp', '操作地址'), value: form.value.operIp, type: 'address' },
    { key: 'operUrl', label: t('page.system.operlog.detailDrawer.operUrl', '请求地址'), value: form.value.operUrl, type: 'request' },
    { key: 'method', label: t('page.system.operlog.detailDrawer.method', '操作方法'), value: form.value.method },
    { key: 'costTime', label: t('page.system.operlog.detailDrawer.costTime', '消耗时间'), value: form.value.costTime, type: 'duration' },
    { key: 'operParam', label: t('page.system.operlog.detailDrawer.operParam', '请求参数'), value: form.value.operParam, type: 'json' },
    { key: 'jsonResult', label: t('page.system.operlog.detailDrawer.jsonResult', '返回参数'), value: form.value.jsonResult, type: 'json' },
    { key: 'errorMsg', label: t('page.system.operlog.detailDrawer.errorMsg', '异常信息'), value: form.value.errorMsg }
  ];

  return items.filter((item) => {
    if (item.key === 'deptName') return hasValue(item.value);
    if (item.key === 'errorMsg') return hasValue(form.value.status) && String(form.value.status) !== '0';
    return true;
  });
});

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
  if (!hasValue(value)) return;
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
    :title="$t('page.system.operlog.detailDrawer.title', '操作日志详细')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <template #header>
      <el-text>{{ $t('page.system.operlog.detailDrawer.title', '操作日志详细') }}</el-text>
    </template>

    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <template v-if="item.type === 'status'">
          <el-tag v-if="hasValue(item.value) && String(item.value) === '0'" type="success">
            {{ $t('page.system.operlog.detailDrawer.statusNormal', '正常') }}
          </el-tag>
          <el-tag v-else-if="hasValue(item.value)" type="danger">
            {{ $t('page.system.operlog.detailDrawer.statusAbnormal', '异常') }}
          </el-tag>
        </template>
        <span v-else-if="item.type === 'address'" class="detail-value">{{ [item.value, form.operLocation].filter(hasValue).join(' ') }}</span>
        <span v-else-if="item.type === 'request'" class="detail-value">
          <span v-if="form.requestMethod" :class="'method-tag method-tag--' + form.requestMethod.toLowerCase()">{{ form.requestMethod }}</span>
          {{ formatValue(item.value) }}
        </span>
        <span v-else-if="item.type === 'duration' && hasValue(item.value)" class="detail-value">
          {{ formatValue(item.value) }} {{ $t('page.system.operlog.millisecond', '毫秒') }}
        </span>
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
