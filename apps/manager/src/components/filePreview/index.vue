<template>
  <div class="file-preview">
    <!-- Word 预览容器 -->
    <VueOfficeDocxPreview v-if="fileType === 'word'" :path="previewFilePath" class="preview-box"/>

    <!-- PDF 预览容器 -->
    <PdfPreview v-if="fileType === 'pdf'" :path="previewFilePath" class="preview-box"/>

    <!-- PPT 预览容器 -->
    <PptxPreview v-if="fileType === 'pptx'" :path="previewFilePath" class="preview-box"/>

    <!-- CSV 预览容器 -->
    <CsvPreview v-if="fileType === 'csv'" :path="previewFilePath" class="preview-box"/>

    <!-- Excel 预览容器 -->
    <VueOfficeExcelPreview v-if="fileType === 'excel'" :path="previewFilePath" class="preview-box"/>

    <!-- Txt 预览容器 -->
    <TxtPreview v-if="fileType === 'txt'" :path="previewFilePath" class="preview-box"/>

    <!-- Image 预览容器 -->
    <ImagePreview v-if="fileType === 'image'" :path="previewFilePath" class="preview-box"/>

    <!-- Md 预览容器 -->
    <MdPreview v-if="fileType === 'md'" :path="previewFilePath" class="preview-box"/>

    <!--  PPT 提示（前端无法直渲，需后端转PDF） -->
    <!-- <div v-if="['ppt'].includes(fileType)" class="tip-box">
      <p>当前PPT文件，请后端转PDF后预览</p>
      <p class="text-gray">也可调用在线Office预览地址查看</p>
    </div> -->
  </div>
</template>
<script setup lang="ts">
// import WordPreview from './WordPreview.vue'
import PptxPreview from './PptxPreview.vue'
import CsvPreview from './CsvPreview.vue'
import PdfPreview from './PdfPreview.vue'
import VueOfficeExcelPreview from './VueOfficeExcelPreview.vue'
import VueOfficePptxPreview from './VueOfficePptxPreview.vue'
import VueOfficeDocxPreview from './VueOfficeDocxPreview.vue'
// import VueOfficePdfPreview from './VueOfficePdfPreview.vue'
import TxtPreview from './TxtPreview.vue'
import ImagePreview from './ImagePreview.vue'
import MdPreview from './MdPreview.vue'

function getFileType(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  if (['pdf'].includes(ext)) return 'pdf'
  if (['docx'].includes(ext)) return 'word'
  if (['xlsx','xls'].includes(ext)) return 'excel'
  if (['pptx'].includes(ext)) return 'pptx'
  if (['ppt'].includes(ext)) return 'ppt'
  if (['csv'].includes(ext)) return 'csv'
  if (['jpg','jpeg','png'].includes(ext)) return 'image'
  if (['txt'].includes(ext)) return 'txt'
  if (['md'].includes(ext)) return 'md'
  return 'other'
}

const props = defineProps({
  path: {
    type: String,
    default: () => ''
  }
})

const fileType = ref('')
const previewFilePath = ref('')

// 统一入口
const startPreview = async () => {
  let path = props.path
  if (!path) return
  // path = '/file/f1.docx'
  // path = '/file/f2.pptx'
  // path = 'https://data.source.coop/severo/csv-papaparse-test-files/verylong-sample.csv'
  // path = '/file/f3.pdf'
  // path = 'https://samplepdf.org/files/sample.pdf'
  // loading.value = true
  // path = 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.pptx'
  // path = 'https://501351981.github.io/vue-office/examples/dist/static/test-files/test.xlsx'
  // path = '/file/f4.txt'
  // path = 'https://pic.rmb.bdstatic.com/bjh/bb8b50ae54b/241213/b5a2ee80d505b8b904ea41c79665116b.jpeg'
  // path = '/file/f5.md'
  const fileName = path.split('/').pop() || ''
  const fileTypeValue = getFileType(fileName)
  fileType.value = fileTypeValue
  console.log('fileTypeValue', fileTypeValue)
  previewFilePath.value = path
}

watch(() => props.path, startPreview, { immediate: true })
</script>
<style scoped lang="scss">
.file-preview {
  height: 100%;
  overflow: auto;
}
</style>
