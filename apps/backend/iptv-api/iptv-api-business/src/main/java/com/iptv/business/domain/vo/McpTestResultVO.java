package com.iptv.business.domain.vo;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * <p>
 * MCP服务测试结果VO
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
@NoArgsConstructor
@Schema(description = "MCP服务测试结果")
public class McpTestResultVO {

    @Schema(description = "测试是否成功")
    private Boolean success;

    @Schema(description = "测试消息")
    private String message;

    @Schema(description = "服务器描述")
    private String description;

    @Schema(description = "工具列表")
    private List<McpToolVO> tools;

    @Schema(description = "资源列表")
    private List<McpResourceVO> resources;

    public McpTestResultVO(Boolean success, String message) {
        this.success = success;
        this.message = message;
    }
}
