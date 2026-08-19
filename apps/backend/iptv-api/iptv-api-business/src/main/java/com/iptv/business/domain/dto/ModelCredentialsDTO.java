package com.iptv.business.domain.dto;

import java.io.Serializable;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型凭证 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelCredentialsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 模型ID
     */
    @Schema(description = "模型ID")
    private String modelId;

    /**
     * API密钥 (可选，null表示不修改)
     */
    @Schema(description = "API密钥")
    private String apiKey;

    /**
     * 应用密钥 (可选，null表示不修改)
     */
    @Schema(description = "应用密钥")
    private String appSecret;
}
