<template>
  <MessageInputComponent
    ref="inputRef"
    :model-value="modelValue"
    @update:modelValue="updateValue"
    :is-loading="isLoading"
    :disabled="disabled"
    :send-button-disabled="sendButtonDisabled"
    :placeholder="placeholder"
    :mention="mention"
    :thread-id="threadId"
    :file-upload-enabled="supportsFileUpload"
    :image-upload-enabled="supportsFileUpload"
    :image-count="currentImage ? 1 : 0"
    :attachment-count="previewAttachments.length"
    @send="handleSend"
    @keydown="handleKeyDown"
    @paste-image="handlePastedImage"
    @drop-files="handleDroppedFiles"
    @attach="handleAttachmentUpload"
  >
    <template #top>
      <div v-if="currentImage || previewAttachments.length" class="input-top-stack">
        <ImagePreviewComponent
          v-if="currentImage"
          :image-data="currentImage"
          @remove="handleImageRemoved"
          class="image-preview-wrapper"
        />

        <div v-if="previewAttachments.length" class="attachment-preview-list">
          <div
            v-for="attachment in previewAttachments"
            :key="attachment.fileId"
            class="attachment-file-card"
          >
            <div class="attachment-file-icon">
              <FileTypeIcon :name="attachment.name" :size="18" />
            </div>
            <div class="attachment-file-body">
              <div class="attachment-file-name" :title="attachment.name">{{ attachment.name }}</div>
              <div class="attachment-file-meta">{{ attachment.meta }}</div>
            </div>
            <button
              class="attachment-remove-btn"
              type="button"
              :aria-label="t('harness.chat.removeAttachment', { name: attachment.name })"
              @click.stop="handleAttachmentRemoved(attachment)"
            >
              <X :size="14" />
            </button>
          </div>
        </div>
      </div>
    </template>
    <template #actions-left>
      <div class="input-actions-left">
        <slot name="actions-left-extra"></slot>
      </div>
    </template>
    <template #actions-right>
      <div class="input-actions-right">
        <slot name="actions-right-extra"></slot>
      </div>
    </template>
  </MessageInputComponent>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import MessageInputComponent from '@/components/harness/MessageInputComponent.vue'
import ImagePreviewComponent from '@/components/harness/ImagePreviewComponent.vue'
import { X } from 'lucide-vue-next'
import { normalizeAttachmentPreviews } from '@/utils/harness/file_utils'
import { uploadMultimodalImage } from '@/utils/harness/multimodal_image_upload'
import FileTypeIcon from '@/components/harness/common/FileTypeIcon.vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  isLoading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  sendButtonDisabled: { type: Boolean, default: false },
  mention: { type: Object, default: () => null },
  threadId: { type: String, default: '' },
  supportsFileUpload: { type: Boolean, default: false },
  attachments: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:modelValue',
  'send',
  'keydown',
  'upload-attachment',
  'remove-attachment'
])

const { t } = useI18n()
const inputRef = ref(null)
const currentImage = ref(null)
const placeholder = computed(() => t('input.placeholder'))

const previewAttachments = computed(() => normalizeAttachmentPreviews(props.attachments))

const updateValue = (val) => {
  emit('update:modelValue', val)
}

const handleAttachmentUpload = (files = []) => {
  emit('upload-attachment', files)
}

const handleImageUpload = (imageData) => {
  if (imageData && imageData.success) {
    currentImage.value = imageData
  }
}

const handlePastedImage = async (file) => {
  if (props.disabled || !props.supportsFileUpload) return

  try {
    const imageData = await uploadMultimodalImage(file)
    handleImageUpload(imageData)
  } catch (error) {
    console.error('图片上传失败:', error)
  }
}

const handleDroppedFiles = (files = []) => {
  if (props.disabled || !props.supportsFileUpload || !files.length) return
  handleAttachmentUpload(files)
}

const handleImageRemoved = () => {
  currentImage.value = null
}

const restoreImage = (image) => {
  currentImage.value = image || null
}

const handleAttachmentRemoved = (attachment) => {
  emit('remove-attachment', attachment.raw)
}

const handleSend = () => {
  inputRef.value?.flushSelectedMentions?.()
  emit('send', { image: currentImage.value })
  currentImage.value = null
}

const handleKeyDown = (e) => {
  // 与发送按钮保持一致：只要有已选中的 @ 提及、待发图片或待发附件，
  // 即便正文为空也允许 Enter 发送（否则点击发送按钮能发，敲 Enter 却没反应）。
  const isSendDisabled = inputRef.value?.isSendDisabled?.value ?? props.sendButtonDisabled
  if (isSendDisabled) {
    return
  }

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  } else {
    emit('keydown', e)
  }
}

defineExpose({
  focus: () => inputRef.value?.focus(),
  closeOptions: () => inputRef.value?.closeOptions(),
  restoreImage
})
</script>

<style lang="less" scoped>
.input-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.input-actions-right {
  display: flex;
  align-items: center;
  margin-right: 8px;
  gap: 2px;
}

.input-top-stack {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.attachment-preview-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.attachment-file-card {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  width: 220px;
  min-width: 0;
  padding: 10px 34px 10px 12px;
  border: 1px solid var(--gray-150);
  border-radius: 12px;
  background: var(--gray-0);
  box-shadow: 0 1px 4px var(--shadow-0);
}

.attachment-file-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--main-700);
  background: var(--main-30);
}

.attachment-file-body {
  min-width: 0;
}

.attachment-file-name {
  overflow: hidden;
  color: var(--gray-900);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.attachment-file-meta {
  margin-top: 2px;
  color: var(--gray-500);
  font-size: 12px;
  line-height: 1.3;
}

.attachment-remove-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  color: var(--gray-0);
  background: var(--gray-900);
  cursor: pointer;
  transition:
    background-color 0.15s ease,
    transform 0.15s ease;

  &:hover {
    background: var(--gray-700);
  }

  &:active {
    transform: scale(0.96);
  }
}

// 输入框操作按钮通用样式（穿透到 slot 内容）
:deep(.input-action-btn) {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  height: 28px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: var(--td-text-color-secondary, #666);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;
  user-select: none;
  background: transparent;
  border: 0.5px solid var(--td-component-border, #e7e7e7);

  &:hover:not(.disabled) {
    color: var(--td-text-color-primary, #333);
    background: var(--td-bg-color-secondarycontainer-hover, #e6e6e6);
  }

  &.active {
    color: var(--td-text-color-primary);
    background: var(--td-bg-color-secondarycontainer);
  }

  &.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }

  span {
    line-height: 1;
  }
}

// slot 内容的 hide-text 响应式样式
:deep(.hide-text) {
  @media (max-width: 768px) {
    display: none;
  }
}

@media (max-width: 768px) {
  .input-top-stack {
    gap: 8px;
    margin-bottom: 10px;
  }

  .attachment-file-card {
    width: min(220px, 100%);
  }
}
</style>
