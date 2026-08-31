-- P2 影子列、回填结果与 slug 部分唯一索引必须保留。
-- 回滚请关闭 HARNESS_TENANT_SCOPE，不要 DROP COLUMN / 不要恢复全局 UNIQUE(slug)。
SELECT 1;
