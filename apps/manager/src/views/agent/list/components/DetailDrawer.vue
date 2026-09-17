<script setup lang="ts">
import modal from '@/plugins/modal';
import { getParserEngineListApi } from '@/api/data/system';
import KjscRtlDrawer from '@/components/KjscUi/KjscRtlDrawer.vue';
import { t } from '@/i18n';
import type { CustomAgentConfig, CustomAgentsVO, ParserEngineEntity } from '@/types';
import type { KnowledgeBaseEntity, McpEntity } from '@/types/api/data';
import type { ModelEntity } from '@/types/api/model';

interface DetailItem {
  key: string;
  label: string;
  value: unknown;
  json?: boolean;
  parserRules?: boolean;
  toolTags?: boolean;
}

interface ParserFileGroup {
  key: string;
  labelKey: string;
  labelDefault: string;
  extensions: string[];
}

interface ParserEngineRule {
  file_types?: string[];
  engine?: string;
  xlsx_first_row_as_header?: boolean;
}

interface ParserRuleRow {
  key: string;
  label: string;
  extensions: string[];
  engine: string;
  showXlsxFirstRowAsHeader: boolean;
  xlsxFirstRowAsHeader: boolean;
}

interface ToolDisplay {
  key: string;
  label: string;
}

interface DetailSection {
  key: string;
  label: string;
  items: DetailItem[];
}

interface MenuGroup {
  key: string;
  label: string;
  sections: DetailSection[];
}

const parserFileGroups: ParserFileGroup[] = [
  {
    key: 'pdf',
    labelKey: 'component.kbSettings.parser.fileTypePdf',
    labelDefault: 'PDF 文档',
    extensions: ['pdf']
  },
  {
    key: 'office',
    labelKey: 'component.kbSettings.parser.fileTypeWord',
    labelDefault: 'Word 文档',
    extensions: ['docx', 'doc']
  },
  {
    key: 'ppt',
    labelKey: 'component.kbSettings.parser.fileTypePpt',
    labelDefault: '演示文稿',
    extensions: ['pptx', 'ppt']
  },
  {
    key: 'excel',
    labelKey: 'component.kbSettings.parser.fileTypeExcel',
    labelDefault: 'Excel 表格',
    extensions: ['xlsx', 'xls']
  },
  {
    key: 'ebook',
    labelKey: 'component.kbSettings.parser.fileTypeEbook',
    labelDefault: '电子书',
    extensions: ['epub']
  },
  {
    key: 'webarchive',
    labelKey: 'component.kbSettings.parser.fileTypeWebArchive',
    labelDefault: '网页归档',
    extensions: ['mhtml']
  },
  {
    key: 'csv',
    labelKey: 'component.kbSettings.parser.fileTypeCsv',
    labelDefault: 'CSV 文件',
    extensions: ['csv']
  },
  {
    key: 'markdown',
    labelKey: '',
    labelDefault: 'Markdown',
    extensions: ['md', 'markdown']
  },
  {
    key: 'text',
    labelKey: 'component.kbSettings.parser.fileTypeText',
    labelDefault: '纯文本',
    extensions: ['txt']
  },
  {
    key: 'json',
    labelKey: 'component.kbSettings.parser.fileTypeJson',
    labelDefault: 'JSON 文件',
    extensions: ['json']
  },
  {
    key: 'image',
    labelKey: 'component.kbSettings.parser.fileTypeImage',
    labelDefault: '图片',
    extensions: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp']
  },
  {
    key: 'audiovisual',
    labelKey: 'component.kbSettings.parser.fileTypeAudiovisual',
    labelDefault: '音频',
    extensions: ['mp3', 'wav', 'm4a', 'flac', 'ogg']
  }
];

const parserEngineLabels: Record<string, { key: string; label: string }> = {
  builtin: { key: 'component.kbSettings.parser.engines.builtin.name', label: '内置' },
  markitdown: { key: 'component.kbSettings.parser.engines.markitdown.name', label: 'MarkItDown' },
  mineru: { key: 'component.kbSettings.parser.engines.mineru.name', label: 'MinerU' },
  mineru_cloud: { key: 'component.kbSettings.parser.engines.mineru_cloud.name', label: 'MinerU Cloud' },
  opendataloader: { key: 'component.kbSettings.parser.engines.opendataloader.name', label: 'OpenDataLoader' },
  paddleocr_vl: { key: 'component.kbSettings.parser.engines.paddleocr_vl.name', label: 'PaddleOCR-VL' },
  paddleocr_vl_cloud: { key: 'component.kbSettings.parser.engines.paddleocr_vl_cloud.name', label: 'PaddleOCR-VL Cloud' },
  simple: { key: 'component.kbSettings.parser.engines.simple.name', label: 'Simple' },
  weknoracloud: { key: 'component.kbSettings.parser.engines.weknoracloud.name', label: 'WeKnora Cloud' }
};

