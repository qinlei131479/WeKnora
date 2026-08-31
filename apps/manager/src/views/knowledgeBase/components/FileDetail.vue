<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="$t('page.knowledgeFile.detailModel.title', '文件详情')"
    size="40%"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
    @close="handleClose"
  >
    <div class="model-body">
      <el-tabs v-model="activeTab">
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.baseInfo', '基本信息')" name="base">
          <div class="doc-detail-rows">
            <div v-if="details.createdAt" class="doc-detail-row">
              <span class="doc-detail-label">{{ getTimeLabel() }}</span>
              <span class="doc-detail-value">{{ parseTime(details.createdAt) }}</span>
            </div>
            <div v-if="details.type" class="doc-detail-row">
              <span class="doc-detail-label">{{ $t('page.knowledgeFile.detailModel.type') }}</span>
              <span class="doc-detail-value">
                <el-tag size="small" :type="getTypeTheme()">{{ getTypeLabel() }}</el-tag>
              </span>
            </div>
            <div v-if="details.channel && details.channel !== 'web'" class="doc-detail-row">
              <span class="doc-detail-label">{{ $t('page.knowledgeFile.detailModel.source') }}</span>
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
        </el-tab-pane>
        <el-tab-pane
          :label="$t('page.knowledgeFile.detailModel.customMetadata', '自定义元数据') + '(' + Object.keys(details.customMetadata || {}).length + ')'"
          name="customMetadata"
        >
          <div v-if="Object.keys(details.customMetadata || {}).length" class="metadata-grid">
            <div v-for="(value, key) in details.customMetadata || {}" :key="key" class="metadata-item">
              <span class="metadata-item-key">{{ key }}</span>
              <span class="metadata-item-value">{{ formatMetadataValue(value) }}</span>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane v-if="details.source" :label="$t('page.knowledgeFile.detailModel.sourceUrl', 'URL 导入')" name="sourceUrl">
          <div>
            {{ details.source }}
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.summary', '摘要')" name="summary">
          <div class="summary_wrapper">
            <div class="summary_content">{{ details.description }}</div>
          </div>
        </el-tab-pane>
        <el-tab-pane :label="$t('page.knowledgeFile.detailModel.fileContent', '文件内容')" name="content">
          <div class="content-wrapper">
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
                  $t('page.knowledgeFile.totalChunks', { total: details?.total || 0 }, `共${details?.total || 0}个片段`)
                }}</el-tag>
              </div>
            </div>
            <!-- 音频播放器（音频文件时固定显示在内容区顶部） -->
            <div v-if="isAudioFile(details.fileType)" class="audio-player-section">
              <div v-if="audioLoading" class="audio-loading">
                <el-loading size="small" />
                <span>{{ $t('page.normal.preview.audioLoading') }}</span>
              </div>
              <audio v-else-if="audioBlobUrl" controls class="audio-player" :src="audioBlobUrl">
                {{ $t('page.normal.preview.audioNotSupported') }}
              </audio>
            </div>

            <!-- 合并视图 -->
            <div v-if="viewMode === 'merged'" class="content-view">
              <div v-if="!mergedContent" class="no_content">{{ $t('page.normal.noData') }}</div>
              <div v-else class="md-content" v-html="processMarkdown(mergedContent)"></div>
            </div>

            <!-- 分块视图 -->
            <div v-else-if="viewMode === 'chunks'" class="content-view">
              <div v-if="!processedChunks.length" class="no_content">{{ $t('page.normal.noData') }}</div>
              <div v-else class="chunk-list">
                <div
                  class="chunk-item"
                  :class="{ 'chunk-item--disabled': !chunk.original.is_enabled }"
                  v-for="(chunk, index) in processedChunks"
                  :key="chunk.original.id || index"
                >
                  <div class="chunk-header">
                    <div class="chunk-heading">
                      <span class="chunk-index">{{ $t('page.knowledgeFile.detailModel.segment', '分块') }} {{ Number(index) + 1 }}</span>
                      <span class="chunk-meta">{{ chunk.meta }}</span>
                    </div>
                    <div class="chunk-header-right">
                      <t-tooltip
                        v-if="chunk.original.index_status === 'failed' && canEditContent"
                        :content="$t('page.knowledgeFile.detailModel.retryIndex')"
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
                          :title="$t('page.knowledgeFile.detailModel.viewParentContext', '查看父块上下文')"
                        >
                          <template #icon><t-icon name="git-branch" size="15px" /></template>
                        </t-button>
                        <template #content>
                          <div class="chunk-context-popup" @click.stop>
                            <div class="chunk-popup-head">
                              <div class="chunk-popup-title">
                                <t-icon name="git-branch" size="15px" />
                                <span>{{ $t('page.knowledgeFile.detailModel.viewParentContext', '查看父块上下文') }}</span>
                              </div>
                            </div>
                            <div v-if="parentContextLoading.has(index)" class="chunk-popup-state">
                              <t-loading size="small" />
                              <span>{{ $t('page.normal.loading') }}</span>
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
                          :title="$t('page.knowledgeFile.detailModel.generatedQuestions', '辅助召回问题')"
                        >
                          <template #icon><t-icon name="help-circle" size="15px" /></template>
                        </t-button>
                        <template #content>
                          <div class="chunk-questions-popup" @click.stop>
                            <div class="chunk-popup-head">
                              <div class="chunk-popup-title">
                                <t-icon name="help-circle" size="15px" />
                                <span>{{ $t('page.knowledgeFile.detailModel.generatedQuestions', '辅助召回问题') }}</span>
                                <span class="chunk-popup-count">{{ chunk.questions.length }}</span>
                                <span v-if="hasStaleGeneratedQuestions(chunk.original)" class="chunk-question-stale-hint">
                                  {{ $t('page.knowledgeFile.detailModel.staleGeneratedQuestions', '过期问题') }}
                                </span>
                              </div>
                              <div v-if="canEditContent" class="chunk-popup-actions">
                                <t-tooltip :content="$t('page.knowledgeFile.detailModel.addGeneratedQuestion', '添加辅助召回问题')" placement="top">
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
                                <t-tooltip :content="$t('page.knowledgeFile.detailModel.regenerateQuestions', '重新生成问题')" placement="top">
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
                                  :placeholder="$t('page.knowledgeFile.detailModel.addGeneratedQuestion', '添加辅助召回问题')"
                                  @enter="addQuestion(chunk.original)"
                                />
                                <t-tooltip :content="$t('page.normal.cancel', '取消')" placement="top">
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
                                  {{ $t('page.normal.add', '添加') }}
                                </t-button>
                              </div>
                              <div v-if="chunk.questions.length" class="questions-list">
                                <div v-for="question in chunk.questions" :key="question.id" class="question-item">
                                  <span class="question-leading-icon"><t-icon name="help-circle" size="14px" /></span>
                                  <div v-if="editingQuestionKey === `${chunk.original.id}:${question.id}`" class="question-inline-editor">
                                    <t-input v-model="questionEditDraft" autofocus @enter="saveQuestionEdit(chunk.original, question)" />
                                    <t-button size="small" variant="text" @click="cancelQuestionEdit">{{
                                      $t('page.normal.cancel', '取消')
                                    }}</t-button>
                                    <t-button
                                      size="small"
                                      theme="primary"
                                      :loading="savingQuestionKey === `${chunk.original.id}:${question.id}`"
                                      @click="saveQuestionEdit(chunk.original, question)"
                                      >{{ $t('page.normal.save', '保存') }}</t-button
                                    >
                                  </div>
                                  <template v-else>
                                    <span class="question-text">{{ question.question }}</span>
                                    <div class="question-actions">
                                      <t-tooltip
                                        v-if="canEditContent && !question.id.startsWith('legacy-')"
                                        :content="$t('page.normal.edit', '编辑')"
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
                                        :content="$t('page.normal.confirmDeleteQuestion', '确定要删除这个问题吗？删除后将同时移除对应的向量索引。')"
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
                                <span>{{ $t('page.normal.noGeneratedQuestions', '暂无辅助召回问题') }}</span>
                              </div>
                            </div>
                          </div>
                        </template>
                      </t-popup>
                      <template v-if="canEditContent">
                        <t-tooltip :content="$t('page.normal.edit', '编辑')" placement="top">
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
                            :title="$t('page.knowledgeFile.detailModel.chunkHistory', '分块编辑历史')"
                          >
                            <template #icon><t-icon name="history" size="15px" /></template>
                          </t-button>
                          <template #content>
                            <div class="chunk-history-popup" @click.stop>
                              <div class="chunk-history-popup-head">
                                <div>
                                  <div class="chunk-history-popup-title">
                                    <t-icon name="history" size="15px" />
                                    <span>{{ $t('page.knowledgeFile.detailModel.chunkHistory', '分块编辑历史') }}</span>
                                  </div>
                                  <div class="chunk-history-current">
                                    v{{ chunk.original.content_revision || 0 }} · {{ $t('page.knowledgeFile.detailModel.currentVersion') }} ·
                                    {{
                                      chunk.original.is_enabled
                                        ? $t('page.knowledgeFile.detailModel.enabledStatus')
                                        : $t('page.knowledgeFile.detailModel.disabledStatus')
                                    }}
                                  </div>
                                </div>
                                <div class="chunk-history-diff-legend">
                                  <span class="chunk-history-diff-legend-item chunk-history-diff-legend-item--add">
                                    <i />{{ $t('page.knowledgeFile.detailModel.diffAddedInCurrent') }}
                                  </span>
                                  <span class="chunk-history-diff-legend-item chunk-history-diff-legend-item--del">
                                    <i />{{ $t('page.knowledgeFile.detailModel.diffRemovedFromCurrent') }}
                                  </span>
                                </div>
                              </div>
                              <div v-if="chunkHistoryLoading === chunk.original.id" class="chunk-history-popup-state">
                                <t-loading size="small" />
                                <span>{{ $t('page.normal.loading') }}</span>
                              </div>
                              <div v-else-if="!(chunkHistories[chunk.original.id] || []).length" class="chunk-history-popup-state">
                                {{ $t('page.knowledgeFile.detailModel.noChunkHistory') }}
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
                                      {{
                                        revision.is_enabled
                                          ? $t('page.knowledgeFile.detailModel.enabledStatus')
                                          : $t('page.knowledgeFile.detailModel.disabledStatus')
                                      }}
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
                                        $t('page.knowledgeFile.detailModel.compareRevisionWithCurrent', {
                                          revision: revision.revision,
                                          current: chunk.original.content_revision || 0
                                        })
                                      }}</span>
                                      <t-popconfirm
                                        theme="warning"
                                        :content="$t('page.knowledgeFile.detailModel.revertRevisionConfirm', { revision: revision.revision })"
                                        @confirm="revertChunk(chunk.original, revision.revision)"
                                      >
                                        <t-button
                                          class="icon-action-btn"
                                          size="small"
                                          variant="text"
                                          shape="square"
                                          :title="$t('page.knowledgeFile.detailModel.revertRevision')"
                                          :loading="revertingRevision === `${chunk.original.id}:${revision.revision}`"
                                        >
                                          <template #icon><t-icon name="rollback" size="14px" /></template>
                                        </t-button>
                                      </t-popconfirm>
                                    </div>
                                    <div v-if="!compactChunkDiff(chunk.original).length" class="chunk-history-no-diff">
                                      {{ $t('page.knowledgeFile.detailModel.noContentChanges') }}
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
                          :content="
                            chunk.original.is_enabled
                              ? $t('page.knowledgeFile.detailModel.disableChunk')
                              : $t('page.knowledgeFile.detailModel.enableChunk')
                          "
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
                      <span>{{ $t('page.knowledgeFile.detailModel.editChunkContent') }}</span>
                    </div>
                    <t-textarea v-model="chunkDraft" :autosize="{ minRows: 6, maxRows: 20 }" autofocus />
                    <div class="chunk-editor-actions">
                      <t-button size="small" variant="outline" :disabled="savingChunkId === chunk.original.id" @click="editingChunkId = ''">{{
                        $t('page.normal.cancel')
                      }}</t-button>
                      <t-button size="small" theme="primary" :loading="savingChunkId === chunk.original.id" @click="saveChunkEdit(chunk.original)">{{
                        $t('page.normal.save')
                      }}</t-button>
                    </div>
                  </div>
                  <div v-else class="md-content" :class="{ 'chunk-disabled': !chunk.original.is_enabled }" v-html="chunk.processedContent"></div>
                </div>
              </div>
            </div>

            <!-- 文档预览视图 -->
            <div v-else-if="viewMode === 'preview'" class="content-view">
              <DocumentPreview
                :knowledgeId="details.id"
                :fileType="details.fileType"
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
      <el-collapse v-model="activeNames" expand-icon-position="left" style="display: none">
        <el-collapse-item :title="$t('page.knowledgeFile.detailModel.baseInfo', '基本信息')" name="base"> </el-collapse-item>
        <el-collapse-item name="customMetadata">
          <template #title="{ isActive }">
            <div class="title-content">
              <span>{{ $t('page.knowledgeFile.detailModel.customMetadata', '自定义元数据') }}</span>
              <el-tag v-if="Object.keys(details.customMetadata || {}).length" class="metadata-count" type="info">
                {{ Object.keys(details.customMetadata || {}).length }}/20
              </el-tag>
            </div>
          </template>
        </el-collapse-item>
        <el-collapse-item v-if="details.source" name="sourceUrl">
          <div>
            {{ details.source }}
          </div>
        </el-collapse-item>
        <el-collapse-item :title="$t('page.knowledgeFile.detailModel.summary', '摘要')" name="summary"> </el-collapse-item>
        <el-collapse-item :title="$t('page.knowledgeFile.detailModel.fileContent', '文件内容')" name="content">
          <template #title="{ isActive }">
            <div class="collapse-title-row">
              <div class="title-content">
                <span>{{ $t('page.knowledgeFile.detailModel.fileContent', '文件内容') }}</span>
                <!-- <el-tag type="info">{{
                  $t('page.knowledgeFile.totalChunks', { total: entity?.fileSize || 0 }, `共${entity?.fileSize || 0}个片段`)
                }}</el-tag> -->
              </div>
            </div>
          </template>
        </el-collapse-item>
      </el-collapse>
    </div>
  </KjscRtlDrawer>
