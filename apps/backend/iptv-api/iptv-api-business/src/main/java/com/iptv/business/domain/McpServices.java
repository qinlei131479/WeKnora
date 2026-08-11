package com.iptv.business.domain;

import java.util.Date;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * <p>
 * MCP service configurations
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "mcp_services", autoResultMap = true)
public class McpServices implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 唯一ID
     */
    @Schema(description = "唯一ID")
    private String id;

    /**
     * 租户ID
     */
    @Schema(description = "租户ID")
    private Integer tenantId;

    /**
     * 服务名称
     */
    @Schema(description = "服务名称")
    private String name;

    /**
     * 描述
     */
    @Schema(description = "描述")
    private String description;

    /**
     * 启用服务 true-启用 false-停用
     */
    @Schema(description = "启用服务 true-启用 false-停用")
    private Boolean enabled;

    /**
     * 传输类型 http-streamable、SSE
     */
    @Schema(description = "传输类型 http-streamable、SSE")
    private String transportType;

    /**
     * 服务URL
     */
    @Schema(description = "服务URL")
    private String url;

    /**
     * 请求头
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "请求头")
    private String headers;

    /**
     * 认证配置
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "认证配置")
    private String authConfig;

    /**
     * 高级配置
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "高级配置")
    private String advancedConfig;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "stdio配置")
    private String stdioConfig;

    @TableField(typeHandler = JsonbTypeHandler.class)
    @Schema(description = "环境变量")
    private String envVars;

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

    /**
     * 删除时间
     */
    @Schema(description = "删除时间")
    private Date deletedAt;

    /**
     * 是否内置
     */
    @Schema(description = "是否内置")
    private Boolean isBuiltin;
}