const toolLabels: Record<string, { key: string; label: string }> = {
  data_analysis: { key: 'page.agent.list.detail.tool.dataAnalysis', label: '数据分析' },
  data_schema: { key: 'page.agent.list.detail.tool.dataSchema', label: '查看数据元信息' },
  database_query: { key: 'page.agent.list.detail.tool.databaseQuery', label: '查询数据库' },
  get_document_info: { key: 'page.agent.list.detail.tool.getDocumentInfo', label: '获取文档信息' },
  grep_chunks: { key: 'page.agent.list.detail.tool.grepChunks', label: '关键词搜索' },
  knowledge_search: { key: 'page.agent.list.detail.tool.knowledgeSearch', label: '语义搜索' },
  list_knowledge_chunks: { key: 'page.agent.list.detail.tool.listKnowledgeChunks', label: '查看文档分块' },
  query_knowledge_graph: { key: 'page.agent.list.detail.tool.queryKnowledgeGraph', label: '查询知识图谱' },
  search_knowledge: { key: 'page.agent.list.detail.tool.knowledgeSearch', label: '语义搜索' },
  thinking: { key: 'page.agent.list.detail.tool.thinking', label: '思考' },
  todo_write: { key: 'page.agent.list.detail.tool.todoWrite', label: '制定计划' },
  wiki_delete_page: { key: 'page.agent.list.detail.tool.wikiDeletePage', label: '删除 Wiki' },
  wiki_flag_issue: { key: 'page.agent.list.detail.tool.wikiFlagIssue', label: '标记 Wiki 问题' },
  wiki_read_issue: { key: 'page.agent.list.detail.tool.wikiReadIssue', label: '查看 Wiki 问题' },
  wiki_read_page: { key: 'page.agent.list.detail.tool.wikiReadPage', label: '阅读 Wiki 页面' },
  wiki_read_source_doc: { key: 'page.agent.list.detail.tool.wikiReadSourceDoc', label: '精读源文档' },
  wiki_rename_page: { key: 'page.agent.list.detail.tool.wikiRenamePage', label: '重命名 Wiki' },
  wiki_replace_text: { key: 'page.agent.list.detail.tool.wikiReplaceText', label: '局部替换 Wiki' },
  wiki_search: { key: 'page.agent.list.detail.tool.wikiSearch', label: '搜索 Wiki' },
  wiki_update_issue: { key: 'page.agent.list.detail.tool.wikiUpdateIssue', label: '更新 Wiki 问题' },
  wiki_write_page: { key: 'page.agent.list.detail.tool.wikiWritePage', label: '创建/覆盖 Wiki' }
};

const toolOrder = [
  'thinking',
  'todo_write',
  'grep_chunks',
  'knowledge_search',
  'list_knowledge_chunks',
  'query_knowledge_graph',
  'get_document_info',
  'database_query',
  'wiki_search',
  'wiki_read_page',
  'wiki_read_source_doc',
  'wiki_flag_issue',
  'wiki_write_page',
  'wiki_replace_text',
  'wiki_rename_page',
  'wiki_delete_page',
  'wiki_read_issue',
  'wiki_update_issue',
  'data_analysis',
  'data_schema'
];

const props = withDefaults(
  defineProps<{
    modelValue?: boolean;
    agent?: CustomAgentsVO;
  }>(),
  {
    modelValue: false,
    agent: () => ({})
  }
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
}>();

const activeSection = ref('basic');
const parserEngines = ref<ParserEngineEntity[]>([]);
const parserEnginesTenantKey = ref<string>();
const parserEnginesLoadingTenantKey = ref<string>();
const parserEnginesRequestId = ref(0);

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const drawerTitle = computed(() => {
  const detail = t('page.normal.detail', '详情');
  return props.agent.name ? `${props.agent.name} ${detail}` : detail;
});

