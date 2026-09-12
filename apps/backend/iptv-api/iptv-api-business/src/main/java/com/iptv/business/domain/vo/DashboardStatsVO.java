package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.math.BigDecimal;

/**
 * 顶部数据总览VO
 */
@Data
public class DashboardStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = -8924968033528161638L;

    @Schema(description = "总对话数")
    private Long totalConversations;

    @Schema(description = "活跃对话数")
    private Long activeConversations;

    @Schema(description = "总消息数")
    private Long totalMessages;

    @Schema(description = "总用户数")
    private Long totalUsers;

    @Schema(description = "反馈统计")
    private FeedbackStats feedbackStats;

    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;

    @Schema(description = "对话式会话数")
    private Long weknoraSessions;

    @Schema(description = "生成式会话数")
    private Long yuxiConversations;

    @Schema(description = "对话式会话消息数")
    private Long weknoraMessages;

    @Schema(description = "生成式会话消息数")
    private Long yuxiMessages;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class FeedbackStats implements Serializable {
        @Serial
        private static final long serialVersionUID = -7154090638177151756L;

        @Schema(description = "反馈数")
        private Long totalFeedbacks;

        @Schema(description = "满意度")
        private BigDecimal satisfactionRate;
    }
}
