import { apiGet } from './base'

type QueryRecord = Record<string, string | number | undefined>

function toQuery(params: QueryRecord): string {
  const queryParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })
  const encoded = queryParams.toString()
  return encoded ? `?${encoded}` : ''
}

export const dashboardApi = {
  getConversations: (params: QueryRecord = {}) => {
    return apiGet(`/api/dashboard/conversations${toQuery(params)}`)
  },

  getConversationDetail: (threadId: string) => {
    return apiGet(`/api/dashboard/conversations/${threadId}`)
  },

  getStats: () => {
    return apiGet('/api/dashboard/stats')
  },

  getFeedbacks: (params: QueryRecord = {}) => {
    const rating = params.rating === 'all' ? undefined : params.rating
    return apiGet(`/api/dashboard/feedbacks${toQuery({ rating, agent_id: params.agent_id })}`)
  },

  getUserStats: () => {
    return apiGet('/api/dashboard/stats/users')
  },

  getToolStats: () => {
    return apiGet('/api/dashboard/stats/tools')
  },

  getKnowledgeStats: () => {
    return apiGet('/api/dashboard/stats/knowledge')
  },

  getAgentStats: () => {
    return apiGet('/api/dashboard/stats/agents')
  },

  getAllStats: async () => {
    const [basicStats, userStats, toolStats, knowledgeStats, agentStats] = await Promise.all([
      apiGet('/api/dashboard/stats'),
      apiGet('/api/dashboard/stats/users'),
      apiGet('/api/dashboard/stats/tools'),
      apiGet('/api/dashboard/stats/knowledge'),
      apiGet('/api/dashboard/stats/agents'),
    ])
    return {
      basic: basicStats,
      users: userStats,
      tools: toolStats,
      knowledge: knowledgeStats,
      agents: agentStats,
    }
  },

  getCallTimeseries: (type = 'models', timeRange = '14days') => {
    return apiGet(`/api/dashboard/stats/calls/timeseries?type=${type}&time_range=${timeRange}`)
  },
}
