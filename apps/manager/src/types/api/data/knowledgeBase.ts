import { ModelEntity } from '../model';
import { StorageBackendsVO } from './storage';
import { VectorStoresDTO } from './vectorStores';

export type VectorStoreSource = 'env' | 'user' | 'shared' | 'unavailable';
export type VectorStoreStatus = 'available' | 'unavailable';

interface KnowledgeBaseSimple {
  /**
   * 主键 ID
   */
  id?: string;

  /**
   * 知识库名称
   */
  name?: string;

  /**
   * 知识库描述
   */
  description?: string;

  /**
   * 所属工作空间（租户）ID
   */
  tenantId?: number;

  /**
   * 嵌入模型 ID
   */
  embeddingModelId?: string;

  // 嵌入模型
  embeddingModel?: ModelEntity;

  /**
   * 摘要模型 ID
   */
  summaryModelId?: string;

  // 摘要模型
  summaryModel?: ModelEntity;

  wikiSynthesisModel?: ModelEntity;

  /**
   * 创建时间
   */
  createdAt?: Date;

  /**
   * 最后更新时间
   */
  updatedAt?: Date;

  /**
   * 软删除时间；非空表示已删除
   */
  deletedAt?: Date;

  /**
   * 是否临时知识库（UI 通常隐藏）
   */
  isTemporary?: boolean;

  /**
   * 知识库类型（document/faq/wiki 等）
   */
  type?: string;

  /**
   * 是否置顶
   */
  isPinned?: boolean;

  /**
   * 置顶时间；未置顶时为空
   */
  pinnedAt?: Date;

  /**
   * 绑定的向量库实例 ID（创建后通常不可改）
   */
  vectorStoreId?: string;

  // 向量库实例
  vectorStore?: VectorStoresDTO;

  vectorStoreSource?: VectorStoreSource;
  vectorStoreStatus?: VectorStoreStatus;

  /**
   * 创建者用户 ID
   */
  creatorId?: string;

  /**
   * 绑定的存储后端实例 ID
   */
  storageBackendId?: string;
  /**
   * 绑定的存储后端实例名称
   */
  storageBackend?: StorageBackendsVO;
}

interface KnowledgeBaseBase extends KnowledgeBaseSimple {
  /**
   * 分块配置
   */
  chunkingConfig?: string;

  /**
   * 图片处理配置
   */
  imageProcessingConfig?: string;

  /**
   * 语音识别配置
   */
  asrConfig?: string;

  // 遗留存储配置列（JSON）；兼容旧数据，新逻辑优先 storage_backend_id
  cosConfig?: string;
  /**
   * 视觉语言模型配置
   */
  vlmConfig?: string;

  /**
   * 信息抽取配置
   */
  extractConfig?: string;

  /**
   * FAQ 专用配置
   */
  faqConfig?: string;

  /**
   * 问题生成配置
   */
  questionGenerationConfig?: string;

  /**
   * 知识库存储提供商选择；凭证来自租户 StorageEngineConfig
   */
  storageProviderConfig?: string;

  /**
   * Wiki 类型知识库配置
   */
  wikiConfig?: string;

  /**
   * 索引管线开关（向量/关键词/Wiki/知识图谱等）
   */
  indexingStrategy?: string;

  /**
   * 解析后异步关联已有标签的配置
   */
  autoTagConfig?: string;

  // 文件数量, 修改时需要
  fileCount?: number;
}

export interface KnowledgeBaseEntity extends KnowledgeBaseBase {}

export interface KnowledgeBaseListReq extends KnowledgeBaseBase {}

export interface KnowledgeBaseSaveReq extends KnowledgeBaseBase {}

export interface KnowledgeBaseFaqConfig {
  // indexMode?: string;
  // questionIndexMode?: string;
  index_mode?: string;
  question_index_mode?: string;
}
export interface KnowledgeBaseParserEngineRule {
  engine?: 'builtin' | 'mineru' | 'simple';
  file_types?: string[];
}
export interface KnowledgeBaseChunkingConfig {
  // chunkSize?: number;
  // // 80 ≈ 15% of chunkSize — community-recommended sweet spot.
  // // Aligned with chunker.DefaultChunkOverlap on the backend.
  // chunkOverlap?: number;
  // // separators?: string[];
  // parserEngineRules?: any;
  // enableParentChild?: boolean;
  // parentChunkSize?: number;
  // childChunkSize?: number;
  // // New KBs default to the adaptive auto-strategy. User can change in the UI.
  // // strategy?: string;
  // tokenLimit?: number;
  // languages?: string[];
  // tableMetadataInstructions?: string;

