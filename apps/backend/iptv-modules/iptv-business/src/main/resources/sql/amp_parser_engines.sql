-- =====================================================================
-- 文档解析引擎表（amp_parser_engines）
-- 存储本地注册的解析引擎定义，与 Go 代码 engine_registry.go 中的
-- 7 个本地引擎一一对应。远程引擎（如 markitdown、opendataloader）
-- 通过 gRPC 直连 docreader 服务动态发现，不在此表中存储。
-- =====================================================================

DROP TABLE IF EXISTS amp_parser_engines;

CREATE TABLE amp_parser_engines (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(64)  NOT NULL,
    description     VARCHAR(255) NOT NULL DEFAULT '',
    file_types      JSONB        NOT NULL DEFAULT '[]',
    check_type      VARCHAR(32)  NOT NULL DEFAULT 'none',
    config_key      VARCHAR(64)  NOT NULL DEFAULT '',
    sort_order      INT          NOT NULL DEFAULT 0,
    enabled         BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_amp_parser_engines_name UNIQUE (name)
);

COMMENT ON TABLE amp_parser_engines IS '文档解析引擎表';
COMMENT ON COLUMN amp_parser_engines.id IS '主键 ID';
COMMENT ON COLUMN amp_parser_engines.name IS '引擎名称（唯一标识）';
COMMENT ON COLUMN amp_parser_engines.description IS '引擎描述';
COMMENT ON COLUMN amp_parser_engines.file_types IS '支持的文件类型列表（JSON 数组）';
COMMENT ON COLUMN amp_parser_engines.check_type IS '可用性检测方式：none-无需检测/docreader-依赖DocReader连接/config-仅检查配置项存在/http_ping-HTTP探测';
COMMENT ON COLUMN amp_parser_engines.config_key IS '检测所需的租户配置项名称（check_type=config/http_ping 时使用）';
COMMENT ON COLUMN amp_parser_engines.sort_order IS '排序序号';
COMMENT ON COLUMN amp_parser_engines.enabled IS '是否启用';
COMMENT ON COLUMN amp_parser_engines.created_at IS '创建时间';
COMMENT ON COLUMN amp_parser_engines.updated_at IS '更新时间';

-- =====================================================================
-- 初始化数据：7 个本地引擎（与 Go engine_registry.go 保持一致）
-- =====================================================================

INSERT INTO amp_parser_engines (name, description, file_types, check_type, config_key, sort_order) VALUES
('builtin', 'DocReader built-in parser engine',
 '["docx","doc","pdf","md","markdown","xlsx","xls","epub","html","htm","mhtml","jpg","jpeg","png","gif","bmp","tiff","webp","mp3","wav","m4a","flac","ogg"]',
 'docreader', '', 1),
('simple', 'Simple format & image parsing (no external service required)',
 '["md","markdown","txt","csv","json","jpg","jpeg","png","gif","bmp","tiff","webp","mp3","wav","m4a","flac","ogg"]',
 'none', '', 2),
('weknoracloud', 'WeKnoraCloud document reader',
 '["docx","doc","pdf","md","markdown","xlsx","xls","pptx","ppt"]',
 'config', 'weknoracloud_app_id', 3),
('mineru', 'MinerU self-hosted service',
 '["pdf","jpg","jpeg","png","bmp","tiff","doc","docx","ppt","pptx"]',
 'http_ping', 'mineru_endpoint', 4),
('mineru_cloud', 'MinerU Cloud API',
 '["pdf","jpg","jpeg","png","bmp","tiff","doc","docx","ppt","pptx"]',
 'http_ping', 'mineru_api_key', 5),
('paddleocr_vl', 'PaddleOCR-VL self-hosted service',
 '["pdf","jpg","jpeg","png","bmp","tiff"]',
 'http_ping', 'paddleocr_vl_endpoint', 6),
('paddleocr_vl_cloud', 'PaddleOCR-VL Cloud API',
 '["pdf","jpg","jpeg","png","bmp","tiff"]',
 'config', 'paddleocr_vl_cloud_token', 7);
