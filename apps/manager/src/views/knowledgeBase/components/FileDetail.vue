<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="$t('page.knowledgeFile.titleDetail', '文件详情')"
    size="40%"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
  >
    <div class="model-body">
      <el-collapse v-model="activeNames" expand-icon-position="left">
        <el-collapse-item :title="$t('page.knowledgeFile.baseInfo', '基本信息')" name="base">
          <div class="doc-detail-rows">
            <div v-if="details.createdAt" class="doc-detail-row">
              <span class="doc-detail-label">{{ getTimeLabel() }}</span>
              <span class="doc-detail-value">{{ parseTime(details.createdAt) }}</span>
            </div>
            <div v-if="details.type" class="doc-detail-row">
              <span class="doc-detail-label">{{ $t('knowledgeBase.infoCard.type') }}</span>
              <span class="doc-detail-value">
                <el-tag size="small" :type="getTypeTheme()">{{ getTypeLabel() }}</el-tag>
              </span>
            </div>
            <div v-if="details.channel && details.channel !== 'web'" class="doc-detail-row">
              <span class="doc-detail-label">{{ $t('knowledgeBase.infoCard.source') }}</span>
              <span class="doc-detail-value">
                <el-tag size="small" type="warning">{{ getChannelLabel(details.channel) }}</el-tag>
              </span>
            </div>
            <!-- <div v-if="detailTags.length > 0" class="doc-detail-row">
              <span class="doc-detail-label">{{ $t('knowledgeBase.tagLabel') }}</span>
              <span class="doc-detail-value doc-tag-chips">
                <t-tag v-for="tag in detailTags" :key="tag.id" size="small" variant="light-outline" class="doc-tag-chip">
                  <span class="tag-text">{{ tag.name }}</span>
                </t-tag>
              </span>
            </div> -->
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('page.knowledgeFile.customMetadata', '自定义元数据')" name="customMetadata">
          <template #title="{ isActive }">
            <div class="title-content">
              <span>{{ $t('page.knowledgeFile.customMetadata', '自定义元数据') }}</span>
              <el-tag v-if="Object.keys(details.customMetadata || {}).length" class="metadata-count" type="info">
                {{ Object.keys(details.customMetadata || {}).length }}/20
              </el-tag>
            </div>
          </template>
          <div v-if="Object.keys(details.customMetadata || {}).length" class="metadata-grid">
            <div v-for="(value, key) in details.customMetadata || {}" :key="key" class="metadata-item">
              <span class="metadata-item-key">{{ key }}</span>
              <span class="metadata-item-value">{{ formatMetadataValue(value) }}</span>
            </div>
          </div>
        </el-collapse-item>
        <el-collapse-item v-if="details.source" :title="$t('page.knowledgeFile.sourceUrl', '来源网址')" name="sourceUrl">
          <div>
            {{ details.source }}
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('page.knowledgeFile.summary', '摘要')" name="summary">
          <div class="summary_wrapper">
            <div class="summary_content'">{{ details.description }}</div>
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('page.knowledgeFile.fileContent', '文件内容')" name="content">
          <template #title="{ isActive }">
            <div class="collapse-title-row">
              <div class="title-content">
                <span>{{ $t('page.knowledgeFile.fileContent', '文件内容') }}</span>
                <!-- <el-tag type="info">{{
                  $t('page.knowledgeFile.totalChunks', { total: entity?.fileSize || 0 }, `共${entity?.fileSize || 0}个片段`)
                }}</el-tag> -->
              </div>
              <div>
                <div class="view-mode-buttons">
                  <el-button
                    v-if="canPreview()"
                    size="small"
                    :type="viewMode === 'preview' ? 'primary' : ''"
                    @click="viewMode = 'preview'"
                    class="view-mode-btn"
                  >
                    {{ $t('preview.tab') }}
                  </el-button>
                  <el-button
                    v-if="!canPreview()"
                    size="small"
                    :type="viewMode === 'merged' ? 'primary' : ''"
                    @click="viewMode = 'merged'"
                    class="view-mode-btn"
                  >
                    {{ $t('knowledgeBase.viewMerged') }}
                  </el-button>
                  <el-button size="small" :type="viewMode === 'chunks' ? 'primary' : ''" @click="viewMode = 'chunks'" class="view-mode-btn">
                    {{ $t('knowledgeBase.viewChunks') }}
                  </el-button>
                </div>
                <!-- <el-button type="primary" size="small">{{ $t('page.normal.preview', '预览') }}</el-button> -->
                <!-- <el-button size="small">{{ $t('page.knowledgeFile.showChunk', '查看分块') }}</el-button> -->
              </div>
            </div>
          </template>
          <!-- 音频播放器（音频文件时固定显示在内容区顶部） -->
          <div v-if="isAudioFile(details.fileType)" class="audio-player-section">
            <div v-if="audioLoading" class="audio-loading">
              <el-loading size="small" />
              <span>{{ $t('preview.audioLoading') }}</span>
            </div>
            <audio v-else-if="audioBlobUrl" controls class="audio-player" :src="audioBlobUrl">
              {{ $t('preview.audioNotSupported') }}
            </audio>
          </div>

          <!-- 合并视图 -->
          <div v-if="viewMode === 'merged'">
            <div v-if="!mergedContent" class="no_content">{{ $t('common.noData') }}</div>
            <div v-else class="md-content" v-html="processMarkdown(mergedContent)"></div>
          </div>

          <!-- 分块视图 -->
          <div v-else-if="viewMode === 'chunks'">
            <div v-if="!processedChunks.length" class="no_content">{{ $t('common.noData') }}</div>
            <div v-else class="chunk-list">
              <div
                class="chunk-item"
                :class="{ 'chunk-item--disabled': !chunk.original.is_enabled }"
                v-for="(chunk, index) in processedChunks"
                :key="chunk.original.id || index"
              >
                <div class="chunk-header">
                  <div class="chunk-heading">
                    <span class="chunk-index">{{ $t('knowledgeBase.segment') }} {{ Number(index) + 1 }}</span>
                    <span class="chunk-meta">{{ chunk.meta }}</span>
                  </div>
                  <div class="chunk-header-right">
                    <t-tooltip
                      v-if="chunk.original.index_status === 'failed' && canEditContent"
                      :content="$t('knowledgeBase.retryIndex')"
                      placement="top"
                    >
                      <t-button
                        class="icon-action-btn"
                        size="small"
                        theme="danger"
                        variant="text"
                        shape="square"
                        @click="retryChunkIndex(chunk.original)"
                      >
                        <template #icon><t-icon name="refresh" size="15px" /></template>
                      </t-button>
                    </t-tooltip>
                    <t-popup
                      v-if="chunk.hasParent"
                      :visible="parentContextPopup === chunk.original.id"
                      trigger="click"
                      placement="bottom-right"
                      :show-arrow="true"
                      destroy-on-close
                      :overlay-inner-style="{ padding: 0 }"
                      overlay-class-name="chunk-context-popup-overlay"
                      @visible-change="(visible: boolean) => setParentContextPopupVisible(chunk.original, index, visible)"
                    >
                      <t-button
                        class="icon-action-btn"
                        :class="{ 'is-active': parentContextPopup === chunk.original.id }"
                        size="small"
                        variant="text"
                        shape="square"
                        :title="$t('knowledgeBase.viewParentContext')"
                      >
                        <template #icon><t-icon name="git-branch" size="15px" /></template>
                      </t-button>
                      <template #content>
                        <div class="chunk-context-popup" @click.stop>
                          <div class="chunk-popup-head">
                            <div class="chunk-popup-title">
                              <t-icon name="git-branch" size="15px" />
                              <span>{{ $t('knowledgeBase.viewParentContext') }}</span>
                            </div>
                          </div>
                          <div v-if="parentContextLoading.has(index)" class="chunk-popup-state">
                            <t-loading size="small" />
                            <span>{{ $t('common.loading') }}</span>
                          </div>
                          <div v-else class="chunk-context-popup-body md-content" v-html="processMarkdown(getParentContent(chunk.original))"></div>
                        </div>
                      </template>
                    </t-popup>
                    <t-popup
                      v-if="chunk.questions.length > 0 || canEditContent"
                      :visible="questionPopupChunk === chunk.original.id"
                      trigger="click"
                      placement="bottom-right"
                      :show-arrow="true"
                      destroy-on-close
                      :overlay-inner-style="{ padding: 0 }"
                      overlay-class-name="chunk-questions-popup-overlay"
                      @visible-change="(visible: boolean) => setQuestionPopupVisible(chunk.original, visible)"
                    >
                      <t-button
                        class="icon-action-btn chunk-question-entry"
                        :class="{ 'is-active': questionPopupChunk === chunk.original.id }"
                        size="small"
                        variant="text"
                        shape="square"
                        :title="$t('knowledgeBase.generatedQuestions')"
                      >
                        <template #icon><t-icon name="help-circle" size="15px" /></template>
                      </t-button>
                      <template #content>
                        <div class="chunk-questions-popup" @click.stop>
                          <div class="chunk-popup-head">
                            <div class="chunk-popup-title">
                              <t-icon name="help-circle" size="15px" />
                              <span>{{ $t('knowledgeBase.generatedQuestions') }}</span>
                              <span class="chunk-popup-count">{{ chunk.questions.length }}</span>
                              <span v-if="hasStaleGeneratedQuestions(chunk.original)" class="chunk-question-stale-hint">
                                {{ $t('knowledgeBase.staleGeneratedQuestions') }}
                              </span>
                            </div>
                            <div v-if="canEditContent" class="chunk-popup-actions">
                              <t-tooltip :content="$t('knowledgeBase.addGeneratedQuestion')" placement="top">
                                <t-button
                                  class="icon-action-btn"
                                  size="small"
                                  variant="text"
                                  shape="square"
                                  @click.stop="openQuestionComposer(chunk.original)"
                                >
                                  <template #icon><t-icon name="add" size="15px" /></template>
                                </t-button>
                              </t-tooltip>
                              <t-tooltip :content="$t('knowledgeBase.regenerateQuestions')" placement="top">
                                <t-button
                                  class="icon-action-btn"
                                  size="small"
                                  variant="text"
                                  shape="square"
                                  :loading="regeneratingQuestionChunk === chunk.original.id"
                                  @click.stop="regenerateQuestions(chunk.original)"
                                >
                                  <template #icon><t-icon name="refresh" size="15px" /></template>
                                </t-button>
                              </t-tooltip>
                            </div>
                          </div>
                          <div class="chunk-questions-popup-body">
                            <div v-if="canEditContent && questionComposerChunk === chunk.original.id" class="question-composer">
                              <t-input
                                v-model="questionDrafts[chunk.original.id]"
                                autofocus
                                :placeholder="$t('knowledgeBase.addGeneratedQuestion')"
                                @enter="addQuestion(chunk.original)"
                              />
                              <t-tooltip :content="$t('common.cancel')" placement="top">
                                <t-button
                                  class="icon-action-btn"
                                  size="small"
                                  variant="text"
                                  shape="square"
                                  :disabled="savingQuestionChunk === chunk.original.id"
                                  @click="closeQuestionComposer(chunk.original)"
                                >
                                  <template #icon><t-icon name="close" size="14px" /></template>
                                </t-button>
                              </t-tooltip>
                              <t-button
                                size="small"
                                theme="primary"
                                :loading="savingQuestionChunk === chunk.original.id"
                                :disabled="!(questionDrafts[chunk.original.id] || '').trim()"
                                @click="addQuestion(chunk.original)"
                              >
                                {{ $t('common.add') }}
                              </t-button>
                            </div>
                            <div v-if="chunk.questions.length" class="questions-list">
                              <div v-for="question in chunk.questions" :key="question.id" class="question-item">
                                <span class="question-leading-icon"><t-icon name="help-circle" size="14px" /></span>
                                <div v-if="editingQuestionKey === `${chunk.original.id}:${question.id}`" class="question-inline-editor">
                                  <t-input v-model="questionEditDraft" autofocus @enter="saveQuestionEdit(chunk.original, question)" />
                                  <t-button size="small" variant="text" @click="cancelQuestionEdit">{{ $t('common.cancel') }}</t-button>
                                  <t-button
                                    size="small"
                                    theme="primary"
                                    :loading="savingQuestionKey === `${chunk.original.id}:${question.id}`"
                                    @click="saveQuestionEdit(chunk.original, question)"
                                    >{{ $t('common.save') }}</t-button
                                  >
                                </div>
                                <template v-else>
                                  <span class="question-text">{{ question.question }}</span>
                                  <div class="question-actions">
                                    <t-tooltip
                                      v-if="canEditContent && !question.id.startsWith('legacy-')"
                                      :content="$t('common.edit')"
                                      placement="top"
                                    >
                                      <t-button
                                        class="icon-action-btn"
                                        theme="default"
                                        variant="text"
                                        shape="square"
                                        size="small"
                                        @click.stop="startQuestionEdit(chunk.original, question)"
                                      >
                                        <template #icon><t-icon name="edit" size="14px" /></template>
                                      </t-button>
                                    </t-tooltip>
                                    <t-popconfirm
                                      v-if="canDeleteGeneratedQuestion && !question.id.startsWith('legacy-')"
                                      theme="warning"
                                      :content="$t('knowledgeBase.confirmDeleteQuestion')"
                                      @confirm="handleDeleteQuestion(chunk.original, index, question)"
                                    >
                                      <t-button
                                        class="icon-action-btn delete-question-btn"
                                        theme="default"
                                        variant="text"
                                        shape="square"
                                        size="small"
                                        :loading="isDeleting(index, question.id)"
                                      >
                                        <template #icon><t-icon name="delete" size="14px" /></template>
                                      </t-button>
                                    </t-popconfirm>
                                  </div>
                                </template>
                              </div>
                            </div>
                            <div v-else-if="questionComposerChunk !== chunk.original.id" class="questions-empty">
                              <t-icon name="chat-bubble-help" size="20px" />
                              <span>{{ $t('knowledgeBase.noGeneratedQuestions') }}</span>
                            </div>
                          </div>
                        </div>
                      </template>
                    </t-popup>
                    <template v-if="canEditContent">
                      <t-tooltip :content="$t('common.edit')" placement="top">
                        <t-button
                          class="icon-action-btn"
                          :class="{ 'is-active': editingChunkId === chunk.original.id }"
                          size="small"
                          variant="text"
                          shape="square"
                          @click="startChunkEdit(chunk.original)"
                        >
                          <template #icon><t-icon name="edit" size="15px" /></template>
                        </t-button>
                      </t-tooltip>
                      <t-popup
                        :visible="chunkHistoryPopup === chunk.original.id"
                        trigger="click"
                        placement="bottom-right"
                        :show-arrow="true"
                        destroy-on-close
                        :overlay-inner-style="{ padding: 0 }"
                        overlay-class-name="chunk-history-popup-overlay"
                        @visible-change="(visible: boolean) => setChunkHistoryPopupVisible(chunk.original, visible)"
                      >
                        <t-button
                          class="icon-action-btn"
                          :class="{ 'is-active': chunkHistoryPopup === chunk.original.id }"
                          size="small"
                          variant="text"
                          shape="square"
                          :title="$t('knowledgeBase.chunkHistory')"
                        >
                          <template #icon><t-icon name="history" size="15px" /></template>
                        </t-button>
                        <template #content>
                          <div class="chunk-history-popup" @click.stop>
                            <div class="chunk-history-popup-head">
                              <div>
                                <div class="chunk-history-popup-title">
                                  <t-icon name="history" size="15px" />
                                  <span>{{ $t('knowledgeBase.chunkHistory') }}</span>
                                </div>
                                <div class="chunk-history-current">
                                  v{{ chunk.original.content_revision || 0 }} · {{ $t('knowledgeBase.currentVersion') }} ·
                                  {{ chunk.original.is_enabled ? $t('knowledgeBase.enabledStatus') : $t('knowledgeBase.disabledStatus') }}
                                </div>
                              </div>
                              <div class="chunk-history-diff-legend">
                                <span class="chunk-history-diff-legend-item chunk-history-diff-legend-item--add">
                                  <i />{{ $t('knowledgeBase.diffAddedInCurrent') }}
                                </span>
                                <span class="chunk-history-diff-legend-item chunk-history-diff-legend-item--del">
                                  <i />{{ $t('knowledgeBase.diffRemovedFromCurrent') }}
                                </span>
                              </div>
                            </div>
                            <div v-if="chunkHistoryLoading === chunk.original.id" class="chunk-history-popup-state">
                              <t-loading size="small" />
                              <span>{{ $t('common.loading') }}</span>
                            </div>
                            <div v-else-if="!(chunkHistories[chunk.original.id] || []).length" class="chunk-history-popup-state">
                              {{ $t('knowledgeBase.noChunkHistory') }}
                            </div>
                            <div v-else class="chunk-history-popup-list">
                              <div
                                v-for="(revision, revisionIndex) in chunkHistories[chunk.original.id]"
                                :key="revision.id"
                                class="chunk-history-popup-item"
                                :class="{ 'is-selected': selectedChunkRevision[chunk.original.id] === revision.revision }"
                              >
                                <button
                                  type="button"
                                  class="chunk-history-version-row"
                                  @click="selectChunkRevision(chunk.original, revision.revision)"
                                >
                                  <span class="chunk-history-version">v{{ revision.revision }}</span>
                                  <span class="chunk-history-time">{{ new Date(revision.edited_at).toLocaleString() }}</span>
                                  <span v-if="revisionStatusChanged(chunk.original, revisionIndex)" class="chunk-history-status-change">
                                    <t-icon :name="revision.is_enabled ? 'play-circle' : 'stop-circle'" size="13px" />
                                    {{ revision.is_enabled ? $t('knowledgeBase.enabledStatus') : $t('knowledgeBase.disabledStatus') }}
                                  </span>
                                  <t-icon
                                    :name="selectedChunkRevision[chunk.original.id] === revision.revision ? 'chevron-up' : 'chevron-down'"
                                    size="14px"
                                    class="chunk-history-row-chevron"
                                  />
                                </button>
                                <div v-if="selectedChunkRevision[chunk.original.id] === revision.revision" class="chunk-history-diff">
                                  <div class="chunk-history-diff-head">
                                    <span>{{
                                      $t('knowledgeBase.compareRevisionWithCurrent', {
                                        revision: revision.revision,
                                        current: chunk.original.content_revision || 0
                                      })
                                    }}</span>
                                    <t-popconfirm
                                      theme="warning"
                                      :content="$t('knowledgeBase.revertRevisionConfirm', { revision: revision.revision })"
                                      @confirm="revertChunk(chunk.original, revision.revision)"
                                    >
                                      <t-button
                                        class="icon-action-btn"
                                        size="small"
                                        variant="text"
                                        shape="square"
                                        :title="$t('knowledgeBase.revertRevision')"
                                        :loading="revertingRevision === `${chunk.original.id}:${revision.revision}`"
                                      >
                                        <template #icon><t-icon name="rollback" size="14px" /></template>
                                      </t-button>
                                    </t-popconfirm>
                                  </div>
                                  <div v-if="!compactChunkDiff(chunk.original).length" class="chunk-history-no-diff">
                                    {{ $t('knowledgeBase.noContentChanges') }}
                                  </div>
                                  <pre v-else class="chunk-history-diff-body"><span
                                    v-for="(line, lineIndex) in compactChunkDiff(chunk.original)" :key="lineIndex"
                                    :class="['chunk-history-diff-line', `chunk-history-diff-line--${line.type}`]">{{ diffLinePrefix(line.type) }}{{ line.text }}
