import { AjaxResult, PageDomain, TableDataInfo, TenantMemberEntity, TenantMemberListReq, TenantMemberRole, TenantMemberSaveReq } from '@/types';
import request from '@/utils/request'


const API = "/business";

export function getTenantMemberListApi(req: TenantMemberListReq, page: PageDomain): Promise<TableDataInfo<TenantMemberEntity>> {
  return request.get(`${API}/users/list`, { params: { ...req, ...page } })
}
export function addTenantMemberSingleApi(req: TenantMemberSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/users/insert/single`, req)
}
export function updateTenantMemberSingleApi(req: TenantMemberSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/users/update/single`, req)
}
export function deleteTenantMemberSingleApi(req: number|string): Promise<AjaxResult> {
  return request.post(`${API}/users/delete/single?id=${req}`)
}
export function getTenantMemberSingleApi(req: number|string): Promise<AjaxResult<TenantMemberEntity>> {
  return request.get(`${API}/users/single?id=${req}`)
}

// // 批量启用
// export function enableTenantMemberBatchApi(req: (number|string)[]): Promise<AjaxResult> {
//   return request.post(`${API}/users/enabled/batch`, req)
// }
// // 批量停用
// export function disableTenantMemberBatchApi(req: (number|string)[]): Promise<AjaxResult> {
//   return request.post(`${API}/users/disabled/batch`, req)
// }

export function enableTenantMemberApi(id: number|string): Promise<AjaxResult> {
  return request.get(`${API}/users/enable?userId=${id}`)
}
export function disableTenantMemberApi(id: number|string): Promise<AjaxResult> {
  return request.get(`${API}/users/disable?userId=${id}`)
}
