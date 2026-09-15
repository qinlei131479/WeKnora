package com.iptv.business.pgmapper;

import com.iptv.business.domain.vo.*;
import org.apache.ibatis.annotations.Param;
import org.springframework.lang.Nullable;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * <p>
 * 总览看板 Mapper 接口（PostgreSQL）
 * </p>
 *
 * @author kjsc
 * @since 2026-09-01
 */
public interface DashboardMapper {
    /**
     * WeKnora 会话数
     */
    Long recordCountWeknoraSessions();

    /**
     * Yuxi 会话数
     */
    Long recordCountYuxiConversations();

    /**
     * 活跃对话数
     */
    Long recordCountActiveConversations();

    /**
     * WeKnora 消息数
     */
    Long recordCountWeknoraMessages();

    /**
     * Yuxi 消息数
     */
    Long recordCountYuxiMessages();

    /**
     * 总用户数
     */
    Long recordCountTotalUsers();

    /**
     * 反馈数
     *
     * @param rating 反馈类型，为空时统计全部反馈
     */
    Long recordCountFeedbacks(@Nullable @Param("rating") String rating);

    /**
     * 调用时间序列原始统计
     */
    List<Map<String, Object>> selectCallTimeseries(@Param("type") String type,
                                                   @Param("timeRange") String timeRange,
                                                   @Param("startTime") LocalDateTime startTime);

    /**
     * 工具调用数；状态和时间边界为空时不限制
     */
    Long recordCountToolCalls(@Nullable @Param("status") String status,
                              @Nullable @Param("since") LocalDateTime since,
                              @Nullable @Param("until") LocalDateTime until);

    /**
     * 根据 slug 查询智能体名称
     */
    List<Map<String, Object>> selectAgentNames(@Param("slugs") List<String> slugs);

    /**
     * WeKnora 有效成员数，保留 Python 成员关系计数口径
     */
    Long recordCountWeknoraMembers();

    /**
     * 会话更新或发送消息的去重用户数，时间范围为 [since, until)
     */
    Long recordCountWeknoraActiveUsers(@Param("since") OffsetDateTime since,
                                       @Nullable @Param("until") OffsetDateTime until);

    /**
     * 会话更新或发送消息的去重用户信息，时间范围为 [since, until)
     */
    List<DashboardUserActiveStatsVO.ActiveUser> selectWeknoraActiveUsers(@Param("since") OffsetDateTime since,
                                                                         @Nullable @Param("until") OffsetDateTime until);

    /**
     * 调用量最高的十个工具
     */
    List<DashboardToolCallStatsVO.MostUsedTool> selectMostUsedTools();

    /**
     * status=error 的工具错误分布
     */
    List<Map<String, Object>> selectToolErrorCounts();

    Long recordCountKnowledgeBases();

    List<Map<String, Object>> selectKnowledgeBaseTypeCounts();

    List<Map<String, Object>> selectKnowledgeFileTypeStats();

    List<DashboardKnowledgeStatsVO.ActiveKnowledgeBase> selectActiveKnowledgeBases();

    List<DashboardAgentAnalyticsVO.AgentConversationCount> selectYuxiAgentConversationCounts();

    List<Map<String, Object>> selectYuxiAgentFeedbackCounts();

    List<DashboardAgentAnalyticsVO.AgentToolUsage> selectYuxiAgentToolUsage();

    /**
     * 分析接口的原始 slug/名称记录，对齐 Python 不额外筛选同名智能体
     */
    List<Map<String, Object>> selectAnalyticsAgentNames(@Param("slugs") List<String> slugs);

    Long recordCountWeknoraAgents();

    List<Map<String, Object>> selectWeknoraAgentNames();

    List<DashboardAgentAnalyticsVO.WeknoraAgentConversationCount> selectWeknoraAgentConversationCounts();

    List<DashboardConversationVO> selectStatsConversations(@Param("since") OffsetDateTime since,
                                                           @Nullable @Param("until") OffsetDateTime until);
}
