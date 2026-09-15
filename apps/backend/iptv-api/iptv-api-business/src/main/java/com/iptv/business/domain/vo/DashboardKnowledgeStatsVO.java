package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.util.List;
import java.util.Map;

/**
 * 知识库统计VO
 */
@Data
public class DashboardKnowledgeStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = 8802137864898212929L;

    @Schema(description = "总数据库数")
    private Long totalDatabases;

    @Schema(description = "总文件数")
    private Long totalFiles;

    @Schema(description = "总节点数")
    private Long totalNodes;

    @Schema(description = "总存储大小")
    private Long totalStorageSize;

    @Schema(description = "数据库类型分布")
    private Map<String, Long> databasesByType;

    @Schema(description = "文件类型分布")
    private Map<String, Long> fileTypeDistribution;

    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;

    @Schema(description = "系统分类")
    private String source;

    @Schema(description = "常用知识库列表")
    private List<ActiveKnowledgeBase> activeKnowledgeBases;


    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class ActiveKnowledgeBase implements Serializable {
        @Serial
        private static final long serialVersionUID = 2016347020234944362L;

        @Schema(description = "活跃度 COUNT")
        private Integer score;

        @Schema(description = "知识库ID")
        private String id;

        @Schema(description = "知识库名称")
        private String name;

        @Schema(description = "知识库描述")
        private String description;
    }
}
