package com.iptv.business.domain.dto.page;

import com.iptv.common.core.web.page.PageDTO;
import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;

/**
 * <p>
 * MCP service configurations
 * </p>
 *
 * @author kjsc
 * @since 2026-08-10
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class McpServicesPageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "")
    private String id;

    @Schema(description = "")
    private Integer tenantId;

    @Schema(description = "")
    private String name;

    @Schema(description = "")
    private String description;

    @Schema(description = "")
    private Boolean enabled;

    @Schema(description = "")
    private String transportType;

    @Schema(description = "")
    private String url;

    @Schema(description = "")
    private String headers;

    @Schema(description = "")
    private String authConfig;

    @Schema(description = "")
    private String advancedConfig;

    @Schema(description = "")
    private String stdioConfig;

    @Schema(description = "")
    private String envVars;

    @Schema(description = "")
    private Date createdAt;

    @Schema(description = "")
    private Date updatedAt;

    @Schema(description = "")
    private Date deletedAt;

    @Schema(description = "")
    private Boolean isBuiltin;
}
