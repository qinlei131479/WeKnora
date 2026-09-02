import { AjaxResult, PageDomain, TableDataInfo, KnowledgeFaqEntity, KnowledgeFaqListReq, KnowledgeTag } from '@/types';
import request from '@/utils/request';

const API = '/business';

export function getKnowledgeFaqListApi(req: KnowledgeFaqListReq, page: PageDomain): Promise<TableDataInfo<KnowledgeFaqEntity>> {
  return request.post(`${API}/knowledges/faq/entries`, req, { params: page });
}
// export function addKnowledgeFaqSingleApi(req: KnowledgeFaqSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/insert/single`, req)
// }
// export function updateKnowledgeFaqSingleApi(req: KnowledgeFaqSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/update/single`, req)
// }
export function deleteKnowledgeFaqSingleApi(req: number | string): Promise<AjaxResult> {
  return request.get(`${API}/knowledges/faq/delete?id=${req}`);
}
// export function getKnowledgeFaqSingleApi(req: number | string): Promise<AjaxResult<KnowledgeFaqEntity>> {
//   return request.get(`${API}/knowledges/single?id=${req}`);
// }

// 根据知识库ID查询所有标签
export function getKnowledgeTagsApi(knowledgeBaseId: number | string): Promise<AjaxResult<KnowledgeTag[]>> {
  return request.get(`${API}/knowledges/tags?knowledgeBaseId=${knowledgeBaseId}`);
}

// // 批量启用
// export function enableKnowledgeFaqsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/enabled/batch`, req)
// }
// // 批量停用
// export function disableKnowledgeFaqsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/disabled/batch`, req)
// }
