package com.iptv.business.service.impl.websearch;

import cn.hutool.json.JSONObject;

/**
 * 网络搜索提供商接口
 * 定义搜索引擎的统一接口
 *
 * @author kjsc
 * @since 2026-08-18
 */
public interface WebSearchProvider {

    /**
     * 获取提供商名称
     *
     * @return 提供商名称（如 bing, tavily, baidu, duckduckgo）
     */
    String getName();

    /**
     * 执行搜索测试
     *
     * @param query 查询词
     * @param maxResults 最大结果数
     * @return 搜索结果数量
     * @throws Exception 搜索失败时抛出异常
     */
    int testSearch(String query, int maxResults) throws Exception;

    /**
     * 获取空结果时的诊断信息
     *
     * @return 诊断信息
     */
    default String getEmptyResultDiagnostics() {
        return "";
    }
}
