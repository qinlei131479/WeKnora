<script setup lang="ts">
import AgentForm from '@/components/agentic/brain/AgentForm.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const agentId = route.query.id as string;
const agentIdValue = agentId ? Number(agentId) : null
</script>
<template>
  <AgentForm :id="agentId" />
</template>
