


// // WebSearchConfig represents the web search configuration for a tenant
// export interface WebSearchConfig {
//   // New: references a WebSearchProviderEntity by ID
//   default_provider_id?: string
//   // Deprecated: kept for backward compatibility
//   provider?: string
//   api_key?: string
//   max_results: number
//   include_date: boolean
//   compression_method: string
//   blacklist: string[]
//   embedding_model_id?: string
//   embedding_dimension?: number
//   rerank_model_id?: string
//   document_fragments?: number
// }
// /** 解析引擎配置（引擎连接参数存空间；聊天附件解析策略在智能体中配置） */
// export type MinerUParseMethod = 'auto' | 'ocr' | 'txt'

// export interface ParserEngineConfig {
//   docreader_addr?: string
//   docreader_transport?: string
//   mineru_endpoint?: string
//   mineru_api_key?: string
//   // MinerU 自建参数
//   mineru_model?: string
//   mineru_vlm_server_url?: string
//   mineru_enable_formula?: boolean | null
//   mineru_enable_table?: boolean | null
//   mineru_parse_method?: MinerUParseMethod
//   mineru_enable_ocr?: boolean | null
//   mineru_language?: string
//   // MinerU 云 API 参数
//   mineru_cloud_model?: string
//   mineru_cloud_enable_formula?: boolean | null
//   mineru_cloud_enable_table?: boolean | null
//   mineru_cloud_enable_ocr?: boolean | null
//   mineru_cloud_language?: string
//   // PaddleOCR-VL 自建参数
//   paddleocr_vl_endpoint?: string
//   paddleocr_vl_use_seal_recognition?: boolean | null
//   paddleocr_vl_use_chart_recognition?: boolean | null
//   // PaddleOCR-VL 云 API 参数
//   paddleocr_vl_cloud_token?: string
//   paddleocr_vl_cloud_model?: string
//   paddleocr_vl_cloud_use_seal_recognition?: boolean | null
//   paddleocr_vl_cloud_use_chart_recognition?: boolean | null
// }

// export interface StorageEngineConfig {
//   default_provider: string // "local" | "minio" | "cos" | "tos" | "s3" | "oss" | "ks3" | "obs"
//   local: { path_prefix: string }
//   minio: { mode: string; endpoint: string; access_key_id: string; secret_access_key: string; bucket_name: string; use_ssl: boolean; path_prefix: string }
//   cos: {
//     secret_id: string
//     secret_key: string
//     region: string
//     bucket_name: string
//     app_id: string
//     path_prefix: string
//   }
//   tos: {
//     endpoint: string
//     region: string
//     access_key: string
//     secret_key: string
//     bucket_name: string
//     path_prefix: string
//   }
//   s3: {
//     endpoint: string // optional for standard AWS S3
//     region: string
//     access_key: string // both keys empty => AWS default credential chain
//     secret_key: string
//     bucket_name: string
//     path_prefix: string
//   }
//   oss: {
//     endpoint: string
//     region: string
//     access_key: string
//     secret_key: string
//     bucket_name: string
//     path_prefix: string
//     use_temp_bucket: boolean
//     temp_bucket_name: string
//     temp_region: string
//   }
//   ks3: {
//     endpoint: string
//     region: string
//     access_key: string
//     secret_key: string
//     bucket_name: string
//     path_prefix: string
//   }
//   obs: {
//     endpoint: string
//     region: string
//     access_key: string
//     secret_key: string
//     bucket_name: string
//     path_prefix: string
//   }
// }

export interface TenantSpaceBase {
  /**
   * 主键 ID
   */
  id?: number;

  /**
   * 工作空间名称
   */
  name: string;

  /**
   * 工作空间描述
   */
  description: string;

  /**
   * 检索引擎配置列表（JSONB）
   */
  retrieverEngines: string;

  /**
   * 工作空间状态（如 active）
   */
  status: string;

  /**
   * 业务标识
   */
  business: string;

  /**
   * 存储配额（字节）
   */
  storageQuota: number;

  /**
   * 已用存储（字节）
   */
  storageUsed: number;

  /**
   * 智能体相关配置或会话最近请求状态（历史列名复用）
   */
  agentConfig: string;

  /**
   * 创建时间
   */
  createdAt: string;

  /**
   * 最后更新时间
   */
  updatedAt: string;

  /**
   * 软删除时间；非空表示已删除
   */
  deletedAt: string;

  /**
   * 全局上下文管理配置（会话默认）
   */
  contextConfig: string;

  /**
   * 全局对话配置（普通模式会话默认）
   */
  conversationConfig: string;

  /**
   * 全局联网搜索配置
   */
  webSearchConfig: string;

  /**
   * 解析引擎覆盖配置（如 MinerU），覆盖环境变量
   */
  parserEngineConfig: string;

  /**
   * 存储引擎配置（Local/MinIO/COS 等）
   */
  storageEngineConfig: string;

  /**
   * 会话历史写入知识库并向量检索的配置
   */
  chatHistoryConfig: string;

  /**
   * 全局检索参数（知识检索与消息检索共用）
   */
  retrievalConfig: string;

  /**
   * 凭证配置（JSON，通常加密）
   */
  credentials: string;

  /**
   * X‑API‑Key 映射到终端主体的策略配置
   */
  apiPrincipalConfig: string;

  /**
   * 工作空间默认存储后端 ID
   */
  defaultStorageBackendId: string;
}


export interface TenantSpaceListReq {
  name?: string
}

export interface TenantSpaceEntity extends TenantSpaceBase {
}

export interface TenantSpaceSaveReq extends TenantSpaceBase {}
