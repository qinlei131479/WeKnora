package com.iptv.business.controller;

import com.iptv.business.domain.vo.*;
import com.iptv.business.service.DashboardService;
import com.iptv.common.core.domain.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * <p>
 * 总览看板
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Tag(name = "总览看板", description = "总览看板管理")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {

    @Autowired
    private DashboardService dashboardService;

    @Operation(summary = "顶部数据总览", description = "顶部数据总览")
    @GetMapping("/stats")
    public R<DashboardStatsVO> queryStats() {
        return R.ok(dashboardService.queryStats());
    }

    @Operation(summary = "调用统计", description = "调用统计")
    @GetMapping("/stats/calls/timeseries")
    public R<TimeSeriesStatsVO> queryCallsTimeseries(String type, String time_range) {
        return R.ok(dashboardService.queryCallsTimeseries(type, time_range));
    }

    @Operation(summary = "用户活跃度分析", description = "用户活跃度分析")
    @GetMapping("/stats/users")
    public R<UserActivityStatsVO> queryStatsUsers() {
        return R.ok(dashboardService.queryStatsUsers());
    }

    @Operation(summary = "工具调用监控", description = "工具调用监控")
    @GetMapping("/stats/tools")
    public R<ToolCallStatsVO> queryStatsTools() {
        return R.ok(dashboardService.queryStatsTools());
    }

    @Operation(summary = "知识库使用情况", description = "知识库使用情况")
    @GetMapping("/stats/knowledge")
    public R<KnowledgeStatsVO> queryStatsKnowledge() {
        return R.ok(dashboardService.queryStatsKnowledge());
    }

    @Operation(summary = "AI智能体分析", description = "AI智能体分析")
    @GetMapping("/stats/agents")
    public R<AgentAnalyticsVO> queryStatsAgents() {
        return R.ok(dashboardService.queryStatsAgents());
    }
}
