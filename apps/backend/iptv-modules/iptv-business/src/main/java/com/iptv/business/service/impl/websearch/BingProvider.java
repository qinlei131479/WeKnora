package com.iptv.business.service.impl.websearch;

import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * Bing 搜索引擎实现
 *
 * @author kjsc
 * @since 2026-08-18
 */
@Slf4j
public class BingProvider implements WebSearchProvider {

    private static final String BING_SEARCH_URL = "https://api.bing.microsoft.com/v7.0/search";
    private static final int TIMEOUT = 10000; // 10秒

    private final String apiKey;

    public BingProvider(String apiKey) {
        if (StrUtil.isBlank(apiKey)) {
            throw new IllegalArgumentException("Bing API key is required");
        }
        this.apiKey = apiKey;
    }

    @Override
    public String getName() {
        return "bing";
    }

    @Override
    public int testSearch(String query, int maxResults) throws Exception {
        log.info("[WebSearch][Bing] Testing with query: {}, maxResults: {}", query, maxResults);

        String url = StrUtil.format("{}?q={}&count={}", BING_SEARCH_URL, query, maxResults);

        try (HttpResponse response = HttpRequest.get(url)
                .header("Ocp-Apim-Subscription-Key", apiKey)
                .timeout(TIMEOUT)
                .execute()) {

            if (response.getStatus() != 200) {
                throw new RuntimeException("Bing API returned status " + response.getStatus() + ": " + response.body());
            }

            JSONObject jsonResponse = JSONUtil.parseObj(response.body());
            JSONObject webPages = jsonResponse.getJSONObject("webPages");

            if (webPages == null) {
                return 0;
            }

            return webPages.getJSONArray("value") != null ? webPages.getJSONArray("value").size() : 0;
        }
    }
}
