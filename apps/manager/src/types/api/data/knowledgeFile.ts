interface KnowledgeFileBase {
  // 主键 ID
  id?: string;

  // 所属工作空间（租户）ID
  tenantId?: number;

  // 知识库 ID
  knowledgeBaseId?: string;

  // 知识类型（document/faq/manual/url 等）
  type?: string;

  // 知识标题
  title?: string;

  // 知识描述
  description?: string;

  // 知识来源（URL 或 manual 等）
  source?: string;

  // 解析状态（pending/processing/finalizing/completed/failed/cancelled 等）
  parseStatus?: string;

  // 启用状态
  enableStatus?: string;

  // 嵌入模型 ID
  embeddingModelId?: string;

  // 文件名（不含目录；目录见 folder_path）
  fileName?: string;

  // 文件类型
  fileType?: string;

  // 文件大小（字节）
  fileSize?: number;

  // 文件存储路径
  filePath?: string;

  // 文件内容哈希
  fileHash?: string;

  // 占用存储大小（字节）
  storageSize?: number;

  // 元数据（JSON）
  metadata?: string;

  // 创建时间
  createdAt?: string;

  // 最后更新时间
  updatedAt?: string;

  // 处理完成时间
  processedAt?: string;

  // 错误信息
  errorMessage?: string;

  // 软删除时间；非空表示已删除
  deletedAt?: string;

  // 摘要异步任务状态
  summaryStatus?: string;

  // 最近一次 FAQ 导入结果
  lastFaqImportResult?: string;

  // 来源渠道（web/api/im 等）
  channel?: string;

  // 富化子任务未完成计数（finalizing 时有意义）
  pendingSubtasksCount?: number;

  // 用户可读的自定义元数据（与内部 metadata 分离）
  customMetadata?: string;

  // 知识库内相对目录路径；空表示根目录（仅导航，非物理路径）
  folderPath?: string;
}

export interface KnowledgeFileEntity extends KnowledgeFileBase {}

export interface KnowledgeFileListReq {
  // 知识库 ID
  knowledgeBaseId?: string;

  /**
   * 解析状态（pending/processing/finalizing/completed/failed/cancelled 等）
   */
  parseStatus?: string;

  /**
   * 文件名（不含目录；目录见 folder_path）
   */
  fileName?: string;

  /**
   * 文件类型
   */
  fileType?: string;

  /**
   * 来源渠道（web/api/im 等）
   */
  channel?: string;

  /**
   * 知识库内相对目录路径；空表示根目录（仅导航，非物理路径）
   */
  folderPath?: string;

  /**
   * 搜索关键词
   */
  keyword?: string;
}

export interface KnowledgeFileFoldersNode {
  /**
   * 文件夹名称
   */
  name?: string;

  /**
   * 文件夹路径
   */
  path?: string;

  /**
   * 直接子文档数量
   */
  documentCount?: number;

  /**
   * 总文档数量（包含子文件夹）
   */
  totalCount?: number;

  /**
   * 子文件夹列表
   */
  children?: KnowledgeFileFoldersNode[];
}
export interface KnowledgeFileFoldersResp {
  /**
   * 根目录文档数量
   */
  rootDocumentCount?: number;

  /**
   * 总文档数量
   */
  totalDocumentCount?: number;

  /**
   * 文件夹列表
   */
  folders?: KnowledgeFileFoldersNode[];
}
