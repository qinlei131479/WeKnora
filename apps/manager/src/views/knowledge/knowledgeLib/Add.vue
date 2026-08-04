<template>
  <div class="h-full">
    <SaveForm :domain="domain" />
  </div>
</template>

<script setup lang="ts">
import SaveForm from '@/components/knowledge/lib/SaveForm.vue'
const route = useRoute()
const domain = route.query.domain
</script>