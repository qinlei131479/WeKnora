<template>
  <div class="excel-preview file-preview">
    <div v-if="loading" class="file-loading-tip">Excel文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <VueOfficeExcel
      v-if="props.path"
      :src="props.path"
      :showToolbar="true"
      :showGrid="true"
      @rendered="onRendered"
      @error="onError"
    />
  </div>
</template>
<script setup lang="ts">
import VueOfficeExcel from '@vue-office/excel'
import '@vue-office/excel/lib/index.css'

const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})

const loading = ref(false)
const errorText = ref('')
const onRendered = () => {
  console.log('XLSX 渲染完成')
}
const onError = (e: any) => {
  console.error('XLSX 渲染失败：', e)
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