package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 顶部数据总览VO
 */
@Data
public class DashboardStatsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 总对话数
     */
    @Schema(description = "总对话数")
    private Integer totalConversations;
    /**
     * 活跃对话数
     */
    @Schema(description = "活跃对话数")
    private Integer activeConversations;

    /**
     * 总消息数
     */
    @Schema(description = "总消息数")
    private Integer totalMessages;

    /**
     * 总用户数
     */
    @Schema(description = "总用户数")
    private Integer totalUsers;

    /**
     * 反馈统计
     */
    @Schema(description = "反馈统计")
    private List<FeedbackStats> feedbackStats;

    /**
     * 是否按系统分类
     */
    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;

    @Schema(description = "对话式会话数")
    private Integer weknoraSessions;

    @Schema(description = "生成式会话数")
    private Integer yuxiConversations;

    @Schema(description = "生成式会话消息数")
    private Integer yuxiMessages;

    @Schema(description = "对话式会话消息数")
    private Integer weknoraMessages;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class FeedbackStats {
        /**
         * 反馈数
         */
        private Integer totalFeedbacks;
        /**
         * 满意度
         */
        private Integer satisfactionRate;
    }
}