const config = computed<CustomAgentConfig>(() => {
  if (!props.agent.config) return {};

  try {
    const value = JSON.parse(props.agent.config);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
});

const isSmartReasoning = computed(() => config.value.agent_mode === 'smart-reasoning');
const hasKnowledgeBase = computed(() => config.value.kb_selection_mode !== 'none');

const hasValue = (value: unknown): boolean => {
  return value !== undefined && value !== null && value !== '';
};

const formatJson = (value: unknown): string => {
  if (!hasValue(value)) return '';

  try {
    const parsedValue = typeof value === 'string' ? JSON.parse(value) : value;
    return JSON.stringify(parsedValue, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const formatValue = (value: unknown): string => {
  if (!hasValue(value)) return '';
  if (typeof value === 'boolean') {
    return value ? t('page.agent.list.detail.yes', '是') : t('page.agent.list.detail.no', '否');
  }
  if (Array.isArray(value)) return value.map((item) => String(item)).join('\n');
  if (typeof value === 'object') return formatJson(value);
  return String(value);
};

const getDefaultParserEngineName = (extensions: string[]): string => {
  const extensionSet = new Set(extensions.map((extension) => extension.replace(/^\./, '').toLowerCase()));
  return (
    parserEngines.value.find(
      (engine: ParserEngineEntity) =>
        engine.available !== false && (engine.fileTypes || []).some((fileType: string) => extensionSet.has(fileType.replace(/^\./, '').toLowerCase()))
    )?.name || ''
  );
};

const formatParserEngineName = (engine: string, extensions: string[]): string => {
  const engineLabel = parserEngineLabels[engine];
  const label = engineLabel ? t(engineLabel.key, engineLabel.label) : engine;
  if (engine && engine === getDefaultParserEngineName(extensions)) {
    return `${label} (${t('component.kbSettings.parser.default', '默认')})`;
  }
  return label;
};

const formatParserRuleRows = (value: unknown): ParserRuleRow[] => {
  if (!Array.isArray(value)) return [];

  const rules = value
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) return undefined;
      const rule = item as ParserEngineRule;
      return {
        index,
        engine: rule.engine || '',
        fileTypes: (rule.file_types || []).map((fileType) => fileType.replace(/^\./, '').toLowerCase()),
        xlsxFirstRowAsHeader: rule.xlsx_first_row_as_header === true
      };
    })
    .filter((rule): rule is NonNullable<typeof rule> => Boolean(rule));

  const rows: ParserRuleRow[] = [];
  const knownFileTypes = new Set(parserFileGroups.flatMap((group) => group.extensions));

  parserFileGroups.forEach((group) => {
    rules.forEach((rule) => {
      const extensions = group.extensions.filter((extension) => rule.fileTypes.includes(extension));
      if (!extensions.length) return;

      rows.push({
        key: `${group.key}-${rule.index}`,
        label: group.labelKey ? t(group.labelKey, group.labelDefault) : group.labelDefault,
        extensions,
        engine: formatParserEngineName(rule.engine, group.extensions),
        showXlsxFirstRowAsHeader: extensions.includes('xlsx') && rule.engine === 'builtin',
        xlsxFirstRowAsHeader: rule.xlsxFirstRowAsHeader
      });
    });
  });

  rules.forEach((rule) => {
    rule.fileTypes
      .filter((fileType) => !knownFileTypes.has(fileType))
      .sort()
      .forEach((fileType) => {
        rows.push({
          key: `dynamic-${fileType}-${rule.index}`,
          label: fileType.toUpperCase(),
          extensions: [fileType],
          engine: formatParserEngineName(rule.engine, [fileType]),
          showXlsxFirstRowAsHeader: false,
          xlsxFirstRowAsHeader: false
        });
      });
  });

  return rows;
};

const formatAllowedTools = (value: unknown): ToolDisplay[] => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => ({ key: String(item), index }))
    .sort((left, right) => {
      const leftIndex = toolOrder.indexOf(left.key);
      const rightIndex = toolOrder.indexOf(right.key);
      if (leftIndex === -1 && rightIndex === -1) return left.index - right.index;
      if (leftIndex === -1) return 1;
      if (rightIndex === -1) return -1;
      return leftIndex - rightIndex;
    })
    .map(({ key }) => {
      const toolLabel = toolLabels[key];
      return {
        key,
        label: toolLabel ? t(toolLabel.key, toolLabel.label) : key
      };
    });
};

const formatModel = (model: ModelEntity | undefined, modelId: string | undefined): string => {
  const name = model?.displayName || model?.name;
  if (name && modelId) return `${name}<br/>${modelId}`;
  return name || modelId || '';
};

const formatAgentMode = (value: CustomAgentConfig['agent_mode']): string => {
  const labels = {
    'quick-answer': t('page.agent.list.detail.mode.quickAnswer', '即时问答'),
    'smart-reasoning': t('page.agent.list.detail.mode.smartReasoning', '推理问答')
  };
  return value ? labels[value] : '';
};

const formatAgentType = (value: CustomAgentConfig['agent_type']): string => {
  const labels = {
    'rag-qa': t('page.agent.list.detail.type.ragQa', 'RAG 问答'),
    'wiki-qa': t('page.agent.list.detail.type.wikiQa', 'Wiki 问答'),
    'hybrid-rag-wiki': t('page.agent.list.detail.type.hybridRagWiki', 'Wiki + RAG 混合'),
    'data-analysis': t('page.agent.list.detail.type.dataAnalysis', '数据分析'),
    custom: t('page.agent.list.detail.type.custom', '自定义')
  };
  return value ? labels[value] : '';
};

const formatSelectionMode = (value: 'all' | 'selected' | 'none' | '' | undefined): string => {
  if (!value) return '';
  const labels = {
    all: t('page.agent.list.detail.selection.all', '全部'),
    selected: t('page.agent.list.detail.selection.selected', '指定'),
    none: t('page.agent.list.detail.selection.none', '禁用')
  };
  return labels[value];
};

const formatKnowledgeBaseSelectionMode = (value: CustomAgentConfig['kb_selection_mode']): string => {
  if (!value) return '';
  const labels = {
    all: t('page.agent.list.detail.selection.allKnowledgeBases', '全部知识库'),
    selected: t('page.agent.list.detail.selection.selectedKnowledgeBases', '指定知识库'),
    none: t('page.agent.list.detail.selection.noKnowledgeBase', '不使用知识库')
  };
  return labels[value];
};

const formatSuggestionMode = (value: string | undefined): string => {
  if (!value) return '';
  const labels: Record<string, string> = {
    curated: t('page.agent.list.detail.suggestionMode.curated', '运营配置'),
    generated: t('page.agent.list.detail.suggestionMode.generated', '模型生成'),
    knowledge: t('page.agent.list.detail.suggestionMode.knowledge', '知识库'),
    hybrid: t('page.agent.list.detail.suggestionMode.hybrid', '混合')
  };
  return labels[value] || value;
};

