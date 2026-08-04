<template>
  <div class="image-preview file-preview">
    <el-image
      :src="props.path"
      fit="contain"
      class="preview-box"
    />
  </div>
</template>
<script setup lang="ts">

const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})

// watch(
//   () => props.path,
//   (newPath: string) => {
//     if (newPath) {
//       startPreview(newPath)
//     }
//   },
//   { immediate: true }
// )
</script>
<style scoped lang="scss">
@use './preview.scss';
</style>