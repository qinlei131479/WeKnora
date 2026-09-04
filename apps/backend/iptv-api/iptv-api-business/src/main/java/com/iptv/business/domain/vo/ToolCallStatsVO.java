package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 工具调用统计VO
 */
@Data
public class ToolCallStatsVO implements Serializable {
    private static final long serialVersionUID = 1L;


    /**
     * 总工具调用数
     */
    @Schema(description = "总工具调用数")
    private Integer totalCalls;
    /**
     * 成功调用数
     */
    @Schema(description = "成功调用数")
    private Integer successfulCalls;
    /**
     * 失败调用数
     */
    @Schema(description = "失败调用数")
    private Integer failedCalls;
    /**
     * 成功工具调用数
     */
    @Schema(description = "成功率")
    private Float successRate;
    /**
     * 最常用工具
     */
    @Schema(description = "最常用工具")
    private List<MostUsedTool> mostUsedTools;

    /**
     * 工具调用错误分布
     */
    @Schema(description = "工具调用错误分布")
    private List<ToolErrorDistribution> toolErrorDistributions;
    /**
     * 最近7天每日工具调用数
     */
    @Schema(description = "最近7天每日工具调用数")
    private List<DailyToolCall> dailyToolCalls;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class ToolErrorDistribution{

        /**
         * 工具名称
         */
        @Schema(description = "工具名称")
        private String name;

        /**
         * 调用次数
         */
        @Schema(description = "调用次数")
        private Integer count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class DailyToolCall{
        /**
         * 日期
         */
        @Schema(description = "日期 yyyy-MM-dd")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private String date;

        /**
         * 调用次数
         */
        @Schema(description = "调用次数")
        private Integer count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class MostUsedTool{
        /**
         * 工具名称
         */
        @Schema(description = "工具名称")
        private String toolName;
        /**
         * 调用次数
         */
        @Schema(description = "调用次数")
        private Integer count;
    }
}
