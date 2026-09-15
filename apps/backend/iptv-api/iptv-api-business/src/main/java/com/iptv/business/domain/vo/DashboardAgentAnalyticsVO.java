package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * AI智能体分析VO
 */
@Data
public class DashboardAgentAnalyticsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = 964078402729180849L;

    @Schema(description = "总智能体数")
    private Long totalAgents;

    @Schema(description = "智能体对话次数")
    private List<AgentConversationCount> agentConversationCounts;

    @Schema(description = "智能体满意度")
    private List<AgentSatisfactionRate> agentSatisfactionRates;

    @Schema(description = "智能体工具使用")
    private List<AgentToolUsage> agentToolUsage;

    @Schema(description = "智能体性能排名")
    private List<TopPerformingAgent> topPerformingAgents;

    @Schema(description = "智能体名称列表")
    private List<AgentName> agentNames;

    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;

    @Schema(description = "Yuxi智能体数")
    private Long yuxiTotalAgents;

    @Schema(description = "Weknora智能体数")
    private Long weknoraTotalAgents;

    @Schema(description = "Weknora智能体对话次数")
    private List<WeknoraAgentConversationCount> weknoraAgentConversationCounts;

    @Schema(description = "Weknora智能体名称映射")
    private Map<String, String> weknoraAgentNames;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentName implements Serializable {
        @Serial
        private static final long serialVersionUID = -204661593380692268L;

        @Schema(description = "智能体ID")
        private String id;

        @Schema(description = "智能体名称")
        private String name;

        @Schema(description = "智能体描述")
        private String description;
    }


    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentConversationCount implements Serializable {
        @Serial
        private static final long serialVersionUID = 2437705055072669298L;

        @Schema(description = "智能体ID")
        private String agentId;

        @Schema(description = "次数")
        private Long conversationCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentSatisfactionRate implements Serializable {
        @Serial
        private static final long serialVersionUID = 5685078211889345754L;

        @Schema(description = "智能体ID")
        private String agentId;

        @Schema(description = "满意度")
        private BigDecimal satisfactionRate;

        @Schema(description = "总反馈数")
        private Long totalFeedbacks;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopPerformingAgent implements Serializable {
        @Serial
        private static final long serialVersionUID = -1938604641417465527L;

        @Schema(description = "智能体ID")
        private String agentId;

        @Schema(description = "对话次数")
        private Long conversationCount;

        @Schema(description = "满意度")
        private BigDecimal satisfactionRate;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AgentToolUsage implements Serializable {
        @Serial
        private static final long serialVersionUID = 4924424356839688348L;

        @Schema(description = "智能体ID")
        private String agentId;

        @Schema(description = "工具调用次数")
        private Long toolUsageCount;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class WeknoraAgentConversationCount implements Serializable {
        @Serial
        private static final long serialVersionUID = 736674857326562442L;

        @Schema(description = "智能体ID")
        private String agentId;

        @Schema(description = "对话次数")
        private Long conversationCount;

        @Schema(description = "所属系统")
        private String system;
    }
}
