
import { MockMethod } from 'vite-plugin-mock'
import Mock from 'mockjs'
import { BASE_URL, AGENT_URL, AGENT_BRAIN_URL, wrapData, wrapTableData } from './base'
import type { BusinessAgentBrainEntity } from './src/types'

const DEFAULT_AGENTS: BusinessAgentBrainEntity[] = [
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
// 模拟生成用户列表数据
const createUserList = (count: number) => {
  const list = []
  for (let i = 0; i < count; i++) {
    list.push(
      Mock.mock({
        id: '@increment', // 自增ID
        username: '@cname', // 随机中文姓名
        email: '@email', // 随机邮箱
        phone: /^1[3-9]\d{9}$/, // 随机手机号正则
        avatar: '@image("200x200", "@color", "#fff", "@cname")', // 随机头像
        address: '@province @city @county', // 随机地址
        createTime: '@datetime("yyyy-MM-dd HH:mm:ss")', // 随机时间
        status: '@boolean', // 随机状态
      })
    )
  }
  return list
}

let agentList = JSON.parse(JSON.stringify(DEFAULT_AGENTS))
export default [
  // 列表接口
  {
    url: `${BASE_URL}${AGENT_URL}${AGENT_BRAIN_URL}/list`,
    method: 'get',
    response: () => wrapTableData(agentList, agentList.length)
  },
  // 新增接口
  {
    url: `${BASE_URL}${AGENT_URL}${AGENT_BRAIN_URL}/insert/single`,
    method: 'post',
    response: ({ body }) => {
      const agents = agentList
      const newAgent: BusinessAgentBrainEntity = {
        ...body,
        id: `agent-${Date.now()}`,
        creator: '管理员',
        date: new Date().toISOString().replace('T', ' ').substring(0, 19),
        config: {
          knowledgeCount: body.config?.knowledgeCount || 0,
          dataCount: body.config?.dataCount || 0,
          toolCount: body.config?.toolCount || 0,
          capabilityCount: body.config?.capabilityCount || 0,
          taskCount: body.config?.taskCount || 0,
        },
      }
      agents.push(newAgent)
      return wrapData(newAgent)
    }
  },
  // 修改接口
  {
    url: `${BASE_URL}${AGENT_URL}${AGENT_BRAIN_URL}/update/single`,
    method: 'post',
    response: ({ body }) => {
      const agents = agentList
      const index = agents.findIndex((a) => a.id === body.id)
      const target = agents[index]
      if (index !== -1) {
        Object.assign(target, body)
      }
      return wrapData(target)
    }
  },
  // 删除接口
  {
    url: `${BASE_URL}${AGENT_URL}${AGENT_BRAIN_URL}/delete/single`,
    method: 'post',
    response: ({ body }) => {
      const agents = agentList
      const index = agents.findIndex((a) => a.id === body.id)
      let target = agents[index];
      if (target) {
        agents.splice(index, 1)
      }
      return wrapData(target)
    }
  },
] as MockMethod[]
