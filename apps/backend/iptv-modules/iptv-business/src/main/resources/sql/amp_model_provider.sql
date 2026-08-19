-- 模型厂商表
CREATE TABLE IF NOT EXISTS amp_model_provider (
                                                  id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    default_urls JSONB,
    model_types JSONB,
    requires_auth BOOLEAN DEFAULT TRUE,
    extra_fields JSONB,
    enabled BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

COMMENT ON TABLE amp_model_provider IS '模型厂商配置表';
COMMENT ON COLUMN amp_model_provider.name IS '厂商标识，如 openai, aliyun, zhipu';
COMMENT ON COLUMN amp_model_provider.display_name IS '显示名称，如 OpenAI, 阿里云 DashScope';
COMMENT ON COLUMN amp_model_provider.description IS '厂商描述，包含代表性模型';
COMMENT ON COLUMN amp_model_provider.default_urls IS 'JSON格式，按模型类型区分的默认URL，如 {"chat": "https://...", "embedding": "https://..."}';
COMMENT ON COLUMN amp_model_provider.model_types IS 'JSON格式，支持的模型类型列表，如 ["chat", "embedding", "rerank", "vllm", "asr"]';
COMMENT ON COLUMN amp_model_provider.requires_auth IS '是否需要API Key认证';
COMMENT ON COLUMN amp_model_provider.extra_fields IS 'JSON格式，额外配置字段定义，如 Azure OpenAI 的 api_version';
COMMENT ON COLUMN amp_model_provider.enabled IS '是否启用，false表示该厂商不可用';
COMMENT ON COLUMN amp_model_provider.sort_order IS '排序序号，用于前端展示顺序';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_amp_model_provider_name ON amp_model_provider(name);
CREATE INDEX IF NOT EXISTS idx_amp_model_provider_sort_order ON amp_model_provider(sort_order);

-- 插入所有模型厂商数据
-- 按照 Go 代码中 AllProviders() 的顺序插入
-- enabled 字段默认为 true，表示所有厂商默认启用

-- 1. Generic (自定义 OpenAI 兼容接口)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_generic',
           'generic',
           '自定义 (OpenAI兼容接口)',
           'Generic API endpoint (OpenAI-compatible)',
           '{}'::jsonb,
           '["chat", "embedding", "rerank", "vllm", "asr"]'::jsonb,
           false,
           NULL,
           true,
           0
       );

-- 2. WeKnoraCloud
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_weknoracloud',
           'weknoracloud',
           'WeKnoraCloud',
           'WeKnora云服务，模型：chat, embedding, rerank, vlm',
           '{"chat": "https://weknora.weixin.qq.com", "embedding": "https://weknora.weixin.qq.com", "rerank": "https://weknora.weixin.qq.com", "vllm": "https://weknora.weixin.qq.com"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           1
       );

-- 3. Aliyun (阿里云 DashScope)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_aliyun',
           'aliyun',
           '阿里云 DashScope',
           'qwen-plus, tongyi-embedding-vision-plus, qwen3-rerank, etc.',
           '{"chat": "https://dashscope.aliyuncs.com/compatible-mode/v1", "embedding": "https://dashscope.aliyuncs.com/compatible-mode/v1", "rerank": "https://dashscope.aliyuncs.com/api/v1/services/rerank/text-rerank/text-rerank", "vllm": "https://dashscope.aliyuncs.com/compatible-mode/v1"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           2
       );

-- 4. Zhipu (智谱 AI)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_zhipu',
           'zhipu',
           '智谱 BigModel',
           'glm-4.7, embedding-3, rerank, etc.',
           '{"chat": "https://open.bigmodel.cn/api/paas/v4", "embedding": "https://open.bigmodel.cn/api/paas/v4", "rerank": "https://open.bigmodel.cn/api/paas/v4/rerank", "vllm": "https://open.bigmodel.cn/api/paas/v4"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           3
       );

-- 5. Volcengine (火山引擎)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_volcengine',
           'volcengine',
           '火山引擎 Volcengine',
           'doubao-1-5-pro-32k-250115, doubao-embedding-vision-250615, doubao-seed-rerank, etc.',
           '{"chat": "https://ark.cn-beijing.volces.com/api/v3", "embedding": "https://ark.cn-beijing.volces.com/api/v3/embeddings/multimodal", "rerank": "https://api-knowledgebase.mlp.cn-beijing.volces.com", "vllm": "https://ark.cn-beijing.volces.com/api/v3"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           4
       );

