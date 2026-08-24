import { AjaxResult, PageDomain, TableDataInfo, ModelEntity, ModelListReq, ModelSaveReq } from '@/types'
import request from '@/utils/request'

const API = "/business";

export function getModelListApi(req: ModelListReq, page: PageDomain): Promise<TableDataInfo<ModelEntity>> {
  return request.get(`${API}/models/list`, { params: { ...req, ...page } })
}
export function addModelSingleApi(req: ModelSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/models/insert/single`, req)
}
export function updateModelSingleApi(req: ModelSaveReq): Promise<AjaxResult> {
  return request.post(`${API}/models/update/single`, req)
}
export function deleteModelSingleApi(req: number|string): Promise<AjaxResult> {
  return request.post(`${API}/models/delete/single?id=${req}`)
}
export function getModelSingleApi(req: number|string): Promise<AjaxResult<ModelEntity>> {
  return request.get(`${API}/models/single?id=${req}`)
}

// // 批量启用
// export function enablemodelsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/models/enabled/batch`, req)
// }
// // 批量停用
// export function disablemodelsBatchApi(req: string[]|number[]): Promise<AjaxResult> {
//   return request.post(`${API}/models/disabled/batch`, req)
// }
