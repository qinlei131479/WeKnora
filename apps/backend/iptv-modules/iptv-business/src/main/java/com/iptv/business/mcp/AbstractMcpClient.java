package com.iptv.business.mcp;

import cn.hutool.core.util.StrUtil;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.iptv.business.domain.McpServices;
import com.iptv.business.domain.vo.McpResourceVO;
import com.iptv.business.domain.vo.McpToolVO;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * <p>
 * MCP客户端抽象基类
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
public abstract class AbstractMcpClient implements McpClient {

    protected final McpServices service;
    protected boolean connected = false;

    protected AbstractMcpClient(McpServices service) {
        this.service = service;
    }

    @Override
    public void connect() throws Exception {
        if (connected) {
            return;
        }
        doConnect();
        connected = true;
        log.info("MCP client connected to: {}", service.getUrl());
    }

    @Override
    public void disconnect() {
        if (!connected) {
            return;
        }
        try {
            doDisconnect();
        } catch (Exception e) {
            log.warn("Error disconnecting MCP client: {}", e.getMessage());
        }
        connected = false;
        log.info("MCP client disconnected from: {}", service.getUrl());
    }

    @Override
    public List<McpToolVO> listTools() throws Exception {
        checkConnected();
        String response = sendRequest("tools/list", null);
        return parseTools(response);
    }

    @Override
    public List<McpResourceVO> listResources() throws Exception {
        checkConnected();
        String response = sendRequest("resources/list", null);
        return parseResources(response);
    }

    protected void checkConnected() {
        if (!connected) {
            throw new IllegalStateException("MCP client is not connected");
        }
    }

    protected abstract void doConnect() throws Exception;

    protected abstract void doDisconnect() throws Exception;

    protected abstract String sendRequest(String method, Map<String, Object> params) throws Exception;

    protected List<McpToolVO> parseTools(String response) {
        List<McpToolVO> tools = new ArrayList<>();
        try {
            JSONObject json = JSONUtil.parseObj(response);
            JSONObject result = json.getJSONObject("result");
            if (result != null) {
                var toolsArray = result.getJSONArray("tools");
                if (toolsArray != null) {
                    for (int i = 0; i < toolsArray.size(); i++) {
                        JSONObject toolJson = toolsArray.getJSONObject(i);
                        McpToolVO tool = new McpToolVO();
                        tool.setName(toolJson.getStr("name"));
                        tool.setDescription(toolJson.getStr("description"));
                        tool.setInputSchema(JSONUtil.toJsonStr(toolJson.get("inputSchema")));
                        tools.add(tool);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse tools: {}", e.getMessage());
        }
        return tools;
    }

    protected List<McpResourceVO> parseResources(String response) {
        List<McpResourceVO> resources = new ArrayList<>();
        try {
            JSONObject json = JSONUtil.parseObj(response);
            JSONObject result = json.getJSONObject("result");
            if (result != null) {
                var resourcesArray = result.getJSONArray("resources");
                if (resourcesArray != null) {
                    for (int i = 0; i < resourcesArray.size(); i++) {
                        JSONObject resourceJson = resourcesArray.getJSONObject(i);
                        McpResourceVO resource = new McpResourceVO();
                        resource.setUri(resourceJson.getStr("uri"));
                        resource.setName(resourceJson.getStr("name"));
                        resource.setDescription(resourceJson.getStr("description"));
                        resource.setMimeType(resourceJson.getStr("mimeType"));
                        resources.add(resource);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse resources: {}", e.getMessage());
        }
        return resources;
    }

    protected McpInitResult parseInitResult(String response) {
        McpInitResult result = new McpInitResult();
        try {
            JSONObject json = JSONUtil.parseObj(response);
            JSONObject resultJson = json.getJSONObject("result");
            if (resultJson != null) {
                JSONObject serverInfo = resultJson.getJSONObject("serverInfo");
                if (serverInfo != null) {
                    McpInitResult.ServerInfo info = new McpInitResult.ServerInfo();
                    info.setName(serverInfo.getStr("name"));
                    info.setVersion(serverInfo.getStr("version"));
                    info.setDescription(serverInfo.getStr("description"));
                    result.setServerInfo(info);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to parse init result: {}", e.getMessage());
        }
        return result;
    }

    protected String buildHeaders() {
        if (StrUtil.isBlank(service.getHeaders())) {
            return null;
        }
        try {
            JSONObject headers = JSONUtil.parseObj(service.getHeaders());
            StringBuilder sb = new StringBuilder();
            for (Map.Entry<String, Object> entry : headers.entrySet()) {
                if (sb.length() > 0) {
                    sb.append(",");
                }
                sb.append(entry.getKey()).append("=").append(entry.getValue());
            }
            return sb.toString();
        } catch (Exception e) {
            log.warn("Failed to parse headers: {}", e.getMessage());
            return null;
        }
    }
}
