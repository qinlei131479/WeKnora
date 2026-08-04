package com.iptv.system.api.domain.dto;

import com.iptv.common.core.web.domain.BaseEntity;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;

/**
 * 租户查询过滤 DTO
 */
@Data
@EqualsAndHashCode(callSuper = false)
@Schema(description = "租户查询过滤")
public class SysTenantFilterDTO extends BaseEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "关键字查询")
    private String keyWord;

    @Schema(description = "用户id", hidden = true)
    private Long userId;

    @Schema(description = "租户id", hidden = true)
    private Long tenantId;
}
