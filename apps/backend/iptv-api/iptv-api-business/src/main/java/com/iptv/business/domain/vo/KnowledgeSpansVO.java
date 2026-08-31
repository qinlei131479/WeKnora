package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.Date;
import java.util.List;

/**
 * <p>
 * 知识处理Span树节点响应类
 * </p>
 *
 * @author kjsc
 * @since 2026-08-31
 */
@Data
@Schema(description = "知识处理Span树节点")
public class KnowledgeSpansVO {

    @Schema(description = "知识条目ID")
    private String knowledgeId;

    @Schema(description = "尝试号")
    private Integer attempt;

    @Schema(description = "最新尝试号")
    private Integer latestAttempt;

    @Schema(description = "解析状态")
    private String parseStatus;

    @Schema(description = "当前尝试号")
    private Integer currentAttempt;

    @Schema(description = "当前阶段名称")
    private String currentStage;

    @Schema(description = "Span树根节点")
    private SpanTreeNodeVO trace;

    @Schema(description = "最后错误信息")
    private SpanErrorVO lastError;

    /**
     * Span树节点
     */
    @Data
    @Schema(description = "Span树节点")
    public static class SpanTreeNodeVO {

        @Schema(description = "Span ID")
        private String spanId;

        @Schema(description = "父Span ID")
        private String parentSpanId;

        @Schema(description = "Span名称")
        private String name;

        @Schema(description = "Span类型（root/stage/subspan/generation）")
        private String kind;

        @Schema(description = "Span状态（pending/running/done/failed/skipped/cancelled）")
        private String status;

        @Schema(description = "输入数据")
        private Object input;

        @Schema(description = "输出数据")
        private Object output;

        @Schema(description = "元数据")
        private Object metadata;

        @Schema(description = "错误码")
        private String errorCode;

        @Schema(description = "错误信息")
        private String errorMessage;

        @Schema(description = "开始时间")
        private Date startedAt;

        @Schema(description = "结束时间")
        private Date finishedAt;

        @Schema(description = "耗时（毫秒）")
        private Long durationMs;

        @Schema(description = "创建时间")
        private Date createdAt;

        @Schema(description = "更新时间")
        private Date updatedAt;

        @Schema(description = "子节点列表")
        private List<SpanTreeNodeVO> children;
    }

    /**
     * Span错误信息
     */
    @Data
    @Schema(description = "Span错误信息")
    public static class SpanErrorVO {

        @Schema(description = "阶段名称")
        private String stage;

        @Schema(description = "错误码")
        private String code;

        @Schema(description = "错误信息")
        private String message;

        @Schema(description = "Span名称")
        private String name;

        @Schema(description = "错误码")
        private String errorCode;

        @Schema(description = "错误信息")
        private String errorMessage;

        @Schema(description = "结束时间")
        private Date finishedAt;
    }
}
