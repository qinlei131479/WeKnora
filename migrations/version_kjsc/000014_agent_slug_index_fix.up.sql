-- 修正 amp_agents.slug 的唯一性口径。
--
-- 设计口径（000008）：slug 的唯一性按「目录行（tenant_id IS NULL）」与「租户内（tenant_id IS NOT NULL）」
-- 两个分区各自唯一，两条偏索引即可允许目录行与租户覆写行同 slug 并存。
-- 但 ensure_business_schema() 历史上以 CREATE UNIQUE INDEX 在 slug 上建了全局唯一索引，
-- 且每次 lifespan 启动都会重放，于是内置智能体保存（落租户级覆写行）必然撞唯一约束。
-- 这里把该索引还原成 000008 定义的非唯一索引，并清掉与 uq_amp_agents_* 重复的历史遗留索引对。

DROP INDEX IF EXISTS ix_amp_agents_slug;
CREATE INDEX IF NOT EXISTS ix_amp_agents_slug ON amp_agents(slug);

-- 两个分区的唯一性靠偏索引保证，实库缺失时补建。
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_slug_tenant ON amp_agents(tenant_id, slug) WHERE tenant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_amp_agents_slug_catalog ON amp_agents(slug) WHERE tenant_id IS NULL;

-- 与上面两条定义完全相同的历史遗留索引，只保留 amp_ 前缀这一套。
DROP INDEX IF EXISTS uq_agents_slug_tenant;
DROP INDEX IF EXISTS uq_agents_slug_catalog;

DO $$
BEGIN
    IF to_regclass('public.ix_amp_agents_slug') IS NOT NULL THEN
        COMMENT ON INDEX ix_amp_agents_slug IS '按智能体 slug 加速目录查询';
    END IF;
    IF to_regclass('public.uq_amp_agents_slug_tenant') IS NOT NULL THEN
        COMMENT ON INDEX uq_amp_agents_slug_tenant IS '同一空间内 slug 唯一';
    END IF;
    IF to_regclass('public.uq_amp_agents_slug_catalog') IS NOT NULL THEN
        COMMENT ON INDEX uq_amp_agents_slug_catalog IS '目录行 slug 唯一';
    END IF;
END;
$$;