package com.iptv.business.domain.dto.page;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serial;
import java.io.Serializable;

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
    @Serial
    private static final long serialVersionUID = -3832357298724414249L;

    @Schema(description = "查询关键字")
    private String keyword;
}
