import { apiGet } from './base'

/**
 * 系统管理 API。模型下拉只读取 WeKnora 模型列表。
 */

export const modelProviderApi = {
  getV2Models: async (modelType = 'chat') => {
    return apiGet(`/api/system/model-providers/models/v2?model_type=${modelType}`)
  }
}
