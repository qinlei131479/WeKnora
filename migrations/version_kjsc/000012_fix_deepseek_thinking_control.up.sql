-- 清理 DeepSeek V4 行内残留的旧思考控制覆盖值。
-- 该值会压制模型目录返回的思考强度档位，删除后运行时重新读取目录默认能力。

UPDATE models
SET parameters = parameters #- '{extra_config,thinking_control}',
    updated_at = CURRENT_TIMESTAMP
WHERE name IN ('deepseek-v4-pro', 'deepseek-v4-flash')
  AND parameters->'extra_config'->>'thinking_control' = 'none';
