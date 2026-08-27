import { AjaxResult, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request';
import type {
  WebSearchProvidersDTO,
  WebSearchProvidersPageDTO,
  WebSearchProvidersVO,
  WebSearchCredentialsDTO,
  WebSearchTestRequestDTO,
  WebSearchProviderTypeVO,
  WebSearchTestResult,
  CredentialFieldMeta,
} from '@/types/api/data/webSearchProviders';

const PATH = '/business/webSearchProviders';

// 1. 获取提供商类型（动态表单用）
const types = (): Promise<AjaxResult<WebSearchProviderTypeVO[]>> =>
  request({ url: `${PATH}/types`, method: 'GET' });

// 2. 分页列表
const list = (
  dto: WebSearchProvidersPageDTO,
  page: PageDomain
): Promise<TableDataInfo<WebSearchProvidersVO>> =>
  request({
    url: `${PATH}/list`,
    method: 'GET',
    params: { ...dto, ...page },   // dto 和 page 合并成 query 参数
  });

// 3. 单条详情
const single = (id: string): Promise<AjaxResult<WebSearchProvidersVO>> =>
  request({ url: `${PATH}/single`, method: 'GET', params: { id } });

// 4. 新增
const insert = (data: WebSearchProvidersDTO): Promise<AjaxResult<WebSearchProvidersVO>> =>
  request({ url: `${PATH}/insert/single`, method: 'POST', data });

// 5. 更新（不含 api_key）
const update = (data: WebSearchProvidersDTO): Promise<AjaxResult<WebSearchProvidersVO>> =>
  request({ url: `${PATH}/update/single`, method: 'POST', data });

// 6. 删除
const _delete = (id: string): Promise<AjaxResult<void>> =>
  request({ url: `${PATH}/delete/single`, method: 'POST', params: { id } });

// 7. 测试已保存
const testById = (id: string): Promise<AjaxResult<WebSearchTestResult>> =>
  request({ url: `${PATH}/${id}/test`, method: 'POST' });

// 8. 测试未保存
const testRaw = (data: WebSearchTestRequestDTO): Promise<AjaxResult<WebSearchTestResult>> =>
  request({ url: `${PATH}/test`, method: 'POST', data });

// 9. 凭证：更新或查询
const updateOrQueryCredentials = (
  data: WebSearchCredentialsDTO
): Promise<AjaxResult<{ fields?: Record<string, CredentialFieldMeta> }>> =>
  request({ url: `${PATH}/credentials`, method: 'POST', data });

// 10. 删除凭证
const deleteCredentialField = (id: string, field: string): Promise<AjaxResult<void>> =>
  request({ url: `${PATH}/${id}/credentials/${field}`, method: 'DELETE' });

export const WebSearchProviders = {
  types,
  list,
  single,
  insert,
  update,
  delete: _delete,
  testById,
  testRaw,
  updateOrQueryCredentials,
  deleteCredentialField,
};