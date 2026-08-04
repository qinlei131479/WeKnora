<template>
  <input
    v-bind="$attrs"
    :type="props.type || 'text'"
    :class="cn(
      'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
    :value="innerVal"
    @input="handleInput"
  />
</template>

<script setup lang="ts">
import { cn } from '@/lib/utils'

// 接收 v-model
const props = defineProps<{
  modelValue: string | number
  type?: string
  class?: any
}>()

const emit = defineEmits(['update:modelValue'])

// 双向绑定
const innerVal = computed({
  get() {
    return props.modelValue
  },
  set(val: string) {
    emit('update:modelValue', val)
  }
})

// 兼容原生input事件赋值
const handleInput = (e: Event) => {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>