<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  class?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void,
  (e: 'close'): void
  (e: 'open'): void
}>()

const handleClose = () => {
  emit('update:open', false)
}
watch(
  () => props.open,
  (open: boolean) => {
    if (open) {
      emit('open')
    } else {
      emit('close')
    }
  }
)
if (props.open) {
  emit('open')
}
</script>

<template>
  <Teleport to="body">
    <div v-if="props.open"
      class="fixed inset-0 z-1050 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div class="absolute inset-0" @click="handleClose"></div>
      <div
        :class="cn('relative z-50 animate-in fade-in zoom-in-95 duration-200 flex flex-col w-full max-h-full', props.class || 'max-w-2xl')">
        <slot :on-close="handleClose" />
      </div>
    </div>
  </Teleport>
</template>
