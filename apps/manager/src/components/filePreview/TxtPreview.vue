<template>
  <div class="txt-preview file-preview">
    <!-- 加载状态 -->
    <div v-if="loading" class="file-loading-tip">CSV文件加载解析中...</div>
    <!-- 错误提示 -->
    <div v-if="errorText" class="file-error-tip">{{ errorText }}</div>
    <DynamicScroller
      class="txt-scroller"
      :items="textList"
      :min-item-size="30"
      key-field="id"
    >
      <template #default="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :index="index"
        >
          <div class="line-text">
            {{ item.content }}
          </div>
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>
<script setup lang="ts">
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
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
// 原始超大文本
const bigText = ref('')

// 按换行分割成每行
const textList = computed(() => {
  return bigText.value.split('\n').map((content: string, id: number) => ({ id, content }))
})

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
  .line-text {
    // white-space: nowrap;
    line-height: 30px;
    font-size: 16px;
  }
}
</style>