import { apiAdminDelete, apiAdminGet, apiAdminPost, apiAdminPut, apiGet } from './base'

const BASE_URL = '/api/system/mcp-servers'

export const HARNESS_MCP_OAUTH_CALLBACK_PATH = '/harness-api/api/system/mcp-servers/oauth/callback'

export const getMcpServers = () => apiGet(BASE_URL)

export const getMcpServer = (name: string) => apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}`)

export const createMcpServer = (data: unknown) => apiAdminPost(BASE_URL, data)

export const updateMcpServer = (name: string, data: unknown) =>
  apiAdminPut(`${BASE_URL}/${encodeURIComponent(name)}`, data)

export const deleteMcpServer = (name: string) => apiAdminDelete(`${BASE_URL}/${encodeURIComponent(name)}`)

export const testMcpServer = (name: string) =>
  apiAdminPost(`${BASE_URL}/${encodeURIComponent(name)}/test`, {})

export const testMcpConnection = (data: {
  transport_type?: string
  url: string
  headers?: Record<string, string>
}) => apiAdminPost(`${BASE_URL}/test-connection`, data)

export const getMcpMetadata = (name: string) =>
  apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}/metadata`)

export const refreshMcpMetadata = (name: string) =>
  apiAdminPost(`${BASE_URL}/${encodeURIComponent(name)}/metadata/refresh`, {})

export const getMcpToolApprovals = (name: string) =>
  apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}/tool-approvals`)

export const setMcpToolPolicy = (name: string, toolName: string, body: { enabled?: boolean; require_approval?: boolean }) =>
  apiAdminPut(
    `${BASE_URL}/${encodeURIComponent(name)}/tool-approvals/${encodeURIComponent(toolName)}`,
    body,
  )

export const putMcpCredentials = (name: string, body: Record<string, string>) =>
  apiAdminPut(`${BASE_URL}/${encodeURIComponent(name)}/credentials`, body)

export const deleteMcpCredential = (name: string, field: string) =>
  apiAdminDelete(`${BASE_URL}/${encodeURIComponent(name)}/credentials/${encodeURIComponent(field)}`)

export const getMcpOAuthAuthorizeURL = (name: string, body: { redirect_uri: string; frontend_redirect?: string }) =>
  apiAdminPost(`${BASE_URL}/${encodeURIComponent(name)}/oauth/authorize-url`, body)

export const getMcpOAuthStatus = (name: string, authorizationAttempt?: string) => {
  const query = authorizationAttempt
    ? `?authorization_attempt=${encodeURIComponent(authorizationAttempt)}`
    : ''
  return apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}/oauth/status${query}`)
}

export const revokeMcpOAuthToken = (name: string) =>
  apiAdminDelete(`${BASE_URL}/${encodeURIComponent(name)}/oauth/token`)

export const updateMcpServerStatus = (name: string, enabled: boolean) =>
  apiAdminPut(`${BASE_URL}/${encodeURIComponent(name)}/status`, { enabled })

export const getMcpServerTools = (name: string) =>
  apiAdminGet(`${BASE_URL}/${encodeURIComponent(name)}/tools`)

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
  testMcpConnection,
  getMcpMetadata,
  refreshMcpMetadata,
  getMcpToolApprovals,
  setMcpToolPolicy,
  putMcpCredentials,
  deleteMcpCredential,
  getMcpOAuthAuthorizeURL,
  getMcpOAuthStatus,
  revokeMcpOAuthToken,
  updateMcpServerStatus,
  getMcpServerTools,
  toggleMcpServerTool,
}

export default mcpApi
