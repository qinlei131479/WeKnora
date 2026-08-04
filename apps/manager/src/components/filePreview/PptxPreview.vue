<template>
  <div class="pptx-preview file-preview">
    <div v-if="loading" class="file-loading-tip">PPTX文件加载中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <div ref="pptAreaRef" class="file-viewer"  :style="{visibility: showPPT ? undefined : 'hidden'}"></div>
  </div>
  <!-- <div ref="pptAreaRef" class="pptx-preview2" :style="{visibility: showPPT ? undefined : 'hidden'}"></div> -->
</template>
<script setup lang="ts" name="PptxPreview">
import {init} from 'pptx-preview'

const props = defineProps({
  url: {
    type: String,
    default: '',
  },
  path: {
    type: String,
    default: '',
  }
})

const loading = ref(false)
const errorText = ref('')
const showPPT = ref(false)
const urlRef = ref('');

const pptAreaRef = ref<HTMLDivElement>()
let pptxPrviewer: any = null;

const initPptxPreview = () => {
  const pptAreaNode = pptAreaRef.value
  if (pptAreaNode) {
    pptxPrviewer = init(pptAreaNode, {
      width: pptAreaNode.clientWidth,
      height: pptAreaNode.clientHeight
    })
    if (urlRef.value) {
      showPPTByUrl(urlRef.value)
      urlRef.value = ''
    }
  }
}
const showPPTByUrl = (pptUrl: string) => {
  showPPT.value = false
  if (!pptUrl) {
    return
  }
  loading.value = true
  // errorText.value = ''
  //获取文件或者读取文件，获取文件的 ArrayBuffer格式数据，传给组件进行预览
  fetch(pptUrl).then(response=>{
      return response.arrayBuffer()
  }).then(res =>{
      //调用预览器的preview方法
      showPPT.value = true
      loading.value = false
      pptxPrviewer.preview(res)
  })
}
watch(
  () => [props.path, props.url],
  (newVal: string[]) => {
    if (pptxPrviewer) {
      showPPTByUrl(newVal[0] || newVal[1])
    } else {
      urlRef.value = newVal[0] || newVal[1]
    }
  },
  { immediate: true }
)
let waitInitTimer: any = null
onMounted(() => {
  waitInitTimer = setTimeout(() => {
    waitInitTimer = null
    initPptxPreview()
  }, 1000)
})
onUnmounted(() => {
  if (waitInitTimer) {
    clearTimeout(waitInitTimer)
  }
  if (pptxPrviewer) {
    pptxPrviewer.destroy()
  }
})
</script>
<style scoped lang="scss">
@use './preview.scss';

.pptx-preview {
  :deep(.pptx-preview-wrapper){
    overflow-x: hidden;
  }
}
</style>
