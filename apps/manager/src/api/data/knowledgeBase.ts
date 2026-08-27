import {
  AjaxResult,
  PageDomain,
  TableDataInfo,
  KnowledgeBaseEntity,
  KnowledgeBaseListReq,
  // KnowledgeBaseSaveReq,
  KnowledgeBaseActivityEntity
} from '@/types';
import request from '@/utils/request';

const API = '/business';

export function getKnowledgeBaseListApi(req: KnowledgeBaseListReq, page: PageDomain): Promise<TableDataInfo<KnowledgeBaseEntity>> {
  return request.get(`${API}/knowledgeBases/list`, { params: { ...req, ...page } });
}
// export function addKnowledgeBaseSingleApi(req: KnowledgeBaseSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledgeBases/insert/single`, req)
// }
// export function updateKnowledgeBaseSingleApi(req: KnowledgeBaseSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledgeBases/update/single`, req)
// }
export function deleteKnowledgeBaseSingleApi(req: number | string): Promise<AjaxResult> {
  return request.get(`${API}/knowledgeBases/delete/single?id=${req}`);
}
export function getKnowledgeBaseSingleApi(req: number | string): Promise<AjaxResult<KnowledgeBaseEntity>> {
  return request.get(`${API}/knowledgeBases/single?id=${req}`);
}

// // 批量启用
// export function enableKnowledgeBasesBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledgeBases/enabled/batch`, req)
// }
// // 批量停用
// export function disableKnowledgeBasesBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledgeBases/disabled/batch`, req)
// }

export function getKnowledgeBaseActivityListApi(
  knowledgeBaseId: number | string,
  page: PageDomain
): Promise<TableDataInfo<KnowledgeBaseActivityEntity>> {
  return request.get(`${API}/knowledgeBases/activity/list`, { params: { knowledgeBaseId, ...page } });
}
