import { apiAdminGet } from './base'

const BASE_URL = '/api/system/tools'

export const getTools = (category?: string | null) => {
  const query = category ? `?${new URLSearchParams({ category }).toString()}` : ''
  return apiAdminGet(`${BASE_URL}${query}`)
}

export const getToolOptions = () => apiAdminGet(`${BASE_URL}/options`)

export const toolApi = {
  getTools,
  getToolOptions,
}

export default toolApi
