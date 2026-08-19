package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import jakarta.validation.constraints.NotBlank;
import java.util.Map;

/**
 * 模型测试请求 DTO
 * 用于测试远程模型连接
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@Schema(description = "模型测试请求")
public class ModelTestRequestDTO {

    @NotBlank(message = "模型名称不能为空")
    @Schema(description = "模型名称", required = true)
    private String modelName;

    @NotBlank(message = "Base URL不能为空")
    @Schema(description = "Base URL", required = true)
    private String baseUrl;

    @Schema(description = "API Key")
    private String apiKey;

    @Schema(description = "Provider")
    private String provider;

    @Schema(description = "接口类型")
    private String interfaceType;

    @Schema(description = "向量维度（Embedding模型）")
    private Integer dimension;

    @Schema(description = "是否支持维度覆盖")
    private Boolean supportsDimensionOverride;

    @Schema(description = "自定义请求头")
    private Map<String, String> customHeaders;

    @Schema(description = "额外配置")
    private Map<String, String> extraConfig;

    @Schema(description = "App Secret（用于某些需要第二段密钥的场景）")
    private String appSecret;

    @Schema(description = "模型ID（用于从已存储模型中补齐密钥）")
    private String modelId;

    @Schema(description = "来源")
    private String source;
}
