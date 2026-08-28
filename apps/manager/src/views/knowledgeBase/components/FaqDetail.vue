<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="t('page.knowledgeFaq.titleDetail', '问答详情')"
    size="40%"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
  >
    <div class="model-body">
      <el-descriptions title="" :column="1" border :label-width="120">
        <el-descriptions-item label="id" label-align="center">
          <el-text>
            {{ entity?.id || '' }}
          </el-text>
        </el-descriptions-item>
        <el-descriptions-item label="标准问题" label-align="center">
          <el-text>
            {{ entity?.standardQuestion || '' }}
          </el-text>
        </el-descriptions-item>
        <el-descriptions-item label="相似问题" label-align="center">
          <template v-if="(entity?.similarQuestions || []).length > 0">
            <div v-for="(item, index) in entity?.similarQuestions || []" :key="index">
              <div class="sep"></div>
              <el-text>{{ item }}</el-text>
            </div>
          </template>
          <!-- <template v-else>
            <el-text>-</el-text>
          </template> -->
        </el-descriptions-item>
        <el-descriptions-item label="反例问题" label-align="center">
          <template v-if="(entity?.negativeQuestions || []).length > 0">
            <div v-for="(item, index) in entity?.negativeQuestions || []" :key="index">
              <div class="sep"></div>
              <el-text>{{ item }}</el-text>
            </div>
          </template>
          <!-- <template v-else>
            <el-text>-</el-text>
          </template> -->
        </el-descriptions-item>
        <!-- 答案 -->
        <el-descriptions-item label="答案" label-align="center">
          <template v-if="(entity?.answers || []).length > 0">
            <div v-for="(item, index) in entity?.answers || []" :key="index">
              <div class="sep"></div>
              <el-text>{{ item }}</el-text>
            </div>
          </template>
          <!-- <template v-else>
            <el-text>-</el-text>
          </template> -->
        </el-descriptions-item>
        <el-descriptions-item label="标签" label-align="center">
          <el-text>
            {{ entity?.tagName || '' }}
          </el-text>
        </el-descriptions-item>
      </el-descriptions>
    </div>
  </KjscRtlDrawer>
</template>
<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { KnowledgeFaqEntity } from '@/types';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  entity?: KnowledgeFaqEntity;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();
</script>
<style scoped lang="scss">
.sep {
  height: 1px;
  background: var(--el-border-color-lighter);
  margin: 5px -11px;
}
.sep:first-child {
  display: none;
}
</style>
