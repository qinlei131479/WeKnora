<template>
  <div class="h-full">
    <SaveForm :id="id" />
  </div>
</template>

<script setup lang="ts">
import SaveForm from '@/components/knowledge/lib/SaveForm.vue'
const route = useRoute()
const id = route.params.id
</script>