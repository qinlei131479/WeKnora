package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 网络搜索提供商类型元数据VO
 * 用于 GET /types 接口，返回UI表单需要的提供商类型及参数定义
 * 字段名与Go代码保持一致
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@Schema(description = "网络搜索提供商类型元数据")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSearchProviderTypeVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 提供商类型标识
     */
    @Schema(description = "提供商类型标识")
    private String id;

    /**
     * 显示名称
     */
    @Schema(description = "显示名称")
    private String name;

    /**
     * 是否需要API密钥
     */
    @Schema(description = "是否需要API密钥")
    private Boolean requiresApiKey;

    /**
     * 是否支持可选API密钥（无密钥可用，但有密钥可提升限额）
     */
    @Schema(description = "是否支持可选API密钥")
    private Boolean supportsOptionalApiKey;

    /**
     * 是否需要引擎ID（如Google CSE）
     */
    @Schema(description = "是否需要引擎ID")
    private Boolean requiresEngineId;

    /**
     * 是否需要用户提供Base URL（如自托管SearXNG）
     */
    @Schema(description = "是否需要Base URL")
    private Boolean requiresBaseUrl;

    /**
     * 是否支持代理
     */
    @Schema(description = "是否支持代理")
    private Boolean supportsProxy;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 官方文档URL
     */
    @Schema(description = "官方文档URL")
    private String docsUrl;

    /**
     * 提供商特定的配置字段
     */
    @Schema(description = "配置字段")
    private List<WebSearchProviderConfigFieldVO> configFields;
}