  child_chunk_size?: number;
  chunk_overlap?: number;
  chunk_size?: number;
  enable_parent_child?: boolean;
  parent_chunk_size?: number;
  separators?: string[];
  parser_engine_rules?: KnowledgeBaseParserEngineRule[];
  strategy?: string;
  languages?: string[];
  token_limit?: number;
  table_metadata_instructions?: string;
}
export interface KnowledgeBaseImageProcessingConfig {
  model_id?: string;
}
export interface KnowledgeBaseAsrConfig {
  enabled?: boolean;
  language?: string;
  model_id?: string;
}
export interface KnowledgeBaseQuestionGenerationConfig {
  enabled?: boolean;
  // questionCount?: number;
  // customInstructions?: string;
  question_count?: number;
  custom_instructions?: string;
}
export interface KnowledgeBaseAutoTagConfig {
  enabled?: boolean;
  // modelId?: string;
  // maxTags?: number;
  // skipIfTagged?: boolean;
  model_id?: string;
  max_tags?: number;
  skip_if_tagged?: boolean;
}
export interface KnowledgeBaseWikiConfig {
  // synthesisModelId: string;
  // maxPagesPerIngest: number;
  // extractionGranularity: 'focused' | 'standard' | 'exhaustive';
  // contentInstructions: string;
  // extractionInstructions: string;
  synthesis_model_id?: string;
  max_pages_per_ingest?: number;
  extraction_granularity?: 'focused' | 'exhaustive' | 'standard';
  content_instructions?: string;
  extraction_instructions?: string;
}
export interface KnowledgeBaseIndexingStrategy {
  // vectorEnabled?: boolean;
  // keywordEnabled?: boolean;
  // wikiEnabled?: boolean;
  // graphEnabled?: boolean;
  graph_enabled: boolean;
  keyword_enabled: boolean;
  vector_enabled: boolean;
  wiki_enabled: boolean;
}
export interface KnowledgeBaseCosConfig {
  app_id?: string;
  bucket_name?: string;
  path_prefix?: string;
  provider?: string;
  region?: string;
  secret_id?: string;
  secret_key?: string;
}
export interface KnowledgeBaseVlmConfig {
  api_key?: string;
  base_url?: string;
  enabled?: boolean;
  interface_type?: string;
  model_id?: string;
  model_name?: string;
  custom_instructions?: string;
  description_language?: string;
}

export interface KnowledgeBaseExtractConfigNode {
  name: string;
  attributes: string[];
}
export interface KnowledgeBaseExtractConfigRelation {
  node1: string;
  node2: string;
  type: string;
}
export interface KnowledgeBaseExtractConfig {
  enabled?: boolean;
  text?: string;
  tags?: string[];
  nodes?: KnowledgeBaseExtractConfigNode[];
  relations?: KnowledgeBaseExtractConfigRelation[];
  custom_instructions?: string;
}
export interface KnowledgeBaseStorageProviderConfig {
  provider?: string;
}

export interface KnowledgeBaseExtends extends KnowledgeBaseSimple {
  /**
   * 分块配置
   */
  chunkingConfig?: KnowledgeBaseChunkingConfig;

  /**
   * 图片处理配置
   */
  imageProcessingConfig?: KnowledgeBaseImageProcessingConfig;

  /**
   * 语音识别配置
   */
  asrConfig?: KnowledgeBaseAsrConfig;

  // 遗留存储配置列（JSON）；兼容旧数据，新逻辑优先 storage_backend_id
  cosConfig?: KnowledgeBaseCosConfig;
  /**
   * 视觉语言模型配置
   */
  vlmConfig?: KnowledgeBaseVlmConfig;

  /**
   * 信息抽取配置
   */
  extractConfig?: KnowledgeBaseExtractConfig;

  /**
   * FAQ 专用配置
   */
  faqConfig?: KnowledgeBaseFaqConfig;

  /**
   * 问题生成配置
   */
  questionGenerationConfig?: KnowledgeBaseQuestionGenerationConfig;

  /**
   * 知识库存储提供商选择；凭证来自租户 StorageEngineConfig
   */
  storageProviderConfig?: KnowledgeBaseStorageProviderConfig;
  storageConfig?: any;

  /**
   * Wiki 类型知识库配置
   */
  wikiConfig?: KnowledgeBaseWikiConfig;

  /**
   * 索引管线开关（向量/关键词/Wiki/知识图谱等）
   */
  indexingStrategy?: KnowledgeBaseIndexingStrategy;

  /**
   * 解析后异步关联已有标签的配置
   */
  autoTagConfig?: KnowledgeBaseAutoTagConfig;
}

export interface KnowledgeBaseActivityEntity {
  /**
   * 主键 ID
   */
  id?: number;

  /**
   * 所属工作空间（租户）ID
   */
  tenantId?: number;

  /**
   * 操作者用户 ID
   */

  actorUserId?: string;

  /**
   * 操作者角色
   */

  actorRole?: string;

  /**
   * 审计动作名（点分命名空间）
   */

  action?: string;

  /**
   * 目标对象类型
   */

  targetType?: string;

  /**
   * 目标对象 ID
   */

  targetId?: string;

  /**
   * 目标用户 ID
   */

  targetUserId?: string;

  /**
   * HTTP 请求路径
   */

  requestPath?: string;

  /**
   * HTTP 方法
   */

  requestMethod?: string;

  /**
   * 结果（success/failure 等）
   */

  outcome?: string;

  /**
   * 详情（JSONB）
   */

  details?: string;

  /**
   * 创建时间
   */

  createdAt?: string;

  /**
   * Key 作用域类型（tenant/platform）
   */

  scopeType?: string;

  /**
   * scope id
   */

  scopeId?: string;
}
