<template>
  <el-input-number
    v-bind="props"
    class="input-number-radius"
    @update:model-value="handleUpdate"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @input="handleInput"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </el-input-number>
</template>

<script setup lang="ts">
import { inputNumberEmits, inputNumberProps } from 'element-plus';

defineOptions({
  name: 'InputNumberRadius'
});

const props = defineProps(inputNumberProps);
const emit = defineEmits(inputNumberEmits);

const handleUpdate = (value: number | undefined) => emit('update:modelValue', value);
const handleChange = (current: number | undefined, previous: number | undefined) => emit('change', current, previous);
const handleBlur = (event: FocusEvent) => emit('blur', event);
const handleFocus = (event: FocusEvent) => emit('focus', event);
const handleInput = (value: number | null | undefined) => emit('input', value);
</script>

<style lang="scss" scoped>
.input-number-radius {
  height: 36px;
  border-radius: 8px;

  :deep(.el-input),
  :deep(.el-input__wrapper) {
    height: inherit;
    border-radius: inherit;
  }
}
</style>