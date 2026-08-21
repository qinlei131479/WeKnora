package com.iptv.business.domain.dto;

import com.iptv.common.core.web.domain.dto.BaseDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

/**
 * <p>
 * 租户绑定用户 DTO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class TenantBindUsersDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    /**
     * 用户 ID
     */
    @NotBlank(message = "租户ID不能为空", groups = {BaseDTO.Update.class})
    @Schema(description = "租户ID")
    private Integer tenantId;

    /**
     * 角色
     */
    @NotBlank(message = "角色不能为空", groups = {BaseDTO.Update.class})
    @Schema(description = "角色(owner/admin/contributor/viewer)")
    private String role;

    /**
     * 用户ID列表
     */
    @NotEmpty(message = "用户ID列表不能为空", groups = {BaseDTO.Update.class})
    @Schema(description = "用户ID列表")
    private List<String> userIds;
}
