<template>
  <el-drawer :model-value="visible" @update:model-value="$emit('update:visible', $event)" :title="modelTitle" size="60%">
    <div class="model-body">
      <el-tabs v-model="currentSection">
        <el-tab-pane v-for="item in navTabs" :key="item.key" :label="item.label" :name="item.key"></el-tab-pane>
      </el-tabs>
      <div class="settings-container">
        <div class="settings-content">
          <div class="content-wrapper">
            <!-- 基本信息 -->
            <div v-show="currentSection === 'basic'" class="section">
              <div v-if="formData" class="section-content">
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.basic.kbId', '知识库 ID') }}</label>
                      <div class="form-value">{{ activeKbId }}</div>
                      <!-- <div class="kb-id-field">
                        <code class="kb-id-value" :title="activeKbId">{{ activeKbId }}</code>
                        <el-tooltip :content="$t('common.copy', '复制')" placement="top">
                          <el-button text size="small" class="kb-id-copy" @click="copyKbId">
                            <el-icon><DocumentCopy /></el-icon>
                          </el-button>
                        </el-tooltip>
                      </div> -->
                    </div>

                    <div class="form-item">
                      <label class="form-label required">{{ $t('component.knowledgeEditor.basic.typeLabel', '知识库类型') }}</label>
                      <div class="form-value">
                        {{
                          formData.type === 'document'
                            ? $t('component.knowledgeEditor.basic.typeDocument', '文档类型')
                            : $t('component.knowledgeEditor.basic.typeFAQ', 'FAQ 类型')
                        }}
                      </div>
                    </div>

                    <!-- 索引策略 -->
                    <div v-if="!isFAQ" class="form-item">
                      <label class="form-label required">{{ $t('component.knowledgeEditor.indexing.title', '索引策略') }}</label>
                      <div class="form-value">
                        <span v-if="formData.indexingStrategy.vectorEnabled">
                          {{ $t('component.knowledgeEditor.indexing.searchTitle', '向量检索') }}
                        </span>
                        <span v-if="formData.indexingStrategy.wikiEnabled">
                          {{ $t('component.knowledgeEditor.indexing.wikiTitle', 'Wiki 图谱') }}
                        </span>
                      </div>
                      <!-- <p class="form-tip">{{ $t('component.knowledgeEditor.indexing.description', '选择知识库的索引方式') }}</p> -->
                      <!-- <div class="indexing-checks" :class="{ 'is-locked': isIndexingLocked }">
                        <div
                          class="indexing-check-item"
                          :class="{ 'is-checked': formData.indexingStrategy.vectorEnabled, 'is-disabled': isIndexingLocked }"
                          @click="toggleVectorIndexing"
                        >
                          <el-checkbox :model-value="formData.indexingStrategy.vectorEnabled" :disabled="isIndexingLocked" class="indexing-check-box">{{
                            $t('component.knowledgeEditor.indexing.searchTitle', '向量检索')
                          }}</el-checkbox>
                          <p class="indexing-check-desc">{{ $t('component.knowledgeEditor.indexing.searchDesc', '基于语义相似度的智能检索') }}</p>
                        </div>
                        <div
                          class="indexing-check-item"
                          :class="{ 'is-checked': formData.indexingStrategy.wikiEnabled, 'is-disabled': isIndexingLocked }"
                          @click="toggleWikiIndexing"
                        >
                          <el-checkbox :model-value="formData.indexingStrategy.wikiEnabled" :disabled="isIndexingLocked" class="indexing-check-box">
                            <span class="indexing-check-title">
                              {{ $t('component.knowledgeEditor.indexing.wikiTitle', 'Wiki 图谱') }}
                              <span class="indexing-new-badge">NEW</span>
                            </span>
                          </el-checkbox>
                          <p class="indexing-check-desc">{{ $t('component.knowledgeEditor.indexing.wikiDesc', '构建知识图谱，支持关系推理') }}</p>
                        </div>
                      </div> -->
                      <!-- <p v-if="isIndexingLocked" class="form-tip locked-tip">
                        {{ $t('component.knowledgeEditor.indexing.lockedTip', '已有文档时无法修改索引策略') }}
                      </p> -->
                    </div>

                    <!-- Wiki 提取粒度 -->
                    <div v-if="!isFAQ && formData.indexingStrategy.wikiEnabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.wiki.extractionGranularityLabel', '提取粒度') }}</label>
                      <div class="form-value">
                        <span v-if="resolvedGranularity === 'focused'">{{ $t('component.knowledgeEditor.wiki.granularityFocused', '精简') }}</span>
                        <span v-else-if="resolvedGranularity === 'standard'">{{
                          $t('component.knowledgeEditor.wiki.granularityStandard', '标准')
                        }}</span>
                        <span v-else-if="resolvedGranularity === 'exhaustive'">{{
                          $t('component.knowledgeEditor.wiki.granularityExhaustive', '详尽')
                        }}</span>
                      </div>
                      <!-- <p class="form-tip">{{ $t('component.knowledgeEditor.wiki.extractionGranularityTip', '控制知识提取的详细程度') }}</p> -->
                      <!-- <el-radio-group :model-value="resolvedGranularity" class="granularity-radio-group" @change="handleGranularityChange">
                        <el-radio-button value="focused">
                          {{ $t('component.knowledgeEditor.wiki.granularityFocused', '精简') }}
                        </el-radio-button>
                        <el-radio-button value="standard">
                          {{ $t('component.knowledgeEditor.wiki.granularityStandard', '标准') }}
                        </el-radio-button>
                        <el-radio-button value="exhaustive">
                          {{ $t('component.knowledgeEditor.wiki.granularityExhaustive', '详尽') }}
                        </el-radio-button>
                      </el-radio-group>
                      <p class="form-tip granularity-hint">{{ granularityHint }}</p> -->
                    </div>

                    <div v-if="!isFAQ && formData.indexingStrategy.wikiEnabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.wiki.contentInstructionsLabel', '内容指令') }}</label>
                      <!-- <p class="form-tip">{{ $t('component.knowledgeEditor.wiki.contentInstructionsTip', '指导内容提取的指令') }}</p> -->
                      <!-- <el-input
                        v-model="formData.wikiConfig.contentInstructions"
                        type="textarea"
                        :disabled="editorMode === 'detail'"
                        :placeholder="$t('component.knowledgeEditor.wiki.contentInstructionsPlaceholder', '请输入内容提取指令...')"
                        :maxlength="4000"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                      /> -->
                      <div class="form-value">
                        {{ formData.wikiConfig.contentInstructions }}
                      </div>
                    </div>

                    <div v-if="!isFAQ && formData.indexingStrategy.wikiEnabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.wiki.extractionInstructionsLabel', '提取指令') }}</label>
                      <!-- <p class="form-tip">{{ $t('component.knowledgeEditor.wiki.extractionInstructionsTip', '指导实体和关系提取的指令') }}</p> -->
                      <!-- <el-input
                        v-model="formData.wikiConfig.extractionInstructions"
                        type="textarea"
                        :disabled="editorMode === 'detail'"
                        :placeholder="$t('component.knowledgeEditor.wiki.extractionInstructionsPlaceholder', '请输入提取指令...')"
                        :maxlength="4000"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                      /> -->
                      <div class="form-value">
                        {{ formData.wikiConfig.extractionInstructions }}
                      </div>
                    </div>

                    <div class="form-item">
                      <label class="form-label required">{{ $t('component.knowledgeEditor.basic.nameLabel', '知识库名称') }}</label>
                      <!-- <el-input
                        v-model="formData.name"
                        :disabled="editorMode === 'detail'"
                        :placeholder="$t('component.knowledgeEditor.basic.namePlaceholder', '请输入知识库名称')"
                        :maxlength="50"
                      /> -->
                      <div class="form-value">
                        {{ formData.name }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.basic.descriptionLabel', '知识库描述') }}</label>
                      <!-- <el-input
                        v-model="formData.description"
                        type="textarea"
                        :disabled="editorMode === 'detail'"
                        :placeholder="$t('component.knowledgeEditor.basic.descriptionPlaceholder', '请输入知识库描述')"
                        :maxlength="200"
                        :autosize="{ minRows: 3, maxRows: 6 }"
                      /> -->
                      <div class="form-value">
                        {{ formData.description }}
                      </div>
                    </div>
                  </div>
                  <!-- <el-divider></el-divider> -->
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.models.llmLabel') }}</label>
                      <div class="form-value">
                        {{ formData.modelConfig.llmModel?.name }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.models.embeddingLabel') }}</label>
                      <div class="form-value">
                        {{ formData.modelConfig.embeddingModel?.name }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.wiki.synthesisModelLabel') }}</label>
                      <div class="form-value">
                        {{ formData.modelConfig.wikiSynthesisModel?.name }}
                      </div>
                    </div>
                  </div>
                  <!-- <el-divider></el-divider> -->
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.kbSettings.vectorStore.boundLabel') }}</label>
                      <div class="form-value">
                        <!-- <VectorStoreBadge
                          :source="formData.vectorStoreInfo?.source"
                          :name="formData.vectorStoreInfo?.name"
                          :engine-type="formData.vectorStoreInfo?.engineType"
                          :status="formData.vectorStoreInfo?.status"
                        /> -->
                        {{ formData.vectorStoreInfo?.name }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- FAQ 配置 -->
            <div v-if="isFAQ && formData" v-show="currentSection === 'faq'" class="section">
              <div class="section-content">
                <!-- <div class="section-header">
                  <h3 class="section-title">{{ $t('component.knowledgeEditor.faq.title', 'FAQ 配置') }}</h3>
                  <p class="section-desc">{{ $t('component.knowledgeEditor.faq.description', '配置 FAQ 知识库的索引方式') }}</p>
                </div> -->
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.faq.indexModeLabel', '索引模式') }}</label>
                      <div class="form-value">
                        <span v-if="formData.faqConfig.indexMode === 'question_only'">{{
                          $t('component.knowledgeEditor.faq.modes.questionOnly', '仅问题')
                        }}</span>
                        <span v-else-if="formData.faqConfig.indexMode === 'question_answer'">{{
                          $t('component.knowledgeEditor.faq.modes.questionAnswer', '问题+答案')
                        }}</span>
                      </div>
                      <!-- <p class="form-tip">{{ $t('component.knowledgeEditor.faq.indexModeDescription', '选择索引内容的范围') }}</p> -->
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.faq.questionIndexModeLabel', '问题索引模式') }}</label>
                      <div class="form-value">
                        <span v-if="formData.faqConfig.questionIndexMode === 'combined'">{{
                          $t('component.knowledgeEditor.faq.modes.combined', '合并索引')
                        }}</span>
                        <span v-else-if="formData.faqConfig.questionIndexMode === 'separate'">{{
                          $t('component.knowledgeEditor.faq.modes.separate', '独立索引')
                        }}</span>
                      </div>
                      <!-- <el-radio-group :model-value="formData.faqConfig.questionIndexMode">
                        <el-radio-button value="combined">{{ $t('component.knowledgeEditor.faq.modes.combined', '合并索引') }}</el-radio-button>
                        <el-radio-button value="separate">{{ $t('component.knowledgeEditor.faq.modes.separate', '独立索引') }}</el-radio-button>
                      </el-radio-group>
                      <p class="form-tip">{{ $t('component.knowledgeEditor.faq.questionIndexModeDescription', '问题和答案的索引方式') }}</p> -->
                    </div>
                  </div>
                  <!-- <div class="faq-guide">
                    <p>{{ $t('component.knowledgeEditor.faq.entryGuide', 'FAQ 条目可在知识库详情页中添加和管理') }}</p>
                  </div> -->
                </div>
              </div>
            </div>

            <!-- 解析引擎 -->
            <div v-if="!isFAQ && formData && currentSection === 'parser'" class="section">
              <KBParserDetail :parser-engine-rules="formData.chunkingConfig.parserEngineRules" />
            </div>

            <!-- 存储引擎 -->
            <div v-if="!isFAQ && formData && currentSection === 'storage'" class="section">
              <!-- <KBStorageSettings
                :detail="editorMode === 'detail'"
                :storage-backend-id="formData.storageBackendId"
                :storage-provider="formData.storageProvider"
                :has-files="editorMode === 'edit' && hasFiles"
                @update:storage-backend-id="handleStorageBackendUpdate"
                @update:storage-provider="handleStorageProviderUpdate"
              /> -->
              <!-- <div v-if="loading" class="loading-inline">
                <div v-loading size="small"></div>
                <span>{{ $t('component.kbSettings.storage.loading') }}</span>
              </div> -->
              <div v-if="formData" class="section-content">
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.kbSettings.storage.instanceLabel') }}</label>
                      <div class="form-value">
                        <span>{{ formData.storageBackend?.name }}</span>
                        <span v-if="formData.storageBackend" class="option-hint">
                          {{
                            formData.storageBackend.config?.endpoint ||
                            formData.storageBackend.config?.bucket_name ||
                            formData.storageBackend.config?.path_prefix ||
                            $t('component.kbSettings.storage.localStorage')
                          }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 分块设置 -->
            <div v-if="!isFAQ" v-show="currentSection === 'chunking'" class="section">
              <!-- <KBChunkingSettings
                v-if="formData"
                :detail="editorMode === 'detail'"
                :config="formData.chunkingConfig"
                @update:config="handleChunkingConfigUpdate"
              /> -->
              <div v-if="formData" class="section-content">
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.strategyLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.strategyOption?.label }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.sizeLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.chunkSize }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.sizeLabel') }}</label>
                      <div class="form-value">{{ formData.chunkingConfig.chunkSize }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.overlapLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.chunkOverlap }} {{ $t('component.knowledgeEditor.chunking.characters') }}
                      </div>
                    </div>
                  </div>
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.separatorsLabel') }}</label>
                      <div class="form-value">{{ formData.chunkingConfig.separatorsNames.join(' ') }}</div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.parentChildLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.enableParentChild ? $t('page.normal.enable') : $t('page.normal.disable') }}
                      </div>
                    </div>
                    <div v-if="formData.chunkingConfig.enableParentChild" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.parentChunkSizeLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.parentChunkSize }} {{ $t('component.knowledgeEditor.chunking.characters') }}
                      </div>
                    </div>
                    <div v-if="formData.chunkingConfig.enableParentChild" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.childChunkSizeLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.childChunkSize }} {{ $t('component.knowledgeEditor.chunking.characters') }}
                      </div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.tokenLimitLabel') }}</label>
                      <div class="form-value">{{ formData.chunkingConfig.tokenLimit }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
                    </div>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.chunking.languagesLabel') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig.languageNames.join(' ') }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 多模态配置 图像处理-->
            <div v-if="!isFAQ" v-show="currentSection === 'multimodal'" class="section">
              <!-- <div v-if="formData" class="kb-multimodal-settings"> -->
              <!-- <div class="section-header">
                  <h2>{{ $t('component.knowledgeEditor.multimodal.title', '多模态配置') }}</h2>
                  <p class="section-description">{{ $t('component.knowledgeEditor.multimodal.description', '配置图片和视频内容的处理方式') }}</p>
                </div> -->

              <!-- <div class="settings-group">
                  <div class="setting-row">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.advanced.multimodal.label', '启用多模态') }}</label>
                      <p class="desc">{{ $t('component.knowledgeEditor.advanced.multimodal.description', '启用后支持图片和视频内容的理解') }}</p>
                    </div>
                    <div class="setting-control">
                      <el-switch v-model="formData.multimodalConfig.enabled" :disabled="editorMode === 'detail'" @change="handleMultimodalToggle" />
                    </div>
                  </div>

                  <div v-if="formData.multimodalConfig.enabled" class="setting-row">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.advanced.multimodal.vllmLabel', 'VLLM 模型') }} <span class="required">*</span></label>
                      <p class="desc">{{ $t('component.knowledgeEditor.advanced.multimodal.vllmDescription', '用于多模态内容理解的模型') }}</p>
                    </div>
                    <div class="setting-control">
                      <ModelSelector
                        v-if="editorMode != 'detail'"
                        model-type="VLLM"
                        :selected-model-id="formData.multimodalConfig.vllmModelId"
                        :all-models="allModels"
                        @update:selected-model-id="handleMultimodalVLLMChange"
                        @add-model="handleAddVLLMModel"
                        :placeholder="$t('component.knowledgeEditor.advanced.multimodal.vllmPlaceholder', '选择 VLLM 模型')"
                      />
                      <ModelDetail v-else :selected-model-id="formData.multimodalConfig.vllmModelId" :all-models="allModels" />
                    </div>
                  </div>

                  <div v-if="formData.multimodalConfig.enabled" class="setting-row">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.advanced.multimodal.descriptionLanguageLabel', '描述语言') }}</label>
                      <p class="desc">
                        {{ $t('component.knowledgeEditor.advanced.multimodal.descriptionLanguageDescription', '多模态内容描述的生成语言') }}
                      </p>
                    </div>
                    <div class="setting-control">
                      <el-select
                        v-if="editorMode != 'detail'"
                        v-model="formData.multimodalConfig.descriptionLanguage"
                        clearable
                        :placeholder="$t('component.knowledgeEditor.advanced.multimodal.descriptionLanguageAuto', '自动检测')"
                      >
                        <el-option v-for="item in languageOptions" :key="item.value" :label="item.label" :value="item.value" />
                      </el-select>
                      <el-input v-else :model-value="currentLanguage" />
                    </div>
                  </div>

                  <div v-if="formData.multimodalConfig.enabled" class="setting-row setting-row-vertical">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.advanced.multimodal.customInstructionsLabel', '自定义指令') }}</label>
                      <p class="desc">
                        {{ $t('component.knowledgeEditor.advanced.multimodal.customInstructionsDescription', '多模态内容处理的自定义指令') }}
                      </p>
                    </div>
                    <div class="setting-control setting-control-full">
                      <el-input
                        v-model="formData.multimodalConfig.customInstructions"
                        :disabled="editorMode === 'detail'"
                        type="textarea"
                        :placeholder="$t('component.knowledgeEditor.advanced.multimodal.customInstructionsPlaceholder', '请输入自定义指令...')"
                        :maxlength="4000"
                        :autosize="{ minRows: 3, maxRows: 8 }"
                      />
                    </div>
                  </div>
                </div> -->
              <!-- </div> -->
              <div v-if="formData" class="section-content">
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.multimodal.label', '启用多模态') }}</label>
                      <div class="form-value">{{ formData.multimodalConfig.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
                    </div>
                    <div v-if="formData.multimodalConfig.enabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.multimodal.vllmLabel', 'VLLM 模型') }}</label>
                      <div class="form-value">{{ formData.multimodalConfig.vllmModelId }}</div>
                    </div>
                    <div v-if="formData.multimodalConfig.enabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.multimodal.descriptionLanguageLabel', '描述语言') }}</label>
                      <div class="form-value">{{ currentLanguage }}</div>
                    </div>
                    <div v-if="formData.multimodalConfig.enabled" class="form-item">
                      <label class="form-label">{{
                        $t('component.knowledgeEditor.advanced.multimodal.customInstructionsLabel', '自定义指令')
                      }}</label>
                      <div class="form-value">{{ formData.multimodalConfig.customInstructions }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 音频处理（ASR）设置 -->
            <div v-if="!isFAQ" v-show="currentSection === 'asr'" class="section">
              <div v-if="formData" class="section-content">
                <!-- <div class="section-header">
                  <h2>{{ $t('component.knowledgeEditor.asr.title', '音频处理') }}</h2>
                  <p class="section-description">{{ $t('component.knowledgeEditor.asr.description', '配置语音识别和音频内容处理') }}</p>
                </div> -->
                <div class="section-body">
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.asr.label', '启用语音识别') }}</label>
                      <div class="form-value">{{ formData.asrConfig.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
                    </div>
                    <div v-if="formData.multimodalConfig.enabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.asr.modelLabel', 'ASR 模型') }}</label>
                      <div class="form-value">{{ formData.asrConfig.modelId }}</div>
                    </div>
                  </div>
                </div>
                <!-- <div class="settings-group">
                  <div class="setting-row">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.asr.label', '启用语音识别') }}</label>
                      <p class="desc">{{ $t('component.knowledgeEditor.asr.desc', '启用后支持音频文件的语音转文字') }}</p>
                    </div>
                    <div class="setting-control">
                      <el-switch v-model="formData.asrConfig.enabled" :disabled="editorMode === 'detail'" />
                    </div>
                  </div>

                  <div v-if="formData.asrConfig.enabled" class="setting-row">
                    <div class="setting-info">
                      <label>{{ $t('component.knowledgeEditor.asr.modelLabel', 'ASR 模型') }} <span class="required">*</span></label>
                      <p class="desc">{{ $t('component.knowledgeEditor.asr.modelDescription', '用于语音识别的模型') }}</p>
                    </div>
                    <div class="setting-control">
                      <ModelSelector
                        v-if="editorMode !== 'detail'"
                        model-type="ASR"
                        :selected-model-id="formData.asrConfig.modelId"
                        :all-models="allModels"
                        @update:selected-model-id="
                          (val: string) => {
                            if (formData) formData.asrConfig.modelId = val;
                          }
                        "
                        @add-model="handleAddASRModel"
                        :placeholder="$t('component.knowledgeEditor.asr.modelPlaceholder', '选择 ASR 模型')"
                      />
                      <ModelDetail v-else :selected-model-id="formData.asrConfig.modelId" :all-models="allModels" />
                    </div>
                  </div>
                </div> -->
              </div>
            </div>

            <!-- 知识图谱 -->
            <!-- <div v-if="!isFAQ && currentSection === 'graph'" class="section">
              <GraphSettings
                v-if="formData"
                :graph-extract="formData.nodeExtractConfig"
                :model-id="formData.modelConfig.llmModelId"
                :all-models="allModels"
                @update:graphExtract="handleNodeExtractUpdate"
              />
            </div> -->

            <!-- 高级设置 -->
            <div v-if="!isFAQ" v-show="currentSection === 'advanced'" class="section">
              <!-- <KBAdvancedSettings
                v-if="formData"
                :detail="editorMode === 'detail'"
                :question-generation="formData.questionGenerationConfig"
                :auto-tag="formData.autoTagConfig"
                :rag-enabled="formData.indexingStrategy?.vectorEnabled || formData.indexingStrategy?.keywordEnabled"
                :all-models="allModels"
                :table-metadata-instructions="formData.chunkingConfig.tableMetadataInstructions"
                @update:question-generation="handleQuestionGenerationUpdate"
                @update:auto-tag="
                  (value?: boolean) => {
                    if (formData) formData.autoTagConfig = value;
                  }
                "
                @update:table-metadata-instructions="
                  (value?: string) => {
                    if (formData) formData.chunkingConfig.tableMetadataInstructions = value;
                  }
                "
              /> -->
              <div v-if="formData" class="section-content">
                <div class="section-body">
                  <div class="section-card" v-if="(formData.indexingStrategy?.vectorEnabled || formData.indexingStrategy?.keywordEnabled) !== false">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.questionGeneration.label') }}</label>
                      <div class="form-value">
                        {{ formData.questionGenerationConfig?.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}
                      </div>
                    </div>
                    <div v-if="formData.questionGenerationConfig?.enabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.questionGeneration.countLabel') }}</label>
                      <div class="form-value">
                        {{ formData.questionGenerationConfig?.questionCount }}
                      </div>
                    </div>
                    <div v-if="formData.questionGenerationConfig?.enabled" class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.questionGeneration.instructionsLabel') }}</label>
                      <div class="form-value">
                        {{ formData.questionGenerationConfig?.customInstructions }}
                      </div>
                    </div>
                  </div>
                  <div class="section-card">
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.autoTag.label') }}</label>
                      <div class="form-value">
                        {{ formData.autoTagConfig?.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}
                      </div>
                    </div>
                    <template v-if="formData.autoTagConfig?.enabled">
                      <div class="form-item">
                        <label class="form-label">{{ $t('component.knowledgeEditor.advanced.autoTag.modelLabel') }}</label>
                        <div class="form-value">
                          {{ formData.autoTagConfig?.modelId }}
                        </div>
                      </div>
                      <div class="form-item">
                        <label class="form-label">{{ $t('component.knowledgeEditor.advanced.autoTag.maxTagsLabel') }}</label>
                        <div class="form-value">
                          {{ formData.autoTagConfig?.maxTags }}
                        </div>
                      </div>
                      <div class="form-item">
                        <label class="form-label">{{ $t('component.knowledgeEditor.advanced.autoTag.skipIfTaggedLabel') }}</label>
                        <div class="form-value">
                          {{ formData.autoTagConfig.skipIfTagged ? $t('page.normal.enable') : $t('page.normal.disable') }}
                        </div>
                      </div>
                    </template>
                    <div class="form-item">
                      <label class="form-label">{{ $t('component.knowledgeEditor.advanced.tableMetadataInstructions.label') }}</label>
                      <div class="form-value">
                        {{ formData.chunkingConfig?.tableMetadataInstructions }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 数据源管理 -->
            <div v-if="currentSection === 'datasource'" class="section">
              <!-- <DataSourceSettings :kb-id="activeKbId" @count="dsCount = $event" /> -->
            </div>

            <!-- 共享设置 -->
            <div v-if="currentSection === 'share'" class="section">
              <!-- <KBShareSettings :kb-id="activeKbId" :can-share="canShareKB" /> -->
            </div>

            <!-- 活动记录 -->
            <div v-if="currentSection === 'activity'" class="section" style="height: 100%">
              <!-- <KnowledgeBaseActivitySettings :detail="editorMode === 'detail'" :kb-id="activeKbId" :active="currentSection === 'activity'" /> -->
              <KnowledgeBaseActivityDetail :kb-id="activeKbId" />
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <div style="flex: auto">
        <el-button @click="handleClose">
          {{ $t('page.normal.close', '关闭') }}
        </el-button>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
// import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus';
import {
  Close,
  DocumentCopy,
  CircleCheckFilled,
  InfoFilled,
  Cpu,
  Coin,
  HelpFilled,
  Picture,
  Microphone,
  Folder,
  Files,
  Connection,
  Setting,
  Download,
  Share,
  Paperclip
} from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';
import { Search } from 'lucide-vue-next';

// import KBModelConfig from './settings/KBModelConfig.vue';
// import KBVectorStoreSettings from './settings/KBVectorStoreSettings.vue';
// import KBStorageSettings from './settings/KBStorageSettings.vue';
// import KBChunkingSettings from './settings/KBChunkingSettings.vue';
// import KBAdvancedSettings from './settings/KBAdvancedSettings.vue';
// import ModelSelector from '@/components/business/ModelSelector.vue';
// import ModelDetail from '@/components/business/ModelDetail.vue';
// import GraphSettings from './settings/GraphSettings.vue';
// import KBShareSettings from './settings/KBShareSettings.vue';
// import DataSourceSettings from './settings/DataSourceSettings.vue';
// import KnowledgeBaseActivitySettings from './settings/KnowledgeBaseActivitySettings.vue';
// import VectorStoreBadge from '@/components/business/VectorStoreBadge.vue';
import KBParserDetail from './settings/KBParserDetail.vue';
import KnowledgeBaseActivityDetail from './settings/KnowledgeBaseActivityDetail.vue';

import { getKnowledgeBaseSingleApi } from '@/api/data/knowledgeBase.js';

import { getKBChunkStrategyOptions } from '@/composables/useKBChunk';
import { parseEntity } from '@/composables/useKnowledge.js';
import { KnowledgeBaseExtends } from '@/types';
import { getModelListApi } from '@/api/model/model.js';

const { t } = useI18n();
const $t = t;

// 功能开关（manager 项目默认启用）
const hideDatasource = false;
const hideShareManagement = false;

// Props
const props = defineProps<{
  visible: boolean;
  mode: 'create' | 'edit' | 'detail';
  kbId?: string;
  initialType?: 'document' | 'faq';
}>();

// Emits
const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'success', kbId: string): void;
}>();

const modelTitle = computed(() => {
  return t('component.knowledgeEditor.titleDetail', '知识库详情');
});

/** 首次保存创建成功后留在弹窗内，继续配置共享等设置 */
const savedKbId = ref<string | null>(null);
const editorMode = computed(() => (savedKbId.value ? 'edit' : props.mode));
const activeKbId = computed(() => savedKbId.value ?? props.kbId);

const copyKbId = async () => {
  const id = activeKbId.value;
  if (!id) return;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(id);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = id;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    ElMessage.success(t('common.copied'));
  } catch {
    ElMessage.error(t('common.copyFailed'));
  }
};

const currentSection = ref<string>('basic');

const saving = ref(false);
const loading = ref(false);
const allModels = ref<any[]>([]);
const hasFiles = ref(false);
const initialStorageProvider = ref<string>('');
const tenantDefaultStorageProvider = ref('local');
const initialIndexingStrategy = ref<any>(null);

const canViewActivity = computed(() => {
  if (editorMode.value === 'create' && !activeKbId.value) return false;
  return true;
});

const chunkingDirty = ref(false);

const navTabs = computed(() => {
  if (formData.value?.type === 'faq') {
    return [
      { key: 'basic', icon: InfoFilled, label: t('component.knowledgeEditor.sidebar.basic') },
      { key: 'faq', icon: HelpFilled, label: t('component.knowledgeEditor.sidebar.faq') },
      { key: 'activity', icon: Paperclip, label: t('component.knowledgeEditor.sidebar.activity') }
    ];
  }
  return [
    { key: 'basic', icon: InfoFilled, label: t('component.knowledgeEditor.sidebar.basic') },
    { key: 'parser', icon: Search, label: t('component.knowledgeEditor.sidebar.parserEngine') },
    { key: 'multimodal', icon: Picture, label: t('component.knowledgeEditor.sidebar.multimodal') },
    { key: 'asr', icon: Microphone, label: t('component.knowledgeEditor.sidebar.asr') },
    { key: 'storage', icon: Folder, label: t('component.knowledgeEditor.sidebar.storage') },
    { key: 'chunking', icon: Files, label: t('component.knowledgeEditor.sidebar.chunking') },
    // { key: 'graph', icon: Connection, label: t('component.knowledgeEditor.sidebar.graph') },
    { key: 'advanced', icon: Setting, label: t('component.knowledgeEditor.sidebar.advanced') },
    { key: 'activity', icon: Paperclip, label: t('component.knowledgeEditor.sidebar.activity') }
  ];
});

const formData = ref<any>(null);
const isFAQ = computed(() => formData.value?.type === 'faq');

const languageOptions = computed(() => {
  return [
    { label: t('component.language.zhCN'), value: 'Chinese' },
    { label: t('component.language.enUS'), value: 'English' },
    { label: t('component.language.koKR'), value: 'Korean' },
    { label: t('component.language.ruRU'), value: 'Russian' }
  ];
});
const currentLanguage = computed(() => {
  const options = languageOptions.value;
  const value = formData.value.multimodalConfig.descriptionLanguage || '';
  const selected = options.find((item?: any) => item.value === value);
  return selected?.label || '';
});

const loadAllModels = async (force = false) => {
  try {
    const reslut = await getModelListApi({}, { pageNum: 1, pageSize: 9999 });
    allModels.value = reslut.rows || [];
  } catch (error) {
    console.error('Failed to load model list:', error);
    ElMessage.error(t('component.knowledgeEditor.messages.loadModelsFailed'));
    allModels.value = [];
  }
};

const loadKBData = async (kbIdOverride?: string) => {
  const kbId = kbIdOverride ?? activeKbId.value;
  if (!kbId) return;

  loading.value = true;
  try {
    const reslut = await getKnowledgeBaseSingleApi(kbId);
    if (!reslut || !reslut.data) {
      throw new Error(t('component.knowledgeEditor.messages.notFound'));
    }
    const kb = reslut.data;

    hasFiles.value = (kb.fileCount as number) > 0;

    const kbExtend: KnowledgeBaseExtends = parseEntity(kb);
    console.log('kbExtend', kbExtend);
    let storageBackendConfig;
    let storageBackend: any = null;
    if (kb.storageBackend) {
      storageBackend = { ...kb.storageBackend };
      if (typeof storageBackend.config === 'string') {
        storageBackendConfig = JSON.parse(storageBackend.config);
      }
      storageBackend.config = storageBackendConfig;
    }

    // 设置表单数据
    const kbType = (kb.type as 'document' | 'faq') || 'document';
    formData.value = {
      type: kbType,
      name: kb.name || '',
      description: kb.description || '',
      faqConfig: {
        indexMode: kbExtend.faqConfig?.index_mode || 'question_only',
        questionIndexMode: kbExtend.faqConfig?.question_index_mode || 'separate'
      },
      modelConfig: {
        llmModel: kbExtend.summaryModel,
        llmModelId: kbExtend.summaryModelId || '',
        embeddingModel: kbExtend.embeddingModel,
        embeddingModelId: kbExtend.embeddingModelId || '',
        wikiSynthesisModel: kbExtend.wikiSynthesisModel,
        wikiSynthesisModelId: kbExtend.wikiConfig?.synthesis_model_id || ''
      },
      chunkingConfig: {
        chunkSize: kbExtend.chunkingConfig?.chunk_size || 512,
        // Fallback only used when the loaded KB has no chunk_overlap stored.
        // Aligned with chunker.DefaultChunkOverlap on the backend.
        chunkOverlap: kbExtend.chunkingConfig?.chunk_overlap || 80,
        separators: kbExtend.chunkingConfig?.separators || ['\n\n', '\n', '。', '！', '？', ';', '；'],
        parserEngineRules: kbExtend.chunkingConfig?.parser_engine_rules || undefined,
        enableParentChild: kbExtend.chunkingConfig?.enable_parent_child || false,
        parentChunkSize: kbExtend.chunkingConfig?.parent_chunk_size || 4096,
        childChunkSize: kbExtend.chunkingConfig?.child_chunk_size || 384,
        // Existing KBs without strategy field render as empty (= legacy behavior).
        // The user has to actively pick a value to opt in to the new tiers.
        strategy: kbExtend.chunkingConfig?.strategy || '',
        strategyOption: getKBChunkStrategyOptions(t).find((item) => item.value === kbExtend.chunkingConfig?.strategy),
        tokenLimit: kbExtend.chunkingConfig?.token_limit || 0,
        languages: kbExtend.chunkingConfig?.languages || [],
        tableMetadataInstructions: kbExtend.chunkingConfig?.table_metadata_instructions || ''
      },
      storageBackendId: (kbExtend.storageBackendId || '') as string,
      storageBackend: storageBackend,
      storageProvider: (kbExtend.storageProviderConfig?.provider || kbExtend.storageConfig?.provider || 'local') as string,
      multimodalConfig: {
        enabled: !!kbExtend.vlmConfig?.enabled,
        vllmModelId: kbExtend.vlmConfig?.model_id || '',
        descriptionLanguage: kbExtend.vlmConfig?.description_language || '',
        customInstructions: kbExtend.vlmConfig?.custom_instructions || ''
      },
      asrConfig: {
        enabled: !!kbExtend.asrConfig?.enabled,
        modelId: kbExtend.asrConfig?.model_id || '',
        language: kbExtend.asrConfig?.language || ''
      },
      nodeExtractConfig: {
        enabled: kbExtend.extractConfig?.enabled || false,
        text: kbExtend.extractConfig?.text || '',
        tags: kbExtend.extractConfig?.tags || [],
        nodes: (kbExtend.extractConfig?.nodes || []).map((node: any) => ({
          name: node.name,
          attributes: node.attributes || []
        })),
        relations: kbExtend.extractConfig?.relations || [],
        customInstructions: kbExtend.extractConfig?.custom_instructions || ''
      },
      questionGenerationConfig: {
        enabled: kbExtend.questionGenerationConfig?.enabled || false,
        questionCount: kbExtend.questionGenerationConfig?.question_count || 3,
        customInstructions: kbExtend.questionGenerationConfig?.custom_instructions || ''
      },
      autoTagConfig: {
        enabled: kbExtend.autoTagConfig?.enabled || false,
        modelId: kbExtend.autoTagConfig?.model_id || '',
        maxTags: kbExtend.autoTagConfig?.max_tags || 3,
        // Absent on knowledge bases saved before the toggle existed; the
        // backend treats that as "skip", so mirror it here.
        skipIfTagged: kbExtend.autoTagConfig?.skip_if_tagged ?? true
      },
      wikiConfig: {
        synthesisModelId: kbExtend.wikiConfig?.synthesis_model_id || '',
        maxPagesPerIngest: kbExtend.wikiConfig?.max_pages_per_ingest || 0,
        extractionGranularity: (kbExtend.wikiConfig?.extraction_granularity === 'focused' ||
        kbExtend.wikiConfig?.extraction_granularity === 'exhaustive'
          ? kbExtend.wikiConfig.extraction_granularity
          : 'standard') as 'focused' | 'standard' | 'exhaustive',
        contentInstructions: kbExtend.wikiConfig?.content_instructions || '',
        extractionInstructions: kbExtend.wikiConfig?.extraction_instructions || ''
      },
      indexingStrategy: {
        vectorEnabled: kbExtend.indexingStrategy?.vector_enabled ?? true,
        keywordEnabled: kbExtend.indexingStrategy?.keyword_enabled ?? true,
        wikiEnabled: kbExtend.indexingStrategy?.wiki_enabled ?? false,
        graphEnabled: kbExtend.indexingStrategy?.graph_enabled ?? false
      },
      // Vector-store binding. vectorStoreId is editor-only state; it
      // is only included in the create request, never the update
      // request, because the binding is immutable after creation.
      // vectorStoreInfo carries the read-only display fields that the
      // edit view renders below; they come straight from the KB
      // response.
      vectorStoreId: kb.vectorStoreId,
      vectorStoreInfo: {
        source: kbExtend.vectorStore?.source,
        name: kbExtend.vectorStore?.name,
        engineType: kbExtend.vectorStore?.engineType,
        status: kbExtend.vectorStore?.status
      }
    };
    const separatorOptions = [
      { label: t('component.knowledgeEditor.chunking.separators.doubleNewline'), value: '\n\n' },
      { label: t('component.knowledgeEditor.chunking.separators.singleNewline'), value: '\n' },
      { label: t('component.knowledgeEditor.chunking.separators.periodCn'), value: '。' },
      { label: t('component.knowledgeEditor.chunking.separators.exclamationCn'), value: '！' },
      { label: t('component.knowledgeEditor.chunking.separators.questionCn'), value: '？' },
      { label: t('component.knowledgeEditor.chunking.separators.semicolonCn'), value: '；' },
      { label: t('component.knowledgeEditor.chunking.separators.semicolonEn'), value: ';' },
      { label: t('component.knowledgeEditor.chunking.separators.space'), value: ' ' }
    ];
    const separatorValueLableMap = separatorOptions.reduce(
      (acc, cur) => {
        acc[cur.value] = cur.label;
        return acc;
      },
      {} as Record<string, string>
    );
    formData.value.chunkingConfig.separatorsNames = formData.value.chunkingConfig.separators.map((item: string) => separatorValueLableMap[item]);
    const languageOptions = [
      { label: t('component.knowledgeEditor.chunking.languageOptions.de'), value: 'de' },
      { label: t('component.knowledgeEditor.chunking.languageOptions.en'), value: 'en' },
      { label: t('component.knowledgeEditor.chunking.languageOptions.zh'), value: 'zh' }
    ];
    const languageValueLableMap = languageOptions.reduce(
      (acc, cur) => {
        acc[cur.value] = cur.label;
        return acc;
      },
      {} as Record<string, string>
    );
    formData.value.chunkingConfig.languageNames = formData.value.chunkingConfig.languages.map((item: string) => languageValueLableMap[item]);
    initialStorageProvider.value = formData.value.storageProvider;
    initialIndexingStrategy.value = { ...formData.value.indexingStrategy };
    console.log('formData.value', { ...formData.value });
  } catch (error) {
    console.error('Failed to load knowledge base data:', error);
    ElMessage.error(t('component.knowledgeEditor.messages.loadDataFailed'));
    handleClose();
  } finally {
    loading.value = false;
  }
};

const resolvedGranularity = computed<'focused' | 'standard' | 'exhaustive'>(() => {
  const g = formData.value?.wikiConfig?.extractionGranularity;
  if (g === 'focused' || g === 'standard' || g === 'exhaustive') {
    return g;
  }
  return 'standard';
});

const resetState = () => {
  savedKbId.value = null;
  currentSection.value = 'basic';
  formData.value = null;
  hasFiles.value = false;
  initialStorageProvider.value = '';
  tenantDefaultStorageProvider.value = 'local';
  initialIndexingStrategy.value = null;
  saving.value = false;
  loading.value = false;
  chunkingDirty.value = false;
  // kbCreatorId.value = '';
  // kbTenantId.value = 0;
};

const handleClose = () => {
  emit('update:visible', false);
  setTimeout(() => {
    resetState();
  }, 300);
};

watch(
  () => props.visible,
  async (newVal?: boolean) => {
    if (newVal) {
      resetState();
      // await loadAllModels();
      loadKBData();
    }
  }
);
</script>

<style scoped lang="scss">
.close-btn {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 32px;
  height: 32px;
  border: none;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-text-color-regular);
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: var(--el-fill-color);
    color: var(--el-text-color-primary);
  }
}
.option-hint {
  font-size: 12px;
  margin: 8px 0;
  color: var(--el-text-color-regular);
  margin-left: 8px;
}
.model-body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  .el-tabs {
    flex-shrink: 0;
    flex-grow: 0;
  }
  .settings-container {
    flex-grow: 1;
    overflow: auto;
    min-height: 0;
  }
  .settings-content {
    height: 100%;
  }
}

.content-wrapper {
  padding: 24px 32px;
  height: 100%;
}

.section {
  margin-bottom: 32px;

  &:last-child {
    margin-bottom: 0;
  }
}
.section-card {
  padding: 24px 0;
  border-radius: 12px;
  border: 1px solid #e3d6d6;
  & + .section-card {
    margin-top: 24px;
  }
}

.section-content {
  .section-header {
    margin-bottom: 16px;
  }

  .section-title {
    margin: 0 0 6px 0;
    font-family: var(--el-font-family);
    font-size: 20px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  .section-desc {
    margin: 0;
    font-family: var(--el-font-family);
    font-size: 14px;
    color: var(--el-text-color-placeholder);
    line-height: 22px;
  }

  .section-body {
    background: var(--el-bg-color);
  }
}

.form-item {
  // margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-start;

  border-bottom: 1px solid #eee;
  padding: 10px 0;

  // &:first-child {
  //   border-top: 1px solid #eee;
  // }
  &:last-child {
    // margin-bottom: 0;
    border-bottom: none;
  }
}

.form-label {
  display: block;
  // margin-bottom: 8px;
  font-family: var(--el-font-family);
  font-size: 15px;
  font-weight: 500;
  // color: var(--el-text-color-primary);
  color: #646567;

  width: 160px;
  text-align: right;
  // &.required::after {
  //   content: '*';
  //   color: var(--el-color-danger);
  //   margin-left: 4px;
  // }
}
.form-value {
  margin-left: 20px;
}

.form-tip {
  margin-top: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.kb-id-field {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  max-width: 480px;
  // margin-top: 8px;
  padding: 6px 8px 6px 12px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color);
  border-radius: 6px;

  .kb-id-value {
    flex: 1;
    min-width: 0;
    margin: 0;
    padding: 0;
    background: none;
    border: none;
    font-family: monospace;
    font-size: 13px;
    line-height: 1.5;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .kb-id-copy {
    flex-shrink: 0;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
    }
  }
}

.granularity-radio-group {
  margin-top: 4px;
}

.granularity-hint {
  margin-top: 8px;
  line-height: 1.6;
  color: var(--el-text-color-secondary);
  white-space: normal;
  word-break: break-word;
}

.indexing-checks {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 10px;
}

.indexing-check-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border: 1px solid var(--el-border-color);
  border-radius: 8px;
  background: var(--el-bg-color);
  cursor: pointer;
  user-select: none;
  transition:
    border-color 0.2s ease,
    background 0.2s ease;

  &:hover {
    border-color: var(--el-color-primary);
  }

  &.is-checked {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
  }

  &.is-disabled {
    cursor: not-allowed;
    opacity: 0.7;

    &:hover {
      border-color: var(--el-border-color);
    }

    &.is-checked:hover {
      border-color: var(--el-color-primary);
    }
  }

  :deep(.el-checkbox__label) {
    font-weight: 500;
    color: var(--el-text-color-primary);
  }
}

.locked-tip {
  color: var(--el-color-warning);
  margin-top: 8px;
}

.indexing-check-box {
  pointer-events: none;
}

.indexing-check-title {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.indexing-new-badge {
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  height: 16px;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.4px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.indexing-check-desc {
  margin: 0;
  padding-left: 24px;
  font-size: 12px;
  line-height: 18px;
  color: var(--el-text-color-placeholder);
}

.faq-guide {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 20px;
}

.settings-footer {
  padding: 12px 40px;
  border-top: 1px solid var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
  flex-shrink: 0;
}

.settings-footer-note {
  margin: 0;
  margin-right: auto;
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 13px;
  line-height: 20px;
  color: var(--el-text-color-secondary);

  strong {
    margin-right: 4px;
    color: var(--el-text-color-primary);
    font-weight: 500;
  }

  &__icon {
    flex-shrink: 0;
    margin-top: 2px;
    font-size: 14px;
    color: var(--el-color-success);
  }
}

.settings-footer-actions {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .settings-modal {
    transform: scale(0.95);
  }
}

// 多模态配置内联样式
.kb-multimodal-settings {
  width: 100%;

  .section-header {
    margin-bottom: 20px;

    h2 {
      font-size: 20px;
      font-weight: 600;
      color: var(--el-text-color-primary);
      margin: 0 0 6px 0;
    }

    .section-description {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }
  }

  .settings-group {
    display: flex;
    flex-direction: column;
  }

  .setting-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--el-border-color);

    &:last-child {
      border-bottom: none;
    }

    &.setting-row-vertical {
      flex-direction: column;
      gap: 12px;
    }
  }

  .setting-info {
    flex: 1;
    max-width: 65%;
    padding-right: 24px;

    label {
      font-size: 15px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      display: block;
      margin-bottom: 4px;
    }

    .desc {
      font-size: 13px;
      color: var(--el-text-color-secondary);
      margin: 0;
      line-height: 1.5;
    }
  }

  .setting-control {
    flex-shrink: 0;
    min-width: 280px;
    display: flex;
    justify-content: flex-end;
    align-items: center;

    &.setting-control-full {
      min-width: 100%;
      width: 100%;
      justify-content: flex-start;
    }
  }

  .required {
    color: var(--el-color-danger);
    margin-left: 2px;
    font-weight: 500;
  }
}
</style>
