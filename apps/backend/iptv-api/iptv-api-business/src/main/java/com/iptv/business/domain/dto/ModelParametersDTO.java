package com.iptv.business.domain.dto;

import com.alibaba.fastjson2.annotation.JSONField;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Map;

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
    @JSONField(name = "base_url")
    private String baseUrl;

    /**
     * API密钥 (仅创建时使用，响应中不返回)
     */
    @Schema(description = "API密钥")
    @JSONField(name = "api_key")
    private String apiKey;

    /**
     * 接口类型
     */
    @Schema(description = "接口类型")
    @JSONField(name = "interface_type")
    private String interfaceType;

    /**
     * 嵌入参数
     */
    @Schema(description = "嵌入参数")
    @JSONField(name = "embedding_parameters")
    private EmbeddingParametersDTO embeddingParameters;

    /**
     * 参数规模 (如 "7B", "13B", "70B")
     */
    @Schema(description = "参数规模")
    @JSONField(name = "parameter_size")
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
    @JSONField(name = "extra_config")
    private Map<String, String> extraConfig;

    /**
     * 自定义请求头
     */
    @Schema(description = "自定义请求头")
    @JSONField(name = "custom_headers")
    private Map<String, String> customHeaders;

    /**
     * 是否支持视觉输入
     */
    @Schema(description = "是否支持视觉输入")
    @JSONField(name = "supports_vision")
    private Boolean supportsVision;

    /**
     * 最大并发数
     */
    @Schema(description = "最大并发数")
    @JSONField(name = "max_concurrency")
    private Integer maxConcurrency;

    /**
     * 应用ID (WeKnoraCloud 专用)
     */
    @Schema(description = "应用ID")
    @JSONField(name = "app_id")
    private String appId;

    /**
     * 应用密钥 (WeKnoraCloud 专用，仅创建时使用，响应中不返回)
     */
    @Schema(description = "应用密钥")
    @JSONField(name = "app_secret")
    private String appSecret;
}
