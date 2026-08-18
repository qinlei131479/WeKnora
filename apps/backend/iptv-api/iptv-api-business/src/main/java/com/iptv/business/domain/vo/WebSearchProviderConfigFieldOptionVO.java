package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 网络搜索提供商配置字段选项VO
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Data
@Schema(description = "配置字段选项")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSearchProviderConfigFieldOptionVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 显示标签
     */
    @Schema(description = "显示标签")
    private String label;

    /**
     * 国际化标签键
     */
    @Schema(description = "国际化标签键")
    private String labelKey;

    /**
     * 选项值
     */
    @Schema(description = "选项值")
    private String value;
}
