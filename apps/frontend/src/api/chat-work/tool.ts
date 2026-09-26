import { apiAdminGet } from './base'

const BASE_URL = '/api/system/tools'

export const getTools = (category?: string | null, source?: string | null) => {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (source) params.set('source', source)
  const query = params.size ? `?${params.toString()}` : ''
  return apiAdminGet(`${BASE_URL}${query}`)
}

export const getToolOptions = () => apiAdminGet(`${BASE_URL}/options`)

export const toolApi = {
  getTools,
  getToolOptions,
}

export default toolApi
