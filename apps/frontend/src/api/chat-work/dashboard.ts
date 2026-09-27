import { apiGet } from './base'

export const dashboardApi = {
  getStats: () => {
    return apiGet('/api/dashboard/stats')
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
