<template>
  <div class="docx-preview file-preview">
    <div v-if="loading" class="file-loading-tip">Word文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <VueOfficeDocx
      v-if="props.path"
      :src="props.path"
      @rendered="onRendered"
      @error="onError"
    />
  </div>
</template>
<script setup lang="ts">
import VueOfficeDocx from '@vue-office/docx'
import '@vue-office/docx/lib/index.css'

const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})

const loading = ref(false)
const errorText = ref('')
const onRendered = () => {
  console.log('DOCX 渲染完成')
}
const onError = (e: any) => {
  console.error('DOCX 渲染失败：', e)
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