const formatCategories = (values: string[] | undefined): string => {
  const labels: Record<string, string> = {
    clarify: t('page.agent.list.detail.category.clarify', '澄清'),
    deepen: t('page.agent.list.detail.category.deepen', '深入'),
    action: t('page.agent.list.detail.category.action', '下一步')
  };
  return (values || []).map((value) => labels[value] || value).join('\n');
};

const formatFileTypes = (values: string[] | undefined): string => {
  if (!values?.length) return t('page.agent.list.detail.allFileTypes', '全部文件类型');
  return values.join('\n');
};

const formatKnowledgeBases = (ids: string[] | undefined): string => {
  return (ids || [])
    .map((id) => {
      const knowledgeBase = props.agent.knowledgeBasesList?.find((item: KnowledgeBaseEntity) => item.id === id);
      return knowledgeBase?.name ? `${knowledgeBase.name}<br/>${id}` : id;
    })
    .join('\n');
};

const formatMcpServices = (ids: string[] | undefined): string => {
  return (ids || [])
    .map((id) => {
      const service = props.agent.mcpServicesList?.find((item: McpEntity) => item.id === id);
      return service?.name ? `${service.name}<br/>${id}` : id;
    })
    .join('\n');
};

const detailSections = computed<DetailSection[]>(() => {
  const current = config.value;
  const starters = current.question_suggestions?.starters;
  const followUps = current.question_suggestions?.follow_ups;

  const basicItems: DetailItem[] = [
    { key: 'id', label: t('page.agent.list.detail.id', '智能体 ID'), value: props.agent.id },
    { key: 'name', label: t('page.agent.list.detail.name', '智能体名称'), value: props.agent.name },
    { key: 'description', label: t('page.agent.list.detail.description', '智能体说明'), value: props.agent.description },
    // { key: 'avatar', label: t('page.agent.list.detail.avatar', '头像'), value: props.agent.avatar },
    { key: 'isBuiltin', label: t('page.agent.list.detail.isBuiltin', '是否内置'), value: props.agent.isBuiltin },
    { key: 'agentMode', label: t('page.agent.list.detail.agentMode', '运行模式'), value: formatAgentMode(current.agent_mode) }
  ];
  if (isSmartReasoning.value) {
    basicItems.push({ key: 'agentType', label: t('page.agent.list.detail.agentType', '智能体类型'), value: formatAgentType(current.agent_type) });
  }
  basicItems.push(
    { key: 'tenantId', label: t('page.agent.list.detail.tenantId', '工作空间（租户）ID'), value: props.agent.tenantId },
    { key: 'tenantName', label: t('page.agent.list.detail.tenantName', '工作空间（租户）'), value: props.agent.tenant?.name },
    { key: 'createdBy', label: t('page.agent.list.detail.createdBy', '创建用户 ID'), value: props.agent.createdBy },
    { key: 'runnableByViewer', label: t('page.agent.list.detail.runnableByViewer', '只读成员是否可运行'), value: props.agent.runnableByViewer },
    { key: 'createdAt', label: t('page.agent.list.detail.createdAt', '创建时间'), value: props.agent.createdAt },
    { key: 'updatedAt', label: t('page.agent.list.detail.updatedAt', '更新时间'), value: props.agent.updatedAt }
    // { key: 'deletedAt', label: t('page.agent.list.detail.deletedAt', '删除时间'), value: props.agent.deletedAt }
  );

  const modelItems: DetailItem[] = [
    { key: 'model', label: t('page.agent.list.detail.model', '对话模型'), value: formatModel(props.agent.model, current.model_id) },
    { key: 'temperature', label: t('page.agent.list.detail.temperature', '温度'), value: current.temperature }
  ];
  if (!isSmartReasoning.value) {
    modelItems.push({
      key: 'maxCompletionTokens',
      label: t('page.agent.list.detail.maxCompletionTokens', '最大生成 Token 数'),
      value: current.max_completion_tokens
    });
  }
  modelItems.push(
    { key: 'thinking', label: t('page.agent.list.detail.thinking', '思考模式'), value: current.thinking },
    { key: 'citationEnabled', label: t('page.agent.list.detail.citationEnabled', '输出来源引用'), value: current.citation_enabled }
  );
  if (hasKnowledgeBase.value || current.rerank_model_id) {
    modelItems.push({
      key: 'rerankModel',
      label: t('page.agent.list.detail.rerankModel', 'ReRank 模型'),
      value: formatModel(props.agent.reRankModel, current.rerank_model_id)
    });
  }
  if (!isSmartReasoning.value && current.multi_turn_enabled && current.enable_rewrite) {
    modelItems.push({
      key: 'queryUnderstandModel',
      label: t('page.agent.list.detail.queryUnderstandModel', '问题理解模型 ID'),
      value: current.query_understand_model_id
    });
  }
  if (isSmartReasoning.value) {
    modelItems.push(
      { key: 'maxIterations', label: t('page.agent.list.detail.maxIterations', '最大迭代次数'), value: current.max_iterations },
      { key: 'llmCallTimeout', label: t('page.agent.list.detail.llmCallTimeout', 'LLM 调用超时（秒）'), value: current.llm_call_timeout }
    );
  }

  const suggestionItems: DetailItem[] = [
    { key: 'startersEnabled', label: t('page.agent.list.detail.startersEnabled', '开启开场问题推荐'), value: starters?.enabled }
  ];
  if (starters?.enabled) {
    suggestionItems.push(
      { key: 'startersMode', label: t('page.agent.list.detail.startersMode', '开场问题内容来源'), value: formatSuggestionMode(starters.mode) },
      { key: 'startersCount', label: t('page.agent.list.detail.startersCount', '开场问题展示数量'), value: starters.count },
      { key: 'startersItems', label: t('page.agent.list.detail.startersItems', '运营配置问题'), value: starters.items }
    );
  }
  suggestionItems.push({
    key: 'followUpsEnabled',
    label: t('page.agent.list.detail.followUpsEnabled', '开启回答后问题推荐'),
    value: followUps?.enabled
  });
  if (followUps?.enabled) {
    suggestionItems.push(
      { key: 'followUpsMode', label: t('page.agent.list.detail.followUpsMode', '回答后问题内容来源'), value: formatSuggestionMode(followUps.mode) },
      { key: 'followUpsCount', label: t('page.agent.list.detail.followUpsCount', '回答后问题展示数量'), value: followUps.count },
      { key: 'followUpsModelId', label: t('page.agent.list.detail.followUpsModelId', '推荐问题生成模型 ID'), value: followUps.model_id },
      {
        key: 'followUpsContextTurns',
        label: t('page.agent.list.detail.followUpsContextTurns', '最大上下文轮数'),
        value: followUps.max_context_turns
      },
      {
        key: 'followUpsCategories',
        label: t('page.agent.list.detail.followUpsCategories', '推荐问题类别'),
        value: formatCategories(followUps.categories)
      },
      { key: 'followUpsInstruction', label: t('page.agent.list.detail.followUpsInstruction', '额外指令'), value: followUps.additional_instruction },
      { key: 'suppressOnFallback', label: t('page.agent.list.detail.suppressOnFallback', '兜底回答时不推荐'), value: followUps.suppress_on_fallback },
      {
        key: 'suppressWhenAnswerAsksQuestion',
        label: t('page.agent.list.detail.suppressWhenAnswerAsksQuestion', '回答包含追问时不推荐'),
        value: followUps.suppress_when_answer_asks_question
      },
      { key: 'knowledgeFallback', label: t('page.agent.list.detail.knowledgeFallback', '启用知识库回退'), value: followUps.knowledge_fallback },
      { key: 'allowRegenerate', label: t('page.agent.list.detail.allowRegenerate', '允许重新生成'), value: followUps.allow_regenerate }
    );
  }

  const knowledgeItems: DetailItem[] = [
    {
      key: 'kbSelectionMode',
      label: t('page.agent.list.detail.kbSelectionMode', '知识库范围'),
      value: formatKnowledgeBaseSelectionMode(current.kb_selection_mode)
    }
  ];
  if (current.kb_selection_mode === 'selected') {
    knowledgeItems.push({
      key: 'knowledgeBases',
      label: t('page.agent.list.detail.knowledgeBases', '指定知识库'),
      value: formatKnowledgeBases(current.knowledge_bases)
    });
  }
  if (hasKnowledgeBase.value) {
    knowledgeItems.push(
      {
        key: 'supportedFileTypes',
        label: t('page.agent.list.detail.supportedFileTypes', '支持的文件类型'),
        value: formatFileTypes(current.supported_file_types)
      },
      {
        key: 'retrieveKbOnlyWhenMentioned',
        label: t('page.agent.list.detail.retrieveKbOnlyWhenMentioned', "仅在 {'@'} 提及时检索知识库"),
        value: current.retrieve_kb_only_when_mentioned
      },
      {
        key: 'retainRetrievalHistory',
        label: t('page.agent.list.detail.retainRetrievalHistory', '保留检索历史'),
        value: current.retain_retrieval_history
      }
    );
  }

  const retrievalItems: DetailItem[] = [];
  if (!isSmartReasoning.value) {
    retrievalItems.push({
      key: 'enableQueryExpansion',
      label: t('page.agent.list.detail.enableQueryExpansion', '查询扩展'),
      value: current.enable_query_expansion
    });
  }
  retrievalItems.push(
    { key: 'embeddingTopK', label: t('page.agent.list.detail.embeddingTopK', '向量召回 TopK'), value: current.embedding_top_k },
    { key: 'keywordThreshold', label: t('page.agent.list.detail.keywordThreshold', '关键词召回阈值'), value: current.keyword_threshold },
    { key: 'vectorThreshold', label: t('page.agent.list.detail.vectorThreshold', '向量召回阈值'), value: current.vector_threshold }
  );
  if (current.rerank_model_id) {
    retrievalItems.push(
      { key: 'rerankTopK', label: t('page.agent.list.detail.rerankTopK', '重排 TopK'), value: current.rerank_top_k },
      { key: 'rerankThreshold', label: t('page.agent.list.detail.rerankThreshold', '重排阈值'), value: current.rerank_threshold }
    );
  }
  retrievalItems.push({
    key: 'faqPriorityEnabled',
    label: t('page.agent.list.detail.faqPriorityEnabled', 'FAQ 优先'),
    value: current.faq_priority_enabled
  });
  if (current.faq_priority_enabled) {
    retrievalItems.push(
      {
        key: 'faqDirectAnswerThreshold',
        label: t('page.agent.list.detail.faqDirectAnswerThreshold', 'FAQ 直接回答阈值'),
        value: current.faq_direct_answer_threshold
      },
      { key: 'faqScoreBoost', label: t('page.agent.list.detail.faqScoreBoost', 'FAQ 分数加权'), value: current.faq_score_boost }
    );
  }
  if (!isSmartReasoning.value) {
    retrievalItems.push({
      key: 'dataAnalysisEnabled',
      label: t('page.agent.list.detail.dataAnalysisEnabled', '表格数据分析'),
      value: current.data_analysis_enabled
    });
  }

  const webSearchItems: DetailItem[] = [
    { key: 'webSearchEnabled', label: t('page.agent.list.detail.webSearchEnabled', '网络搜索'), value: current.web_search_enabled }
  ];
  if (current.web_search_enabled) {
    webSearchItems.push(
      { key: 'webSearchProviderId', label: t('page.agent.list.detail.webSearchProviderId', '搜索引擎 ID'), value: current.web_search_provider_id },
      { key: 'webSearchMaxResults', label: t('page.agent.list.detail.webSearchMaxResults', '最大搜索结果数'), value: current.web_search_max_results },
      { key: 'webFetchEnabled', label: t('page.agent.list.detail.webFetchEnabled', '自动抓取页面内容'), value: current.web_fetch_enabled }
    );
    if (current.web_fetch_enabled) {
      webSearchItems.push({ key: 'webFetchTopN', label: t('page.agent.list.detail.webFetchTopN', '抓取页面数'), value: current.web_fetch_top_n });
    }
  }

  const attachmentItems: DetailItem[] = [
    { key: 'imageUploadEnabled', label: t('page.agent.list.detail.imageUploadEnabled', '图片上传'), value: current.image_upload_enabled }
  ];
  if (current.image_upload_enabled) {
    attachmentItems.push(
      {
        key: 'vlmModel',
        label: t('page.agent.list.detail.vlmModel', '视觉理解模型'),
        value: formatModel(props.agent.vlmModel, current.vlm_model_id)
      },
      {
        key: 'attachmentImageUnderstanding',
        label: t('page.agent.list.detail.attachmentImageUnderstanding', '附件图片理解'),
        value: current.attachment_image_understanding
      }
    );
    if (current.attachment_image_understanding) {
      attachmentItems.push({
        key: 'attachmentOcrMaxPages',
        label: t('page.agent.list.detail.attachmentOcrMaxPages', '扫描件 OCR 最大页数'),
        value: current.attachment_ocr_max_pages
      });
    }
    attachmentItems.push({
      key: 'imageStorageProvider',
      label: t('page.agent.list.detail.imageStorageProvider', '图片存储提供商'),
      value: current.image_storage_provider
    });
  }
  attachmentItems.push({
    key: 'audioUploadEnabled',
    label: t('page.agent.list.detail.audioUploadEnabled', '音频上传'),
    value: current.audio_upload_enabled
  });
  if (current.audio_upload_enabled) {
    attachmentItems.push({
      key: 'asrModel',
      label: t('page.agent.list.detail.asrModel', '语音识别模型'),
      value: formatModel(props.agent.asrModel, current.asr_model_id)
    });
  }
  attachmentItems.push(
    {
      key: 'attachmentParseWaitTimeout',
      label: t('page.agent.list.detail.attachmentParseWaitTimeout', '附件解析等待超时（秒）'),
      value: current.attachment_parse_wait_timeout_sec
    },
    {
      key: 'chatParserEngineRules',
      label: t('page.agent.list.detail.chatParserEngineRules', '附件解析引擎规则'),
      value: current.chat_parser_engine_rules,
      parserRules: true
    }
  );

  const sections: DetailSection[] = [
    { key: 'basic', label: t('page.agent.list.detail.menu.basic', '基本信息'), items: basicItems },
    { key: 'model', label: t('page.agent.list.detail.menu.model', '模型配置'), items: modelItems }
  ];
  if (!isSmartReasoning.value) {
    const conversationItems: DetailItem[] = [
      { key: 'multiTurnEnabled', label: t('page.agent.list.detail.multiTurnEnabled', '多轮对话'), value: current.multi_turn_enabled }
    ];
    if (current.multi_turn_enabled) {
      conversationItems.push(
        { key: 'historyTurns', label: t('page.agent.list.detail.historyTurns', '保留历史轮数'), value: current.history_turns },
        { key: 'enableRewrite', label: t('page.agent.list.detail.enableRewrite', '问题改写'), value: current.enable_rewrite }
      );
    }
    sections.push({ key: 'conversation', label: t('page.agent.list.detail.menu.conversation', '多轮对话'), items: conversationItems });
  }
  sections.push(
    { key: 'suggestions', label: t('page.agent.list.detail.menu.suggestions', '问题推荐'), items: suggestionItems },
    { key: 'knowledge', label: t('page.agent.list.detail.menu.knowledge', '知识库'), items: knowledgeItems }
  );
  if (hasKnowledgeBase.value) {
    sections.push({ key: 'retrieval', label: t('page.agent.list.detail.menu.retrieval', '检索策略'), items: retrievalItems });
  }
  sections.push(
    { key: 'webSearch', label: t('page.agent.list.detail.menu.webSearch', '网络搜索'), items: webSearchItems },
    { key: 'attachment', label: t('page.agent.list.detail.menu.attachment', '附件上传'), items: attachmentItems }
  );
  if (isSmartReasoning.value) {
    const mcpItems: DetailItem[] = [
      {
        key: 'mcpSelectionMode',
        label: t('page.agent.list.detail.mcpSelectionMode', 'MCP 服务范围'),
        value: formatSelectionMode(current.mcp_selection_mode)
      }
    ];
    if (current.mcp_selection_mode === 'selected') {
      mcpItems.push({
        key: 'mcpServices',
        label: t('page.agent.list.detail.mcpServices', '指定 MCP 服务'),
        value: formatMcpServices(current.mcp_services)
      });
    }
    if (current.mcp_selection_mode && current.mcp_selection_mode !== 'none') {
      mcpItems.push({
        key: 'mcpAuthWaitTimeout',
        label: t('page.agent.list.detail.mcpAuthWaitTimeout', 'MCP 授权等待超时（秒）'),
        value: current.mcp_auth_wait_timeout
      });
    }

    const skillItems: DetailItem[] = [
      {
        key: 'skillsSelectionMode',
        label: t('page.agent.list.detail.skillsSelectionMode', '技能范围'),
        value: formatSelectionMode(current.skills_selection_mode)
      }
    ];
    if (current.skills_selection_mode === 'selected') {
      skillItems.push({ key: 'selectedSkills', label: t('page.agent.list.detail.selectedSkills', '指定技能'), value: current.selected_skills });
    }

    sections.push(
      {
        key: 'tools',
        label: t('page.agent.list.detail.menu.tools', '工具'),
        items: [
          {
            key: 'allowedTools',
            label: t('page.agent.list.detail.allowedTools', '允许的工具'),
            value: current.allowed_tools,
            toolTags: true
          }
        ]
      },
      { key: 'mcp', label: t('page.agent.list.detail.menu.mcp', 'MCP 服务'), items: mcpItems },
      { key: 'skills', label: t('page.agent.list.detail.menu.skills', '技能'), items: skillItems }
    );
  }

  return sections;
});

