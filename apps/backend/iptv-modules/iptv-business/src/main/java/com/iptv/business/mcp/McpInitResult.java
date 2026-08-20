package com.iptv.business.mcp;

import lombok.Data;

/**
 * <p>
 * MCP初始化结果
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Data
public class McpInitResult {

    private ServerInfo serverInfo;

    @Data
    public static class ServerInfo {
        private String name;
        private String version;
        private String description;
    }
}
