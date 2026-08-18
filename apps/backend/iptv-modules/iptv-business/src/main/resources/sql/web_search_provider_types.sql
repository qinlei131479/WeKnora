-- 网络搜索提供商类型元数据表
CREATE TABLE IF NOT EXISTS web_search_provider_types (
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
COMMENT ON TABLE web_search_provider_types IS '网络搜索提供商类型元数据表';
COMMENT ON COLUMN web_search_provider_types.id IS '主键 ID';
COMMENT ON COLUMN web_search_provider_types.provider_type IS '提供商类型标识（如 bing, tavily, duckduckgo, baidu）';
COMMENT ON COLUMN web_search_provider_types.name IS '显示名称';
COMMENT ON COLUMN web_search_provider_types.requires_api_key IS '是否需要 API 密钥';
COMMENT ON COLUMN web_search_provider_types.supports_optional_api_key IS '是否支持可选 API 密钥（无密钥可用，有密钥可提升限额）';
COMMENT ON COLUMN web_search_provider_types.requires_engine_id IS '是否需要引擎 ID（如 Google CSE）';
COMMENT ON COLUMN web_search_provider_types.requires_base_url IS '是否需要用户提供 Base URL（如自托管 SearXNG）';
COMMENT ON COLUMN web_search_provider_types.supports_proxy IS '是否支持代理';
COMMENT ON COLUMN web_search_provider_types.description IS '提供商描述';
COMMENT ON COLUMN web_search_provider_types.docs_url IS '官方文档 URL';
COMMENT ON COLUMN web_search_provider_types.config_fields IS '配置字段定义（JSON 格式）';
COMMENT ON COLUMN web_search_provider_types.sort_order IS '排序顺序（数值越小越靠前）';
COMMENT ON COLUMN web_search_provider_types.enabled IS '是否启用';
COMMENT ON COLUMN web_search_provider_types.created_at IS '创建时间';
COMMENT ON COLUMN web_search_provider_types.updated_at IS '更新时间';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wspt_provider_type ON web_search_provider_types(provider_type);
CREATE INDEX IF NOT EXISTS idx_wspt_enabled ON web_search_provider_types(enabled);
CREATE INDEX IF NOT EXISTS idx_wspt_sort_order ON web_search_provider_types(sort_order);

-- 插入初始数据（4个提供商）
INSERT INTO web_search_provider_types (id, provider_type, name, requires_api_key, supports_optional_api_key, requires_engine_id, requires_base_url, supports_proxy, description, docs_url, config_fields, sort_order, enabled) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567801', 'duckduckgo', 'DuckDuckGo', FALSE, FALSE, FALSE, FALSE, TRUE, 'DuckDuckGo Search (free, no API key required)', 'https://duckduckgo.com/', '[]'::jsonb, 1, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567802', 'bing', 'Bing', TRUE, FALSE, FALSE, FALSE, TRUE, 'Bing Search API (requires API key from Azure)', 'https://learn.microsoft.com/en-us/bing/search-apis/bing-web-search/overview', '[]'::jsonb, 2, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567803', 'tavily', 'Tavily', TRUE, FALSE, FALSE, FALSE, TRUE, 'Tavily Search API (requires API key)', 'https://tavily.com/', '[]'::jsonb, 3, TRUE),
('a1b2c3d4-e5f6-7890-abcd-ef1234567804', 'baidu', 'Baidu', TRUE, FALSE, FALSE, FALSE, FALSE, 'Baidu AI Search (requires API key from Baidu Cloud)', 'https://cloud.baidu.com/doc/AppBuilder/s/qlvEcai0p', '[]'::jsonb, 4, TRUE);

-- 更新时间戳的触发器
CREATE OR REPLACE FUNCTION update_web_search_provider_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_web_search_provider_types_updated_at
    BEFORE UPDATE ON web_search_provider_types
    FOR EACH ROW
    EXECUTE FUNCTION update_web_search_provider_types_updated_at();