const menuGroups = computed<MenuGroup[]>(() => {
  const sectionMap = new Map(detailSections.value.map((section: DetailSection) => [section.key, section]));
  const getSections = (keys: string[]) => keys.map((key) => sectionMap.get(key)).filter((section): section is DetailSection => Boolean(section));

  return [
    {
      key: 'basic',
      label: t('page.agent.list.detail.group.basic', '基础配置'),
      sections: getSections(['basic', 'model', 'conversation', 'suggestions'])
    },
    {
      key: 'knowledge',
      label: t('page.agent.list.detail.group.knowledge', '知识与检索'),
      sections: getSections(['knowledge', 'retrieval', 'webSearch'])
    },
    {
      key: 'capability',
      label: t('page.agent.list.detail.group.capability', '能力扩展'),
      sections: getSections(['attachment', 'tools', 'mcp', 'skills'])
    }
  ].filter((group) => group.sections.length);
});

const activeDetailSection = computed(
  () => detailSections.value.find((section: DetailSection) => section.key === activeSection.value) || detailSections.value[0]
);

const selectSection = (index: string) => {
  activeSection.value = index;
};

const copyWithTextarea = (text: string) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '0';
  textarea.style.left = '0';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  if (typeof textarea.setSelectionRange === 'function') {
    textarea.setSelectionRange(0, textarea.value.length);
  }

  try {
    if (document.execCommand('copy')) {
      modal.msgSuccess(t('page.normal.copySuccess', '复制成功'));
    } else {
      modal.msgError(t('page.normal.copyFailed', '复制失败'));
    }
  } catch {
    modal.msgError(t('page.normal.copyFailed', '复制失败'));
  } finally {
    document.body.removeChild(textarea);
  }
};

