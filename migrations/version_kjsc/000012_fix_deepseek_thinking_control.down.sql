-- 按本次清理口径回补旧行为。若迁移上线后新增了同名模型，回退会一并影响，
-- 需人工核对这些新增行是否确实需要 thinking_control=none。

UPDATE models
SET parameters = jsonb_set(
        parameters,
        '{extra_config,thinking_control}',
        '"none"',
        true
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE name IN ('deepseek-v4-pro', 'deepseek-v4-flash')
  AND parameters->'extra_config' IS NOT NULL
  AND NOT (parameters->'extra_config' ? 'thinking_control');
