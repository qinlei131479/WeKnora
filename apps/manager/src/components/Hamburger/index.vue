<template>
  <div style="padding: 0 15px;" @click="toggleClick">
    <img
      :class="{ 'is-active': isActive }"
      class="hamburger"
      :src="sidebarToggleIcon"
      alt="切换侧边栏"
    />
  </div>
</template>

<script setup lang="ts">
// 请将 sidebar-toggle.png 放到 src/assets/images/layout/ 目录下
import sidebarToggleIcon from '@/assets/images/layout/sidebar-toggle.png'

defineProps({
  isActive: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits()
const toggleClick = () => {
  emit('toggleClick')
}
</script>

<style scoped>
.hamburger {
  display: inline-block;
  vertical-align: middle;
  width: 20px;
  height: 20px;
  object-fit: contain;
}
</style>