const copyText = (value: unknown) => {
  const text = formatJson(value);

  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(text)
      .then(() => modal.msgSuccess(t('page.normal.copySuccess', '复制成功')))
      .catch(() => copyWithTextarea(text));
    return;
  }

  copyWithTextarea(text);
};

const loadParserEngines = () => {
  const tenantId = props.agent.tenantId;
  const tenantKey = String(tenantId ?? '');
  if (parserEnginesTenantKey.value === tenantKey || parserEnginesLoadingTenantKey.value === tenantKey) return;

  const requestId = ++parserEnginesRequestId.value;
  parserEnginesTenantKey.value = undefined;
  parserEnginesLoadingTenantKey.value = tenantKey;
  parserEngines.value.length = 0;
  getParserEngineListApi(tenantId)
    .then((res) => {
      if (requestId !== parserEnginesRequestId.value) return;
      parserEngines.value.push(...(res.data?.engines || []));
      parserEnginesTenantKey.value = tenantKey;
    })
    .catch((error) => {
      if (requestId !== parserEnginesRequestId.value) return;
      console.error('--> --> Error:', error);
    })
    .finally(() => {
      if (requestId === parserEnginesRequestId.value) parserEnginesLoadingTenantKey.value = undefined;
    });
};

watch(visible, (value: boolean) => {
  if (value) {
    activeSection.value = 'basic';
    loadParserEngines();
  }
});

