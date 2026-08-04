package com.iptv.system.api.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 带 label 的租户树节点 VO
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "租户树节点")
public class SysTenantReChangeVO extends SysTenantVO {

    @Schema(description = "租户名称(用于下拉)")
    private String label;
}
