package com.iptv.business.domain.dto;

import java.io.Serializable;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 嵌入参数 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class EmbeddingParametersDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 向量维度
     */
    @Schema(description = "向量维度")
    private Integer dimension;

    /**
     * 截断提示词token数
     */
    @Schema(description = "截断提示词token数")
    private Integer truncatePromptTokens;

    /**
     * 是否支持维度覆盖
     */
    @Schema(description = "是否支持维度覆盖")
    private Boolean supportsDimensionOverride;
}
