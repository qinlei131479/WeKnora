package com.iptv.business.domain;

import java.util.Date;
import java.io.Serializable;

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
 * 自定义/内置智能体配置（与租户组成复合主键）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-26
 */
@Data
@EqualsAndHashCode(callSuper = false)
@TableName(value = "custom_agents",autoResultMap = true)
public class CustomAgents implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 智能体 ID；内置为 builtin-*，自定义为 UUID
     */

    @TableId(type = IdType.ASSIGN_UUID)
    @Schema(description = "智能体 ID；内置为 builtin-*，自定义为 UUID")
    private String id;

    /**
     * 智能体名称
     */


    @Schema(description = "智能体名称")
    private String name;

    /**
     * 智能体说明
     */


    @Schema(description = "智能体说明")
    private String description;

    /**
     * 头像/图标
     */


    @Schema(description = "头像/图标")
    private String avatar;

    /**
     * 是否内置（全局可见或系统预置）
     */


    @Schema(description = "是否内置（全局可见或系统预置）")
    private Boolean isBuiltin;

    /**
     * 与 id 组成复合主键的租户 ID
     */


    @Schema(description = "与 id 组成复合主键的租户 ID")
    private Integer tenantId;

    /**
     * 创建者用户 ID
     */


    @Schema(description = "创建者用户 ID")
    private String createdBy;

    /**
     * 智能体完整配置（JSONB）
     */


    @Schema(description = "智能体完整配置（JSONB）")
    @TableField(typeHandler = JsonbTypeHandler.class)
    private String config;

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

    /**
     * 只读共享权限下是否允许运行该智能体
     */


    @Schema(description = "只读共享权限下是否允许运行该智能体")
    private Boolean runnableByViewer;
}