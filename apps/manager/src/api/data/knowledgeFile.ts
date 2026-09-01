import { AjaxResult, PageDomain, TableDataInfo, KnowledgeFileEntity, KnowledgeFileListReq, KnowledgeFileFoldersResp } from '@/types';
import request, { getBlob } from '@/utils/request';

const API = '/business';

export function getKnowledgeFileListApi(req: KnowledgeFileListReq, page: PageDomain): Promise<TableDataInfo<KnowledgeFileEntity>> {
  return request.get(`${API}/knowledges/list`, { params: { ...req, ...page } });
}
// export function addKnowledgeFileSingleApi(req: KnowledgeFileSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/insert/single`, req)
// }
// export function updateKnowledgeFileSingleApi(req: KnowledgeFileSaveReq): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/update/single`, req)
// }
export function deleteKnowledgeFileSingleApi(req: number | string): Promise<AjaxResult> {
  return request.get(`${API}/knowledges/delete/single?id=${req}`);
}
export function getKnowledgeFileSingleApi(req: number | string): Promise<AjaxResult<KnowledgeFileEntity>> {
  return request.get(`${API}/knowledges/single?id=${req}`);
}

export function getKnowledgeFileFoldersApi(knowledgeBaseId: number | string): Promise<AjaxResult<KnowledgeFileFoldersResp>> {
  return request.get(`${API}/knowledges/folders?knowledgeBaseId=${knowledgeBaseId}`);
}

// // 批量启用
// export function enableKnowledgeFilesBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/enabled/batch`, req)
// }
// // 批量停用
// export function disableKnowledgeFilesBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/knowledges/disabled/batch`, req)
// }

export function getPreviewKnowledgeFileApi(req: number | string): Promise<Blob> {
  // const isDev = import.meta.env.DEV;
  // console.log('isDev', isDev);
  // if (isDev) {
  //   return getBlob(`${API}/p3.docx?api=knowledges/preview&id=${req}`, { baseURL: '/mock' });
  // }
  return getBlob(`${API}/knowledges/preview?id=${req}`);
}
