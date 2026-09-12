package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serial;
import java.io.Serializable;
import java.util.Map;

/**
 * 知识库统计VO
 */
@Data
public class KnowledgeStatsVO implements Serializable {
    @Serial
    private static final long serialVersionUID = -2461358424956359840L;

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

}