</template>
<script setup lang="ts">
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
// import FileContentDetail from './FileContentDetail.vue';
import { KnowledgeFileChunk, KnowledgeFileDetail, KnowledgeFileEntity } from '@/types';
import { useI18n } from 'vue-i18n';
import { getPreviewKnowledgeFileApi } from '@/api/data/knowledgeFile.js';
import { parseTime } from '@/utils/ruoyi.js';
import DocumentPreview from '@/components/DocumentPreview.vue';
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
const activeTab = ref<string>('base');

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
  let fileType = entity.fileType;
  const isDev = import.meta.env.DEV;
  if (isDev) {
    fileType = 'mp3';
  }
  return {
    ...entity,
    fileType: fileType,
    title: entity.fileName || entity.title || entity.source || t('knowledgeBase.untitledDocument'),
    time: parseTime(entity.updatedAt, '{y}-{m}-{d} {h}:{i}:{s}'),
    type: entity.type || 'file',
    customMetadata: customMetadata,
    md: []
  } as KnowledgeFileDetail;
}) as { value: KnowledgeFileDetail };

const previewBlob = ref<Blob | null>(null);

// watch(
//   () => details.value?.id,
//   async (newId: string | undefined) => {
//     if (newId) {
//       try {
//         const response = await getPreviewKnowledgeFileApi(newId);
//         previewBlob.value = response;
//       } catch (error) {
//         console.error('Error fetching preview:', error);
//       }
//     }
//   }
// );
const handleClose = () => {
  activeTab.value = 'base';
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

// const loadAudioPreview = async () => {
//   if (!details.value?.id || audioBlobUrl.value) return;
//   audioLoading.value = true;
//   try {
//     const blob = await getPreviewKnowledgeFileApi(details.value.id);
//     audioBlobUrl.value = URL.createObjectURL(blob);
//   } catch (err) {
//     console.error('Audio preview load failed:', err);
//   } finally {
//     audioLoading.value = false;
//   }
// };

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
    let isAudio = isAudioFile(detailsValue.fileType);
    if (isAudio) {
      viewMode.value = 'merged'; // 音频默认全文视图，播放器已内嵌
      // loadAudioPreview();
      loadPrevewFile(true);
    } else if (detailsValue.type === 'file' && canPreview()) {
      viewMode.value = 'preview';
      loadPrevewFile(false);
    } else {
      viewMode.value = 'merged';
    }
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

// 合并后的文档内容
/**
 * 把已合并文本 acc 和下一个 chunk 内容 next 拼接，并去除两者的重叠部分。
 *
 * 不再依赖 start_at / end_at 做位置裁剪，而是用「文本重叠匹配」：在 next 的
 * 开头窗口里找 acc 后缀首次出现的位置，从该位置之后接上。这样能同时兼容：
 *  1. chunker 给拆分表格补写的表头（零宽 start/end，位置上不可见）——表头出现
 *     在重叠行之前，会被自然跳过；
 *  2. HTML 实体编码（&#34; 等）导致的 content 长度与原文区间不一致——比对的是
 *     文本本身，不受长度偏差影响。
 *
 * @param positionOverlap 由 start/end 估算的重叠量，仅用于界定搜索窗口大小。
 */
const appendChunkContent = (acc: string, next: string, positionOverlap: number): string => {
  if (!acc) return next;
  if (!next) return acc;

  const MIN_OVERLAP = 12; // 过短的后缀容易误匹配（如分隔行），忽略
  const span = Math.max(positionOverlap, 0);
  // 搜索的后缀最大长度；按位置重叠量放大几倍兜底，并设下限
  const maxK = Math.min(acc.length, next.length, Math.max(span * 3, 400));
  // 重叠行之前最多允许多少前缀（补写的表头）被跳过
  const headSlack = Math.max(span * 2, 320);

  for (let k = maxK; k >= MIN_OVERLAP; k--) {
    const suffix = acc.slice(acc.length - k);
    const pos = next.indexOf(suffix);
    if (pos !== -1 && pos <= headSlack) {
      return acc + next.slice(pos + k);
    }
  }
  return acc + next;
};
/**
 * 合并分块内容，还原完整文档。chunks 按 start_at 排序后逐段用文本重叠匹配拼接。
 */
const mergeChunks = (chunks: KnowledgeFileChunk[]): string => {
  if (!chunks || chunks.length === 0) return '';

  // 按 start_at 排序
  const sortedChunks = [...chunks].sort((a, b) => {
    const startA = a.startAt ?? a.chunkIndex ?? 0;
    const startB = b.startAt ?? b.chunkIndex ?? 0;
    return startA - startB;
  });

  let merged = sortedChunks[0].content || '';
  let mergedEnd = sortedChunks[0].endAt ?? 0;

  for (let i = 1; i < sortedChunks.length; i++) {
    const currentChunk = sortedChunks[i];
    const currentStartAt = currentChunk.startAt ?? 0;
    const currentEndAt = currentChunk.endAt ?? 0;
    const currentContent = currentChunk.content || '';

    if (!currentContent) continue;

    // 与上一段有明显间隙（位置不相邻），用空行分隔后整段拼接
    if (currentStartAt > mergedEnd && mergedEnd > 0) {
      merged = merged + '\n\n' + currentContent;
    } else {
      const positionOverlap = mergedEnd - currentStartAt;
      merged = appendChunkContent(merged, currentContent, positionOverlap);
    }

    if (currentEndAt > mergedEnd) {
      mergedEnd = currentEndAt;
    }
  }

  return merged;
};
// 监听 chunks 变化，自动更新合并内容
const mergedContent = computed(() => {
  const newChunks = props.details?.md;
  if (newChunks && newChunks.length > 0) {
    return mergeChunks(newChunks);
  }
  return '';
});
</script>
<style scoped lang="scss">
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

.doc-detail-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-detail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  line-height: 1.6;
}

