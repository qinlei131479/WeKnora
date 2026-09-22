<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="$t('page.knowledgeFile.detailModel.title', '文件详情')"
    size="800px"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
    @close="handleClose"
  >
    <div class="model-body">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.baseInfo', '基本信息')" name="base" class="detail-pane">
          <el-descriptions :column="1" border>
            <el-descriptions-item v-if="details.createdAt" :label="getTimeLabel()" label-width="180px">
              <span class="detail-value">{{ parseTime(details.createdAt) }}</span>
            </el-descriptions-item>
            <el-descriptions-item v-if="details.type" :label="$t('page.knowledgeFile.detailModel.type')" label-width="180px">
              <el-tag size="small" :type="getTypeTheme()">{{ getTypeLabel() }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item
              v-if="details.channel && details.channel !== 'web'"
              :label="$t('page.knowledgeFile.detailModel.source')"
              label-width="180px"
            >
              <el-tag size="small" type="warning">{{ getChannelLabel(details.channel) }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane
          :label="$t('page.knowledgeFile.detailModel.customMetadata', '自定义元数据') + '(' + Object.keys(details.customMetadata || {}).length + ')'"
          name="customMetadata"
          class="detail-pane"
        >
          <el-descriptions v-if="Object.keys(details.customMetadata || {}).length" :column="1" border>
            <el-descriptions-item :label="$t('page.knowledgeFile.detailModel.customMetadata', '自定义元数据')" label-width="180px">
              <pre class="detail-value detail-json">{{ JSON.stringify(details.customMetadata, null, 2) }}</pre>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane v-if="details.source" :label="$t('page.knowledgeFile.detailModel.sourceUrl', 'URL 导入')" name="sourceUrl" class="detail-pane">
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="$t('page.knowledgeFile.detailModel.sourceUrl', 'URL 导入')" label-width="180px">
              <span class="detail-value">{{ details.source }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.summary', '摘要')" name="summary" class="detail-pane">
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="$t('page.knowledgeFile.detailModel.summary', '摘要')" label-width="180px">
              <span class="detail-value">{{ details.description }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-tab-pane>
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.fileContent', '文件内容')" name="content">
          <div class="content-wrapper" ref="mdContentWrap">
            <div>
              <div class="view-mode-buttons">
                <el-button
                  v-if="canPreview()"
                  size="small"
                  :type="viewMode === 'preview' ? 'primary' : ''"
                  @click="viewMode = 'preview'"
                  class="view-mode-btn"
                >
                  {{ $t('page.normal.preview.tab', '预览') }}
                </el-button>
                <el-button
                  v-if="!canPreview()"
                  size="small"
                  :type="viewMode === 'merged' ? 'primary' : ''"
                  @click="viewMode = 'merged'"
                  class="view-mode-btn"
                >
                  {{ $t('page.knowledgeFile.detailModel.viewMerged') }}
                </el-button>
                <el-button size="small" :type="viewMode === 'chunks' ? 'primary' : ''" @click="viewMode = 'chunks'" class="view-mode-btn">
                  {{ $t('page.knowledgeFile.detailModel.viewChunks', '查看分块') }}
                </el-button>

                <el-tag type="info" class="total-tag">{{
                  $t('page.knowledgeFile.detailModel.totalChunks', { total: chunkTotal || 0 }, `共${chunkTotal || 0}个片段`)
                }}</el-tag>
              </div>
            </div>
            <!-- 音频播放器（音频文件时固定显示在内容区顶部） -->
            <div v-if="isAudioFile(details.fileType)" class="audio-player-section">
              <div v-if="audioLoading" class="audio-loading">
                <div style="height: 20px; width: 100%">
                  <div v-loading="audioLoading"></div>
                </div>
                <span>{{ $t('page.normal.preview.audioLoading') }}</span>
              </div>
              <audio v-else-if="audioBlobUrl" controls class="audio-player" :src="audioBlobUrl">
                {{ $t('page.normal.preview.audioNotSupported') }}
              </audio>
            </div>

            <!-- 合并视图 -->
            <div v-if="viewMode === 'merged'" class="content-view">
              <div v-if="!mergedContent" class="no_content">{{ $t('page.normal.noData') }}</div>
              <el-scrollbar v-else @end-reached="handleChunkEndReached">
                <div class="md-content" v-html="processMarkdown(mergedContent)"></div>
              </el-scrollbar>
            </div>

            <!-- 分块视图 -->
            <div v-else-if="viewMode === 'chunks'" class="content-view">
              <div v-if="!processedChunks.length" class="no_content">{{ $t('page.normal.noData') }}</div>
              <el-scrollbar v-else @end-reached="handleChunkEndReached">
                <div class="chunk-list">
                  <div
                    class="chunk-item"
                    :class="{ 'chunk-item--disabled': !chunk.original.isEnabled }"
                    v-for="(chunk, index) in processedChunks"
                    :key="chunk.original.id || index"
                  >
                    <div class="chunk-header">
                      <div class="chunk-heading">
                        <span class="chunk-index">{{ $t('page.knowledgeFile.detailModel.segment', '分块') }} {{ Number(index) + 1 }}</span>
                        <span class="chunk-meta">{{ chunk.meta }}</span>
                      </div>
                      <div class="chunk-header-right">
                        <el-popover
                          v-if="chunk.questions.length > 0"
                          trigger="click"
                          overlay-class-name="chunk-questions-popup-overlay"
                          width="auto"
                          @show="() => setQuestionPopupVisible(chunk.original, true)"
                          @hide="() => setQuestionPopupVisible(chunk.original, false)"
                          @visible-change="(visible: boolean) => setQuestionPopupVisible(chunk.original, visible)"
                        >
                          <template #reference>
                            <el-button
                              class="icon-action-btn chunk-question-entry"
                              :class="{ 'is-active': questionPopupChunk === chunk.original.id }"
                              text
                              shape="square"
                              :title="$t('page.knowledgeFile.detailModel.generatedQuestions', '辅助召回问题')"
                            >
                              <template #icon><CircleHelp /></template>
                            </el-button>
                          </template>
                          <div class="chunk-questions-popup" @click.stop>
                            <div class="chunk-popup-head">
                              <div class="chunk-popup-title">
                                <el-icon><CircleHelp /></el-icon>
                                <span>{{ $t('page.knowledgeFile.detailModel.generatedQuestions', '辅助召回问题') }}</span>
                                <span class="chunk-popup-count">{{ chunk.questions.length }}</span>
                              </div>
                            </div>
                            <div class="chunk-questions-popup-body">
                              <div v-if="chunk.questions.length" class="questions-list">
                                <div v-for="question in chunk.questions" :key="question.id" class="question-item">
                                  <span class="question-text">{{ question.question }}</span>
                                  <!-- </template> -->
                                </div>
                              </div>
                              <div v-else class="questions-empty">
                                <t-icon name="chat-bubble-help" size="20px" />
                                <span>{{ $t('page.normal.noGeneratedQuestions', '暂无辅助召回问题') }}</span>
                              </div>
                            </div>
                          </div>
                        </el-popover>
                      </div>
                    </div>
                    <div class="md-content" :class="{ 'chunk-disabled': !chunk.original.isEnabled }" v-html="chunk.processedContent"></div>
                  </div>
                </div>
              </el-scrollbar>
            </div>

            <!-- 文档预览视图 -->
            <div v-else-if="viewMode === 'preview'" class="content-view">
              <DocumentPreview
                :knowledgeId="details.id"
                :fileType="details.fileType || ''"
                :fileName="details.title"
                :active="viewMode === 'preview' && activeTab === 'content'"
                :data="previewBlob"
                :dataKey="'kbfile:' + details.id"
                fill-height
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </KjscRtlDrawer>
</template>
<script setup lang="ts">
import { CircleHelp } from 'lucide-vue-next';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { KnowledgeFileDetail, KnowledgeFileEntity } from '@/types';
import { t } from '@/i18n';
import { getPreviewKnowledgeFileApi } from '@/api/data/knowledgeFile.js';
import { parseTime } from '@/utils/ruoyi.js';
import DocumentPreview from '@/components/DocumentPreview.vue';
import useFileDetailChunks from './useFileDetailChunks';

// Props
const props = defineProps<{
  visible: boolean;
  entity?: KnowledgeFileEntity;
}>();

// Emits
defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

let mdContentWrap = ref<HTMLDivElement | null>(null);

const activeTab = ref<string>('base');

const details = computed(() => {
  const entity = props.visible ? props.entity || {} : {};
  let customMetadata: Record<string, unknown> = {};
  if (entity.customMetadata) {
    try {
      const parsedMetadata: unknown = typeof entity.customMetadata === 'string' ? JSON.parse(entity.customMetadata) : entity.customMetadata;
      if (parsedMetadata && typeof parsedMetadata === 'object' && !Array.isArray(parsedMetadata)) {
        customMetadata = parsedMetadata as Record<string, unknown>;
      }
    } catch {
      customMetadata = {};
    }
  }
  let fileType = entity.fileType;
  return {
    ...entity,
    fileType: fileType,
    title: entity.fileName || entity.title || entity.source || t('knowledgeBase.untitledDocument'),
    time: parseTime(entity.updatedAt, '{y}-{m}-{d} {h}:{i}:{s}') || '',
    type: entity.type || 'file',
    customMetadata: customMetadata
  };
});

const {
  processMarkdown,
  processedChunks,
  mergedContent,
  chunkTotal,
  loadFirstPageChunk,
  loadMoreChunks,
  resetDetailChunks,
  setUpKnowledgeId,
  runMarkdownPostRenderPipeline
} = useFileDetailChunks({
  knowledgeId: props.entity?.id || '',
  t,
  getMarkdownRenderRoot: () => mdContentWrap.value
});

const handleChunkEndReached = (direction: string) => {
  if (direction === 'bottom') {
    loadMoreChunks();
  }
};
const previewBlob = ref<Blob | null>(null);

const handleClose = () => {
  activeTab.value = 'base';
  resetDetailChunks();
};
// 获取时间标签
const getTimeLabel = () => {
  switch (details.value.type) {
    case 'url':
      return t('page.knowledgeFile.detailModel.importTime');
    case 'manual':
      return t('page.knowledgeFile.detailModel.createTime');
    case 'file':
    default:
      return t('page.knowledgeFile.detailModel.uploadTime');
  }
};
// 获取类型主题色
const getTypeTheme = () => {
  switch (details.value.type) {
    case 'url':
      return 'primary';
    case 'manual':
      return 'success';
    case 'file':
      return 'default';
    default:
      return 'default';
  }
};
// 获取类型标签
const getTypeLabel = () => {
  const detail: KnowledgeFileDetail = details.value || {};
  switch (detail.type) {
    case 'url':
      return t('page.knowledgeFile.detailModel.typeURL');
    case 'manual':
      return t('page.knowledgeFile.detailModel.typeManual');
    case 'file':
      return detail.fileType ? detail.fileType.toUpperCase() : t('page.knowledgeFile.detailModel.typeFile');
    default:
      return '';
  }
};
const channelLabelMap: Record<string, string> = {
  web: 'page.knowledgeFile.detailModel.channelWeb',
  api: 'page.knowledgeFile.detailModel.channelApi',
  browser_extension: 'page.knowledgeFile.detailModel.channelBrowserExtension',
  wechat: 'page.knowledgeFile.detailModel.channelWechat',
  wecom: 'page.knowledgeFile.detailModel.channelWecom',
  feishu: 'page.knowledgeFile.detailModel.channelFeishu',
  // Drive (云盘) connectors get their own channel so Drive docs show
  // "飞书云盘" / "Lark 云盘", distinct from the wiki connector's "飞书".
  feishu_drive: 'page.knowledgeFile.detailModel.channelFeishuDrive',
  lark_drive: 'page.knowledgeFile.detailModel.channelLarkDrive',
  dingtalk: 'page.knowledgeFile.detailModel.channelDingtalk',
  slack: 'page.knowledgeFile.detailModel.channelSlack',
  im: 'page.knowledgeFile.detailModel.channelIm'
};

const getChannelLabel = (channel: string) => {
  const key = channelLabelMap[channel];
  return key ? t(key) : t('page.knowledgeFile.detailModel.channelUnknown');
};
const previewSupportedTypes = new Set([
  'pdf',
  'docx',
  'pptx',
  'ppt',
  'xlsx',
  'xls',
  'csv',
  'jpg',
  'jpeg',
  'png',
  'gif',
  'bmp',
  'webp',
  'tiff',
  'svg',
  'txt',
  'md',
  'markdown',
  'json',
  'xml',
  'html',
  'css',
  'js',
  'ts',
  'py',
  'java',
  'go',
  'cpp',
  'c',
  'h',
  'sh',
  'yaml',
  'yml',
  'ini',
  'conf',
  'log',
  'sql',
  'rs',
  'rb',
  'php',
  'swift',
  'kt',
  'scala',
  'r',
  'lua',
  'pl',
  'toml',
  'mp3',
  'wav',
  'm4a',
  'flac',
  'ogg'
]);

const canPreview = (): boolean => {
  if (details.value?.type !== 'file') return false;
  const ft = details.value?.fileType?.toLowerCase();
  if (!ft) return false;
  if (audioExtensions.has(ft)) return false; // 音频不走预览tab，播放器已内嵌
  return previewSupportedTypes.has(ft);
};

// 音频文件判断与播放器状态
const audioExtensions = new Set(['mp3', 'wav', 'm4a', 'flac', 'ogg']);
const isAudioFile = (fileType?: string): boolean => {
  if (!fileType) return false;
  return audioExtensions.has(fileType.toLowerCase());
};
const audioBlobUrl = ref('');
const audioLoading = ref(false);

// 视图模式：chunks / merged / preview
// file 类型默认「预览」，URL / 手动创建 默认「全文」
const viewMode = ref<'chunks' | 'merged' | 'preview'>('merged');

// 当文档详情加载完成时，file 类型自动切换到「预览」；音频类型使用 merged + 播放器
watch(
  () => details.value?.id,
  (newId?: string) => {
    // 清理旧音频
    if (audioBlobUrl.value) {
      URL.revokeObjectURL(audioBlobUrl.value);
      audioBlobUrl.value = '';
    }
    previewBlob.value = null;
    if (!newId) return;
    setUpKnowledgeId(newId);
    const detailsValue: KnowledgeFileDetail = details.value || {};
    let isAudio = isAudioFile(detailsValue.fileType);
    if (isAudio) {
      viewMode.value = 'merged'; // 音频默认全文视图，播放器已内嵌
      loadPrevewFile(true);
    } else if (detailsValue.type === 'file' && canPreview()) {
      viewMode.value = 'preview';
      loadPrevewFile(false);
    } else {
      viewMode.value = 'merged';
    }
    loadFirstPageChunk();
  }
);
const loadPrevewFile = async (isAudio: boolean) => {
  try {
    if (isAudio) {
      audioLoading.value = true;
    }
    const blob = await getPreviewKnowledgeFileApi(details.value.id!);
    if (isAudio) {
      audioBlobUrl.value = URL.createObjectURL(blob);
    } else {
      previewBlob.value = blob;
    }
  } catch (error) {
    console.error('Error fetching preview:', error);
  } finally {
    if (isAudio) {
      audioLoading.value = false;
    }
  }
};

const questionPopupChunk = ref('');
const setQuestionPopupVisible = (item: any, visible: boolean) => {
  questionPopupChunk.value = visible ? item.id : '';
};

watch(
  () => viewMode.value,
  (mode: 'chunks' | 'merged' | 'preview') => {
    if ((mode === 'chunks' || mode === 'merged') && props.visible) {
      runMarkdownPostRenderPipeline();
    }
  },
  { flush: 'post' }
);
</script>
<style scoped lang="scss">
@use '@/components/css/markdown.scss';
.model-body {
  height: 100%;
  .el-tabs {
    height: 100%;
    :deep(.el-tab-pane) {
      height: 100%;
    }
  }
}
.content-wrapper {
  overflow: auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
  .audio-player-section {
    flex-shrink: 0;
    flex-grow: 0;
  }
  .content-view {
    flex-grow: 1;
    overflow: auto;
  }
}
.collapse-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-mode-buttons {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
  align-items: center;

  .view-mode-btn {
    height: 28px;
    min-width: 60px;
  }
  .total-tag {
    margin-left: auto;
  }
}
// 音频播放器样式
.audio-player-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  // background: var(--el-bg-color-container-hover);
  border-radius: 6px;
  // border: 1px solid var(--el-component-border);
  border: var(--el-border);

  .audio-player {
    width: 100%;
    height: 40px;
  }

  .audio-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--el-text-color-placeholder);
    font-size: 13px;
    padding: 4px 0;
  }
}

.detail-pane {
  overflow-y: auto;
}

:deep(.el-descriptions__label),
:deep(.el-descriptions__content) {
  vertical-align: top;
}

.detail-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.detail-json {
  margin: 0;
}
.no_content {
  margin-top: 12px;
  color: var(--el-text-color-disabled);
  font-size: 13px;
  padding: 16px;
  text-align: center;
}

.md-content {
  word-break: break-word;
  line-height: 1.6;
  color: var(--el-text-color-primary);
  font-size: 14px;
  // :deep() {
  //   p,
  //   blockquote,
  //   ul,
  //   ol,
  //   dl,
  //   table {
  //     margin: 10px 0;
  //   }
  // }
  // :deep(p) {
  //   margin: 0;
  // }
}

.icon-action-btn {
  width: 28px;
  min-width: 28px;
  height: 28px;
  padding: 0;
  color: var(--el-text-color-secondary);
  border-radius: 4px;

  &:hover,
  &.is-active {
    color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }
}

// 保留旧样式作为兼容（已被chunk-item替代）
.content {
  word-break: break-word;
  padding: 4px;
  gap: 4px;
  margin-top: 12px;
}

// Chunk列表样式
.chunk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chunk-item {
  border-radius: 6px;
  padding: 12px 14px;
  // background: var(--el-bg-color);
  border: var(--el-border);

  // &.chunk-item--disabled {
  //   background: var(--el-bg-color-secondarycontainer);
  // }
}

.chunk-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 28px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--el-border-color);

  .chunk-heading {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    min-width: 0;
  }

  .chunk-index {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
  }

  .chunk-header-right {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .chunk-meta {
    color: var(--el-text-color-placeholder);
    font-size: 11px;
  }
}

