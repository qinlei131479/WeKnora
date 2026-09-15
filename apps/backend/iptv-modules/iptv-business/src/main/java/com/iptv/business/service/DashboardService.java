package com.iptv.business.service;

import com.iptv.business.domain.vo.*;

import java.util.List;

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
    DashboardTimeSeriesStatsVO queryCallsTimeseries(String type, String timeRange);

    /**
     * 查询用户活跃度分析
     */
    DashboardUserActiveStatsVO queryStatsUsers();

    /**
     * 查询工具调用监控
     */
    DashboardToolCallStatsVO queryStatsTools();

    /**
     * 查询知识库使用情况
     */
    DashboardKnowledgeStatsVO queryStatsKnowledge();

    /**
     * 查询AI智能体分析
     */
    DashboardAgentAnalyticsVO queryStatsAgents();

    /**
     * 查询最近对话消息
     */
    List<DashboardConversationVO> queryStatsConversations();
}
