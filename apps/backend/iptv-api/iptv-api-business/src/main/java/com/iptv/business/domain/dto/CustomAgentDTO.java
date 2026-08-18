package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;

import java.io.Serializable;

/**
 * 智能体DTO
 *
 * @author kjsc
 * @since 2026-08-13
 */
@Data
@Schema(description = "智能体")
public class CustomAgentDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "智能体ID")
    private String id;

    @Schema(description = "智能体名称")
    private String name;

    @Schema(description = "描述")
    private String description;

    @Schema(description = "头像")
    private String avatar;

    @Schema(description = "租户ID")
    private Integer tenantId;

    @Schema(description = "创建者用户ID")
    private String createdBy;

    @Schema(description = "智能体配置")
    private CustomAgentConfigDTO config;
}
