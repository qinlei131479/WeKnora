/**
 * 模型配置相关类型，对齐后端 ModelsController（/business/models）。
 *
 * 两套类型命名分工：
 * - 落库字段 type：KnowledgeQA / Embedding / Rerank / VLLM / ASR
 * - 厂商表（/providers 的 modelTypes、defaultUrls 的 key）：chat / embedding / rerank / vllm / asr
 */

/** 模型类型（落库值） */
export type ModelType = 'KnowledgeQA' | 'Embedding' | 'Rerank' | 'VLLM' | 'ASR';

/** 厂商表使用的模型类型短名 */
export type ProviderModelType = 'chat' | 'embedding' | 'rerank' | 'vllm' | 'asr';

export interface ModelEmbeddingParameters {
  /** 向量维度 */
  dimension?: number;

  /** 截断提示词 token 数 */
  truncatePromptTokens?: number;

  /** 是否支持维度覆盖 */
  supportsDimensionOverride?: boolean;
}

/** 响应里的模型参数（脱敏，不含 apiKey / appSecret） */
export interface ModelParameters {
  /** 基础 URL（内置模型且非管理员时为空） */
  baseUrl?: string;

  /** 接口类型 */
  interfaceType?: string;

  /** 嵌入参数 */
  embeddingParameters?: ModelEmbeddingParameters;

  /** 参数规模，如 7B / 13B */
  parameterSize?: string;

  /** 提供商标识 */
  provider?: string;

  /** 额外配置（内置模型且非管理员时为空） */
  extraConfig?: Record<string, string>;

  /** 自定义请求头（内置模型且非管理员时为空） */
  customHeaders?: Record<string, string>;

  /** 是否支持视觉输入 */
  supportsVision?: boolean;

  /** 最大并发数 */
  maxConcurrency?: number;

  /** 应用 ID（内置模型时为空） */
  appId?: string;
}

/** 提交时的模型参数，比响应多了两个凭证字段 */
export interface ModelParametersDTO extends ModelParameters {
  /** API 密钥，仅新增时随 parameters 提交，响应不返回 */
  apiKey?: string;

  /** 应用密钥，仅新增时随 parameters 提交，响应不返回 */
  appSecret?: string;
}

/** 凭证字段状态。后端不返回明文，只返回是否已配置 */
export interface ModelCredentialFieldMetadata {
  configured?: boolean;
}

export interface ModelBase {
  /** 唯一 ID */
  id?: string;

  /** 租户 ID */
  tenantId?: number;

  /** 模型名称 */
  name?: string;

  /** 显示名称 */
  displayName?: string;

  /** 模型类型 */
  type?: string;

  /** 模型来源 */
  source?: string;

  /** 描述 */
  description?: string;

  /** 是否默认模型（只读，新增/更新接口不接收） */
  isDefault?: boolean;

  /** 是否内置模型（只读，内置模型不可删除） */
  isBuiltin?: boolean;

  /** 状态 */
  status?: string;

  /** 创建时间 */
  createdAt?: string;

  /** 更新时间 */
  updatedAt?: string;
}

/** 列表 / 详情返回的单条模型 */
export interface ModelsVO extends ModelBase {
  /** 模型参数（脱敏） */
  parameters?: ModelParameters;

  /** 凭证配置状态，内置模型不返回 */
  credentials?: Record<string, ModelCredentialFieldMetadata>;
}

/** 新增 / 更新提交的数据 */
export interface ModelsDTO {
  /** 更新时必填 */
  id?: string;
  tenantId?: number;
  name?: string;
  displayName?: string;
  type?: string;
  source?: string;
  description?: string;
  parameters?: ModelParametersDTO;
}

/** 列表查询条件 */
export interface ModelsPageDTO {
  /** 模糊匹配 */
  id?: string;
  tenantId?: number;
  /** 模糊匹配 */
  name?: string;
  /** 模糊匹配 */
  displayName?: string;
  /** 精确匹配 */
  type?: string;
  /** 精确匹配 */
  source?: string;
  /** 模糊匹配 */
  description?: string;
  isDefault?: boolean;
  isBuiltin?: boolean;
  status?: string;
}

/** /providers 返回的厂商信息 */
export interface ModelProviderVO {
  /** 厂商标识，如 openai / aliyun */
  value?: string;

  /** 显示名称 */
  label?: string;

  /** 描述 */
  description?: string;

  /** 按模型类型短名区分的默认 URL */
  defaultUrls?: Record<string, string>;

  /** 支持的模型类型短名 */
  modelTypes?: string[];
}

/** 凭证更新请求。注意主键字段是 modelId，不是 id */
export interface ModelCredentialsDTO {
  modelId?: string;
  /** 有值=更新，空字符串=清空，null/undefined=不修改 */
  apiKey?: string | null;
  appSecret?: string | null;
}

/** 凭证接口响应 */
export interface CredentialsResponseVO {
  fields?: Record<string, ModelCredentialFieldMetadata>;
}

/** 测试连接请求（5 种 test 接口共用） */
export interface ModelTestRequestDTO {
  modelName: string;
  baseUrl: string;
  apiKey?: string;
  provider?: string;
  interfaceType?: string;
  /** Embedding 模型的向量维度 */
  dimension?: number;
  supportsDimensionOverride?: boolean;
  customHeaders?: Record<string, string>;
  extraConfig?: Record<string, string>;
  appSecret?: string;
  /** 必填。后端用它补库里已存的密钥；新增未保存时不能测 */
  modelId?: string;
  source?: string;
}

/**
 * 测试连接结果。
 * 注意与网络搜索不同：这里用 available，而不是 success。
 */
export interface ModelTestResultVO {
  available?: boolean;
  message?: string;
  /** 仅 Embedding 模型返回 */
  dimension?: number;
}

/** 调试请求 */
export interface ModelDebugDTO {
  modelId: string;
  input: string;
  systemPrompt?: string;
  /** 0-2 */
  temperature?: number;
  /** 0-1 */
  topP?: number;
  /** 1-8192 */
  maxTokens?: number;
  thinking?: boolean;
  /** Rerank 模型使用 */
  documents?: string[];
  /** 视觉 / 语音调试时上传的文件 */
  file?: File;
}

/** 调试结果。Swagger 里写的是 string，后端实际返回 ModelDebugVO */
export interface ModelDebugVO {
  /** 脱敏后的请求预览 */
  requestPreview?: Record<string, unknown>;
  /** 耗时（毫秒） */
  elapsedMs?: number;
  response?: unknown;
  error?: string;
  /** 观察指标，如 answer_characters / dimension */
  observations?: Record<string, unknown>;
}

/** 兼容旧代码（KnowledgeBaseDetailDrawer 等仍在使用） */
export interface ModelListReq extends ModelsPageDTO {}
export interface ModelEntity extends ModelsVO {}
export interface ModelSaveReq extends ModelsDTO {}
