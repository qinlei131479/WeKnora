// import { AjaxResult, McpServicesEntity, McpServicesListReq, McpServicesSaveReq, McpServicesToolBatchReqItem, McpServicesToolResp, PageDomain, TableDataInfo } from '@/types';
// import request from '@/utils/request'

// const API = "/business";

// // 按 id 查询
// export function getMcpServicesSingleApi(id: string): Promise<AjaxResult<McpServicesEntity>> {
//   return request.get(`${API}/mcpServices/single?id=${id}`)
// }

// // 按条件分页查询
// export function getMcpServicesListApi(req: McpServicesListReq, page: PageDomain): Promise<TableDataInfo<McpServicesEntity>> {
//   return request.get(`${API}/mcpServices/list`, { ...req, ...page })
// }

// // 新增
// export function insertMcpServicesSingleApi(req: McpServicesSaveReq): Promise<AjaxResult<McpServicesEntity>> {
//   return request.post(`${API}/mcpServices/insert/single`, req)
// }

// // 按 id 更新
// export function updateMcpServicesSingleApi(req: McpServicesSaveReq): Promise<AjaxResult<McpServicesEntity>> {
//   return request.post(`${API}/mcpServices/update/single`, req)
// }

// // 按 id 删除
// export function deleteMcpServicesSingleApi(id: string): Promise<AjaxResult<any>> {
//   return request.get(`${API}/mcpServices/delete/single?id=${id}`)
// }

// // 批量启用
// export function enableMcpServicesBatchApi(req: string[]): Promise<AjaxResult<any>> {
//   return request.post(`${API}/mcpServices/enabled/batch`, req)
// }

// // 批量停用
// export function disableMcpServicesBatchApi(req: string[]): Promise<AjaxResult<any>> {
//   return request.post(`${API}/mcpServices/disabled/batch`, req)
// }

// // 获取MCP已启用工具列表
// export function getMcpServicesToolListApi(mcpId: string): Promise<AjaxResult<McpServicesToolResp[]>> {
//   return request.post(`${API}/mcpServices/tool/list?mcpId=${mcpId}`)
// }

// // 批量启用工具
// export function enableMcpServicesToolBatchApi(req: McpServicesToolBatchReqItem[]): Promise<AjaxResult<any>> {
//   return request.post(`${API}/mcpServices/tool/enabled/batch`, req)
// }

// // 批量停用工具
// export function disableMcpServicesToolBatchApi(req: McpServicesToolBatchReqItem[]): Promise<AjaxResult<any>> {
//   return request.post(`${API}/mcpServices/tool/disabled/batch`, req)
// }
