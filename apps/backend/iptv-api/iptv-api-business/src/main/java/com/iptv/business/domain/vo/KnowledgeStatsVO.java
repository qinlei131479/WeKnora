package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 知识库统计VO
 */
@Data
public class KnowledgeStatsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    /**
     * 总数据库数
     */
    @Schema(description = "总数据库数")
    private Integer totalDatabases;
    /**
     * 总文件数
     */
    @Schema(description = "总文件数")
    private Integer totalFiles;

    /**
     * 总节点数
     */
    @Schema(description = "总节点数")
    private Integer totalNodes;

    /**
     * 总存储大小
     */
    @Schema(description = "总存储大小")
    private Integer totalStorageSize;

    /**
     * 数据库类型分布
     */
    @Schema(description = "数据库类型分布")
    private List<DatabaseByTypes> databaseByTypes;

    /**
     * 文件类型分布
     */
    @Schema(description = "文件类型分布")
    private List<FileTypeDistribution> fileTypeDistributions;

    /**
     * 是否按系统分类
     */
    @Schema(description = "是否按系统分类")
    private Boolean splitBySystem;

    /**
     * 系统分类
     */
    @Schema(description = "系统分类")
    private String source;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class DatabaseByTypes{
        /**
         * 数据库类型
         */
        @Schema(description = "数据库类型")
        private String databaseType;
        /**
         * 数量
         */
        @Schema(description = "数量")
        private Integer count;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    private static class FileTypeDistribution{

        /**
         * 文件类型
         */
        @Schema(description = "文件类型")
        private String fileType;

        /**
         * 数量
         */
        @Schema(description = "数量")
        private Integer count;
    }
}
