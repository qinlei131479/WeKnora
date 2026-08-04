import request from '@/utils/request'
import { parseStrEmpty } from "@/utils/ruoyi"
import type { AgentBrainEntity, AgentBrainSaveDataSource, AgentBrainSaveKnowledge, AgentBrainSaveModel, AgentBrainSaveSkill, AgentBrainSaveTool, AjaxResult, BaseAgentBrainSaveParams } from '@/types'
const SERVER_NAME = '/business/agiAgentic';

// 基础半脑

// 查询
export function getBaseAgentBrainApi(): Promise<AjaxResult<AgentBrainEntity>> {
  return request({
    url: `${SERVER_NAME}/base/single`,
    method: 'get',
  })
}
// 修改模型
export function updateBaseAgentBrainModelApi(data: AgentBrainSaveModel): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/base/update/model`,
    method: 'post',
    data: data
  })
}
// 修改知识
export function updateBaseAgentBrainKnowledgeApi(data: AgentBrainSaveKnowledge): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/base/update/knowledge`,
    method: 'post',
    data: data
  })
}
// 修改数据集
export function updateBaseAgentBrainDsApi(data: AgentBrainSaveDataSource): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/base/update/datasource`,
    method: 'post',
    data: data
  })
}
// 修改工具
export function updateBaseAgentBrainToolApi(data: AgentBrainSaveTool): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/base/update/tool`,
    method: 'post',
    data: data
  })
}
// 修改能力
export function updateBaseAgentBrainSkillApi(data: AgentBrainSaveSkill): Promise<AjaxResult> {
  return request({
    url: `${SERVER_NAME}/base/update/skill`,
    method: 'post',
    data: data
  })
}
