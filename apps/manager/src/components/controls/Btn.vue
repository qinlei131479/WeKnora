<template>
  <el-button v-bind="props" class="btn" @click="handleClick">
    <slot />
  </el-button>
</template>

<script setup lang="ts">
import { buttonEmits, buttonProps } from 'element-plus';

defineOptions({
  name: 'Btn'
});

const props = defineProps(buttonProps);
const emit = defineEmits(buttonEmits);

type ButtonClickEvent = Parameters<typeof buttonEmits.click>[0];

const handleClick = (event: ButtonClickEvent) => {
  emit('click', event);
};
</script>

<style lang="scss" scoped>
.btn {
  height: 40px;
  border-radius: 999px !important;
  gap: 0;

  :deep(.el-icon) {
    margin-left: 10px;
  }

  & > :deep(span) {
    padding: 0 10px;
  }

  :deep(.el-icon + span) {
    margin-left: 0;
  }

  &.is-circle {
    width: 40px;
    padding: 0;

    :deep(.el-icon) {
      margin-left: 0;
    }

    & > :deep(span) {
      padding: 0;
    }
  }
}
</style>
