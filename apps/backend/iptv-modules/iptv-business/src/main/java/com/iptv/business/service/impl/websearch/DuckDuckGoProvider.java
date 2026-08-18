package com.iptv.business.service.impl.websearch;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * DuckDuckGo 搜索引擎实现
 * 不需要 API Key
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Slf4j
public class DuckDuckGoProvider implements WebSearchProvider {

    private static final String DUCKDUCKGO_SEARCH_URL = "https://api.duckduckgo.com/";
    private static final int TIMEOUT = 10000; // 10秒

    public DuckDuckGoProvider() {
        // DuckDuckGo 不需要 API Key
    }

    @Override
    public String getName() {
        return "duckduckgo";
    }

    @Override
    public int testSearch(String query, int maxResults) throws Exception {
        log.info("[WebSearch][DuckDuckGo] Testing with query: {}, maxResults: {}", query, maxResults);

        String url = DUCKDUCKGO_SEARCH_URL + "?q=" + query + "&format=json&no_html=1&skip_disambig=1";

        try (HttpResponse response = HttpRequest.get(url)
                .timeout(TIMEOUT)
                .execute()) {

            if (response.getStatus() != 200) {
                throw new RuntimeException("DuckDuckGo API returned status " + response.getStatus() + ": " + response.body());
            }

            JSONObject jsonResponse = JSONUtil.parseObj(response.body());
            
            // DuckDuckGo API 返回的结果格式不同，需要解析 RelatedTopics
            JSONArray relatedTopics = jsonResponse.getJSONArray("RelatedTopics");
            if (relatedTopics == null || relatedTopics.isEmpty()) {
                return 0;
            }

            // 计算有效结果数（最多 maxResults 个）
            int resultCount = 0;
            for (int i = 0; i < relatedTopics.size() && i < maxResults; i++) {
                JSONObject topic = relatedTopics.getJSONObject(i);
                if (topic.containsKey("Text") && StrUtil.isNotBlank(topic.getStr("Text"))) {
                    resultCount++;
                }
            }

            return resultCount;
        }
    }

    @Override
    public String getEmptyResultDiagnostics() {
        return "DuckDuckGo returned 0 results; verify network connectivity and proxy settings";
    }
}
