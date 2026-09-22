package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;

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

    private static final long serialVersionUID = 1L;

    /**
     * 技能名称（模糊查询）
     */
    @Schema(description = "技能名称（模糊查询）")
    private String name;

    /**
     * 技能描述（模糊查询）
     */
    @Schema(description = "技能描述（模糊查询）")
    private String description;

    /**
     * 版本号（模糊查询）
     */
    @Schema(description = "版本号（模糊查询）")
    private String version;

    /**
     * 租户 ID（为空查询全部租户）
     */
    @Schema(description = "租户 ID（为空查询全部租户）")
    private Long tenantId;

    /**
     * 创建时间 start
     */
    @Schema(description = "创建时间 start")
    private Date createdAtStart;

    /**
     * 创建时间 end
     */
    @Schema(description = "创建时间 end")
    private Date createdAtEnd;
}
