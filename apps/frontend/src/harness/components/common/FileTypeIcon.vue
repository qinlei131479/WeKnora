<template>
  <t-icon
    v-if="isDirectory"
    name="folder"
    class="file-type-icon weknora-folder-icon"
    :style="iconSizeStyle"
  />
  <img
    v-else
    class="file-type-icon"
    :src="iconUrl"
    :style="iconSizeStyle"
    alt=""
    draggable="false"
  />
</template>

<script setup>
import { computed } from 'vue'
import { resolveFileIconUrl } from '@harness/utils/file_icon'

const props = defineProps({
  // 文件名或路径（目录可 `/` 结尾）
  name: { type: String, default: '' },
  isDir: { type: Boolean, default: false },
  size: { type: Number, default: 16 }
})

const isDirectory = computed(() => props.isDir || String(props.name || '').endsWith('/'))

const iconSizeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size}px`
}))

const iconUrl = computed(() => resolveFileIconUrl(props.name))
</script>

<style scoped>
.file-type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  object-fit: contain;
  flex-shrink: 0;
  vertical-align: middle;
}

.weknora-folder-icon {
  color: var(--td-brand-color);
}
</style>
