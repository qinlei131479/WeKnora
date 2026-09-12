import { apiAdminDelete, apiAdminGet, apiAdminPost, apiAdminPut, apiGet } from './base'

const BASE_URL = '/api/system/mcp-servers'

export const getMcpServers = () => apiGet(BASE_URL)

export const getMcpServer = (name: string) => apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}`)

export const createMcpServer = (data: unknown) => apiAdminPost(BASE_URL, data)

export const updateMcpServer = (name: string, data: unknown) =>
  apiAdminPut(`${BASE_URL}/${encodeURIComponent(name)}`, data)

export const deleteMcpServer = (name: string) => apiAdminDelete(`${BASE_URL}/${encodeURIComponent(name)}`)

export const testMcpServer = (name: string) =>
  apiAdminPost(`${BASE_URL}/${encodeURIComponent(name)}/test`, {})

export const updateMcpServerStatus = (name: string, enabled: boolean) =>
  apiAdminPut(`${BASE_URL}/${encodeURIComponent(name)}/status`, { enabled })

export const getMcpServerTools = (name: string) =>
  apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}/tools`)

export const refreshMcpServerTools = (name: string) =>
  apiAdminPost(`${BASE_URL}/${encodeURIComponent(name)}/tools/refresh`, {})

export const toggleMcpServerTool = (serverName: string, toolName: string) =>
  apiAdminPut(
    `${BASE_URL}/${encodeURIComponent(serverName)}/tools/${encodeURIComponent(toolName)}/toggle`,
    {},
  )

export const mcpApi = {
  getMcpServers,
  getMcpServer,
  createMcpServer,
  updateMcpServer,
  deleteMcpServer,
  testMcpServer,
  updateMcpServerStatus,
  getMcpServerTools,
  refreshMcpServerTools,
  toggleMcpServerTool,
}

export default mcpApi
