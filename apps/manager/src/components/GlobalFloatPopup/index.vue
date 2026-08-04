<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="global-float-popup"
      :style="{
        left: `${left}px`,
        top: `${top}px`,
        width: width
      }"
      @click.stop
    >
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
// import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
  left: number
  top: number
  width?: string | number
}>()

const emit = defineEmits<{
  'update:visible': [val: boolean]
}>()

// 点击页面空白关闭
const handleDocClick = () => {
  emit('update:visible', false)
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
})
onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
})
</script>

<style scoped>
.global-float-popup {
  position: fixed;
  z-index: 99999;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  padding: 8px;
}
</style>