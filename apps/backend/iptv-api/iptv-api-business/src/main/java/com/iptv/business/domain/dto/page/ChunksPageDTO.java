package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

/**
 * <p>
 * 知识分块分页查询参数
 * </p>
 *
 * @author kjsc
 * @since 2026-08-31
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ChunksPageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 知识条目ID（必填）
     */
    @NotBlank(message = "知识条目ID不能为空")
    @Schema(description = "知识条目ID（必填）", required = true)
    private String knowledgeId;

    /**
     * 分块类型列表，默认为["text"]
     */
    @Schema(description = "分块类型列表，默认为[\"text\"]")
    private List<String> chunkType;

    /**
     * 标签ID列表
     */
    @Schema(description = "标签ID列表")
    private List<String> tagIds;

    /**
     * 搜索关键词
     */
    @Schema(description = "搜索关键词")
    private String keyword;

    /**
     * 搜索字段（FAQ类型时使用）：standard_question/similar_questions/answers
     */
    @Schema(description = "搜索字段（FAQ类型时使用）：standard_question/similar_questions/answers")
    private String searchField;

    /**
     * 知识类型：document/faq
     */
    @Schema(description = "知识类型：document/faq")
    private String knowledgeType;

    /**
     * 是否启用
     */
    @Schema(description = "是否启用")
    private Boolean isEnabled;

    /**
     * 租户ID（多租户隔离）
     */
    @Schema(description = "租户ID")
    private Integer tenantId;
}
