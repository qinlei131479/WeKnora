package com.iptv.business.domain.vo;

import java.io.Serializable;
import java.util.Map;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型参数 VO (脱敏后)
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelParametersVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 基础URL (内置模型或非管理员时为空)
     */
    @Schema(description = "基础URL")
    private String baseUrl;

    /**
     * 接口类型
     */
    @Schema(description = "接口类型")
    private String interfaceType;

    /**
     * 嵌入参数
     */
    @Schema(description = "嵌入参数")
    private EmbeddingParametersVO embeddingParameters;

    /**
     * 参数规模
     */
    @Schema(description = "参数规模")
    private String parameterSize;

    /**
     * 提供商标识
     */
    @Schema(description = "提供商标识")
    private String provider;

    /**
     * 额外配置 (内置模型或非管理员时为空)
     */
    @Schema(description = "额外配置")
    private Map<String, String> extraConfig;

    /**
     * 自定义请求头 (内置模型或非管理员时为空)
     */
    @Schema(description = "自定义请求头")
    private Map<String, String> customHeaders;

    /**
     * 是否支持视觉输入
     */
    @Schema(description = "是否支持视觉输入")
    private Boolean supportsVision;

    /**
     * 最大并发数
     */
    @Schema(description = "最大并发数")
    private Integer maxConcurrency;

    /**
     * 应用ID (内置模型时为空)
     */
    @Schema(description = "应用ID")
    private String appId;

    // 注意: 不包含 apiKey 和 appSecret
}
