package com.iptv.business.domain.dto;

import com.iptv.common.core.web.domain.dto.BaseDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

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
public class UsersDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 主键 ID
     */
    @NotNull(message = "主键 ID 不能为空", groups = {BaseDTO.Update.class})
    @Schema(description = "主键 ID")
    private String id;

    /**
     * 用户名
     */
    @NotBlank(message = "用户名不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "用户名")
    private String username;

    /**
     * 登录邮箱
     */
    @NotBlank(message = "登录邮箱不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "登录邮箱")
    private String email;

    /**
     * 密码
     */
    @NotBlank(message = "密码不能为空", groups = {BaseDTO.Insert.class})
    @Schema(description = "密码")
    private String password;

    /**
     * 绑定租户列表
     */
    @Schema(description = "绑定租户列表")
    private List<BindTenantDTO> tenants;

    @Data
    @AllArgsConstructor
    @NoArgsConstructor
    public static class BindTenantDTO {
        /**
         * 租户 ID
         */
        @Schema(description = "租户 ID")
        private Integer tenantId;

        /**
         * 租户名称
         */
        @Schema(description = "角色(owner/admin/contributor/viewer)")
        private String role;
    }
}
