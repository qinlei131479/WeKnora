import i18n from '@/i18n'

export const HARNESS_API_PREFIX = '/harness-api'

export function harnessUrl(url: string): string {
  if (!url) return url
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith(HARNESS_API_PREFIX)) {
    return url
  }
  if (url.startsWith('/api')) {
    return `${HARNESS_API_PREFIX}${url}`
  }
  return url
}

type ResponseType = 'json' | 'text' | 'blob'

export class RuntimeApiError extends Error {
  status: number
  statusText: string
  data: unknown

  constructor(message: string, status: number, statusText: string, data: unknown) {
    super(message)
    this.name = 'RuntimeApiError'
    this.status = status
    this.statusText = statusText
    this.data = data
  }
}

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {}
  const token = localStorage.getItem('weknora_token')
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id')
  if (selectedTenantId) {
    headers['X-Tenant-ID'] = selectedTenantId
  }
  headers['Accept-Language'] = i18n.global.locale?.value || localStorage.getItem('locale') || 'zh-CN'
  return headers
}

function detailMessage(errorData: unknown, fallback: string): string {
  if (!errorData || typeof errorData !== 'object') return fallback
  const detail = (errorData as { detail?: unknown; message?: unknown }).detail
  if (detail && typeof detail === 'object') {
    const nested = detail as { message?: unknown; error?: unknown }
    if (typeof nested.message === 'string' && nested.message) return nested.message
    if (typeof nested.error === 'string' && nested.error) return nested.error
    return fallback
  }
  if (typeof detail === 'string' && detail) return detail
  const message = (errorData as { message?: unknown }).message
  if (typeof message === 'string' && message) return message
  return fallback
}

export async function apiRequest(
  url: string,
  options: RequestInit = {},
  requiresAuth = true,
  responseType: ResponseType = 'json',
): Promise<unknown> {
  const resolvedUrl = harnessUrl(url)
  const isFormData = options.body instanceof FormData
  const requestOptions: RequestInit = {
    ...options,
    headers: {
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(requiresAuth ? authHeaders() : {}),
      ...(options.headers || {}),
    },
  }

  if (requiresAuth && !localStorage.getItem('weknora_token')) {
    throw new RuntimeApiError('用户未登录', 401, 'Unauthorized', null)
  }

  const response = await fetch(resolvedUrl, requestOptions)
  if (!response.ok) {
    let errorData: unknown = null
    let errorMessage = `请求失败: ${response.status}, ${response.statusText}`
    try {
      errorData = await response.json()
      errorMessage = detailMessage(errorData, errorMessage)
    } catch {
      // keep default message
    }
    if (response.status === 403) {
      errorMessage = '没有权限执行此操作'
    }
    throw new RuntimeApiError(errorMessage, response.status, response.statusText, errorData)
  }

  if (responseType === 'blob') return response
  if (responseType === 'text') return response.text()
  const contentType = response.headers.get('Content-Type')
  if (contentType && contentType.includes('application/json')) {
    return response.json()
  }
  return response.text()
}

export function apiGet(url: string, options: RequestInit = {}, requiresAuth = true, responseType: ResponseType = 'json') {
  return apiRequest(url, { method: 'GET', ...options }, requiresAuth, responseType)
}

export function apiPost(
  url: string,
  data: unknown = {},
  options: RequestInit = {},
  requiresAuth = true,
  responseType: ResponseType = 'json',
) {
  return apiRequest(
    url,
    {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      ...options,
    },
    requiresAuth,
    responseType,
  )
}
