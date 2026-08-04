<script setup lang="ts">
import AgentForm from '@/components/agentic/brain/AgentForm.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const domain = route.query.domain as string;
const domainValue = domain ? Number(domain) : null
</script>
<template>
  <AgentForm :domain="domainValue" />
</template>