-- 6. Hunyuan (腾讯混元)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_hunyuan',
           'hunyuan',
           '腾讯混元 Hunyuan',
           'hunyuan-pro, hunyuan-standard, hunyuan-embedding, etc.',
           '{"chat": "https://api.hunyuan.cloud.tencent.com/v1", "embedding": "https://api.hunyuan.cloud.tencent.com/v1"}'::jsonb,
           '["chat", "embedding"]'::jsonb,
           true,
           NULL,
           true,
           5
       );

-- 7. SiliconFlow (硅基流动)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_siliconflow',
           'siliconflow',
           '硅基流动 SiliconFlow',
           'deepseek-ai/DeepSeek-V3.1, etc.',
           '{"chat": "https://api.siliconflow.cn/v1", "embedding": "https://api.siliconflow.cn/v1", "rerank": "https://api.siliconflow.cn/v1", "vllm": "https://api.siliconflow.cn/v1", "asr": "https://api.siliconflow.cn/v1"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm", "asr"]'::jsonb,
           true,
           NULL,
           true,
           6
       );

-- 8. DeepSeek
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_deepseek',
           'deepseek',
           'DeepSeek',
           'deepseek-chat, deepseek-reasoner, etc.',
           '{"chat": "https://api.deepseek.com/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           7
       );

-- 9. MiniMax
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_minimax',
           'minimax',
           'MiniMax',
           'MiniMax-M3, MiniMax-M2.7, MiniMax-M2.7-highspeed, etc.',
           '{"chat": "https://api.minimaxi.com/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           8
       );

-- 10. Moonshot (月之暗面)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_moonshot',
           'moonshot',
           '月之暗面 Moonshot',
           'kimi-k2-turbo-preview, moonshot-v1-8k-vision-preview, etc.',
           '{"chat": "https://api.moonshot.ai/v1", "vllm": "https://api.moonshot.ai/v1"}'::jsonb,
           '["chat", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           9
       );

-- 11. ModelScope (魔搭)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_modelscope',
           'modelscope',
           '魔搭 ModelScope',
           'Qwen/Qwen3-8B, Qwen/Qwen3-Embedding-8B, etc.',
           '{"chat": "https://api-inference.modelscope.cn/v1", "embedding": "https://api-inference.modelscope.cn/v1", "vllm": "https://api-inference.modelscope.cn/v1"}'::jsonb,
           '["chat", "embedding", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           10
       );

-- 12. Qianfan (百度千帆)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_qianfan',
           'qianfan',
           '百度千帆 Baidu Cloud',
           'ernie-5.0-thinking-preview, embedding-v1, bce-reranker-base, etc.',
           '{"chat": "https://qianfan.baidubce.com/v2", "embedding": "https://qianfan.baidubce.com/v2", "rerank": "https://qianfan.baidubce.com/v2", "vllm": "https://qianfan.baidubce.com/v2"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           11
       );

-- 13. Qiniu (七牛云)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_qiniu',
           'qiniu',
           '七牛云 Qiniu',
           'deepseek/deepseek-v3.2-251201, z-ai/glm-4.7, etc.',
           '{"chat": "https://api.qnaigc.com/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           12
       );

-- 14. OpenAI
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_openai',
           'openai',
           'OpenAI',
           'gpt-5.2, gpt-5-mini, etc.',
           '{"chat": "https://api.openai.com/v1", "embedding": "https://api.openai.com/v1", "rerank": "https://api.openai.com/v1", "vllm": "https://api.openai.com/v1", "asr": "https://api.openai.com/v1"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm", "asr"]'::jsonb,
           true,
           NULL,
           true,
           13
       );

-- 15. Anthropic
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_anthropic',
           'anthropic',
           'Anthropic',
           'Claude models via native Anthropic Messages API',
           '{"chat": "https://api.anthropic.com/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           14
       );

-- 16. Gemini (Google)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_gemini',
           'gemini',
           'Google Gemini',
           'gemini-3-flash-preview, gemini-2.5-pro, gemini-embedding-2, etc.',
           '{"chat": "https://generativelanguage.googleapis.com/v1beta/openai", "embedding": "https://generativelanguage.googleapis.com/v1beta"}'::jsonb,
           '["chat", "embedding"]'::jsonb,
           true,
           NULL,
           true,
           15
       );

-- 17. OpenRouter
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_openrouter',
           'openrouter',
           'OpenRouter',
           'openai/gpt-5.2-chat, google/gemini-3-flash-preview, etc.',
           '{"chat": "https://openrouter.ai/api/v1", "embedding": "https://openrouter.ai/api/v1", "vllm": "https://openrouter.ai/api/v1"}'::jsonb,
           '["chat", "embedding", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           16
       );

