package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;

/**
 * 网络搜索提供商类型元数据实体
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "amp_web_search_provider_types", autoResultMap = true)
public class WebSearchProviderType implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @TableId
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 提供商类型标识（如 bing, tavily 等）
     */
    @Schema(description = "提供商类型标识")
    private String providerType;

    /**
     * 显示名称
     */
    @Schema(description = "显示名称")
    private String name;

    /**
     * 是否需要 API 密钥
     */
    @Schema(description = "是否需要 API 密钥")
    private Boolean requiresApiKey;

    /**
     * 是否支持可选 API 密钥
     */
    @Schema(description = "是否支持可选 API 密钥")
    private Boolean supportsOptionalApiKey;

    /**
     * 是否需要引擎 ID
     */
    @Schema(description = "是否需要引擎 ID")
    private Boolean requiresEngineId;

    /**
     * 是否需要 Base URL
     */
    @Schema(description = "是否需要 Base URL")
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
     * 官方文档 URL
     */
    @Schema(description = "官方文档 URL")
    private String docsUrl;

    /**
     * 配置字段（JSON）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "配置字段")
    private String configFields;

    /**
     * 排序顺序
     */
    @Schema(description = "排序顺序")
    private Integer sortOrder;

    /**
     * 是否启用
     */
    @Schema(description = "是否启用")
    private Boolean enabled;

    /**
     * 创建时间
     */
    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 更新时间
     */
    @Schema(description = "更新时间")
    private Date updatedAt;
}
