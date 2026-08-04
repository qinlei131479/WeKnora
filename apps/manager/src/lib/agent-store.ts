export interface Agent {
  id: string
  name: string
  description: string
  status: string
  creator: string
  date: string
  mode: string
  model: string
  domain: string
  brainType?: 'base' | 'business'
  parentAgentId?: string
  config: {
    knowledgeCount: number
    dataCount: number
    toolCount: number
    capabilityCount: number
    taskCount: number
  }
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent-1',
    name: '融媒体新闻稿智能编写助手',
    description: '专为融媒体行业定制的新闻稿初稿生成与事实核查机器人。对接每日央视热点与地方资讯库。',
    status: '已发布',
    creator: '张融媒',
    date: '2026-05-28 10:15:30',
    mode: '深度思考',
    model: 'DeepSeek R1',
    domain: 'biz-media-news',
    config: { knowledgeCount: 5, dataCount: 2, toolCount: 4, capabilityCount: 2, taskCount: 3 },
  },
  {
    id: 'agent-2',
    name: 'IPTV 智能内容推荐与运营助手',
    description: '根据用户收视数据和标签包进行电视内容企划推荐与编排，智能生成轮播频道运营策略。',
    status: '已发布',
    creator: '李视频',
    date: '2026-05-29 14:20:00',
    mode: '即时响应',
    model: 'Gemini 1.5 Pro',
    domain: 'biz-ott-iptv',
    config: { knowledgeCount: 3, dataCount: 5, toolCount: 2, capabilityCount: 4, taskCount: 1 },
  },
  {
    id: 'agent-3',
    name: 'HR 招聘与简历初步核查筛选助手',
    description: '专门进行校园招聘及社会招聘简历筛选、面试问题生成以及招聘分析报告。',
    status: '已保存',
    creator: '赵小姐',
    date: '2026-05-30 08:30:00',
    mode: '深度思考',
    model: 'DeepSeek R1',
    domain: 'biz-hr-recruit',
    config: { knowledgeCount: 2, dataCount: 1, toolCount: 1, capabilityCount: 3, taskCount: 2 },
  },
]

export function getAgents(): Agent[] {
  try {
    const data = localStorage.getItem('ai-agents-list-v1')
    if (data) return JSON.parse(data)
  } catch (e) {
    console.error(e)
  }
  return DEFAULT_AGENTS
}

export function saveAgents(agents: Agent[]) {
  localStorage.setItem('ai-agents-list-v1', JSON.stringify(agents))
}

export function addAgent(agent: Omit<Agent, 'id' | 'creator' | 'date' | 'config'> & { config?: Partial<Agent['config']> }): Agent {
  const agents = getAgents()
  const newAgent: Agent = {
    ...agent,
    id: `agent-${Date.now()}`,
    creator: '管理员',
    date: new Date().toISOString().replace('T', ' ').substring(0, 19),
    config: {
      knowledgeCount: agent.config?.knowledgeCount || 0,
      dataCount: agent.config?.dataCount || 0,
      toolCount: agent.config?.toolCount || 0,
      capabilityCount: agent.config?.capabilityCount || 0,
      taskCount: agent.config?.taskCount || 0,
    },
  }
  agents.push(newAgent)
  saveAgents(agents)
  return newAgent
}

export function deleteAgent(id: string) {
  const agents = getAgents()
  const filtered = agents.filter((a) => a.id !== id)
  saveAgents(filtered)
}
