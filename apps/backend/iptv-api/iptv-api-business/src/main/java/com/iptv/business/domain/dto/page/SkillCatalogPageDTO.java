package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;

/**
 * <p>
 * 技能目录定义分页查询条件
 * </p>
 *
 * @author kjsc
 * @since 2026-09-21
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class SkillCatalogPageDTO implements Serializable {
    @Serial
    private static final long serialVersionUID = 8468498370547388580L;

    @Schema(description = "查询关键字")
    private String keyword;

    @Schema(description = "租户 ID（为空查询全部租户）")
    private Long tenantId;
}
