<template>
  <div class="flex items-center justify-center"
    :class="getKnowledgeTypeBadgeStyle(type)">
    {{ getKnowledgeTypeName(type, short) }}</div>
</template>

<script setup lang="ts">
import { getKnowledgeTypeName, getKnowledgeTypeBadgeStyle } from '@/api/knowledgeLib/knowledgeAuth'

const props = defineProps({
  type: {
    type: Number,
    default: 0
  },
  short: {
    type: Boolean,
    default: false
  }
})
</script>