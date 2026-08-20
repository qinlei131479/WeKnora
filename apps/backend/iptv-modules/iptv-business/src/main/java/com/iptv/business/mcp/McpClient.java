package com.iptv.business.mcp;

import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.vo.McpResourceVO;
import com.iptv.business.domain.vo.McpToolVO;

import java.util.List;

/**
 * <p>
 * MCP客户端接口
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
public interface McpClient {

    /**
     * 连接到MCP服务器
     *
     * @throws Exception 连接失败
     */
    void connect() throws Exception;

    /**
     * 初始化MCP连接
     *
     * @return 初始化结果
     * @throws Exception 初始化失败
     */
    McpInitResult initialize() throws Exception;

    /**
     * 获取工具列表
     *
     * @return 工具列表
     * @throws Exception 获取失败
     */
    List<McpToolVO> listTools() throws Exception;

    /**
     * 获取资源列表
     *
     * @return 资源列表
     * @throws Exception 获取失败
     */
    List<McpResourceVO> listResources() throws Exception;

    /**
     * 断开连接
     */
    void disconnect();

    /**
     * 创建MCP客户端
     *
     * @param service MCP服务配置
     * @return MCP客户端实例
     */
    static McpClient create(McpServices service) {
        String transportType = service.getTransportType();
        if ("sse".equalsIgnoreCase(transportType)) {
            return new SseMcpClient(service);
        } else {
            // 默认使用HTTP streaming
            return new HttpStreamableMcpClient(service);
        }
    }
}
