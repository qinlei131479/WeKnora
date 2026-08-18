package com.iptv.business.service.impl.websearch;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * Tavily 搜索引擎实现
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Slf4j
public class TavilyProvider implements WebSearchProvider {

    private static final String TAVILY_SEARCH_URL = "https://api.tavily.com/search";
    private static final int TIMEOUT = 15000; // 15秒

    private final String apiKey;

    public TavilyProvider(String apiKey) {
        if (StrUtil.isBlank(apiKey)) {
            throw new IllegalArgumentException("Tavily API key is required");
        }
        this.apiKey = apiKey;
    }

    @Override
    public String getName() {
        return "tavily";
    }

    @Override
    public int testSearch(String query, int maxResults) throws Exception {
        log.info("[WebSearch][Tavily] Testing with query: {}, maxResults: {}", query, maxResults);

        JSONObject requestBody = new JSONObject();
        requestBody.set("api_key", apiKey);
        requestBody.set("query", query);
        requestBody.set("max_results", maxResults);

        try (HttpResponse response = HttpRequest.post(TAVILY_SEARCH_URL)
                .body(requestBody.toString())
                .contentType("application/json")
                .timeout(TIMEOUT)
                .execute()) {

            if (response.getStatus() != 200) {
                throw new RuntimeException("Tavily API returned status " + response.getStatus() + ": " + response.body());
            }

            JSONObject jsonResponse = JSONUtil.parseObj(response.body());
            return jsonResponse.getJSONArray("results") != null ? jsonResponse.getJSONArray("results").size() : 0;
        }
    }
}
