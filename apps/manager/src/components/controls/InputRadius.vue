<template>
  <el-input
    v-bind="props"
    class="input-radius"
    @update:model-value="handleUpdate"
    @input="handleInput"
    @change="handleChange"
    @focus="handleFocus"
    @blur="handleBlur"
    @clear="handleClear"
    @mouseleave="handleMouseleave"
    @mouseenter="handleMouseenter"
    @keydown="handleKeydown"
    @compositionstart="handleCompositionstart"
    @compositionupdate="handleCompositionupdate"
    @compositionend="handleCompositionend"
  >
    <template v-for="(_, name) in $slots" #[name]="slotProps">
      <slot :name="name" v-bind="slotProps || {}" />
    </template>
  </el-input>
</template>

<script setup lang="ts">
import { inputEmits, inputProps } from 'element-plus';

defineOptions({
  name: 'InputRound'
});

const props = defineProps(inputProps);
const emit = defineEmits(inputEmits);

const handleUpdate = (value: string) => emit('update:modelValue', value);
const handleInput = (value: string) => emit('input', value);
const handleChange = (value: string, event?: Event) => emit('change', value, event);
const handleFocus = (event: FocusEvent) => emit('focus', event);
const handleBlur = (event: FocusEvent) => emit('blur', event);
const handleClear = () => emit('clear');
const handleMouseleave = (event: MouseEvent) => emit('mouseleave', event);
const handleMouseenter = (event: MouseEvent) => emit('mouseenter', event);
const handleKeydown = (event: KeyboardEvent | Event) => emit('keydown', event);
const handleCompositionstart = (event: CompositionEvent) => emit('compositionstart', event);
const handleCompositionupdate = (event: CompositionEvent) => emit('compositionupdate', event);
const handleCompositionend = (event: CompositionEvent) => emit('compositionend', event);
</script>

<style lang="scss" scoped>
.input-radius {
  height: 36px;
  border-radius: 8px;

  :deep(.el-input__wrapper) {
    border-radius: inherit;
  }
}
</style>
