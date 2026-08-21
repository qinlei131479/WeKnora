package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.Date;


/**
 * <p>
 * 用户账号：登录凭证、系统管理员标志、跨租户访问与个人偏好
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class Users implements java.io.Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */


    @TableId(type = IdType.ASSIGN_UUID)
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 用户名
     */


    @Schema(description = "用户名")
    private String username;

    /**
     * 登录邮箱
     */


    @Schema(description = "登录邮箱")
    private String email;

    /**
     * 密码哈希
     */


    @Schema(description = "密码哈希")
    private String passwordHash;

    /**
     * 头像/图标
     */


    @Schema(description = "头像/图标")
    private String avatar;

    /**
     * 用户默认/归属工作空间 ID
     */


    @Schema(description = "用户默认/归属工作空间 ID")
    private Integer tenantId;

    /**
     * 是否激活
     */


    @Schema(description = "是否激活")
    private Boolean isActive;

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
     * 是否可访问全部工作空间
     */


    @Schema(description = "是否可访问全部工作空间")
    private Boolean canAccessAllTenants;

    /**
     * 用户偏好（JSONB，如记忆开关等）
     */


    @Schema(description = "用户偏好（JSONB，如记忆开关等）")
    private String preferences;

    /**
     * 是否系统管理员（独立于租户角色）
     */


    @Schema(description = "是否系统管理员（独立于租户角色）")
    private Boolean isSystemAdmin;
}