watch(
  () => props.agent.tenantId,
  () => {
    if (visible.value) loadParserEngines();
  }
);
</script>

<template>
  <KjscRtlDrawer v-model="visible" :size="850" :title="drawerTitle" :show-cancel="false" :show-confirm="false">
    <template #header>
      <el-text>{{ drawerTitle }}</el-text>
    </template>

    <el-tabs v-model="activeSection" @tab-change="selectSection">
      <el-tab-pane v-for="group in menuGroups" :label="group.label" :name="group.key">
        <el-main v-for="section in group.sections">
          <el-descriptions :title="section.label" :column="1" border>
            <el-descriptions-item v-for="item in section.items" :key="item.key" :label="item.label" label-width="200px">
              <div v-if="item.parserRules && formatParserRuleRows(item.value).length" class="parser-rules">
                <div v-for="rule in formatParserRuleRows(item.value)" :key="rule.key" class="parser-rule">
                  <div class="parser-rule__info">
                    <el-text tag="b" class="parser-rule__label">{{ rule.label }}</el-text>
                    <el-space wrap :size="4">
                      <el-tag v-for="extension in rule.extensions" :key="extension" type="info" effect="plain" size="small">
                        .{{ extension }}
                      </el-tag>
                    </el-space>
                  </div>
                  <div class="parser-rule__control">
                    <div class="parser-rule__engine">
                      <el-text>{{ rule.engine }}</el-text>
                    </div>
                    <el-checkbox v-if="rule.showXlsxFirstRowAsHeader" :model-value="rule.xlsxFirstRowAsHeader" disabled>
                      {{ $t('component.kbSettings.parser.xlsxFirstRowAsHeader', '将首行作为列标题，并保留在每行上下文中') }}
                    </el-checkbox>
                  </div>
                </div>
              </div>
              <el-space v-else-if="item.toolTags && formatAllowedTools(item.value).length" direction="vertical" alignment="flex-start" :size="4">
                <el-tag v-for="tool in formatAllowedTools(item.value)" :key="tool.key" type="info" effect="plain">
                  {{ tool.label }}
                </el-tag>
              </el-space>
              <div v-else-if="item.json && hasValue(item.value)" class="json-content">
                <el-button size="small" class="json-content__copy" @click="copyText(item.value)">
                  {{ $t('page.normal.copy', '复制') }}
                </el-button>
                <pre class="json-content__pre">{{ formatJson(item.value) }}</pre>
              </div>
              <span v-else-if="!item.json && !item.parserRules && !item.toolTags" class="detail-value" v-html="formatValue(item.value)" />
            </el-descriptions-item>
          </el-descriptions>
        </el-main>
      </el-tab-pane>
    </el-tabs>
  </KjscRtlDrawer>
