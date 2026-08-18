-- 添加 Go 代码中其他供应商（不启用）
-- 这些供应商在 Go 代码中有定义，但当前 Java 版本暂不启用

INSERT INTO web_search_provider_types (id, provider_type, name, requires_api_key, supports_optional_api_key, requires_engine_id, requires_base_url, supports_proxy, description, docs_url, config_fields, sort_order, enabled) VALUES
-- Google Custom Search（需要 API Key 和 Engine ID）
('a1b2c3d4-e5f6-7890-abcd-ef1234567805', 'google', 'Google', TRUE, FALSE, TRUE, FALSE, TRUE, 'Google Custom Search API (requires API key and engine ID)', 'https://developers.google.com/custom-search/v1/overview', '[]'::jsonb, 5, FALSE),

-- Ollama Web Search（需要 Ollama API Key）
('a1b2c3d4-e5f6-7890-abcd-ef1234567806', 'ollama', 'Ollama Web Search', TRUE, FALSE, FALSE, FALSE, FALSE, 'Ollama Cloud web search (requires Ollama API key)', 'https://docs.ollama.com/capabilities/web-search', '[]'::jsonb, 6, FALSE),

-- SearXNG（自托管，需要 Base URL）
('a1b2c3d4-e5f6-7890-abcd-ef1234567807', 'searxng', 'SearXNG', FALSE, FALSE, FALSE, TRUE, TRUE, 'Self-hosted SearXNG metasearch instance (provide instance URL; private hosts must be SSRF-whitelisted)', 'https://docs.searxng.org/', '[]'::jsonb, 7, FALSE),

-- Keenable（支持可选 API Key）
('a1b2c3d4-e5f6-7890-abcd-ef1234567808', 'keenable', 'Keenable', FALSE, TRUE, FALSE, FALSE, TRUE, 'Keenable web search built for AI agents (keyless by default; an optional API key lifts the rate limit)', 'https://keenable.ai/', '[]'::jsonb, 8, FALSE),

-- Zhipu AI（智谱 AI，需要 API Key，有配置字段）
('a1b2c3d4-e5f6-7890-abcd-ef1234567809', 'zhipu', 'Zhipu AI', TRUE, FALSE, FALSE, FALSE, TRUE, 'Zhipu AI Web Search API (requires API key)', 'https://docs.bigmodel.cn/cn/guide/tools/web-search', '[
  {
    "key": "search_engine",
    "label": "Search engine",
    "label_key": "webSearchSettings.configFields.searchEngine",
    "type": "select",
    "required": true,
    "default": "search_std",
    "description": "Select the Zhipu search engine and per-request price tier.",
    "description_key": "webSearchSettings.configFields.searchEngineDesc",
    "options": [
      {"label": "Standard · ¥0.01/request", "label_key": "webSearchSettings.configFields.searchStd", "value": "search_std"},
      {"label": "Pro · ¥0.03/request", "label_key": "webSearchSettings.configFields.searchPro", "value": "search_pro"},
      {"label": "Sogou · ¥0.05/request", "label_key": "webSearchSettings.configFields.searchSogou", "value": "search_pro_sogou"},
      {"label": "Quark · ¥0.05/request", "label_key": "webSearchSettings.configFields.searchQuark", "value": "search_pro_quark"}
    ]
  },
  {
    "key": "content_size",
    "label": "Content size",
    "label_key": "webSearchSettings.configFields.contentSize",
    "type": "select",
    "required": true,
    "default": "medium",
    "description": "Medium returns concise summaries; high returns more context.",
    "description_key": "webSearchSettings.configFields.contentSizeDesc",
    "options": [
      {"label": "Medium", "label_key": "webSearchSettings.configFields.contentMedium", "value": "medium"},
      {"label": "High", "label_key": "webSearchSettings.configFields.contentHigh", "value": "high"}
    ]
  }
]'::jsonb, 9, FALSE);
