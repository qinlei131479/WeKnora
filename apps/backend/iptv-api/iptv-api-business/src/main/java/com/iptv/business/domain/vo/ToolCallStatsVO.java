package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
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
 * 工具调用统计VO
 */
@Data
public class ToolCallStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = 91758994883829235L;

    @Schema(description = "总工具调用数")
    private Long totalCalls;

    @Schema(description = "成功调用数")
    private Long successfulCalls;

    @Schema(description = "失败调用数")
    private Long failedCalls;

    @Schema(description = "成功率")
    private BigDecimal successRate;

    @Schema(description = "最常用工具")
    private List<MostUsedTool> mostUsedTools;

    @Schema(description = "工具调用错误分布")
    private Map<String, Long> toolErrorDistribution;

    @Schema(description = "最近7天每日工具调用数")
    private List<DailyToolCall> dailyToolCalls;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DailyToolCall implements Serializable {
        @Serial
        private static final long serialVersionUID = 4346929492570753572L;

        @Schema(description = "日期 yyyy-MM-dd")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private String date;

        @Schema(description = "调用次数")
        private Long callCount;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class MostUsedTool implements Serializable {
        @Serial
        private static final long serialVersionUID = -2203504311635021173L;

        @Schema(description = "工具名称")
        private String toolName;

        @Schema(description = "调用次数")
        private Long count;
    }
}