.chunk-toolbar-divider {
  width: 1px;
  height: 16px;
  margin: 0 6px;
  background: var(--el-fill-color);
}

.chunk-editor {
  margin: 4px 0 10px;
  padding: 12px;
  border-radius: 5px;
  background: var(--el-bg-color-page);
}

.chunk-editor-label {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
}

.chunk-history-popup {
  width: min(560px, calc(100vw - 32px));
  max-height: min(620px, calc(100vh - 96px));
  overflow: hidden;
  border-radius: 6px;
  background: var(--el-bg-color-page);
}

.chunk-history-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px 7px;
  border-bottom: 1px solid var(--el-border-color);
}

.chunk-history-popup-title {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.chunk-history-current {
  margin-top: 2px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.chunk-history-popup-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 100px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.chunk-history-popup-list {
  max-height: min(520px, calc(100vh - 180px));
  overflow-y: auto;
}

.chunk-history-popup-item {
  border-bottom: 1px solid var(--el-border-color);

  &:last-child {
    border-bottom: none;
  }

  &.is-selected {
    background: var(--el-bg-color-page);
  }
}

.chunk-history-version-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 40px;
  padding: 8px 14px;
  border: none;
  color: var(--el-text-color-secondary);
  background: transparent;
  cursor: pointer;
  font: inherit;
  text-align: left;

  &:hover {
    background: var(--el-bg-color-container-hover);
  }
}

.chunk-history-version {
  min-width: 32px;
  color: var(--el-text-color-primary);
  font-size: 12px;
  font-weight: 600;
}

.chunk-history-time {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.chunk-history-status-change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  color: var(--el-text-color-secondary);
  font-size: 11px;
}

.chunk-history-row-chevron {
  margin-left: auto;
  color: var(--el-text-color-placeholder);
}

.chunk-history-status-change + .chunk-history-row-chevron {
  margin-left: 0;
}

.chunk-history-diff {
  padding: 0 12px 10px;
}

.chunk-history-diff-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  min-height: 30px;
  color: var(--el-text-color-placeholder);
  font-size: 11px;
}

