<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import { formatSize } from '@/utils';
import { parseTime } from '@/utils/ruoyi';
import { getStatusTheme, getStatusText } from '@/composables/useTenantSpace';
import { getTenantSpaceSingleApi } from '@/api/space/tenantSpace';
import type { TenantSpaceEntity } from '@/types';

interface DetailItem {
  key: keyof TenantSpaceEntity | 'storageRate';
  label: string;
  value: unknown;
  type?: 'status';
}

const visible = ref(false);
const form = ref<Partial<TenantSpaceEntity>>({});

const getRate = (quota?: number, used?: number): string => {
  if (quota == null || used == null) return '';
  return ((used / quota) * 100).toFixed(2) + '%';
};

const detailItems = computed<DetailItem[]>(() => [
  { key: 'id', label: t('page.tenantSpace.id', '空间id'), value: form.value.id },
  { key: 'name', label: t('page.tenantSpace.name', '空间名称'), value: form.value.name },
  { key: 'description', label: t('page.tenantSpace.description', '空间描述'), value: form.value.description },
  { key: 'status', label: t('page.tenantSpace.status', '空间状态'), value: form.value.status, type: 'status' },
  { key: 'createdAt', label: t('page.tenantSpace.createdAt', '空间创建时间'), value: parseTime(form.value.createdAt) },
  {
    key: 'storageQuota',
    label: t('page.tenantSpace.storageQuota', '存储配额'),
    value: form.value.storageQuota == null ? '' : formatSize(form.value.storageQuota)
  },
  {
    key: 'storageUsed',
    label: t('page.tenantSpace.storageUsed', '已使用储存'),
    value: form.value.storageUsed == null ? '' : formatSize(form.value.storageUsed)
  },
  {
    key: 'storageRate',
    label: t('page.tenantSpace.storageRate', '储存使用率'),
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
  return getTenantSpaceSingleApi(id).then((res) => {
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
    :title="$t('page.tenantSpace.title.detail', '空间详情')"
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
