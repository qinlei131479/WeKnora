package com.iptv.business.domain;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;


/**
 * <p>
 * 知识库内标签定义（名称/颜色/排序），FAQ 等分类用
 * </p>
 *
 * @author kjsc
 * @since 2026-08-27
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class KnowledgeTags implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */


    @Schema(description = "主键 ID")
    private String id;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    /**
     * 知识库 ID
     */


    @Schema(description = "知识库 ID")
    private String knowledgeBaseId;

    /**
     * 标签名称（知识库内唯一）
     */


    @Schema(description = "标签名称（知识库内唯一）")
    private String name;

    /**
     * 展示颜色
     */


    @Schema(description = "展示颜色")
    private String color;

    /**
     * 同级排序权重
     */


    @Schema(description = "同级排序权重")
    private Integer sortOrder;

    /**
     * 创建时间
     */


    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 最后更新时间
     */


    @Schema(description = "最后更新时间")
    private Date updatedAt;

    /**
     * 软删除时间；非空表示已删除
     */


    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;

    /**
     * 对外自增序号（API 友好）
     */


    @Schema(description = "对外自增序号（API 友好）")
    private Long seqId;
}