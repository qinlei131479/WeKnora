package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * AI智能体分析VO
 */
@Data
public class AgentAnalyticsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 总智能体数
     */
    @Schema(description = "总智能体数")
    private Integer totalAgents;
    /**
     * 智能体对话次数
     */
    @Schema(description = "智能体对话次数")
    private List<AgentCommonCount> agentConversationCounts;
    /**
     * 智能体满意度
     */
    @Schema(description = "智能体满意度")
    private List<AgentSatisfactionRate> agentSatisfactionRates;
    /**
     * 智能体工具使用
     */
    @Schema(description = "智能体工具使用")
    private List<AgentCommonCount> agentToolUsages;
    /**
     * 智能体性能排名
     */
    @Schema(description = "智能体性能排名")
    private List<TopPerformingAgent> topPerformingAgents;
    /**
     * 智能体名称映射
     */
    @Schema(description = "智能体名称映射")
    private List<AgentName> agentNames;
    /**
     * 是否按系统分类
     */
    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;
    /**
     * Yuxi智能体数
     */
    @Schema(description = "Yuxi智能体数")
    private Integer yuxiTotalAgents;
    /**
     * Weknora智能体数
     */
    @Schema(description = "Weknora智能体数")
    private Integer weknoraTotalAgents;
    /**
     * Weknora智能体体对话次数
     */
    @Schema(description = "Weknora智能体对话次数")
    private List<AgentCommonCount> weknoraAgentConversationCounts;

    /**
     * Weknora智能体名称映射
     */
    @Schema(description = "Weknora智能体名称映射")
    private List<AgentName> weknoraAgentNames;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AgentCommonCount {
        /**
         * 智能体ID
         */
        @Schema(description = "智能体ID")
        private String agentId;

        /**
         * 次数
         */
        @Schema(description = "次数")
        private Integer count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AgentSatisfactionRate {
        /**
         * 智能体ID
         */
        @Schema(description = "智能体ID")
        private String agentId;

        /**
         * 满意度
         */
        @Schema(description = "满意度")
        private Integer satisfactionRate;

        /**
         * 总反馈数
         */
        @Schema(description = "总反馈数")
        private Integer totalFeedbacks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class TopPerformingAgent {
        /**
         * 智能体ID
         */
        @Schema(description = "智能体ID")
        private String agentId;

        /**
         * 对话次数
         */
        @Schema(description = "对话次数")
        private Integer conversationCount;

        /**
         * 满意度
         */
        @Schema(description = "满意度")
        private Integer satisfactionRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class AgentName {
        /**
         * 智能体ID
         */
        @Schema(description = "智能体ID")
        private String agentId;

        /**
         * 智能体名称
         */
        @Schema(description = "智能体名称")
        private String agentName;
    }
}
