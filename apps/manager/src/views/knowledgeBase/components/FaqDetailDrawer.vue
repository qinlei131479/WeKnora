<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="t('page.knowledgeFaq.titleDetail', '问答详情')"
    size="800px"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
  >
    <el-descriptions :column="1" border>
      <el-descriptions-item label="id" label-width="180px">
        <span class="detail-value">{{ entity?.id || '' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="标准问题" label-width="180px">
        <span class="detail-value">{{ entity?.standardQuestion || '' }}</span>
      </el-descriptions-item>
      <el-descriptions-item label="相似问题" label-width="180px">
        <div v-for="(item, index) in entity?.similarQuestions || []" :key="index" class="detail-value">{{ item }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="反例问题" label-width="180px">
        <div v-for="(item, index) in entity?.negativeQuestions || []" :key="index" class="detail-value">{{ item }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="答案" label-width="180px">
        <div v-for="(item, index) in entity?.answers || []" :key="index" class="detail-value">{{ item }}</div>
      </el-descriptions-item>
      <el-descriptions-item label="标签" label-width="180px">
        <span class="detail-value">{{ entity?.tagName || '' }}</span>
      </el-descriptions-item>
    </el-descriptions>
  </KjscRtlDrawer>
</template>
<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { KnowledgeFaqEntity } from '@/types';
import { t } from '@/i18n';

// Props
defineProps<{
  visible: boolean;
  entity?: KnowledgeFaqEntity;
}>();

// Emits
defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();
</script>
<style scoped lang="scss">
:deep(.el-descriptions__label),
:deep(.el-descriptions__content) {
  vertical-align: top;
}

.detail-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-value + .detail-value {
  margin-top: 10px;
}
</style>