</span></pre>
                                </div>
                              </div>
                            </div>
                          </div>
                        </template>
                      </t-popup>
                      <span class="chunk-toolbar-divider" />
                      <t-tooltip
                        :content="chunk.original.is_enabled ? $t('knowledgeBase.disableChunk') : $t('knowledgeBase.enableChunk')"
                        placement="top"
                      >
                        <t-switch
                          :key="`${chunk.original.id}-${chunk.original.is_enabled}`"
                          size="small"
                          :value="chunk.original.is_enabled"
                          :loading="chunkStatusLoading === chunk.original.id"
                          :disabled="chunkStatusLoading === chunk.original.id"
                          @change="(value: boolean) => toggleChunkEnabled(chunk.original, value)"
                        />
                      </t-tooltip>
                    </template>
                  </div>
                </div>
                <div v-if="editingChunkId === chunk.original.id" class="chunk-editor">
                  <div class="chunk-editor-label">
                    <t-icon name="edit" size="14px" />
                    <span>{{ $t('knowledgeBase.editChunkContent') }}</span>
                  </div>
                  <t-textarea v-model="chunkDraft" :autosize="{ minRows: 6, maxRows: 20 }" autofocus />
                  <div class="chunk-editor-actions">
                    <t-button size="small" variant="outline" :disabled="savingChunkId === chunk.original.id" @click="editingChunkId = ''">{{
                      $t('common.cancel')
                    }}</t-button>
                    <t-button size="small" theme="primary" :loading="savingChunkId === chunk.original.id" @click="saveChunkEdit(chunk.original)">{{
                      $t('common.save')
                    }}</t-button>
                  </div>
                </div>
                <div v-else class="md-content" :class="{ 'chunk-disabled': !chunk.original.is_enabled }" v-html="chunk.processedContent"></div>
              </div>
            </div>
          </div>

          <!-- 文档预览视图 -->
          <div v-else-if="viewMode === 'preview'">
            <DocumentPreview :knowledgeId="details.id" :fileType="details.file_type" :fileName="details.title" :active="viewMode === 'preview'" />
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
  </KjscRtlDrawer>
