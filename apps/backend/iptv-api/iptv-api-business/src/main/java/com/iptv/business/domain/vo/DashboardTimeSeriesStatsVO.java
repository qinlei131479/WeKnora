package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;

/**
 * 调用统计VO
 */
@Data
public class DashboardTimeSeriesStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = -2908976371307107161L;

    @Schema(description = "总对话数")
    private Long totalCount;

    @Schema(description = "峰值日期")
    private String peakDate;

    @Schema(description = "峰值对话数")
    private Long peakCount;

    @Schema(description = "活跃对话数统计")
    private List<DataStats> data;

    @Schema(description = "分类统计")
    private List<String> categories;

    @Schema(description = "平均活跃对话数统计")
    private double averageCount;

    @Schema(description = "智能体id-名称关系")
    private List<AgentName> agentNames;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class DataStats implements Serializable {
        @Serial
        private static final long serialVersionUID = -43618184633371269L;

        @Schema(description = "总对话数")
        private Long total;

        @Schema(description = "日期 yyyy-MM-dd")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private String date;

        @Schema(description = "分组-数量关系")
        private List<CategoryCount> data;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class CategoryCount implements Serializable {
        @Serial
        private static final long serialVersionUID = -1200953009604466533L;

        @Schema(description = "分组")
        private String category;

        @Schema(description = "数据量")
        private Long count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class AgentName implements Serializable {
        @Serial
        private static final long serialVersionUID = -279989247842583951L;

        @Schema(description = "智能体id")
        private String id;

        @Schema(description = "智能体名称")
        private String name;
    }

}
