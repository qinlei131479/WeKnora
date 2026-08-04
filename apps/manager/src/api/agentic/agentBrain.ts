import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi"
import type { BusinessAgentBrainQueryParams, TableDataInfo, AgentBrainEntity, AjaxResult, BusinessAgentBrainSaveParams, AgentBrainSaveModel, AgentBrainSaveKnowledge, AgentBrainSaveDataSource, AgentBrainSaveTool, AgentBrainSaveSkill, AgentBrainSavePersona, AgentBrainSaveAuth, AgentBrainSaveTask, AgentBrainTaskQueryParams, AgentBrainTaskCalenderData, AgentBrainTaskItem, PageDomain } from '@/types'
const SERVER_NAME = '/business/agiAgentic';

// 查询列表
export function listBusinessAgentBrainApi(query: BusinessAgentBrainQueryParams): Promise<TableDataInfo<AgentBrainEntity>> {
  return request({
    url: `${SERVER_NAME}/list`,
    method: 'get',
    params: query
  })
}

// 查询详细
export function getBusinessAgentBrainApi(id?: number|string): Promise<AjaxResult<AgentBrainEntity>> {
  return request({
    url: `${SERVER_NAME}/single?id=${parseStrEmpty(id)}`,
    method: 'get'
  })
}

// 新增
export function addBusinessAgentBrainApi(data: BusinessAgentBrainSaveParams): Promise<AjaxResult<AgentBrainEntity>> {
  return request({
    url: `${SERVER_NAME}/insert/single`,
    method: 'post',
    data: data
  })
}

// 修改
export function updateBusinessAgentBrainApi(data: BusinessAgentBrainSaveParams): Promise<AjaxResult<AgentBrainEntity>> {
  return request({
    url: `${SERVER_NAME}/update/single`,
    method: 'post',
    data: data
  })
}

// 删除
export function delBusinessAgentBrainApi(agenticId: number | string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/delete/single?agenticId=${agenticId}`,
    method: 'get',
  })
}
// 查询分组列表
export function businessAgentBrainGroupListApi(params: any) {
  // return request({
  //   url: `${SERVER_NAME}/agentBrain/groupList`,
  //   method: 'post',
  //   data: params
  // })
  return Promise.resolve({
    code: 200,
    msg: 'success',
    data: [
      {
        id: "group-1",
        name: '新闻与媒体通识类',
        list: [
          {
            id: "agent-1",
            name: "融媒体新闻稿智能编写助手",
            description: "专为融媒体行业定制的新闻稿初稿生成与事实核查机器人。对接每日央视热点与地方资讯库。",
            status: "已发布",
            creator: "张融媒",
            date: "2026-05-28 10:15:30",
            mode: "深度思考",
            model: "DeepSeek R1",
            domain: "biz-media-news",
            config: { knowledgeCount: 5, dataCount: 2, toolCount: 4, capabilityCount: 2, taskCount: 3 }
          }
        ]
      },
      {
        id: "group-2",
        name: '企业视频运营类',
        list: [
          {
            id: "agent-2",
            name: "IPTV 智能内容推荐与运营助手",
            description: "根据用户收视数据和标签包进行电视内容企划推荐与编排，智能生成轮播频道运营策略。",
            status: "已发布",
            creator: "李视频",
            date: "2026-05-29 14:20:00",
            mode: "即时响应",
            model: "Gemini 1.5 Pro",
            domain: "biz-ott-iptv",
            config: { knowledgeCount: 3, dataCount: 5, toolCount: 2, capabilityCount: 4, taskCount: 1 }
          }
        ]
      },
      {
        id: "group-3",
        name: '人力资源招聘类',
        list: [
          {
            id: "agent-3",
            name: "HR 招聘与简历初步核查筛选助手",
            description: "专门进行校园招聘及社会招聘简历筛选、面试问题生成以及招聘分析报告。",
            status: "已保存",
            creator: "赵小姐",
            date: "2026-05-30 08:30:00",
            mode: "深度思考",
            model: "DeepSeek R1",
            domain: "biz-hr-recruit",
            config: { knowledgeCount: 2, dataCount: 1, toolCount: 1, capabilityCount: 3, taskCount: 2 }
          }
        ]
      }
    ]
  })
}


// 修改人设
export function updateBusinessAgentBrainPersonaApi(data: AgentBrainSavePersona): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/persona`,
    method: 'post',
    data: data
  })
}


// 修改模型
export function updateBusinessAgentBrainModelApi(data: AgentBrainSaveModel): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/model`,
    method: 'post',
    data: data
  })
}
// 修改知识
export function updateBusinessAgentBrainKnowledgeApi(data: AgentBrainSaveKnowledge): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/knowledge`,
    method: 'post',
    data: data
  })
}
// 修改数据集
export function updateBusinessAgentBrainDsApi(data: AgentBrainSaveDataSource): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/dataSource`,
    method: 'post',
    data: data
  })
}
// 修改工具
export function updateBusinessAgentBrainToolApi(data: AgentBrainSaveTool): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/tool`,
    method: 'post',
    data: data
  })
}
// 修改能力
export function updateBusinessAgentBrainSkillApi(data: AgentBrainSaveSkill): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/skill`,
    method: 'post',
    data: data
  })
}
// 修改权限
export function updateBusinessAgentBrainAuthApi(data: AgentBrainSaveAuth): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/auth`,
    method: 'post',
    data: data
  })
}

// 获取任务详情
export function getAgentBrainTaskDetailApi(taskId: number|string): Promise<AjaxResult<AgentBrainTaskItem>> {
  return request({
    url: `${SERVER_NAME}/task/single?taskId=${taskId}`,
    method: 'get'
  })
}



// 新增任务
export function addFkBusinessAgentBrainTaskApi(data: AgentBrainSaveTask): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/insert/task`,
    method: 'post',
    data: data
  })
}
// 修改任务
export function updateBusinessAgentBrainTaskApi(data: AgentBrainSaveTask): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/update/task`,
    method: 'post',
    data: data
  })
}

// 月任务列表
export function getAgentBrainCalendarTasksApi(params: AgentBrainTaskQueryParams): Promise<AjaxResult<AgentBrainTaskCalenderData>> {
  return request({
    url: `${SERVER_NAME}/task/calendar`,
    method: 'post',
    data: params
  })
}
// 任务列表
export function getAgentBrainListTasksApi(quers: AgentBrainTaskQueryParams, page?: PageDomain): Promise<TableDataInfo<AgentBrainTaskItem>> {
  const params = {
    ...quers,
    ...page
  }
  return request({
    url: `${SERVER_NAME}/task/list`,
    method: 'get',
    params: params
  })
}

// 删除任务
export function deleteBusinessAgentBrainTaskApi(taskId: number|string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/delete/task?taskId=${taskId}`,
    method: 'get'
  })
}
// 启用任务
export function enableBusinessAgentBrainTaskApi(taskId: number|string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/task/enable?taskId=${taskId}`,
    method: 'get'
  })
}
// 停用任务
export function disableBusinessAgentBrainTaskApi(taskId: number|string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/task/disable?taskId=${taskId}`,
    method: 'get'
  })
}
// 上线智能体大脑
export function onlineAgentBrainApi(agenticId: number|string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/online?agenticId=${agenticId}`,
    method: 'get'
  })
}
// 下线智能体大脑
export function offlineAgentBrainApi(agenticId: number|string): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/offline?agenticId=${agenticId}`,
    method: 'get'
  })
}
