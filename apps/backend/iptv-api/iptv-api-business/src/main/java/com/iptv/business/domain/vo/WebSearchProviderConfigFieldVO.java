package com.iptv.business.domain.vo;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.List;

/**
 * 网络搜索提供商配置字段VO
 * 描述提供商特定的非密钥表单字段
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Data
@Schema(description = "配置字段")
@JsonInclude(JsonInclude.Include.NON_NULL)
public class WebSearchProviderConfigFieldVO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 字段键名
     */
    @Schema(description = "字段键名")
    private String key;

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
     * 字段类型（如 select, text 等）
     */
    @Schema(description = "字段类型")
    private String type;

    /**
     * 是否必填
     */
    @Schema(description = "是否必填")
    private Boolean required;

    /**
     * 默认值
     */
    @Schema(description = "默认值")
    private String defaultValue;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 国际化描述键
     */
    @Schema(description = "国际化描述键")
    private String descriptionKey;

    /**
     * 可选项列表
     */
    @Schema(description = "可选项列表")
    private List<WebSearchProviderConfigFieldOptionVO> options;
}
