package com.iptv.business.domain.dto.page;

import java.util.Date;
import java.io.Serializable;
import lombok.Data;
import com.iptv.common.core.web.page.PageDTO;
import lombok.EqualsAndHashCode;
import io.swagger.v3.oas.annotations.media.Schema;

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
public class UsersPageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 用户名 username 字段和框架header 中的 username 冲突,重命名为name
     */
    @Schema(description = "用户名")
    private String name;

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
