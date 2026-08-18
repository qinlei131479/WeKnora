package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 问题建议配置DTO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "问题建议配置")
public class QuestionSuggestionConfigDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "初始问题配置")
    private StarterSuggestionConfigDTO starters;

    @Schema(description = "后续问题配置")
    private FollowUpSuggestionConfigDTO followUps;

    @Data
    @Schema(description = "初始问题建议配置")
    public static class StarterSuggestionConfigDTO implements Serializable {
        
        private static final long serialVersionUID = 1L;

        @Schema(description = "是否启用")
        private Boolean enabled;

        @Schema(description = "模式: curated/knowledge/hybrid")
        private String mode;

        @Schema(description = "预设问题列表")
        private List<String> items;

        @Schema(description = "问题数量(1-8)")
        private Integer count;
    }

    @Data
    @Schema(description = "后续问题建议配置")
    public static class FollowUpSuggestionConfigDTO implements Serializable {
        
        private static final long serialVersionUID = 1L;

        @Schema(description = "是否启用")
        private Boolean enabled;

        @Schema(description = "模式: generated/knowledge/hybrid")
        private String mode;

        @Schema(description = "问题数量(1-5)")
        private Integer count;

        @Schema(description = "生成模型ID")
        private String modelId;

        @Schema(description = "额外指令")
        private String additionalInstruction;

        @Schema(description = "问题类别列表")
        private List<String> categories;

        @Schema(description = "最大上下文轮数(1-5)")
        private Integer maxContextTurns;

        @Schema(description = "回退时是否抑制")
        private Boolean suppressOnFallback;

        @Schema(description = "回答包含问题时是否抑制")
        private Boolean suppressWhenAnswerAsksQuestion;

        @Schema(description = "是否启用知识库回退")
        private Boolean knowledgeFallback;

        @Schema(description = "是否允许重新生成")
        private Boolean allowRegenerate;
    }
}
