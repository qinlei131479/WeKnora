package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.iptv.common.core.typehandler.JsonbTypeHandler;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 自定义智能体实体类
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@TableName(value = "custom_agents", autoResultMap = true)
public class CustomAgent implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 智能体ID（内置智能体为固定ID，自定义为UUID）
     */
    private String id;

    /**
     * 智能体名称
     */
    private String name;

    /**
     * 描述
     */
    private String description;

    /**
     * 头像（emoji或图标名称）
     */
    private String avatar;

    /**
     * 是否为内置智能体
     */
    private Boolean isBuiltin;

    /**
     * 租户ID（与id组成复合主键）
     */
    private Integer tenantId;

    /**
     * 创建者用户ID
     */
    private String createdBy;

    /**
     * 智能体配置（JSONB格式）
     */
    @TableField(typeHandler = JsonbTypeHandler.class)
    private String config;

    /**
     * 创建时间
     */
    private Date createdAt;

    /**
     * 更新时间
     */
    private Date updatedAt;

    /**
     * 删除时间（软删除）
     */
    private Date deletedAt;

    /**
     * 只读共享权限下是否允许运行该智能体
     */
    private Boolean runnableByViewer;

    /**
     * 创建者名称（非数据库字段，用于列表展示）
     */
    @TableField(exist = false)
    private String creatorName;
}
