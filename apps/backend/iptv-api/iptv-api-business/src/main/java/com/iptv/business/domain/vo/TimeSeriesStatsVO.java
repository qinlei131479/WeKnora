package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 调用统计VO
 */
@Data
public class TimeSeriesStatsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 总对话数
     */
    @Schema(description = "总对话数")
    private Integer totalCount;

    /**
     * 峰值日期
     */
    @Schema(description = "峰值日期")
    private String peakDate;

    /**
     * 峰值对话数
     */
    @Schema(description = "峰值对话数")
    private Integer peakCount;

    /**
     * 活跃对话数统计
     */
    @Schema(description = "活跃对话数统计")
    private List<DataStats> data;

    /**
     * 分类统计
     */
    @Schema(description = "分类统计")
    private List<String> categories;

    /**
     * 平均活跃对话数统计
     */
    @Schema(description = "平均活跃对话数统计")
    private double averageCount;

    /**
     * 智能体id-名称关系
     */
    @Schema(description = "智能体id-名称关系")
    private List<AgentName> agentNames;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class DataStats {

        @Schema(description = "总对话数")
        private Integer total;

        /**
         * 日期
         */
        @Schema(description = "日期 yyyy-MM-dd")
        @JsonFormat(pattern = "yyyy-MM-dd")
        private String date;

        /**
         * id-数量关系
         */
        @Schema(description = "id-数量关系")
        private List<AgentCount> data;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class AgentCount {
        @Schema(description = "智能体id")
        private String agentId;
        @Schema(description = "对话数")
        private Integer count;
    }

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    private static class AgentName {
        @Schema(description = "智能体id")
        private String agentId;
        @Schema(description = "智能体名称")
        private String name;
    }

}
