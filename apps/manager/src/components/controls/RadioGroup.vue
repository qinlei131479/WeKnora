<template>
  <el-radio-group v-bind="props" class="radio-group" @update:model-value="handleUpdate" @change="handleChange">
    <slot />
  </el-radio-group>
</template>

<script setup lang="ts">
import { radioGroupEmits, radioGroupProps } from 'element-plus';

defineOptions({
  name: 'RadioGroup'
});

const props = defineProps(radioGroupProps);
const emit = defineEmits(radioGroupEmits);

type RadioGroupValue = typeof props.modelValue;

const handleUpdate = (value: RadioGroupValue) => {
  emit('update:modelValue', value);
};

const handleChange = (value: RadioGroupValue) => {
  emit('change', value);
};
</script>
<style lang="scss" scoped>
$radius-size: 999px;

:global(.el-form-item:has(.radio-group) > .el-form-item__label) {
  // display: inline-flex;
  // height: 36px;
  align-items: center;
  // line-height: 20px;
  margin-top: 2px;
}

.radio-group {
  width: max-content;
  max-width: none;
  flex: 0 0 auto;
  flex-wrap: nowrap;
  border: 1px solid #e1e6ec;
  border-radius: $radius-size;
  background-color: #fff;

  :deep(.el-radio-button) {
    --el-radio-button-checked-bg-color: transparent;
    --el-radio-button-checked-text-color: var(--el-color-white);
    --el-radio-button-checked-border-color: transparent;
    --el-radio-button-disabled-checked-fill: var(--el-border-color-extra-light);

    height: 36px;
    line-height: 20px;
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    background-color: transparent;
    color: #77838f;
    font-weight: 400;
    white-space: nowrap;
  }

  :deep(.el-radio-button__inner) {
    height: 36px;
    line-height: 20px;
    outline: none;
    white-space: nowrap;
  }

  :deep(.el-radio-button:first-child .el-radio-button__inner) {
    border-radius: $radius-size 0 0 $radius-size;
  }

  :deep(.el-radio-button:not(:first-child):not(:last-child) .el-radio-button__inner) {
    border-radius: 0;
  }

  :deep(.el-radio-button:last-child .el-radio-button__inner) {
    border-radius: 0 $radius-size $radius-size 0;
  }

  :deep(.el-radio-button.is-active) {
    z-index: 1;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner) {
    position: relative;
    isolation: isolate;
    border-radius: $radius-size !important;
    background-image: none;
  }

  :deep(.el-radio-button.is-active .el-radio-button__inner::before) {
    position: absolute;
    z-index: -1;
    inset: -1px;
    border-radius: inherit;
    background-image: linear-gradient(to bottom, #31aba0, #2897be);
    content: '';
  }

  :global(.el-form-item:has(.radio-group) > .el-form-item__label) {
    height: 36px;
    line-height: 20px;
  }
}
</style>
