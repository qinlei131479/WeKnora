package com.iptv.business.mcp;

import cn.hutool.core.util.IdUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.iptv.business.domain.McpServices;
import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

/**
 * <p>
 * SSE传输模式MCP客户端
 * </p>
 *
 * @author kjsc
 * @since 2026-08-20
 */
@Slf4j
public class SseMcpClient extends AbstractMcpClient {

    private String messageEndpoint;
    private Thread sseThread;
    private volatile boolean running = false;
    private final BlockingQueue<String> responseQueue = new LinkedBlockingQueue<>();

    public SseMcpClient(McpServices service) {
        super(service);
    }

    @Override
    protected void doConnect() throws Exception {
        // SSE模式下，连接就是建立SSE流
        running = true;
        sseThread = new Thread(this::listenSseStream, "SSE-MCP-Listener");
        sseThread.setDaemon(true);
        sseThread.start();

        // 等待获取message endpoint
        String endpoint = responseQueue.poll(30, TimeUnit.SECONDS);
        if (endpoint == null) {
            throw new RuntimeException("Failed to get message endpoint from SSE stream");
        }
        this.messageEndpoint = endpoint;
        log.info("SSE MCP client connected, message endpoint: {}", messageEndpoint);
    }

    @Override
    protected void doDisconnect() throws Exception {
        running = false;
        if (sseThread != null) {
            sseThread.interrupt();
            sseThread = null;
        }
        messageEndpoint = null;
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
        String url = messageEndpoint;
        if (url == null) {
            throw new RuntimeException("Message endpoint not available");
        }

        HttpResponse response = HttpRequest.post(url)
                .header("Content-Type", "application/json")
                .body(request.toString())
                .timeout(30000)
                .execute();

        return response.body();
    }

    private void listenSseStream() {
        try {
            URL url = new URL(service.getUrl());
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("Accept", "text/event-stream");
            conn.setConnectTimeout(30000);
            conn.setReadTimeout(0); // 无限超时，由running控制

            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()))) {
                String line;
                while (running && (line = reader.readLine()) != null) {
                    if (line.startsWith("data:")) {
                        String data = line.substring(5).trim();
                        if (data.startsWith("{")) {
                            JSONObject json = JSONUtil.parseObj(data);
                            // 检查是否是endpoint事件
                            if (json.containsKey("endpoint")) {
                                String endpoint = json.getStr("endpoint");
                                // 构建完整的message endpoint URL
                                if (!endpoint.startsWith("http")) {
                                    String baseUrl = service.getUrl();
                                    int lastSlash = baseUrl.lastIndexOf('/');
                                    if (lastSlash > 0) {
                                        endpoint = baseUrl.substring(0, lastSlash + 1) + endpoint;
                                    }
                                }
                                responseQueue.offer(endpoint);
                            }
                        }
                    }
                }
            }
        }catch (Exception e) {
            Thread.currentThread().interrupt();
            if (running) {
                log.error("SSE listener error: {}", e.getMessage());
            }
        }
    }
}
