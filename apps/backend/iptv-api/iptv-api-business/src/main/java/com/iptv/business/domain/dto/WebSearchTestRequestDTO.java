package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 网络搜索提供商原始凭证测试DTO
 * 用于 POST /test 接口（不落库）
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@Schema(description = "网络搜索提供商原始凭证测试请求")
public class WebSearchTestRequestDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 提供商类型：bing/google/tavily等
     */
    @Schema(description = "提供商类型", requiredMode = Schema.RequiredMode.REQUIRED)
    private String provider;

    /**
     * 参数（JSON字符串，包含api_key等）
     */
    @Schema(description = "参数（JSON字符串）")
    private String parameters;
}
