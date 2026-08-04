<script setup lang="ts">
import TerminalForm from '@/components/agentic/terminal/TerminalForm.vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const terminalId = route.query.id as string || ''
</script>
<template>
  <my-page>
    <TerminalForm :id="terminalId" /> 
  </my-page>
</template>
