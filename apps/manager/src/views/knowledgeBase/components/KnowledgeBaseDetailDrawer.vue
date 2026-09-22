<template>
  <KjscRtlDrawer
    :model-value="visible"
    @update:model-value="$emit('update:visible', $event)"
    close-on-click-modal
    :title="modelTitle"
    size="800px"
    :show-confirm="false"
    :cancelText="$t('page.normal.close', '关闭')"
  >
    <div class="model-body">
      <el-tabs v-model="currentSection">
        <el-tab-pane v-for="item in navTabs" :key="item.key" :label="item.label" :name="item.key"></el-tab-pane>
      </el-tabs>
      <div class="settings-container">
        <div v-show="currentSection === 'basic'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('component.knowledgeEditor.basic.kbId', '知识库 ID')" label-width="180px">
                <div class="detail-value">{{ activeKbId }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.basic.typeLabel', '知识库类型')" label-width="180px">
                <div class="detail-value">
                  {{
                    formData.type === 'document'
                      ? $t('component.knowledgeEditor.basic.typeDocument', '文档类型')
                      : $t('component.knowledgeEditor.basic.typeFAQ', 'FAQ 类型')
                  }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item v-if="!isFAQ" :label="$t('component.knowledgeEditor.indexing.title', '索引策略')" label-width="180px">
                <div class="detail-value">
                  <span v-if="formData.indexingStrategy.vectorEnabled">{{ $t('component.knowledgeEditor.indexing.searchTitle', '向量检索') }}</span>
                  <span v-if="formData.indexingStrategy.wikiEnabled">{{ $t('component.knowledgeEditor.indexing.wikiTitle', 'Wiki 图谱') }}</span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="!isFAQ && formData.indexingStrategy.wikiEnabled"
                :label="$t('component.knowledgeEditor.wiki.extractionGranularityLabel', '提取粒度')"
                label-width="180px"
              >
                <div class="detail-value">
                  <span v-if="resolvedGranularity === 'focused'">{{ $t('component.knowledgeEditor.wiki.granularityFocused', '精简') }}</span>
                  <span v-else-if="resolvedGranularity === 'standard'">
                    {{ $t('component.knowledgeEditor.wiki.granularityStandard', '标准') }}
                  </span>
                  <span v-else-if="resolvedGranularity === 'exhaustive'">
                    {{ $t('component.knowledgeEditor.wiki.granularityExhaustive', '详尽') }}
                  </span>
                </div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="!isFAQ && formData.indexingStrategy.wikiEnabled"
                :label="$t('component.knowledgeEditor.wiki.contentInstructionsLabel', '内容指令')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.wikiConfig.contentInstructions }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="!isFAQ && formData.indexingStrategy.wikiEnabled"
                :label="$t('component.knowledgeEditor.wiki.extractionInstructionsLabel', '提取指令')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.wikiConfig.extractionInstructions }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.basic.nameLabel', '知识库名称')" label-width="180px">
                <div class="detail-value">{{ formData.name }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.basic.descriptionLabel', '知识库描述')" label-width="180px">
                <div class="detail-value">{{ formData.description }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.models.llmLabel')" label-width="180px">
                <div class="detail-value">{{ formData.modelConfig.llmModel?.name }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.models.embeddingLabel')" label-width="180px">
                <div class="detail-value">{{ formData.modelConfig.embeddingModel?.name }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.wiki.synthesisModelLabel')" label-width="180px">
                <div class="detail-value">{{ formData.modelConfig.wikiSynthesisModel?.name }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.kbSettings.vectorStore.boundLabel')" label-width="180px">
                <div class="detail-value">{{ formData.vectorStoreInfo?.name }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="isFAQ && formData" v-show="currentSection === 'faq'">
          <el-descriptions :column="1" border>
            <el-descriptions-item :label="$t('component.knowledgeEditor.faq.indexModeLabel', '索引模式')" label-width="180px">
              <div class="detail-value">
                <span v-if="formData.faqConfig.indexMode === 'question_only'">
                  {{ $t('component.knowledgeEditor.faq.modes.questionOnly', '仅问题') }}
                </span>
                <span v-else-if="formData.faqConfig.indexMode === 'question_answer'">
                  {{ $t('component.knowledgeEditor.faq.modes.questionAnswer', '问题+答案') }}
                </span>
              </div>
            </el-descriptions-item>
            <el-descriptions-item :label="$t('component.knowledgeEditor.faq.questionIndexModeLabel', '问题索引模式')" label-width="180px">
              <div class="detail-value">
                <span v-if="formData.faqConfig.questionIndexMode === 'combined'">
                  {{ $t('component.knowledgeEditor.faq.modes.combined', '合并索引') }}
                </span>
                <span v-else-if="formData.faqConfig.questionIndexMode === 'separate'">
                  {{ $t('component.knowledgeEditor.faq.modes.separate', '独立索引') }}
                </span>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
        <div v-if="!isFAQ && formData && currentSection === 'parser'">
          <KBParserDetail :parser-engine-rules="formData.chunkingConfig.parserEngineRules" />
        </div>
        <div v-if="!isFAQ && formData && currentSection === 'storage'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('component.kbSettings.storage.instanceLabel')" label-width="180px">
                <div class="detail-value">
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
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="!isFAQ" v-show="currentSection === 'chunking'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.strategyLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.strategyOption?.label }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.sizeLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.chunkSize }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.sizeLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.chunkSize }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.overlapLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.chunkOverlap }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.separatorsLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.separatorsNames.join(' ') }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.parentChildLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.enableParentChild ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.chunkingConfig.enableParentChild"
                :label="$t('component.knowledgeEditor.chunking.parentChunkSizeLabel')"
                label-width="180px"
              >
                <div class="detail-value">
                  {{ formData.chunkingConfig.parentChunkSize }}
                  {{ $t('component.knowledgeEditor.chunking.characters') }}
                </div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.chunkingConfig.enableParentChild"
                :label="$t('component.knowledgeEditor.chunking.childChunkSizeLabel')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.chunkingConfig.childChunkSize }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.tokenLimitLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.tokenLimit }} {{ $t('component.knowledgeEditor.chunking.characters') }}</div>
              </el-descriptions-item>
              <el-descriptions-item :label="$t('component.knowledgeEditor.chunking.languagesLabel')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig.languageNames.join(' ') }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="!isFAQ" v-show="currentSection === 'multimodal'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.multimodal.label', '启用多模态')" label-width="180px">
                <div class="detail-value">{{ formData.multimodalConfig.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.multimodalConfig.enabled"
                :label="$t('component.knowledgeEditor.advanced.multimodal.vllmLabel', 'VLLM 模型')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.multimodalConfig.vllmModelId }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.multimodalConfig.enabled"
                :label="$t('component.knowledgeEditor.advanced.multimodal.descriptionLanguageLabel', '描述语言')"
                label-width="180px"
              >
                <div class="detail-value">{{ currentLanguage }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.multimodalConfig.enabled"
                :label="$t('component.knowledgeEditor.advanced.multimodal.customInstructionsLabel', '自定义指令')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.multimodalConfig.customInstructions }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="!isFAQ" v-show="currentSection === 'asr'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <el-descriptions-item :label="$t('component.knowledgeEditor.asr.label', '启用语音识别')" label-width="180px">
                <div class="detail-value">{{ formData.asrConfig.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
              </el-descriptions-item>
              <el-descriptions-item
                v-if="formData.multimodalConfig.enabled"
                :label="$t('component.knowledgeEditor.asr.modelLabel', 'ASR 模型')"
                label-width="180px"
              >
                <div class="detail-value">{{ formData.asrConfig.modelId }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="!isFAQ" v-show="currentSection === 'advanced'">
          <template v-if="formData">
            <el-descriptions :column="1" border>
              <template v-if="(formData.indexingStrategy?.vectorEnabled || formData.indexingStrategy?.keywordEnabled) !== false">
                <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.questionGeneration.label')" label-width="180px">
                  <div class="detail-value">
                    {{ formData.questionGenerationConfig?.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}
                  </div>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="formData.questionGenerationConfig?.enabled"
                  :label="$t('component.knowledgeEditor.advanced.questionGeneration.countLabel')"
                  label-width="180px"
                >
                  <div class="detail-value">{{ formData.questionGenerationConfig?.questionCount }}</div>
                </el-descriptions-item>
                <el-descriptions-item
                  v-if="formData.questionGenerationConfig?.enabled"
                  :label="$t('component.knowledgeEditor.advanced.questionGeneration.instructionsLabel')"
                  label-width="180px"
                >
                  <div class="detail-value">{{ formData.questionGenerationConfig?.customInstructions }}</div>
                </el-descriptions-item>
              </template>
              <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.autoTag.label')" label-width="180px">
                <div class="detail-value">{{ formData.autoTagConfig?.enabled ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
              </el-descriptions-item>
              <template v-if="formData.autoTagConfig?.enabled">
                <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.autoTag.modelLabel')" label-width="180px">
                  <div class="detail-value">{{ formData.autoTagConfig?.modelId }}</div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.autoTag.maxTagsLabel')" label-width="180px">
                  <div class="detail-value">{{ formData.autoTagConfig?.maxTags }}</div>
                </el-descriptions-item>
                <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.autoTag.skipIfTaggedLabel')" label-width="180px">
                  <div class="detail-value">{{ formData.autoTagConfig.skipIfTagged ? $t('page.normal.enable') : $t('page.normal.disable') }}</div>
                </el-descriptions-item>
              </template>
              <el-descriptions-item :label="$t('component.knowledgeEditor.advanced.tableMetadataInstructions.label')" label-width="180px">
                <div class="detail-value">{{ formData.chunkingConfig?.tableMetadataInstructions }}</div>
              </el-descriptions-item>
            </el-descriptions>
          </template>
        </div>
        <div v-if="currentSection === 'datasource'"></div>
        <div v-if="currentSection === 'share'"></div>
        <div v-if="currentSection === 'activity'" class="activity-content">
          <KnowledgeBaseActivityDetail v-if="activeKbId" :kb-id="activeKbId" />
        </div>
      </div>
    </div>
  </KjscRtlDrawer>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import KBParserDetail from './KBParserDetail.vue';
import KnowledgeBaseActivityDetail from './KnowledgeBaseActivityDetail.vue';
import { getKnowledgeBaseSingleApi } from '@/api/data/knowledgeBase.js';
import { getKBChunkStrategyOptions } from '@/composables/useKBChunk';
import { parseEntity } from '@/composables/useKnowledge.js';
import { KnowledgeBaseExtends } from '@/types';

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

const activeKbId = computed(() => props.kbId);

const currentSection = ref<string>('basic');

const navTabs = computed(() => {
  if (formData.value?.type === 'faq') {
    return [
      { key: 'basic', label: t('component.knowledgeEditor.sidebar.basic') },
      { key: 'faq', label: t('component.knowledgeEditor.sidebar.faq') },
      { key: 'activity', label: t('component.knowledgeEditor.sidebar.activity') }
    ];
  }
  return [
    { key: 'basic', label: t('component.knowledgeEditor.sidebar.basic') },
    { key: 'parser', label: t('component.knowledgeEditor.sidebar.parserEngine') },
    { key: 'multimodal', label: t('component.knowledgeEditor.sidebar.multimodal') },
    { key: 'asr', label: t('component.knowledgeEditor.sidebar.asr') },
    { key: 'storage', label: t('component.knowledgeEditor.sidebar.storage') },
    { key: 'chunking', label: t('component.knowledgeEditor.sidebar.chunking') },
    { key: 'advanced', label: t('component.knowledgeEditor.sidebar.advanced') },
    { key: 'activity', label: t('component.knowledgeEditor.sidebar.activity') }
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

const loadKBData = async (kbIdOverride?: string) => {
  const kbId = kbIdOverride ?? activeKbId.value;
  if (!kbId) return;

  try {
    const reslut = await getKnowledgeBaseSingleApi(kbId);
    if (!reslut || !reslut.data) {
      throw new Error(t('component.knowledgeEditor.messages.notFound'));
    }
    const kb = reslut.data;

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
    console.log('formData.value', { ...formData.value });
  } catch (error) {
    console.error('Failed to load knowledge base data:', error);
    ElMessage.error(t('component.knowledgeEditor.messages.loadDataFailed'));
    handleClose();
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
  currentSection.value = 'basic';
  formData.value = null;
};

const handleClose = () => {
  emit('update:visible', false);
  setTimeout(() => {
    resetState();
  }, 300);
};

watch(
  () => props.visible,
  (newVal?: boolean) => {
    if (newVal) {
      resetState();
      loadKBData();
    }
  }
);
</script>

<style scoped lang="scss">
.model-body {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .el-tabs {
    flex-shrink: 0;
  }
}

.settings-container {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.activity-content {
  height: 100%;
}

:deep(.el-descriptions__label),
:deep(.el-descriptions__content) {
  vertical-align: top;
}

.detail-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.option-hint {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-regular);
}
</style>
