package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;

import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;

/**
 * <p>
 * 知识处理Span：解析流水线的trace树节点
 * </p>
 *
 * @author kjsc
 * @since 2026-08-31
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "knowledge_processing_spans", autoResultMap = true)
public class KnowledgeProcessingSpans implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @TableId(value = "id", type = IdType.AUTO)
    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 知识条目 ID
     */
    @Schema(description = "知识条目 ID")
    private String knowledgeId;

    /**
     * 尝试号（解析尝试次数）
     */
    @Schema(description = "尝试号（解析尝试次数）")
    private Integer attempt;

    /**
     * Span ID（唯一标识）
     */
    @Schema(description = "Span ID（唯一标识）")
    private String spanId;

    /**
     * 父Span ID
     */
    @Schema(description = "父Span ID")
    private String parentSpanId;

    /**
     * Span名称（如：docreader, chunking, embedding等）
     */
    @Schema(description = "Span名称（如：docreader, chunking, embedding等）")
    private String name;

    /**
     * Span类型（root/stage/subspan/generation）
     */
    @Schema(description = "Span类型（root/stage/subspan/generation）")
    private String kind;

    /**
     * Span状态（pending/running/done/failed/skipped/cancelled）
     */
    @Schema(description = "Span状态（pending/running/done/failed/skipped/cancelled）")
    private String status;

    /**
     * 输入数据（JSON）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "输入数据（JSON）")
    private String input;

    /**
     * 输出数据（JSON）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "输出数据（JSON）")
    private String output;

    /**
     * 元数据（JSON）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "元数据（JSON）")
    private String metadata;

    /**
     * 错误码
     */
    @Schema(description = "错误码")
    private String errorCode;

    /**
     * 错误信息
     */
    @Schema(description = "错误信息")
    private String errorMessage;

    /**
     * 错误详情（不对外暴露）
     */
    @Schema(description = "错误详情（不对外暴露）")
    private String errorDetail;

    /**
     * 开始时间
     */
    @Schema(description = "开始时间")
    private Date startedAt;

    /**
     * 结束时间
     */
    @Schema(description = "结束时间")
    private Date finishedAt;

    /**
     * 耗时（毫秒）
     */
    @Schema(description = "耗时（毫秒）")
    private Long durationMs;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 更新时间
     */
    @Schema(description = "更新时间")
    private Date updatedAt;
}
