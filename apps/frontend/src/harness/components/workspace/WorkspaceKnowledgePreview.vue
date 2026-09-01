<template>
  <div class="workspace-knowledge-preview">
    <div class="preview-header">
      <div class="file-title">
        <FileTypeIcon :name="fileName" :size="16" />
        <span class="file-path-title">{{ fileName }}</span>
      </div>
      <button
        v-if="showClose"
        type="button"
        class="modal-action-btn"
        :title="closeTitle"
        :aria-label="closeTitle"
        @click="$emit('close')"
      >
        <component :is="closeIconComponent" :size="16" />
      </button>
    </div>
    <div class="preview-body">
      <DocumentPreview
        :knowledge-id="knowledgeId"
        :file-type="fileType"
        :file-name="fileName"
        :active="true"
        :fill-height="true"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { PanelRight, X } from 'lucide-vue-next'
import DocumentPreview from '@/components/document-preview.vue'
import FileTypeIcon from '@harness/components/common/FileTypeIcon.vue'

const props = defineProps({
  knowledgeId: { type: String, required: true },
  fileType: { type: String, default: '' },
  fileName: { type: String, default: '' },
  showClose: { type: Boolean, default: true },
  closeVariant: {
    type: String,
    default: 'collapse-right',
    validator: (value) => ['close', 'collapse-right'].includes(value)
  }
})

defineEmits(['close'])

const { t } = useI18n()
const closeTitle = computed(() =>
  props.closeVariant === 'collapse-right' ? t('harness.chat.collapsePreview') : t('harness.chat.closePreview')
)
const closeIconComponent = computed(() => (props.closeVariant === 'collapse-right' ? PanelRight : X))
</script>

<style scoped lang="less">
.workspace-knowledge-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--gray-0);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 0 0 auto;
  min-height: 44px;
  padding: 0 12px 0 16px;
  border-bottom: 1px solid var(--gray-150);
}

.file-title {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.file-path-title {
  overflow: hidden;
  color: var(--gray-800);
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--gray-600);
  cursor: pointer;

  &:hover {
    background: var(--gray-50);
    color: var(--gray-900);
  }
}

.preview-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.preview-body :deep(.document-preview) {
  height: 100%;
}

.preview-body :deep(.preview-toolbar) {
  justify-content: flex-end;
  padding: 4px 8px 0;
}
</style>
