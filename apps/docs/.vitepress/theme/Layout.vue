<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import { useData, useRoute } from 'vitepress'
import { watchEffect } from 'vue'
import MermaidZoom from './MermaidZoom.vue'

const { theme, frontmatter } = useData()
const route = useRoute()

watchEffect(() => {
  const t = theme.value
  const path = route.path
  const onLanding = frontmatter.value.layout === 'page'
  const onProduct = path.includes('/00-product/')
  t.nav = onLanding ? t.landingNav : onProduct ? t.productNav : t.techNav
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <MermaidZoom />
    </template>
  </DefaultTheme.Layout>
</template>
