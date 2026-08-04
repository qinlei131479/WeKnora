import { KnowledgeLibEntity, ModelVO, SkillVO, ToolVO } from '@/types';
import type { AjaxResult, PageDomain, BaseEntity } from '../common';

export interface AgentBrainPersona {
  name: string; // 大脑名称
  categoryId: number | null; // 归属领域ID
  description: string; // 大脑描述
  prompt: string; // 大脑提示词
  welcomeMessage?: string; // 欢迎语
}
export interface AgentBrainModel {
  defaultChatMode?: number; // 默认对话模式: 1-即时响应 2-深度思考与推理
  fastModel?: AgentBrainModelItem; // 即时响应大模型
  fastModelId?: number; // 即时响应大模型ID
  slowModel?: AgentBrainModelItem; // 深度思考与推理大模型
  slowModelId?: number; // 深度思考与推理大模型ID
  memoryFlag?: number; // 开启长期记忆标识: 0-不开启 1-开启
  models?: AgentBrainModelItem[]; // 绑定的大模型列表
  // modelIds?: number[] // 大模型ID列表
  // modelList?: any[] // 基础半脑大模型列表
}
export interface AgentBrainModelItem extends ModelVO {}
export interface AgentBrainToolItem extends ToolVO {}
export interface AgentBrainSkillItem extends SkillVO {}
export interface AgentBrainDataSourceItem extends BaseEntity {
  /** 主键 */
  id: number;
  /** 数据源名称 */
  name: string;
  /** 归属领域ID */
  categoryId: number;
  /** 描述 */
  description: string;
  /** jdbc连接地址 */
  url: string;
  /** 用户名 */
  username: string;
  /** 密码(加密) */
  password: string;
  /** 数据库类型: 1-mysql, 2-postgresql等 */
  dsType: number;
  /** 配置类型 */
  confType: string;
  /** 数据库名称 */
  dsName: string;
  /** 实例 */
  instance: string;
  /** 端口 */
  port: number;
  /** 主机 */
  host: string;
  /** 状态: 0-成功, 1-失败 2-未验证 */
  status: number;
}
export interface AgentBrainTaskBase {
  /** 主键 */
  id?: number;
  // /** 智能体大脑表ID agi_agentic.id */
  // agenticId?: number;
  /** 任务名称 */
  taskName?: string;
  /** 开始时间 */
  startDate?: string;
  /** 执行班期: 0-不重复 1-每天 2-每周 3-每月 4-每年 */
  execType?: number;
  /** 结束时间 */
  endDate?: string;
  /** 重复周期:每*天/周/月/年 */
  repeatPeriod?: number;
  /** 重复时间:每周的周几，每月的几号，多个英文逗号隔开 */
  repeatTime?: string;
  /** 自然语言指令 */
  content?: string;
  /** 启用标识: 0-停用 1-启用 */
  enable?: number;
  status?: number; // 状态: 0-待执行 1-执行中 2-已执行 3-执行失败
}
export interface AgentBrainTaskPerson {
  personType: number; // 对象类型: 0-用户 1-部门 2-岗位 3-用户组
  personId: number; // 对象ID
  personName?: string; // 对象名称
}
export interface AgentBrainTaskItem extends AgentBrainTaskBase, BaseEntity {
  skills?: AgentBrainSkillItem[]; // 任务添加的技能列表
  persons?: AgentBrainTaskPerson[]; // 任务对象列表
}

export interface AgentBrainAuthBaseItem {
  authId?: number; // 权限对象(关联sys_dept.id、knowledge_role.id、sys_post.id)
  authType?: number; // 权限类别 0-部门 1-岗位 2-用户组
}
export interface AgentBrainAuthItem extends AgentBrainAuthBaseItem, BaseEntity {
  /** 主键 */
  id?: number;
  /** 智能体大脑表ID agi_agentic.id */
  agenticId?: number;
}

