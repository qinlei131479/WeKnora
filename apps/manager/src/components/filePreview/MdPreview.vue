<template>
  <div class="md-preview file-preview">
    <!-- 加载状态 -->
    <div v-if="loading" class="file-loading-tip">Markdown文件加载解析中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    
    <v-md-preview :text="bigText"></v-md-preview>
  </div>
</template>
<script setup lang="ts">

import axios from 'axios'

const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})

const getFileText = async (path: string) => {
  const res = await axios.get(path, {
    responseType: 'text',
    timeout: 30000
  })
  return res
}
const loading = ref(false)
const errorText = ref('')
// 原始文本
const bigText = ref('')

const startPreview = async (path: string) => {
  try {
    loading.value = true
    const res = await getFileText(path)
    const text = await res.data
    bigText.value = text
  } catch (e) {
    errorText.value = `加载文件失败：${e}`
  } finally {
    loading.value = false
  }
}

watch(
  () => props.path,
  (newPath: string) => {
    if (newPath) {
      startPreview(newPath)
    }
  },
  { immediate: true }
)
</script>
<style scoped lang="scss">
@use './preview.scss';
.txt-preview {
  .txt-scroller {
    height: 100%;
  }
}
</style>