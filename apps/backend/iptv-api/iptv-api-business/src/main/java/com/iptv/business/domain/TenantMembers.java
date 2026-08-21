package com.iptv.business.domain;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;


/**
 * <p>
 * 用户在租户内的成员关系与角色（RBAC）
 * </p>
 *
 * @author kjsc
 * @since 2026-08-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class TenantMembers implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */

    @TableId(type = IdType.AUTO)
    @Schema(description = "主键 ID")
    private Long id;

    /**
     * 用户 ID
     */


    @Schema(description = "用户 ID")
    private String userId;

    /**
     * 所属工作空间（租户）ID
     */


    @Schema(description = "所属工作空间（租户）ID")
    private Integer tenantId;

    /**
     * 租户内角色（owner/admin/contributor 等）
     */


    @Schema(description = "租户内角色（owner/admin/contributor 等）")
    private String role;

    /**
     * 成员状态：active/invited/suspended
     */


    @Schema(description = "成员状态：active/invited/suspended")
    private String status;

    /**
     * 邀请人用户 ID
     */


    @Schema(description = "邀请人用户 ID")
    private String invitedBy;

    /**
     * 加入时间
     */


    @Schema(description = "加入时间")
    private Date joinedAt;

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

    public static TenantMembers create(Users user, Tenants tenant, String role) {
        TenantMembers tenantMembers = new TenantMembers();
        tenantMembers.setUserId(user.getId());
        tenantMembers.setTenantId(tenant.getId());
        tenantMembers.setRole(role);
        tenantMembers.setStatus("active");
        tenantMembers.setJoinedAt(new Date());
        return tenantMembers;
    }
}