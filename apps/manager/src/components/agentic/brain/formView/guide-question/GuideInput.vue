<template>
  <div class="question-row">
    <el-input
      v-model="value"
      :disabled="readonly"
      class="question-input"
      :placeholder="placeholder" />
    <PenLine @click="readonly = !readonly" class="cursor-pointer"/>
    <Trash @click="emit('remove')" class="cursor-pointer"/>
  </div>
</template>
<script setup lang="ts">
import { PenLine, Trash } from 'lucide-vue-next'

const emit = defineEmits(['update:model-value', 'remove'])
const props = defineProps({
  modelValue: {
    type: String,
    default: () => ''
  },
  placeholder: {
    type: String,
    default: () => '请填写引导问题'
  }
})
const readonly = ref(!!props.modelValue)
const value = computed({
  get: () => props.modelValue,
  set: (val: string) => {
    console.log('set', val)
    emit('update:model-value', val)
  }
});
</script>
<style scoped lang="scss">
.question-row {
  display: flex;
  align-items: center;
  padding: 3px 0;
  gap: 5px;
}
.question-input {
  flex: 1;
}
</style>