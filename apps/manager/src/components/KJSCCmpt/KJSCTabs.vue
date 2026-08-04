<template>
  <el-tabs  :class="{ 'hidden-content': props.hiddenContent }">
    <template #default>
      <slot> </slot>
    </template>
  </el-tabs>
</template>
<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  type: {
    type: String,
    default: 'border-card'
  },
  height: {
    type: Number,
    default: 40
  },
  hiddenContent: {
    type: Boolean,
    default: false
  }
});
const height = computed(() => {
  return props.height + 1 + 'px';
});
const lineHeight = computed(() => {
  return props.height - 2 + 'px';
});
</script>
<style lang="less" scoped>
.el-tabs--border-card {
  border-bottom: none;
  :deep(.el-tabs__header) {
    .el-tabs__item {
      border-top: 3px solid transparent;
      height: v-bind('height');
      line-height: v-bind('lineHeight');
      text-align: center;
    }

    .el-tabs__item.is-active {
      border-top: 3px solid;
    }
  }
}

.hidden-content {
  border-bottom: 0px;

  :deep(.el-tabs__content) {
    padding: 0px;
  }
}
</style>
