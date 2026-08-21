package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;
import java.util.Map;

import com.baomidou.mybatisplus.annotation.IdType;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;



/**
 * <p>
 * 租户级网络搜索提供商配置（密钥加密存储）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-17
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value="web_search_providers", autoResultMap = true)
public class WebSearchProviders implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */

    @TableId(type = IdType.ASSIGN_UUID)
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Long tenantId;

    /**
     * 搜索提供商配置名称
     */


    @Schema(description = "搜索提供商配置名称")
    private String name;

    /**
     * 提供商：bing/google/duckduckgo/tavily 等
     */


    @Schema(description = "提供商：bing/google/duckduckgo/tavily 等")
    private String provider;

    /**
     * 搜索提供商说明
     */


    @Schema(description = "搜索提供商说明")
    private String description;

    /**
     * 参数（JSON，敏感字段可能加密）
     */

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "参数（JSON，敏感字段可能加密）")
    private String parameters;

    /**
     * 是否为默认项
     */


    @Schema(description = "是否为默认项")
    private Boolean isDefault;

    /**
     * 创建时间
     */


    @Schema(description = "创建时间")
    private Date createdAt;

    /**
     * 最后更新时间
     */


    @Schema(description = "最后更新时间")
    private Date updatedAt;

    /**
     * 软删除时间；非空表示已删除
     */


    @Schema(description = "软删除时间；非空表示已删除")
    private Date deletedAt;
}