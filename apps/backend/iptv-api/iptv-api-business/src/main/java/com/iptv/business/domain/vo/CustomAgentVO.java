package com.iptv.business.domain.vo;

import com.iptv.business.domain.dto.CustomAgentConfigDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 智能体VO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "智能体")
public class CustomAgentVO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "智能体ID")
    private String id;

    @Schema(description = "智能体名称")
    private String name;

    @Schema(description = "描述")
    private String description;

    @Schema(description = "头像")
    private String avatar;

    @Schema(description = "是否内置")
    private Boolean isBuiltin;

    @Schema(description = "租户ID")
    private Integer tenantId;

    @Schema(description = "创建者用户ID")
    private String createdBy;

    @Schema(description = "创建者名称")
    private String creatorName;

    @Schema(description = "智能体配置")
    private CustomAgentConfigDTO config;

    @Schema(description = "创建时间")
    private Date createdAt;

    @Schema(description = "更新时间")
    private Date updatedAt;
}
