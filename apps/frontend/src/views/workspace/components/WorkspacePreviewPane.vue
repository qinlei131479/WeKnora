<template>
  <aside class="workspace-preview-pane">
    <WorkspaceKnowledgePreview
      v-if="isKnowledgePreview"
      :knowledge-id="knowledgeId"
      :file-type="knowledgeFileType"
      :file-name="knowledgeFileName"
      :show-close="true"
      close-variant="collapse-right"
      @close="$emit('close')"
    />
    <AgentFilePreview
      v-else-if="file"
      :file="file"
      :file-path="filePath"
      :show-download="false"
      :show-close="true"
      close-variant="collapse-right"
      :show-fullscreen="true"
      :full-height="true"
      :editable="editable"
      :saving="saving"
      container-class="workspace-preview-container"
      content-class="workspace-preview-content"
      @close="$emit('close')"
      @save="$emit('save', $event)"
    />
    <div v-else-if="loading" class="preview-state">
      <t-loading size="small" />
      <span>{{ t('workspacePage.loadingPreview') }}</span>
    </div>
    <div v-else class="preview-empty">
      <FileSearch :size="28" />
      <h3>{{ t('workspacePage.selectToPreview') }}</h3>
      <p>{{ t('workspacePage.previewHint') }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { FileSearch } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import AgentFilePreview from '@harness/components/AgentFilePreview.vue'
import WorkspaceKnowledgePreview from './WorkspaceKnowledgePreview.vue'
import { resolveKnowledgePreviewFileType } from '@harness/utils/file_preview'

const { t } = useI18n()

const props = defineProps({
  file: { type: Object, default: null },
  filePath: { type: String, default: '' },
  loading: { type: Boolean, default: false },
  editable: { type: Boolean, default: false },
  saving: { type: Boolean, default: false }
})

defineEmits(['close', 'save'])

const isKnowledgePreview = computed(
  () => props.file?.source === 'knowledge' && Boolean(props.file?.file_id) && !props.file?.is_dir
)
const knowledgeId = computed(() => String(props.file?.file_id || ''))
const knowledgeFileName = computed(() => props.file?.name || props.file?.filename || props.filePath || '')
const knowledgeFileType = computed(() => resolveKnowledgePreviewFileType(props.file))
</script>

<style scoped lang="less">
.workspace-preview-pane {
  min-width: 0;
  min-height: 0;
  background: var(--gray-0);
  overflow: hidden;
}

:deep(.workspace-preview-container) {
  height: 100%;
  border-radius: 0;
}

:deep(.workspace-preview-content) {
  flex: 1 1 auto;
  max-height: none;
  min-height: 0;
}

:deep(.workspace-preview-content .html-preview),
:deep(.workspace-preview-content .pdf-preview) {
  display: block;
  height: 100%;
  min-height: 100%;
}

.preview-state,
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 260px;
  padding: 24px;
  color: var(--gray-500);
  text-align: center;
}

.preview-state {
  gap: 10px;
}

.preview-empty {
  gap: 8px;

  h3 {
    margin: 6px 0 0;
    color: var(--gray-800);
    font-size: 15px;
    font-weight: 600;
  }

  p {
    max-width: 240px;
    margin: 0;
    color: var(--gray-500);
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