.doc-detail-label {
  flex: 0 0 72px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.doc-detail-value {
  flex: 1;
  min-width: 0;
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--el-text-color-primary);
  word-break: break-word;
}

.metadata-grid {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 7px 18px;
}

.metadata-item {
  display: inline-flex;
  align-items: baseline;
  gap: 5px;
  min-width: 0;
}

.metadata-item-key,
.metadata-item-value {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metadata-item-key {
  color: var(--el-text-color-placeholder);
  font-size: 12px;

  &::after {
    content: ':';
  }
}

.metadata-item-value {
  color: var(--el-text-color-primary);
  font-size: 13px;
}

// 文档摘要区域
.summary_wrapper {
  position: relative;
  // background: var(--el-bg-color);
  border: var(--el-border);
  border-radius: 6px;
  max-height: 100%;
  overflow: auto;

  // &.summary_clickable {
  //   cursor: pointer;
  // }
}

.summary_content {
  padding: 12px;
  color: var(--el-text-color-primary);
  font-size: 13px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;

  // &.summary_collapsed {
  //   max-height: 4.5em;
  //   overflow: hidden;
  // }
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

  &.chunk-item--disabled {
    background: var(--el-bg-color-secondarycontainer);
  }
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
  border-bottom: 1px solid var(--td-component-stroke);

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
  background: var(--el-component-stroke);
}

.chunk-editor {
  margin: 4px 0 10px;
  padding: 12px;
  border-radius: 5px;
  background: var(--el-bg-color-secondarycontainer);
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
  background: var(--el-bg-color-container);
}

.chunk-history-popup-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 12px 7px;
  border-bottom: 1px solid var(--el-component-stroke);
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
  border-bottom: 1px solid var(--el-component-stroke);

  &:last-child {
    border-bottom: none;
  }

  &.is-selected {
    background: var(--el-bg-color-secondarycontainer);
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
    background: var(--el-success-color);
  }

  &--del i {
    background: var(--el-error-color);
  }
}

.chunk-history-no-diff {
  padding: 12px;
  border-radius: 4px;
  color: var(--el-text-color-placeholder);
  background: var(--el-bg-color-container);
  text-align: center;
  font-size: 12px;
}

.chunk-history-diff-body {
  max-height: 240px;
  margin: 0;
  padding: 8px 0;
  overflow: auto;
  border: 1px solid var(--el-component-border);
  border-radius: 4px;
  background: var(--el-bg-color-container);
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
    color: var(--el-success-color-active);
    background: var(--el-success-color-light);
  }

  &--del {
    color: var(--el-error-color-active);
    background: var(--el-error-color-light);
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
  border-bottom: 1px solid var(--el-component-stroke);
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
  color: var(--el-warning-color);
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
</style>
