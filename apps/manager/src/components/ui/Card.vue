<script setup lang="ts">
import { cn } from '@/lib/utils'

interface Props {
  class?: string
}

const props = defineProps<Props>()
</script>

<template>
  <div :class="cn('rounded-xl border bg-white text-slate-900 shadow-sm', props.class)">
    <slot />
  </div>
</template>
