import { AjaxResult, McpEntity, McpListReq, McpSaveReq, McpToolBatchReqItem, McpToolResp, PageDomain, TableDataInfo } from '@/types';
import request from '@/utils/request'


export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  require_approval?: boolean
}

export interface MCPToolApprovalRow {
  id: string
  tenant_id?: number
  service_id: string
  tool_name: string
  require_approval: boolean
}

export interface MCPResource {
  uri: string
  name: string
  description?: string
  mimeType?: string
}

export interface MCPTestResult {
  success: boolean
  message?: string
  description?: string
  // Set when the server requires OAuth (RFC 9728) but the service was not
  // configured for it — the UI guides the user to switch to OAuth 2.0.
  oauth_required?: boolean
  tools?: MCPTool[]
  resources?: MCPResource[]
}

const API = "/business";
// 按条件分页查询
export function getMcplistApi(req: McpListReq, page: PageDomain): Promise<TableDataInfo<McpEntity>> {
  return request.get(`${API}/mcpServices/list`, { ...req, ...page })
}
// 按 id 查询
export function getMcpSingleApi(id: string): Promise<AjaxResult<McpEntity>> {
  return request.get(`${API}/mcpServices/single?id=${id}`)
}
// 按 id 删除
export function deleteMcpSingleApi(id: string): Promise<AjaxResult<any>> {
  return request.get(`${API}/mcpServices/delete/single?id=${id}`)
}
// 新增
export function insertMcpSingleApi(req: McpSaveReq): Promise<AjaxResult<McpEntity>> {
  return request.post(`${API}/mcpServices/insert/single`, req)
}
// 按 id 更新
export function updateMcpSingleApi(req: McpSaveReq): Promise<AjaxResult<McpEntity>> {
  return request.post(`${API}/mcpServices/update/single`, req)
}
// 批量启用
export function enableMcpBatchApi(req: string[]): Promise<AjaxResult<any>> {
  return request.post(`${API}/mcpServices/enabled/batch`, req)
}
// 批量停用
export function disableMcpBatchApi(req: string[]): Promise<AjaxResult<any>> {
  return request.post(`${API}/mcpServices/disabled/batch`, req)
}
// 获取MCP service configurations已启用工具列表
export function getMcpToolListApi(mcpId : string): Promise<AjaxResult<McpToolResp[]>> {
  return request.post(`${API}/mcpServices/tool/list?mcpId=${mcpId}`)
}
// 批量启用工具
export function enableMcpToolBatchApi(req: McpToolBatchReqItem[]): Promise<AjaxResult<any>> {
  return request.post(`${API}/mcpServices/tool/enabled/batch`, req)
}
// 批量停用工具
export function disableMcpToolBatchApi(req: McpToolBatchReqItem[]): Promise<AjaxResult<any>> {
  return request.post(`${API}/mcpServices/tool/disabled/batch`, req)
}

// 测试MCP service
export function testMcpServiceApi(id: string): Promise<AjaxResult<MCPTestResult>> {
  return request.get(`${API}/mcpServices/test?id=${id}`)
}