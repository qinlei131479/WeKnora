package com.iptv.business.mcp;

import cn.hutool.core.util.IdUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.iptv.business.domain.McpServices;
import lombok.extern.slf4j.Slf4j;

import java.util.Map;

/**
 * <p>
 * HTTP Streamable传输模式MCP客户端
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
public class HttpStreamableMcpClient extends AbstractMcpClient {

    public HttpStreamableMcpClient(McpServices service) {
        super(service);
    }

    @Override
    protected void doConnect() throws Exception {
        // HTTP Streamable模式下，连接就是验证URL可达
        log.info("HTTP Streamable MCP client connected to: {}", service.getUrl());
    }

    @Override
    protected void doDisconnect() throws Exception {
        // HTTP Streamable模式无需显式断开
        log.info("HTTP Streamable MCP client disconnected");
    }

    @Override
    public McpInitResult initialize() throws Exception {
        checkConnected();
        JSONObject request = new JSONObject();
        request.set("jsonrpc", "2.0");
        request.set("id", IdUtil.fastSimpleUUID());
        request.set("method", "initialize");
        request.set("params", new JSONObject()
                .set("protocolVersion", "2024-11-05")
                .set("capabilities", new JSONObject())
                .set("clientInfo", new JSONObject()
                        .set("name", "WeKnora-Java")
                        .set("version", "1.0.0")));

        String response = sendJsonRpc(request);
        return parseInitResult(response);
    }

    @Override
    protected String sendRequest(String method, Map<String, Object> params) throws Exception {
        checkConnected();
        JSONObject request = new JSONObject();
        request.set("jsonrpc", "2.0");
        request.set("id", IdUtil.fastSimpleUUID());
        request.set("method", method);
        if (params != null) {
            request.set("params", new JSONObject(params));
        }
        return sendJsonRpc(request);
    }

    private String sendJsonRpc(JSONObject request) throws Exception {
        String url = service.getUrl();

        HttpRequest httpRequest = HttpRequest.post(url)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json, text/event-stream")
                .body(request.toString())
                .timeout(30000);

        // 添加自定义headers
        String customHeaders = buildHeaders();
        if (customHeaders != null) {
            for (String header : customHeaders.split(",")) {
                String[] parts = header.split("=", 2);
                if (parts.length == 2) {
                    httpRequest.header(parts[0], parts[1]);
                }
            }
        }

        HttpResponse response = httpRequest.execute();
        return response.body();
    }
}
