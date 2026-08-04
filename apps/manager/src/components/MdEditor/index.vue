<template>
  <div class="md-editor">
    <v-md-editor :model-value="modelValue"
      :disabled-menus="[]"
      @update:model-value="emit('update:modelValue', $event)"
      @upload-image="handleUploadImage"
      @save="handleSave"
      class="v-md-editor"/>
  </div>
</template>
<script setup lang="ts">
import {uploadFile} from '@/utils/request'
import {resolveStaticPath} from '@/utils/index'
const uploadUrl = "/file/upload";
const emit = defineEmits(['update:modelValue', 'save'])
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

const handleUploadImage = (event: any, insertImage: any, files: File[]) => {
  // console.log('上传图片', event, insertImage, files)
  const params = new FormData()
  params.append('file', files[0])
  uploadFile(uploadUrl, params).then((res: any) => {
    // console.log('handleUploadImage', res)
    const data = res?.data || {}
    const url = resolveStaticPath(data?.url)
    const desc = data?.name || ''
    if (url) {
      insertImage({url, desc})
    }
  })
}

const handleSave = (text: string, html: string) => {
  emit('save')
}
</script>
<style scoped lang="scss">
.md-editor {
  height: 100%;
}
.v-md-editor {
  height: 100%;
}
</style>