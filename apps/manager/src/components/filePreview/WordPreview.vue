<template>
  <div class="word-preview file-preview">
    <div v-if="loading" class="file-loading-tip">WORD文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <div v-else ref="wordRef" class="file-viewer"></div>
  </div>
</template>
<script setup lang="ts">
import { renderAsync } from 'docx-preview'
import { getBlob } from '@/utils/request';

  // 获取文件二进制流
const getFileBlob = async (path: string) => {
  const res = await getBlob(path, {
    baseURL: ''
  })
  return res
}

const emit = defineEmits(['loading'])
const props = defineProps({
  path: {
    type: String,
    default: '',
  }
})
const wordRef = ref<HTMLDivElement>()
const loading = ref(false)
const errorText = ref('')
// 渲染 Word
const renderWord = async (blob: Blob) => {
  if (!wordRef.value) return
  wordRef.value.innerHTML = ''
  await renderAsync(blob, wordRef.value, null!, {
    inWrapper: true,
    ignoreWidth: false
  })
}
// 开始预览
const startPreview = async (path: string) => {
  loading.value = true
  errorText.value = ''
  emit('loading', true)
  try {
    const blob = await getFileBlob(path)
    await renderWord(blob)
  } catch (error: any) {
    errorText.value = error.message || '渲染WORD文件失败'
    console.error('渲染WORD文件失败:', error)
  } finally {
    loading.value = false
    emit('loading', false)
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
</style>