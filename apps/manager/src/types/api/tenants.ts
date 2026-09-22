/** 租户新增、修改参数 */
export interface TenantsDTO {
  /** 主键 ID */
  id?: number;
  /** 工作空间名称 */
  name?: string;
  /** 工作空间描述 */
  description?: string;
  /** 检索引擎配置列表（JSONB） */
  retrieverEngines?: string;
  /** 工作空间状态（如 active） */
  status?: string;
  /** 业务标识 */
  business?: string;
  /** 存储配额（字节） */
  storageQuota?: number;
  /** 已用存储（字节） */
  storageUsed?: number;
  /** 智能体相关配置或会话最近请求状态（历史列名复用） */
  agentConfig?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 全局上下文管理配置（会话默认） */
  contextConfig?: string;
  /** 全局对话配置（普通模式会话默认） */
  conversationConfig?: string;
  /** 全局联网搜索配置 */
  webSearchConfig?: string;
  /** 解析引擎覆盖配置（如 MinerU），覆盖环境变量 */
  parserEngineConfig?: string;
  /** 存储引擎配置（Local/MinIO/COS 等） */
  storageEngineConfig?: string;
  /** 会话历史写入知识库并向量检索的配置 */
  chatHistoryConfig?: string;
  /** 全局检索参数（知识检索与消息检索共用） */
  retrievalConfig?: string;
  /** 凭证配置（JSON，通常加密） */
  credentials?: string;
  /** X-API-Key 映射到终端主体的策略配置 */
  apiPrincipalConfig?: string;
  /** 工作空间默认存储后端 ID */
  defaultStorageBackendId?: string;
}
/** 租户分页查询参数 */
export interface TenantsPageDTO {
  /** 主键 ID */
  id?: number;
  /** 工作空间名称 */
  name?: string;
  /** 工作空间描述 */
  description?: string;
  /** 检索引擎配置列表（JSONB） */
  retrieverEngines?: string;
  /** 工作空间状态（如 active） */
  status?: string;
  /** 业务标识 */
  business?: string;
  /** 存储配额（字节） */
  storageQuota?: number;
  /** 已用存储（字节） */
  storageUsed?: number;
  /** 智能体相关配置或会话最近请求状态（历史列名复用） */
  agentConfig?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 全局上下文管理配置（会话默认） */
  contextConfig?: string;
  /** 全局对话配置（普通模式会话默认） */
  conversationConfig?: string;
  /** 全局联网搜索配置 */
  webSearchConfig?: string;
  /** 解析引擎覆盖配置（如 MinerU），覆盖环境变量 */
  parserEngineConfig?: string;
  /** 存储引擎配置（Local/MinIO/COS 等） */
  storageEngineConfig?: string;
  /** 会话历史写入知识库并向量检索的配置 */
  chatHistoryConfig?: string;
  /** 全局检索参数（知识检索与消息检索共用） */
  retrievalConfig?: string;
  /** 凭证配置（JSON，通常加密） */
  credentials?: string;
  /** X-API-Key 映射到终端主体的策略配置 */
  apiPrincipalConfig?: string;
  /** 工作空间默认存储后端 ID */
  defaultStorageBackendId?: string;
}
/** 租户返回数据 */
export interface TenantsVO {
  /** 主键 ID */
  id?: number;
  /** 工作空间名称 */
  name?: string;
  /** 工作空间描述 */
  description?: string;
  /** 检索引擎配置列表（JSONB） */
  retrieverEngines?: string;
  /** 工作空间状态（如 active） */
  status?: string;
  /** 业务标识 */
  business?: string;
  /** 存储配额（字节） */
  storageQuota?: number;
  /** 已用存储（字节） */
  storageUsed?: number;
  /** 智能体相关配置或会话最近请求状态（历史列名复用） */
  agentConfig?: string;
  /** 创建时间 */
  createdAt?: string;
  /** 最后更新时间 */
  updatedAt?: string;
  /** 软删除时间；非空表示已删除 */
  deletedAt?: string;
  /** 全局上下文管理配置（会话默认） */
  contextConfig?: string;
  /** 全局对话配置（普通模式会话默认） */
  conversationConfig?: string;
  /** 全局联网搜索配置 */
  webSearchConfig?: string;
  /** 解析引擎覆盖配置（如 MinerU），覆盖环境变量 */
  parserEngineConfig?: string;
  /** 存储引擎配置（Local/MinIO/COS 等） */
  storageEngineConfig?: string;
  /** 会话历史写入知识库并向量检索的配置 */
  chatHistoryConfig?: string;
  /** 全局检索参数（知识检索与消息检索共用） */
  retrievalConfig?: string;
  /** 凭证配置（JSON，通常加密） */
  credentials?: string;
  /** X-API-Key 映射到终端主体的策略配置 */
  apiPrincipalConfig?: string;
  /** 工作空间默认存储后端 ID */
  defaultStorageBackendId?: string;
}
/** 租户绑定用户参数 */
export interface TenantBindUsersDTO {
  /** 租户ID */
  tenantId: number;
  /** 角色(owner/admin/contributor/viewer) */
  role: string;
  /** 用户ID列表 */
  userIds: string[];
}
