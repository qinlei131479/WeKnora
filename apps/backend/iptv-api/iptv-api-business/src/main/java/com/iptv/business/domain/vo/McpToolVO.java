package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * <p>
 * MCP工具VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@NoArgsConstructor
@Schema(description = "MCP工具")
public class McpToolVO {

    @Schema(description = "工具名称")
    private String name;

    @Schema(description = "工具描述")
    private String description;

    @Schema(description = "输入模式")
    private String inputSchema;
}
