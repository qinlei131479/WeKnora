<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import { formatSize } from '@/utils';
import { parseTime } from '@/utils/ruoyi';
import { API } from '@/api';
import type { TenantsVO } from '@/types';

interface DetailItem {
  key: keyof TenantsVO | 'storageRate';
  label: string;
  value: unknown;
  type?: 'status';
}

const visible = ref(false);
const form = ref<Partial<TenantsVO>>({});

function getStatusTheme(status: string | undefined): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'inactive':
      return 'warning';
    case 'suspended':
      return 'danger';
    default:
      return 'default';
  }
}

function getStatusText(status: string | undefined): string {
  switch (status) {
    case 'active':
      return t('page.tenants.statusActive', '活跃');
    case 'inactive':
      return t('page.tenants.statusInactive', '未激活');
    case 'suspended':
      return t('page.tenants.statusSuspended', '已暂停');
    default:
      return t('page.tenants.statusUnknown', '未知');
  }
}

const getRate = (quota?: number, used?: number): string => {
  if (quota == null || used == null) return '';
  return ((used / quota) * 100).toFixed(2) + '%';
};

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.tenants.id', '空间id'), value: form.value.id },
  { key: 'name', label: t('page.tenants.name', '空间名称'), value: form.value.name },
  { key: 'description', label: t('page.tenants.description', '空间描述'), value: form.value.description },
  { key: 'status', label: t('page.tenants.status', '空间状态'), value: form.value.status, type: 'status' },
  { key: 'createdAt', label: t('page.tenants.createdAt', '空间创建时间'), value: parseTime(form.value.createdAt) },
  {
    key: 'storageQuota',
    label: t('page.tenants.storageQuota', '存储配额'),
    value: form.value.storageQuota == null ? '' : formatSize(form.value.storageQuota)
  },
  {
    key: 'storageUsed',
    label: t('page.tenants.storageUsed', '已使用储存'),
    value: form.value.storageUsed == null ? '' : formatSize(form.value.storageUsed)
  },
  {
    key: 'storageRate',
    label: t('page.tenants.storageRate', '储存使用率'),
    value: getRate(form.value.storageQuota, form.value.storageUsed)
  }
]);

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatValue = (value: unknown): string => {
  return hasValue(value) ? String(value) : '';
};

const showDetail = (id: number) => {
  return API.Tenants.single(id).then((res) => {
    form.value = res.data || {};
    visible.value = true;
  });
};

defineExpose({
  open: showDetail
});
</script>

<template>
  <KjscRtlDrawer
    v-model="visible"
    :size="800"
    :title="$t('page.tenants.title.detail', '空间详情')"
    :show-cancel="false"
    :show-confirm="false"
    append-to-body
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item v-for="item in detailItems" :key="item.key" :label="item.label" label-width="180px">
        <template v-if="item.type === 'status'">
          <el-tag v-if="hasValue(item.value)" :type="getStatusTheme(formatValue(item.value))">
            {{ getStatusText(formatValue(item.value)) }}
          </el-tag>
        </template>
        <span v-else class="detail-value">{{ formatValue(item.value) }}</span>
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
</style>
