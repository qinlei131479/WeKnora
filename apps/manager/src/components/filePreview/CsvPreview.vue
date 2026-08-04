<template>
  <div class="csv-preview file-preview">
    <!-- 加载状态 -->
    <div v-if="loading" class="file-loading-tip">CSV文件加载解析中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>

    <!-- CSV表格预览 -->
    <div v-if="tableList.length" class="file-viewer csv-scroll-box">
      <table class="csv-table" border="1" cellpadding="8" cellspacing="0">
        <thead>
          <tr>
            <th v-for="(item, idx) in tableList[0]" :key="idx">{{ item }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in tableList.slice(1)" :key="rIdx">
            <td v-for="(cell, cIdx) in row" :key="cIdx">{{ cell }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'
import Papa from 'papaparse'

const props = defineProps<{
  path: string
}>()

const loading = ref(false)
const errorText = ref('')
const tableList = ref<string[][]>([])

// 获取文件二进制流
const getFileBlob = async () => {
  const res = await axios.get(props.path, {
    responseType: 'blob',
    timeout: 30000
  })
  return res.data
}

// Blob 转文本 支持 UTF-8 / GBK
const blobToString = (blob: Blob, charset = 'utf-8'): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsText(blob, charset)
    reader.onload = (e) => resolve(e.target?.result as string || '')
  })
}

// 解析CSV核心
const parseCsvData = (csvStr: string) => {
  const result = Papa.parse<string[]>(csvStr, {
    header: false,
    skipEmptyLines: true, // 跳过空行
    delimiter: '', // 自动识别分隔符 , ; 制表符
    dynamicTyping: false
  })
  return result.data
}

// 主入口
const startPreview = async () => {
  if (!props.path) return
  loading.value = true
  errorText.value = ''
  tableList.value = []

  try {
    const blob = await getFileBlob()
    // 优先utf8解析，乱码自动切gbk
    let text = await blobToString(blob, 'utf-8')
    let data = parseCsvData(text)

    // 解析为空 尝试GBK编码
    if (data.length === 0) {
      text = await blobToString(blob, 'gbk')
      data = parseCsvData(text)
    }

    tableList.value = data
  } catch (err) {
    errorText.value = 'CSV文件解析失败，请检查文件格式'
    console.error('CSV解析错误：', err)
  } finally {
    loading.value = false
  }
}

watch(() => props.path, startPreview, { immediate: true })
// onMounted(startPreview)
</script>

<style scoped lang="scss">
@use './preview.scss';
.csv-scroll-box {
  // width: 100%;
  /* max-height: 750px; */
  overflow: auto;
  border: 1px solid #e5e6eb;
}
.csv-table {
  width: 100%;
  border-collapse: collapse;
  white-space: nowrap;
}
.csv-table th {
  background-color: #f2f3f5;
  font-weight: 600;
  position: sticky;
  top: 0;
}
.csv-table th,
.csv-table td {
  border-color: #ebeef5;
}
</style>