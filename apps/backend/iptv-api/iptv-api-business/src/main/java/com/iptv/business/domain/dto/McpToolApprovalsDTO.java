package com.iptv.business.domain.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;


/**
 * <p>
 * MCP 工具审批记录
 * </p>
 *
 * @author kjsc
 * @since 2026-08-11
 */
@Data
@EqualsAndHashCode(callSuper = false)
public class McpToolApprovalsDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Schema(description = "关联 MCP 服务 ID")
    private String serviceId;

    /**
     * 待审批的 MCP 工具名
     */
    @Schema(description = "待审批的 MCP 工具名")
    private String toolName;
}