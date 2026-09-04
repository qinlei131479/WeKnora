package com.iptv.business.service.impl;

import com.iptv.business.domain.vo.*;
import com.iptv.business.pgmapper.DashboardMapper;
import com.iptv.business.service.DashboardService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * <p>
 * 总览看板服务实现
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {

    private final DashboardMapper dashboardMapper;

    @Override
    public DashboardStatsVO queryStats() {
        return null;
    }

    @Override
    public TimeSeriesStatsVO queryCallsTimeseries(String type, String time_range) {
        return null;
    }

    @Override
    public UserActivityStatsVO queryStatsUsers() {
        return null;
    }

    @Override
    public ToolCallStatsVO queryStatsTools() {
        return null;
    }

    @Override
    public KnowledgeStatsVO queryStatsKnowledge() {
        return null;
    }

    @Override
    public AgentAnalyticsVO queryStatsAgents() {
        return null;
    }
}
