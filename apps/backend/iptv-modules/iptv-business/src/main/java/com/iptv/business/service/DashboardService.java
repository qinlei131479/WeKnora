package com.iptv.business.service;

import com.iptv.business.domain.vo.*;

/**
 * <p>
 * 总览看板服务接口
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
public interface DashboardService {

    /**
     * 查询顶部数据总览
     */
    DashboardStatsVO queryStats();

    /**
     * 查询调用统计分类数据
     */
    TimeSeriesStatsVO queryCallsTimeseries(String type, String timeRange);

    /**
     * 查询用户活跃度分析
     */
    UserActivityStatsVO queryStatsUsers();

    /**
     * 查询工具调用监控
     */
    ToolCallStatsVO queryStatsTools();

    /**
     * 查询知识库使用情况
     */
    KnowledgeStatsVO queryStatsKnowledge();

    /**
     * 查询AI智能体分析
     */
    AgentAnalyticsVO queryStatsAgents();


}