.chunk-history-diff-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 0;
  flex-shrink: 0;
  color: var(--el-text-color-placeholder);
  font-size: 10px;
}

.chunk-history-diff-legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;

  i {
    width: 7px;
    height: 7px;
    border-radius: 2px;
  }

  &--add i {
    background: var(--el-color-success);
  }

  &--del i {
    background: var(--el-color-error);
  }
}

.chunk-history-no-diff {
  padding: 12px;
  border-radius: 4px;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color-page);
  text-align: center;
  font-size: 12px;
}

.chunk-history-diff-body {
  max-height: 240px;
  margin: 0;
  padding: 8px 0;
  overflow: auto;
  border: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: var(--el-bg-color-page);
  font-family: var(--app-font-family-mono);
  font-size: 11px;
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.chunk-history-diff-line {
  display: block;
  min-height: 17px;
  padding: 0 10px;

  &--add {
    color: var(--el-color-success-light-3);
    background: var(--el-color-success-light-9);
  }

  &--del {
    color: var(--el-color-error-light-3);
    background: var(--el-color-error-light-9);
  }

  &--same {
    color: var(--el-text-color-secondary);
  }

  &--skip {
    color: var(--el-text-color-placeholder);
  }
}

.chunk-context-popup,
.chunk-questions-popup {
  width: min(520px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 96px));
  overflow: hidden;
  border-radius: 6px;
  background: var(--el-bg-color-container);
}

