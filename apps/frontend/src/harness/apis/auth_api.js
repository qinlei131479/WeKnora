/**
 * 认证相关 API
 */

import { apiAdminGet, apiGet, apiPost } from './base'

async function getUserAccessOptions() {
  return apiAdminGet('/api/auth/users/access-options')
}

async function getCLIAuthSession(userCode) {
  const encoded = encodeURIComponent(userCode)
  return apiGet(`/api/auth/cli/sessions/${encoded}`)
}

async function approveCLIAuthSession(userCode) {
  const encoded = encodeURIComponent(userCode)
  return apiPost(`/api/auth/cli/sessions/${encoded}/approve`, {})
}

export const authApi = {
  getUserAccessOptions,
  getCLIAuthSession,
  approveCLIAuthSession
}