-- 18. Requesty
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_requesty',
           'requesty',
           'Requesty',
           'openai/gpt-4o-mini, anthropic/claude-sonnet-4-5, etc.',
           '{"chat": "https://router.requesty.ai/v1", "embedding": "https://router.requesty.ai/v1", "vllm": "https://router.requesty.ai/v1"}'::jsonb,
           '["chat", "embedding", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           17
       );

-- 19. Jina
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_jina',
           'jina',
           'Jina',
           'jina-clip-v1, jina-embeddings-v2-base-zh, etc.',
           '{"embedding": "https://api.jina.ai/v1", "rerank": "https://api.jina.ai/v1"}'::jsonb,
           '["embedding", "rerank"]'::jsonb,
           true,
           NULL,
           true,
           18
       );

-- 20. Mimo (小米)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_mimo',
           'mimo',
           '小米 MiMo',
           'mimo-v2-flash',
           '{"chat": "https://api.xiaomimimo.com/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           19
       );

-- 21. LongCat
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_longcat',
           'longcat',
           'LongCat AI',
           'LongCat-Flash-Chat, LongCat-Flash-Thinking, etc.',
           '{"chat": "https://api.longcat.chat/openai/v1"}'::jsonb,
           '["chat"]'::jsonb,
           true,
           NULL,
           true,
           20
       );

-- 22. LKEAP (腾讯云知识引擎)
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_lkeap',
           'lkeap',
           '腾讯云 LKEAP',
           'DeepSeek-R1, DeepSeek-V3, lke-reranker-base 等',
           '{"chat": "https://api.lkeap.cloud.tencent.com/v1", "rerank": "https://lkeap.tencentcloudapi.com"}'::jsonb,
           '["chat", "rerank"]'::jsonb,
           true,
           NULL,
           true,
           21
       );

-- 23. GPUStack
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_gpustack',
           'gpustack',
           'GPUStack',
           'Choose your deployed model on GPUStack',
           '{"chat": "http://your_gpustack_server_url/v1-openai", "embedding": "http://your_gpustack_server_url/v1-openai", "rerank": "http://your_gpustack_server_url/v1", "vllm": "http://your_gpustack_server_url/v1-openai", "asr": "http://your_gpustack_server_url/v1-openai"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm", "asr"]'::jsonb,
           true,
           NULL,
           true,
           22
       );

-- 24. Nvidia
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_nvidia',
           'nvidia',
           'NVIDIA',
           'deepseek-ai-deepseek-v3_1, nv-embed-v1, rerank-qa-mistral-4b, etc.',
           '{"chat": "https://integrate.api.nvidia.com/v1", "embedding": "https://integrate.api.nvidia.com/v1", "rerank": "https://ai.api.nvidia.com/v1/retrieval/nvidia/reranking", "vllm": "https://integrate.api.nvidia.com/v1"}'::jsonb,
           '["chat", "embedding", "rerank", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           23
       );

-- 25. Novita
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_novita',
           'novita',
           'Novita AI',
           'moonshotai/kimi-k2.5, zai-org/glm-5, minimax/minimax-m2.7, qwen/qwen3-embedding-0.6b, etc.',
           '{"chat": "https://api.novita.ai/openai/v1", "embedding": "https://api.novita.ai/openai/v1", "vllm": "https://api.novita.ai/openai/v1"}'::jsonb,
           '["chat", "embedding", "vllm"]'::jsonb,
           true,
           NULL,
           true,
           24
       );

-- 26. Azure OpenAI
INSERT INTO amp_model_provider (id, name, display_name, description, default_urls, model_types, requires_auth, extra_fields, enabled, sort_order)
VALUES (
           'provider_azure_openai',
           'azure_openai',
           'Azure OpenAI',
           'gpt-4o, gpt-4, text-embedding-ada-002, etc.',
           '{"chat": "https://{resource}.openai.azure.com", "embedding": "https://{resource}.openai.azure.com", "rerank": "https://{resource}.openai.azure.com", "vllm": "https://{resource}.openai.azure.com", "asr": "https://{resource}.openai.azure.com"}'::jsonb,
           '["chat", "embedding", "vllm", "asr"]'::jsonb,
           true,
           '[{"key": "api_version", "label": "API Version", "type": "string", "required": false, "default": "2024-10-21", "placeholder": "e.g. 2024-10-21"}]'::jsonb,
           true,
           25
       );
