package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

/**
 * 知识库文件夹树响应
 *
 * @author kjsc
 * @since 2026-08-23
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "知识库文件夹树响应")
public class KnowledgesFolderVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 根目录文档数量
     */
    @Schema(description = "根目录文档数量")
    private Integer rootDocumentCount;

    /**
     * 总文档数量
     */
    @Schema(description = "总文档数量")
    private Integer totalDocumentCount;

    /**
     * 文件夹列表
     */
    @Schema(description = "文件夹列表")
    private List<FolderNode> folders;

    /**
     * 文件夹节点
     */
    @Data
    @EqualsAndHashCode(callSuper = false)
    @Schema(description = "文件夹节点")
    public static class FolderNode implements Serializable {

        private static final long serialVersionUID = 1L;

        /**
         * 文件夹名称
         */
        @Schema(description = "文件夹名称")
        private String name;

        /**
         * 文件夹路径
         */
        @Schema(description = "文件夹路径")
        private String path;

        /**
         * 直接子文档数量
         */
        @Schema(description = "直接子文档数量")
        private Integer documentCount;

        /**
         * 总文档数量（包含子文件夹）
         */
        @Schema(description = "总文档数量（包含子文件夹）")
        private Integer totalCount;

        /**
         * 子文件夹列表
         */
        @Schema(description = "子文件夹列表")
        private List<FolderNode> children;
    }
}
