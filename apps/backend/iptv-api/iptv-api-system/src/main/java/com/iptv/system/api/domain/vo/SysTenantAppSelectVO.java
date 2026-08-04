package com.iptv.system.api.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.List;

/**
 * 租户下拉树 VO
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "租户下拉树")
public class SysTenantAppSelectVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "租户ID")
    private Long id;

    @Schema(description = "租户名称")
    private String name;

    @Schema(description = "父级租户ID")
    private Long parentId;

    @Schema(description = "子集")
    private List<SysTenantAppSelectVO> children;
}
