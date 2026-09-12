<template>
  <section v-if="normalizedArtifacts.length" class="artifacts-list">
    <div v-for="file in normalizedArtifacts" :key="file.path" class="artifact-card">
      <button
        type="button"
        class="item-main"
        :title="t('harness.chat.openFile', { name: file.name })"
        @click="openPreview(file)"
      >
        <FileTypeIcon :name="file.path" :size="20" class="item-icon" />
        <div class="item-meta">
          <div class="item-name">{{ file.name }}</div>
          <div class="item-desc">{{ getFileMetaLabel(file.path) }}</div>
        </div>
      </button>
      <div class="item-actions">
        <button class="item-action-btn" :title="t('harness.chat.download')" @click.stop="downloadFile(file)">
          <Download :size="15" />
        </button>
        <button
          class="item-action-btn"
          :title="isSaving(file.path) ? t('harness.chat.saving') : t('harness.chat.saveToWorkspace')"
          :disabled="isSaving(file.path)"
          @click.stop="saveToWorkspace(file)"
        >
          <LoaderCircle v-if="isSaving(file.path)" :size="15" class="item-action-spin" />
          <Save v-else :size="15" />
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { MessagePlugin } from 'tdesign-vue-next'
import { Download, LoaderCircle, Save } from 'lucide-vue-next'
import { threadApi } from '@/api/chat-work/agent'
import FileTypeIcon from '@/components/harness/common/FileTypeIcon.vue'
import { downloadViewerFile } from '@/api/harness/viewer_filesystem'

const props = defineProps({
  artifacts: {
    type: Array,
    default: () => []
  },
  threadId: {
    type: String,
    default: null
  }
})
const emit = defineEmits(['saved', 'open-preview'])
const { t } = useI18n()

const normalizedArtifacts = computed(() =>
  (props.artifacts || [])
    .filter((path) => typeof path === 'string' && path.trim())
    .map((path) => {
      const normalizedPath = path.trim()
      return {
        path: normalizedPath,
        name: normalizedPath.split('/').pop() || normalizedPath
      }
    })
)
const savingState = ref({})

const parseDownloadFilename = (contentDisposition) => {
  if (!contentDisposition) return ''

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch (error) {
      console.warn('解析 UTF-8 文件名失败:', error)
    }
  }

  const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
  return asciiMatch?.[1] || ''
}

const getFileMetaLabel = (path) => {
  const filename =
    String(path || '')
      .split('/')
      .pop() || ''
  if (!filename.includes('.')) return t('harness.chat.deliveryFile')

  const extension = filename.split('.').pop()
  return extension ? t('harness.chat.deliveryFileExt', { ext: extension.toUpperCase() }) : t('harness.chat.deliveryFile')
}

const openPreview = (file) => {
  emit('open-preview', file)
}

const downloadFile = async (file) => {
  if (!props.threadId || !file?.path) return

  try {
    const response = await downloadViewerFile(props.threadId, file.path)
    const blob = await response.blob()
    const contentDisposition =
      response.headers.get('Content-Disposition') || response.headers.get('content-disposition')
    const filename = parseDownloadFilename(contentDisposition) || file.name
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    MessagePlugin.error(error?.message || t('harness.chat.downloadFailed'))
  }
}

const isSaving = (path) => !!savingState.value[path]

const setSaving = (path, saving) => {
  savingState.value = {
    ...savingState.value,
    [path]: saving
  }
}

const saveToWorkspace = async (file) => {
  if (!props.threadId || !file?.path || isSaving(file.path)) return

  setSaving(file.path, true)
  try {
    const result = await threadApi.saveThreadArtifactToWorkspace(props.threadId, file.path)
    MessagePlugin.success(t('harness.chat.savedToWorkspace', { path: result.saved_path }))
    emit('saved', result)
  } catch (error) {
    MessagePlugin.error(error?.message || t('harness.chat.saveToWorkspaceFailed'))
  } finally {
    setSaving(file.path, false)
  }
}
</script>

<style scoped lang="less">
.artifacts-list {
  width: 100%;
  margin: 8px 0 4px;
  padding: 2px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.artifact-card {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  box-sizing: border-box;
  border: 1px solid var(--gray-150, var(--td-component-stroke, #eef0f0));
  border-radius: 12px;
  background: linear-gradient(
    180deg,
    var(--gray-25, var(--td-bg-color-secondarycontainer, #f8fafa)) 0%,
    var(--gray-0, var(--td-bg-color-container, #ffffff)) 100%
  );
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;

  &:hover {
    border-color: var(--main-200, var(--td-brand-color-2, #8ce0af));
    box-shadow: inset 0 0 0 1px var(--main-200, var(--td-brand-color-2, #8ce0af));
    background: var(--gray-0, var(--td-bg-color-container, #ffffff));
  }
}

.item-main {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
  padding: 10px 8px 10px 12px;
}

.item-icon {
  flex-shrink: 0;
  font-size: 18px;
  opacity: 0.86;
}

.item-meta {
  min-width: 0;
  flex: 1;
}

.item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-900, var(--td-text-color-primary, #151616));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.item-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--gray-500, var(--td-text-color-secondary, #979999));
  line-height: 1.2;
}

.item-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-right: 10px;
}

.item-action-btn {
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--gray-600, var(--td-text-color-secondary, #697070));
  border-radius: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.item-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.item-action-btn:hover:not(:disabled) {
  color: var(--main-700, var(--td-brand-color, #038626));
  background: var(--gray-100, var(--td-bg-color-secondarycontainer, #eff2f2));
}

.item-action-spin {
  animation: artifacts-spin 1s linear infinite;
}

@keyframes artifacts-spin {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 768px) {
  .artifacts-list {
    margin-top: 6px;
  }

  .artifact-card {
    align-items: stretch;
  }

  .item-main {
    padding: 9px 6px 9px 12px;
  }
}
</style>