export interface AgentBrainBase extends AgentBrainPersona, AgentBrainModel {
  id?: number;
  status?: number; // 状态: 0-下线 1-上线
  knowledges?: KnowledgeLibEntity[]; // 绑定的知识库列表
  tools?: AgentBrainToolItem[]; // 绑定的工具列表
  skills?: AgentBrainSkillItem[]; // 绑定的能力列表
  datasources?: AgentBrainDataSourceItem[]; // 绑定的数据源
  tasks?: AgentBrainTaskItem[]; // 绑定的任务列表
  auths?: AgentBrainAuthItem[]; // 绑定的权限列表
  // categoryId?: number // 归属领域ID
  // name: string // 大脑名称
  // description: string
  // prompt: string // 大脑提示词
  // welcomeMessage: string // 欢迎语
  // defaultChatMode: number // 默认对话模式: 1-即时响应 2-深度思考与推理
  // fastModel?: string // 即时响应大模型
  // slowModel?: string // 深度思考与推理大模型
  // memoryFlag?: number // 开启长期记忆标识: 0-不开启 1-开启
  // status: string
  // creator?: string
  // date?: string
  // mode?: string
  // model?: string
  // domain: string
  // brainType: 'base' | 'business'
  // parentAgentId?: string
  // config?: BusinessAgentBrainConfig
}

export interface BusinessAgentBrainQueryParams extends PageDomain {
  categoryId?: number; // 归属领域ID
  categoryIdPath?: string;
  keyword?: string; // 搜索关键词
}

export interface BusinessAgentBrainConfig {
  knowledgeCount: number;
  dataCount: number;
  toolCount: number;
  capabilityCount: number;
  taskCount: number;
}
export interface AgentBrainEntity extends AgentBrainBase, BaseEntity {}

// export interface BusinessAgentBrainTask {
//   taskName: string // 任务名称
//   execType: number // 执行班期: 0-不重复 1-每天 2-每周 3-每月 4-自定义
//   execRate: string // 执行时间
//   content: string // 自然语言指令
//   enable: number // 启用标识: 0-停用 1-启用
// }
interface AgentBrainSaveParams {
  modelIds?: number[]; // 大模型ID列表
  knowledgeIds?: number[]; // 知识库ID列表
  dsIds?: number[]; // 数据集ID列表
  toolIds?: number[]; // 工具ID列表
  skillIds?: number[]; // 能力ID列表
  auths?: number[]; // 授权ID列表
  // taskIds?: number[] // 任务ID列表
}

export interface AgentBrainTaskQueryParams {
  agenticId: number;
  date?: string; // 日期 yyyy-MM
  keyword?: string; // 搜索关键词
}

export interface AgentBrainTaskItemParams extends AgentBrainTaskBase {
  taskPersons?: AgentBrainTaskPerson[]; // 任务对象列表
  skillIds?: number[]; // 任务添加的技能ID列表
}
export interface BusinessAgentBrainSaveParams extends AgentBrainPersona, AgentBrainModel, AgentBrainSaveParams {
  tasks?: AgentBrainTaskItemParams[]; // 任务列表
}

export interface BaseAgentBrainSaveParams extends AgentBrainSaveParams {
  id?: number;
}

export interface AgentBrainSavePersona extends AgentBrainPersona {
  /** 主键 */
  id?: number;
}
export interface AgentBrainSaveModel extends AgentBrainModel {
  /** 主键 */
  id?: number;
  modelIds?: number[]; // 大模型ID列表
}
export interface AgentBrainSaveKnowledge {
  /** 主键 */
  id?: number;
  knowledgeIds?: number[]; // 知识库ID列表
}

export interface AgentBrainSaveDataSource {
  /** 主键 */
  id?: number;
  dsIds?: number[]; // 数据集ID列表
}
export interface AgentBrainSaveTool {
  /** 主键 */
  id?: number;
  toolIds?: number[]; // 工具ID列表
}
export interface AgentBrainSaveAuth {
  /** 主键 */
  id?: number;
  auths?: AgentBrainAuthBaseItem[]; // 授权列表
}
export interface AgentBrainSaveSkill {
  /** 主键 */
  id?: number;
  skillIds?: number[]; // 能力ID列表
}
export interface AgentBrainSaveTask {
  /** 主键 */
  id?: number;
  task?: AgentBrainTaskItemParams;
}
export interface AgentBrainTaskCalenderItem {
  day?: string; // 日期 yyyy-MM-dd
  taskList?: AgentBrainTaskItem[]; // 任务列表
}
export interface AgentBrainTaskCalenderData {
  month: string; // 月份 yyyy-MM
  calenderList: AgentBrainTaskCalenderItem[]; // 日历列表
}
