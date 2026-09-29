<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import MermaidZoom from './MermaidZoom.vue'
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <MermaidZoom />
    </template>
  </DefaultTheme.Layout>
</template>
