<template>
  <div class="pdf-preview file-preview">
    <div v-if="loading" class="file-loading-tip">PDF文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <div ref="pdfViewerRef" class="file-viewer"></div>
  </div>
</template>
<script setup lang="ts">
import { PDFViewer, Theme, Scale } from 'pdf-generator-api-pdfviewer';
// import 'pdf-generator-api-pdfviewer/dist/PDFViewer.css';
const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})
const loading = ref(false)
const errorText = ref('')
const pdfViewerRef = ref<HTMLDivElement>()
let viewer: PDFViewer | null = null;
// 渲染 PDF
const renderPdf = (url: string) => {
  if (!pdfViewerRef.value) {
    return
  }
  if (!viewer) {
    viewer = new PDFViewer({
      container: pdfViewerRef.value!,
      // options: {
      //   theme: Theme.PDFApi,
      //   initialScale: Scale.PageFit,
      //   toolbarFontSize: 16,
      //   toolbarIconSize: 24,
      //   scaleDropdown: false,
      //   search: false,
      //   signature: false,
      //   signatureButton: false,
      //   print: false,
      //   download: false,
      //   upload: false,
      //   sidebar: false,
      // }
      // toolbar: true, // 显示工具栏（翻页、缩放、打印）
      // textLayer: true // 可复制文本
    });
    const options = (viewer as any).options;
    const newOptions = {
      ...options,
      upload: false,
      signatureButton: false,
      signature: false,
      search: false,
    }
    viewer.setOptions(newOptions);
  }
  console.log('viewer', viewer)
  // 直接加载 PDF（支持 你之前的测试地址）
  viewer.loadUrl(url);
}
watch(
  () => props.path,
  (newPath: string) => {
    if (newPath) {
      renderPdf(newPath)
    }
  },
  { immediate: false }
)
onMounted(() => {
  if (!viewer && props.path) {
    renderPdf(props.path)
  }
})
// onUnmounted(() => {
//   viewer?.destroy();
// })
</script>
<style scoped lang="scss">
@use './preview.scss';
</style>