</template>
<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
// import FileContentDetail from './FileContentDetail.vue';
import { KnowledgeFileDetail, KnowledgeFileEntity } from '@/types';
import { useI18n } from 'vue-i18n';
import { getPreviewKnowledgeFileApi } from '@/api/data/knowledgeFile.js';
import { parseTime } from '@/utils/ruoyi.js';
const { t } = useI18n();

// Props
const props = defineProps<{
  visible: boolean;
  entity?: KnowledgeFileEntity;
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const activeNames = ref<string[]>(['base', 'customMetadata', 'summary', 'content']);

const details = computed(() => {
  const entity = props.entity || {};
  let customMetadata = entity.customMetadata;
  if (customMetadata) {
    const customMetadataType = typeof customMetadata;
    if (customMetadataType === 'string') {
      try {
        customMetadata = JSON.parse(customMetadata);
      } catch (error) {
        customMetadata = {};
      }
    }
  } else {
    customMetadata = {};
  }
  return {
    ...entity,
    title: entity.fileName || entity.title || entity.source || t('knowledgeBase.untitledDocument'),
    time: parseTime(entity.updatedAt, '{y}-{m}-{d} {h}:{i}:{s}'),
    type: entity.type || 'file',
    customMetadata: customMetadata,
    md: []
  } as KnowledgeFileDetail;
}) as { value: KnowledgeFileDetail };

// 获取时间标签
const getTimeLabel = () => {
  switch (details.value.type) {
    case 'url':
      return t('knowledgeBase.importTime');
    case 'manual':
      return t('knowledgeBase.createTime');
    case 'file':
    default:
      return t('knowledgeBase.uploadTime');
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
      return t('knowledgeBase.typeURL');
    case 'manual':
      return t('knowledgeBase.typeManual');
    case 'file':
      return detail.fileType ? detail.fileType.toUpperCase() : t('knowledgeBase.typeFile');
    default:
      return '';
  }
};
const channelLabelMap: Record<string, string> = {
  web: 'knowledgeBase.channelWeb',
  api: 'knowledgeBase.channelApi',
  browser_extension: 'knowledgeBase.channelBrowserExtension',
  wechat: 'knowledgeBase.channelWechat',
  wecom: 'knowledgeBase.channelWecom',
  feishu: 'knowledgeBase.channelFeishu',
  // Drive (云盘) connectors get their own channel so Drive docs show
  // "飞书云盘" / "Lark 云盘", distinct from the wiki connector's "飞书".
  feishu_drive: 'knowledgeBase.channelFeishuDrive',
  lark_drive: 'knowledgeBase.channelLarkDrive',
  dingtalk: 'knowledgeBase.channelDingtalk',
  slack: 'knowledgeBase.channelSlack',
  im: 'knowledgeBase.channelIm'
};

const getChannelLabel = (channel: string) => {
  const key = channelLabelMap[channel];
  return key ? t(key) : t('knowledgeBase.channelUnknown');
};
// const detailTags = computed(() => {
//   const tags = details.value?.tags;
//   // const tags: any[] = [];
//   return Array.isArray(tags) ? tags : [];
// });
const formatMetadataValue = (value: unknown) => {
  if (value === null) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
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

const loadAudioPreview = async () => {
  if (!details.value?.id || audioBlobUrl.value) return;
  audioLoading.value = true;
  try {
    const blob = await getPreviewKnowledgeFileApi(details.value.id);
    audioBlobUrl.value = URL.createObjectURL(blob);
  } catch (err) {
    console.error('Audio preview load failed:', err);
  } finally {
    audioLoading.value = false;
  }
};

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
    if (!newId) return;
    const detailsValue: KnowledgeFileDetail = details.value || {};
    if (isAudioFile(detailsValue.fileType)) {
      viewMode.value = 'merged'; // 音频默认全文视图，播放器已内嵌
      loadAudioPreview();
    } else if (detailsValue.type === 'file' && canPreview()) {
      viewMode.value = 'preview';
    } else {
      viewMode.value = 'merged';
    }
  }
);
</script>
<style scoped lang="scss">
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

  .view-mode-btn {
    height: 28px;
    min-width: 60px;
  }
}
// 音频播放器样式
.audio-player-section {
  margin-bottom: 16px;
  padding: 12px 16px;
  background: var(--td-bg-color-container-hover);
  border-radius: 6px;
  border: 1px solid var(--td-component-border);

  .audio-player {
    width: 100%;
    height: 40px;
  }

  .audio-loading {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--td-text-color-placeholder);
    font-size: 13px;
    padding: 4px 0;
  }
}
</style>
