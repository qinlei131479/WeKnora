// import type { PageDomain, BaseEntity } from "../common";

// export interface OllamaQueryParams extends PageDomain {}

export interface ModelEmbeddingParameters {
  /**
   * 向量维度
   */
  dimension: number;

  /**
   * 截断提示词token数
   */
  truncatePromptTokens: number;

  /**
   * 是否支持维度覆盖
   */
  supportsDimensionOverride: boolean;
}
export interface ModelParameters {
  /**
   * 基础URL (内置模型或非管理员时为空)
   */
  baseUrl: string;

  /**
   * 接口类型
   */
  interfaceType: string;

  /**
   * 嵌入参数
   */
  embeddingParameters: ModelEmbeddingParameters;

  /**
   * 参数规模
   */
  parameterSize: string;

  /**
   * 提供商标识
   */
  provider: string;

  /**
   * 额外配置 (内置模型或非管理员时为空)
   */
  extraConfig: Record<string, string>;

  /**
   * 自定义请求头 (内置模型或非管理员时为空)
   */
  customHeaders: Record<string, string>;

  /**
   * 是否支持视觉输入
   */
  supportsVision: boolean;

  /**
   * 最大并发数
   */
  maxConcurrency: number;

  /**
   * 应用ID (内置模型时为空)
   */
  appId: string;

  // 注意: 不包含 apiKey 和 appSecret
}
export interface ModelCredentialFieldMetadata {
  /**
   * 该字段是否已配置
   */
  configured: boolean;
}
export interface ModelBase {
  /**
   * 唯一ID
   */
  id?: string;

  /**
   * 租户ID
   */
  tenantId?: number;

  /**
   * 模型名称
   */
  name?: string;

  /**
   * 显示名称
   */
  displayName?: string;

  /**
   * 模型类型
   */
  type?: string;

  /**
   * 模型来源
   */
  source?: string;

  /**
   * 描述
   */
  description?: string;

  /**
   * 模型参数 (脱敏后)
   */
  parameters?: ModelParameters;

  /**
   * 是否默认模型
   */
  isDefault?: boolean;

  /**
   * 是否内置模型
   */
  isBuiltin?: boolean;

  /**
   * 状态
   */
  status?: string;

  /**
   * 创建时间
   */
  createdAt?: Date;

  /**
   * 更新时间
   */
  updatedAt?: Date;
  /**
   * 凭证配置状态 (可选)
   */
  credentials?: Record<string, ModelCredentialFieldMetadata>;
}

export interface ModelListReq {}
export interface ModelEntity extends ModelBase {}

export interface ModelSaveReq extends ModelBase {}
