<template>
  <div class="pptx-preview file-preview">
    <div v-if="loading" class="file-loading-tip">PowerPoint文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <VueOfficePptx
      v-if="props.path"
      :src="props.path"
      @rendered="onRendered"
      @error="onError"
    />
  </div>
</template>
<script setup lang="ts">
import VueOfficePptx from '@vue-office/pptx'
// import '@vue-office/pptx/lib/index.css'

const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})

const loading = ref(false)
const errorText = ref('')
const onRendered = () => {
  console.log('PPTX 渲染完成')
}
const onError = (e: any) => {
  console.error('PPTX 渲染失败：', e)
}
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