</template>

<style lang="scss" scoped>
:deep(.el-tabs) {
  width: 100%;
}

:deep(.el-descriptions__label),
:deep(.el-descriptions__content) {
  vertical-align: top;
}

.detail-value {
  white-space: pre-wrap;
  word-break: break-all;
}

.parser-rules {
  width: 100%;
  overflow: hidden;
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  border-radius: var(--el-border-radius-base);
}

.parser-rule {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 14px;
  border-bottom: var(--el-border-width) var(--el-border-style) var(--el-border-color);

  &:last-child {
    border-bottom: none;
  }

  &__info {
    flex: 0 0 170px;
    max-width: 170px;
  }

  &__label {
    display: block;
    margin-bottom: 4px;
    font-size: 13px;
    font-weight: 500;
  }

  &__control {
    flex: 1;
    min-width: 140px;
  }

  &__engine {
    display: flex;
    align-items: center;
    min-height: 30px;
    padding: 0 11px;
    border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
    border-radius: var(--el-border-radius-base);
  }

  :deep(.el-checkbox) {
    height: auto;
    margin-top: 4px;
    white-space: normal;
  }

  :deep(.el-checkbox__label) {
    line-height: 1.4;
    white-space: normal;
  }
}

.json-content {
  position: relative;
  height: max-content;
  background-color: var(--el-bg-color-page);
  border: var(--el-border-width) var(--el-border-style) var(--el-border-color);
  border-radius: var(--el-border-radius-base);

  &__copy {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 1;
  }

  &__pre {
    margin: 0;
    padding: 0.75em 5em 0.75em 0.75em;
    white-space: pre-wrap;
    word-break: break-all;
  }
}
</style>
