import type {
  DashboardAgentAnalyticsVO,
  DashboardConversationVO,
  AjaxResult,
  DashboardStatsVO,
  DashboardKnowledgeStatsVO,
  DashboardTimeSeriesStatsVO,
  DashboardToolCallStatsVO,
  DashboardUserActiveStatsVO
} from '@/types';
import request from '@/utils/request';

const PATH = '/business/dashboard/stats';

/** 顶部数据总览 */
const queryStats = (): Promise<AjaxResult<DashboardStatsVO>> => {
  return request({
    url: `${PATH}`,
    method: 'GET'
  });
};

/** 用户活跃度分析 */
const queryStatsUsers = (): Promise<AjaxResult<DashboardUserActiveStatsVO>> => {
  return request({
    url: `${PATH}/users`,
    method: 'GET'
  });
};

/** 工具调用监控 */
const queryStatsTools = (): Promise<AjaxResult<DashboardToolCallStatsVO>> => {
  return request({
    url: `${PATH}/tools`,
    method: 'GET'
  });
};

/** 知识库使用情况 */
const queryStatsKnowledge = (): Promise<AjaxResult<DashboardKnowledgeStatsVO>> => {
  return request({
    url: `${PATH}/knowledge`,
    method: 'GET'
  });
};

/** 最近对话消息 */
const queryStatsConversations = (): Promise<AjaxResult<DashboardConversationVO[]>> => {
  return request({
    url: `${PATH}/conversations`,
    method: 'GET'
  });
};

/** 按统计类型和时间范围查询调用趋势 */
const queryCallsTimeseries = (
  type: 'models' | 'agents' | 'tokens' | 'tools',
  timeRange: '14hours' | '14days' | '14weeks'
): Promise<AjaxResult<DashboardTimeSeriesStatsVO>> => {
  return request({
    url: `${PATH}/calls/timeseries`,
    method: 'GET',
    params: { type, timeRange }
  });
};

/** AI智能体分析 */
const queryStatsAgents = (): Promise<AjaxResult<DashboardAgentAnalyticsVO>> => {
  return request({
    url: `${PATH}/agents`,
    method: 'GET'
  });
};

export const Dashboard = {
  queryStats,
  queryStatsUsers,
  queryStatsTools,
  queryStatsKnowledge,
  queryStatsConversations,
  queryCallsTimeseries,
  queryStatsAgents
};
