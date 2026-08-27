package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.util.List;

/**
 * FAQ条目查询参数
 *
 * @author iptv
 * @since 2026-01-27
 */
@Data
@Schema(description = "FAQ条目查询参数")
public class FAQEntryQueryDTO {

    @Schema(description = "知识库ID", required = true)
    private String knowledgeBaseId;

    @Schema(description = "标签ID列表，逗号分隔")
    private List<String> tagIds;

    @Schema(description = "搜索关键词")
    private String keyword;

    @Schema(description = "搜索字段：standard_question/similar_questions/answers")
    private String searchField;
}
