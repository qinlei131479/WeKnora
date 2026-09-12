import type {
  AgentAnalyticsVO,
  AjaxResult,
  DashboardStatsVO,
  KnowledgeStatsVO,
  TimeSeriesStatsVO,
  ToolCallStatsVO,
  UserActivityStatsVO
} from '@/types';
import request from '@/utils/request';

const PATH = '/business/dashboard';

/** 顶部数据总览 */
const queryStats = (): Promise<AjaxResult<DashboardStatsVO>> => {
  return request({
    url: `${PATH}/stats`,
    method: 'GET'
  });
};

/** 用户活跃度分析 */
const queryStatsUsers = (): Promise<AjaxResult<UserActivityStatsVO>> => {
  return request({
    url: `${PATH}/stats/users`,
    method: 'GET'
  });
};

/** 工具调用监控 */
const queryStatsTools = (): Promise<AjaxResult<ToolCallStatsVO>> => {
  return request({
    url: `${PATH}/stats/tools`,
    method: 'GET'
  });
};

/** 知识库使用情况 */
const queryStatsKnowledge = (): Promise<AjaxResult<KnowledgeStatsVO>> => {
  return request({
    url: `${PATH}/stats/knowledge`,
    method: 'GET'
  });
};

/** 按统计类型和时间范围查询调用趋势 */
const queryCallsTimeseries = (
  type: 'models' | 'agents' | 'tokens' | 'tools',
  timeRange: '14hours' | '14days' | '14weeks'
): Promise<AjaxResult<TimeSeriesStatsVO>> => {
  return request({
    url: `${PATH}/stats/calls/timeseries`,
    method: 'GET',
    params: { type, timeRange }
  });
};

/** AI智能体分析 */
const queryStatsAgents = (): Promise<AjaxResult<AgentAnalyticsVO>> => {
  return request({
    url: `${PATH}/stats/agents`,
    method: 'GET'
  });
};

export const Dashboard = {
  queryStats,
  queryStatsUsers,
  queryStatsTools,
  queryStatsKnowledge,
  queryCallsTimeseries,
  queryStatsAgents
};
