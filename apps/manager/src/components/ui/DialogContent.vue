<script setup lang="ts">
import { cn } from '@/lib/utils'
import { X } from 'lucide-vue-next'
// import { getCurrentInstance } from 'vue'

interface Props {
  title?: string
  class?: string
  footer?: unknown
}

defineProps<Props>()

const currentInstance = getCurrentInstance()

const handleClose = () => {
  currentInstance?.parent?.emit('update:open', false)
}
</script>

<template>
  <div
    :class="cn('dialog-content bg-white shadow-xl border border-slate-200 flex flex-col max-h-[85vh] w-full overflow-hidden', $props.class)">
    <div class="dialog-top flex items-center justify-between px-6 py-4 shrink-0">
      <h2 v-if="$props.title" class="dialog-title">{{ $props.title }}</h2>
      <button v-if="$slots.default || $props.title" @click="handleClose"
        class="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 transition-colors ml-auto cursor-pointer">
        <X class="w-4 h-4" />
      </button>
    </div>
    <div class="p-6 overflow-y-auto flex-1">
      <slot />
    </div>
    <div v-if="$props.footer || $slots.footer"
      class="px-6 py-4 border-t border-slate-100 bg-slate-50/50 shrink-0 flex items-center justify-end gap-3">
      <slot name="footer" />
    </div>
  </div>
</template>
<style scoped lang="scss">
.dialog-content {
  border-radius: 24px;
}

.dialog-top {
  border-bottom: 1px solid #E1E6EC;
}

.dialog-title {
  font-weight: bold;
  font-size: 20px;
  color: #2B2F33;
}
</style>