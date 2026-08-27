/** 凭证字段状态 */
export interface CredentialFieldMeta {
  configured?: boolean;
}

/** 列表/详情返回的单条数据 */
export interface WebSearchProvidersVO {
  id?: string;
  tenantId?: number;
  name?: string;
  provider?: string;           // bing / google / tavily 等
  description?: string;
  parameters?: string;           // 注意：是 JSON 字符串，不是对象！
  isDefault?: boolean;
  credentials?: Record<string, CredentialFieldMeta>;
  createdAt?: string;
  updatedAt?: string;
}

/** 新增/编辑提交的数据 */
export interface WebSearchProvidersDTO {
  id?: string;
  tenantId?: number;
  name?: string;
  provider?: string;
  description?: string;
  parameters?: string;           // 提交前 JSON.stringify
  isDefault?: boolean;
}

/** 列表搜索条件 */
export interface WebSearchProvidersPageDTO {
  id?: string;
  tenantId?: number;
  name?: string;
  provider?: string;
}

/** 凭证接口 */
export interface WebSearchCredentialsDTO {
  id?: string;
  apiKey?: string;              // 有值=更新，无值=只查询状态
}

/** 测试未保存凭证 */
export interface WebSearchTestRequestDTO {
  provider: string;
  parameters?: string;
}

/** /types 返回的提供商类型（用来动态生成表单） */
export interface WebSearchProviderTypeVO {
  id?: string;
  name?: string;
  requiresApiKey?: boolean;
  supportsOptionalApiKey?: boolean;
  requiresEngineId?: boolean;
  requiresBaseUrl?: boolean;
  supportsProxy?: boolean;
  description?: string;
  docsUrl?: string;
  configFields?: WebSearchProviderConfigFieldVO[];
}

export interface WebSearchProviderConfigFieldVO {
  key?: string;
  label?: string;
  type?: string;
  required?: boolean;
  defaultValue?: string;
  description?: string;
  options?: Array<{ label?: string; value?: string }>;
}

/** parameters 在表单里用的对象形式（前端内部用，提交时要 stringify） */
export interface WebSearchParameters {
  api_key?: string;
  engine_id?: string;
  base_url?: string;
  proxy_url?: string;
  extra_config?: Record<string, string>;
}

/**
 * 测试连接返回结果。
 * 后端即使测试失败也返回 code=200，成功与否要看 data.success。
 */
export interface WebSearchTestResult {
  success?: boolean;
  message?: string;
  error?: string;
}