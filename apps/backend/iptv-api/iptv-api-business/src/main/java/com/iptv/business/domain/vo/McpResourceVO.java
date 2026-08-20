package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * <p>
 * MCP资源VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@NoArgsConstructor
@Schema(description = "MCP资源")
public class McpResourceVO {

    @Schema(description = "资源URI")
    private String uri;

    @Schema(description = "资源名称")
    private String name;

    @Schema(description = "资源描述")
    private String description;

    @Schema(description = "MIME类型")
    private String mimeType;
}
