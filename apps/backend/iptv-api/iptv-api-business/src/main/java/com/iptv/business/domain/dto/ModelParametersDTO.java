package com.iptv.business.domain.dto;

import java.io.Serializable;
import java.util.Map;

import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * 模型参数 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-19
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class ModelParametersDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 基础URL
     */
    @Schema(description = "基础URL")
    private String baseUrl;

    /**
     * API密钥 (仅创建时使用，响应中不返回)
     */
    @Schema(description = "API密钥")
    private String apiKey;

    /**
     * 接口类型
     */
    @Schema(description = "接口类型")
    private String interfaceType;

    /**
     * 嵌入参数
     */
    @Schema(description = "嵌入参数")
    private EmbeddingParametersDTO embeddingParameters;

    /**
     * 参数规模 (如 "7B", "13B", "70B")
     */
    @Schema(description = "参数规模")
    private String parameterSize;

    /**
     * 提供商标识: openai, aliyun, zhipu, generic 等
     */
    @Schema(description = "提供商标识")
    private String provider;

    /**
     * 额外配置
     */
    @Schema(description = "额外配置")
    private Map<String, String> extraConfig;

    /**
     * 自定义请求头
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
     * 应用ID (WeKnoraCloud 专用)
     */
    @Schema(description = "应用ID")
    private String appId;

    /**
     * 应用密钥 (WeKnoraCloud 专用，仅创建时使用，响应中不返回)
     */
    @Schema(description = "应用密钥")
    private String appSecret;
}