.chunk-popup-head,
.chunk-popup-title,
.chunk-popup-actions,
.chunk-popup-state {
  display: flex;
  align-items: center;
}

.chunk-popup-head {
  justify-content: space-between;
  min-height: 38px;
  padding: 4px 8px 4px 12px;
  border-bottom: 1px solid var(--el-border-color);
}

.chunk-popup-title {
  gap: 7px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.chunk-popup-count {
  color: var(--el-text-color-placeholder);
  font-size: 11px;
  font-weight: 400;
}

.chunk-question-stale-hint {
  color: var(--el-color-warning);
  font-size: 11px;
  font-weight: 400;
}

.chunk-popup-actions {
  gap: 2px;
}

.chunk-popup-state {
  justify-content: center;
  gap: 8px;
  min-height: 120px;
  color: var(--el-text-color-placeholder);
  font-size: 12px;
}

.chunk-context-popup-body {
  max-height: min(480px, calc(100vh - 170px));
  padding: 14px 16px;
  overflow: auto;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.chunk-questions-popup-body {
  max-height: min(480px, calc(100vh - 170px));
  padding: 0 10px 8px;
  overflow-y: auto;
}

// 代码块样式
:deep(.code-block-wrapper) {
  margin: 12px 0;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  background: var(--el-fill-color);
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);

  .code-block-header {
    display: flex;
    align-items: center;
    padding: 8px 12px;
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color);
    font-size: 12px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .code-block-pre {
    margin: 0;
    padding: 12px;
    background: var(--el-fill-color-light);
    overflow: auto;
    font-size: 13px;
    line-height: 1.5;

    code {
      background: transparent;
      padding: 0;
      border: none;
      white-space: pre;
      word-wrap: normal;
      display: block;
    }
  }
}

.question-item,
.question-inline-editor,
.question-composer,
.questions-empty {
  display: flex;
  align-items: center;
}

.questions-list {
  padding-top: 0;
}

.question-item {
  align-items: center;
  gap: 8px;
  min-height: 34px;
  padding: 5px 6px;
  border-bottom: 1px solid var(--el-border-color);
  border-radius: 4px;
  background: transparent;
  font-size: 13px;
  color: var(--el-text-color-primary);
  line-height: 20px;

  &:hover {
    background: var(--el-bg-color-page);

    .question-actions {
      opacity: 1;
    }
  }

  .question-text {
    flex: 1;
    line-height: 20px;
    word-break: break-word;
  }

  .delete-question-btn {
    color: var(--el-text-color-placeholder);

    &:hover {
      color: var(--el-color-error);
      background: var(--el-color-error-light-9);
    }
  }
}

.question-leading-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 20px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}
</style>
