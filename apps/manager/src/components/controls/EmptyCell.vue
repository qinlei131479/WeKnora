<template>
  <el-empty v-bind="props" class="empty-cell">
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </el-empty>
</template>

<script setup lang="ts">
import { emptyProps } from 'element-plus';

defineOptions({
  name: 'EmtityCell'
});

const props = defineProps(emptyProps);
</script>

<style lang="scss" scoped>
.empty-cell {
  box-sizing: border-box;
  width: 100%;
  padding: 95px 0;
  border-radius: 24px;
  background-color: var(--el-color-white);

  :deep(.el-empty__image) {
    width: 64px;
    height: 64px;
  }

  :deep(.el-empty__description) {
    margin-top: 16px;
    color: var(--el-text-color-disabled);
    font-size: 16px;
    font-weight: 400;
  }
}
</style>
