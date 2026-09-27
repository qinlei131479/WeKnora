import type { AjaxResult, PageDomain, TableDataInfo } from '@/types';
import type {
  CredentialsResponseVO,
  ModelCredentialsDTO,
  ModelDebugDTO,
  ModelDebugVO,
  ModelProviderVO,
  ModelTestRequestDTO,
  ModelTestResultVO,
  ModelType,
  ModelsDTO,
  ModelsPageDTO,
  ModelsVO,
  ProviderModelType
} from '@/types/api/model/model';
import request from '@/utils/request';

const PATH = '/business/models';

/**
 * 模型测试和调试都要真实调用第三方模型接口，默认 10s 超时不够用。
 */
const LONG_TIMEOUT = 120000;

/**
 * 落库的 type 与厂商表的 modelTypes 命名不一致：
 * 库里存 KnowledgeQA / Embedding / ...，厂商表存 chat / embedding / ...。
 * 调 /providers 和读 defaultUrls 都要用短名。
 */
const PROVIDER_TYPE_MAP: Record<ModelType, ProviderModelType> = {
  KnowledgeQA: 'chat',
  Embedding: 'embedding',
  Rerank: 'rerank',
  VLLM: 'vllm',
  ASR: 'asr'
};

export const toProviderModelType = (type?: string): ProviderModelType | undefined => (type ? PROVIDER_TYPE_MAP[type as ModelType] : undefined);

// 1. 厂商列表。modelType 传 chat / embedding 等短名，不传则返回全部
const providers = (modelType?: string): Promise<AjaxResult<ModelProviderVO[]>> =>
  request({ url: `${PATH}/providers`, method: 'GET', params: modelType ? { modelType } : {} });

// 2. 分页列表
const list = (dto: ModelsPageDTO, page: PageDomain): Promise<TableDataInfo<ModelsVO>> =>
  request({ url: `${PATH}/list`, method: 'GET', params: { ...dto, ...page } });

// 3. 单条详情
const single = (id: string): Promise<AjaxResult<ModelsVO>> => request({ url: `${PATH}/single`, method: 'GET', params: { id } });

// 4. 新增。parameters 里可以带 apiKey / appSecret，后端会加密落库
const insert = (data: ModelsDTO): Promise<AjaxResult<ModelsVO>> => request({ url: `${PATH}/insert/single`, method: 'POST', data });

// 5. 更新。后端会忽略 parameters 里的凭证字段，凭证要走 credentials 接口
const update = (data: ModelsDTO): Promise<AjaxResult<ModelsVO>> => request({ url: `${PATH}/update/single`, method: 'POST', data });

// 6. 删除。后端是 GET
const _delete = (id: string): Promise<AjaxResult<void>> => request({ url: `${PATH}/delete/single`, method: 'GET', params: { id } });

// 7. 更新/查询凭证。主键字段是 modelId
const updateCredentials = (data: ModelCredentialsDTO): Promise<AjaxResult<CredentialsResponseVO>> =>
  request({ url: `${PATH}/credentials/update`, method: 'POST', data });

// 8. 查询凭证状态
const getCredentials = (id: string): Promise<AjaxResult<CredentialsResponseVO>> =>
  request({ url: `${PATH}/credentials/single`, method: 'GET', params: { id } });

/**
 * 10. 调试模型。后端是 @ModelAttribute，要摊开成 form / multipart，不能发 JSON。
 * VLLM / ASR 把文件放在 file 字段里。
 */
const debug = (data: ModelDebugDTO): Promise<AjaxResult<ModelDebugVO>> => {
  const form = new FormData();
  form.append('modelId', data.modelId);
  form.append('input', data.input);
  if (data.systemPrompt) form.append('systemPrompt', data.systemPrompt);
  if (data.temperature !== undefined) form.append('temperature', String(data.temperature));
  if (data.topP !== undefined) form.append('topP', String(data.topP));
  if (data.maxTokens !== undefined) form.append('maxTokens', String(data.maxTokens));
  if (data.thinking !== undefined) form.append('thinking', String(data.thinking));
  data.documents?.forEach((doc) => form.append('documents', doc));
  if (data.file) form.append('file', data.file);

  return request({
    url: `${PATH}/debug`,
    method: 'POST',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data', repeatSubmit: false },
    timeout: LONG_TIMEOUT
  });
};

const testRequest = (path: string, data: ModelTestRequestDTO): Promise<AjaxResult<ModelTestResultVO>> =>
  request({ url: `${PATH}${path}`, method: 'POST', data, timeout: LONG_TIMEOUT });

// 11-14. 按模型类型分别测试连接
const testChat = (data: ModelTestRequestDTO) => testRequest('/test/chat', data);
const testEmbedding = (data: ModelTestRequestDTO) => testRequest('/test/embedding', data);
const testRerank = (data: ModelTestRequestDTO) => testRequest('/test/rerank', data);
const testAsr = (data: ModelTestRequestDTO) => testRequest('/test/asr', data);

/**
 * 15. 多模态测试。
 *
 * 与 /debug 同样的问题：后端声明为 `@RequestBody + @RequestParam("file")`，
 * 而且 file 是必填，当前无法从前端正确调用（会得到 415 或缺参数）。
 * 保留封装以便后端改成 @RequestPart 后直接接上，UI 暂未使用，
 * VLLM 的测试连接走 /test/chat 做基础连通性校验。
 */
const testMultimodal = (data: ModelTestRequestDTO, file: File): Promise<AjaxResult<ModelTestResultVO>> => {
  const form = new FormData();
  form.append('file', file);
  Object.entries(data).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    form.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  });
  return request({
    url: `${PATH}/test/multimodal`,
    method: 'POST',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: LONG_TIMEOUT
  });
};

/** 按落库类型选 test 接口。多模态/视觉按后端要求走 chat，不调 test/multimodal */
const testByModelType = (type: string | undefined, data: ModelTestRequestDTO) => {
  switch (type) {
    case 'Embedding':
      return testEmbedding(data);
    case 'Rerank':
      return testRerank(data);
    case 'ASR':
      return testAsr(data);
    case 'VLLM':
    case 'KnowledgeQA':
    default:
      return testChat(data);
  }
};

export const Models = {
  providers,
  list,
  single,
  insert,
  update,
  delete: _delete,
  updateCredentials,
  getCredentials,
  debug,
  testChat,
  testEmbedding,
  testRerank,
  testAsr,
  testMultimodal,
  testByModelType
};
