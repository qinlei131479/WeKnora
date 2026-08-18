package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 推荐问题VO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "推荐问题")
public class SuggestedQuestionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "问题文本")
    private String question;

    @Schema(description = "来源类型: agent_config, faq, document, wiki")
    private String source;

    @Schema(description = "来源知识库ID")
    private String knowledgeBaseId;
}
