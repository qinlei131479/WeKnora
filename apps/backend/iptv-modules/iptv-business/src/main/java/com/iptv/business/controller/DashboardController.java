package com.iptv.business.controller;

import com.iptv.business.domain.vo.*;
import com.iptv.business.service.DashboardService;
import com.iptv.common.core.domain.R;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.annotation.Resource;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * <p>
 * 总览看板
 * </p>
 *
 * @author kjsc
 * @since 2026-09-12
 */
@Tag(name = "总览看板", description = "总览看板管理")
@RestController
@RequestMapping("/dashboard")
public class DashboardController {
    @Resource
    private DashboardService dashboardService;


    @Operation(summary = "顶部数据总览", description = "顶部数据总览")
    @GetMapping("/stats")
    public R<DashboardStatsVO> queryStats() {
        return R.ok(dashboardService.queryStats());
    }

    @Operation(summary = "调用统计", description = "按统计类型和时间范围查询调用趋势")
    @GetMapping("/stats/calls/timeseries")
    public R<DashboardTimeSeriesStatsVO> queryCallsTimeseries(@Parameter(description = "models/agents/tokens/tools") @RequestParam String type,
                                                              @Parameter(description = "14hours/14days/14weeks") @RequestParam String timeRange) {
        return R.ok(dashboardService.queryCallsTimeseries(type, timeRange));
    }

    @Operation(summary = "用户活跃度分析", description = "用户活跃度分析")
    @GetMapping("/stats/users")
    public R<DashboardUserActiveStatsVO> queryStatsUsers() {
        return R.ok(dashboardService.queryStatsUsers());
    }

    @Operation(summary = "工具调用监控", description = "工具调用监控")
    @GetMapping("/stats/tools")
    public R<DashboardToolCallStatsVO> queryStatsTools() {
        return R.ok(dashboardService.queryStatsTools());
    }

    @Operation(summary = "知识库使用情况", description = "知识库使用情况")
    @GetMapping("/stats/knowledge")
    public R<DashboardKnowledgeStatsVO> queryStatsKnowledge() {
        return R.ok(dashboardService.queryStatsKnowledge());
    }

    @Operation(summary = "AI智能体分析", description = "AI智能体分析")
    @GetMapping("/stats/agents")
    public R<DashboardAgentAnalyticsVO> queryStatsAgents() {
        return R.ok(dashboardService.queryStatsAgents());
    }

    @Operation(summary = "最近对话消息", description = "Conversations")
    @GetMapping("/stats/conversations")
    public R<List<DashboardConversationVO>> queryStatsConversations() {
        return R.ok(dashboardService.queryStatsConversations());
    }
}
