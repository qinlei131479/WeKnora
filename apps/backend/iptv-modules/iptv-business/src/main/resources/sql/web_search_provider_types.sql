-- 网络搜索提供商类型元数据表
CREATE TABLE IF NOT EXISTS amp_web_search_provider_types (
    id VARCHAR(36) PRIMARY KEY,
    provider_type VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    requires_api_key BOOLEAN NOT NULL DEFAULT FALSE,
    supports_optional_api_key BOOLEAN NOT NULL DEFAULT FALSE,
    requires_engine_id BOOLEAN NOT NULL DEFAULT FALSE,
    requires_base_url BOOLEAN NOT NULL DEFAULT FALSE,
    supports_proxy BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,
    docs_url VARCHAR(500),
    config_fields JSONB DEFAULT '[]'::jsonb,
    sort_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 添加字段注释
COMMENT ON TABLE amp_web_search_provider_types IS '网络搜索提供商类型元数据表';
COMMENT ON COLUMN amp_web_search_provider_types.id IS '主键 ID';
COMMENT ON COLUMN amp_web_search_provider_types.provider_type IS '提供商类型标识（如 bing, tavily, duckduckgo, baidu）';
COMMENT ON COLUMN amp_web_search_provider_types.name IS '显示名称';
COMMENT ON COLUMN amp_web_search_provider_types.requires_api_key IS '是否需要 API 密钥';
COMMENT ON COLUMN amp_web_search_provider_types.supports_optional_api_key IS '是否支持可选 API 密钥（无密钥可用，有密钥可提升限额）';
COMMENT ON COLUMN amp_web_search_provider_types.requires_engine_id IS '是否需要引擎 ID（如 Google CSE）';
COMMENT ON COLUMN amp_web_search_provider_types.requires_base_url IS '是否需要用户提供 Base URL（如自托管 SearXNG）';
COMMENT ON COLUMN amp_web_search_provider_types.supports_proxy IS '是否支持代理';
COMMENT ON COLUMN amp_web_search_provider_types.description IS '提供商描述';
COMMENT ON COLUMN amp_web_search_provider_types.docs_url IS '官方文档 URL';
COMMENT ON COLUMN amp_web_search_provider_types.config_fields IS '配置字段定义（JSON 格式）';
COMMENT ON COLUMN amp_web_search_provider_types.sort_order IS '排序顺序（数值越小越靠前）';
COMMENT ON COLUMN amp_web_search_provider_types.enabled IS '是否启用';
COMMENT ON COLUMN amp_web_search_provider_types.created_at IS '创建时间';
COMMENT ON COLUMN amp_web_search_provider_types.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wspt_provider_type ON amp_web_search_provider_types(provider_type);
CREATE INDEX IF NOT EXISTS idx_wspt_enabled ON amp_web_search_provider_types(enabled);
CREATE INDEX IF NOT EXISTS idx_wspt_sort_order ON amp_web_search_provider_types(sort_order);

-- 插入初始数据（4个提供商）
INSERT INTO amp_web_search_provider_types (id, provider_type, name, requires_api_key, supports_optional_api_key, requires_engine_id, requires_base_url, supports_proxy, description, docs_url, config_fields, sort_order, enabled) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'duckduckgo', 'DuckDuckGo', FALSE, FALSE, FALSE, FALSE, TRUE, 'DuckDuckGo Search (free, no API key required)', 'https://duckduckgo.com/', '[]'::jsonb, 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'bing', 'Bing', TRUE, FALSE, FALSE, FALSE, TRUE, 'Bing Search API (requires API key from Azure)', 'https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/overview', '[]'::jsonb, 2, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'tavily', 'Tavily', TRUE, FALSE, FALSE, FALSE, TRUE, 'Tavily Search API (requires API key)', 'https://tavily.com/', '[]'::jsonb, 3, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'baidu', 'Baidu', TRUE, FALSE, FALSE, FALSE, FALSE, 'Baidu AI Search (requires API key from Baidu Cloud)', 'https://cloud.baidu.com/doc/AppBuilder/s/qlvEcai0p', '[]'::jsonb, 4, TRUE);

-- 添加 Go 代码中其他供应商（不启用）
-- 这些供应商在 Go 代码中有定义，但当前 Java 版本暂不启用

INSERT INTO amp_web_search_provider_types (id, provider_type, name, requires_api_key, supports_optional_api_key, requires_engine_id, requires_base_url, supports_proxy, description, docs_url, config_fields, sort_order, enabled) VALUES
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

-- 更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_amp_web_search_provider_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_amp_web_search_provider_types_updated_at
    BEFORE UPDATE ON amp_web_search_provider_types
    FOR EACH ROW
    EXECUTE FUNCTION update_amp_web_search_provider_types_updated_at();
