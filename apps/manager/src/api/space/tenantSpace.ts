import { AjaxResult, PageDomain, TableDataInfo, TenantSpaceEntity, TenantSpaceListReq, TenantSpaceSaveReq } from '@/types';
import request from '@/utils/request'


const API = "/business";

export function getTenantSpaceListApi(req: TenantSpaceListReq, page: PageDomain): Promise<TableDataInfo<TenantSpaceEntity>> {
  return request.get(`${API}/tenants/list`, { params: { ...req, ...page } })
}
export function addTenantSpaceSingleApi(req: TenantSpaceSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/tenants/insert/single`, req)
}
export function updateTenantSpaceSingleApi(req: TenantSpaceSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/tenants/update/single`, req)
}
export function deleteTenantSpaceSingleApi(req: number|string): Promise<AjaxResult> {
  return request.post(`${API}/tenants/delete/single?id=${req}`)
}
export function getTenantSpaceSingleApi(req: number|string): Promise<AjaxResult<TenantSpaceEntity>> {
  return request.get(`${API}/tenants/single?id=${req}`)
}

// 批量启用
export function enableTenantsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
  return request.post(`${API}/tenants/enabled/batch`, req)
}
// 批量停用
export function disableTenantsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
  return request.post(`${API}/tenants/disabled/batch`, req)
}
