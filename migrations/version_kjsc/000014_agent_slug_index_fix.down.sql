-- 回退到修复前的索引形态：slug 恢复全局唯一，清掉 000014 补建的分区偏索引。
--
-- 注意：如果修复上线后已经存在同 slug 的目录行与租户覆写行并存，重建全局唯一索引会失败。
-- 此时需人工确认这些重复 slug 应保留哪一条（目录行给未保存过的租户兜底，租户行是该租户的覆写），
-- 先合并或改写多余行的 slug，再执行本回退。

DROP INDEX IF EXISTS ix_amp_agents_slug;
DROP INDEX IF EXISTS uq_amp_agents_slug_tenant;
DROP INDEX IF EXISTS uq_amp_agents_slug_catalog;

CREATE UNIQUE INDEX IF NOT EXISTS ix_amp_agents_slug ON amp_agents(slug);

DO $$
BEGIN
    IF to_regclass('public.ix_amp_agents_slug') IS NOT NULL THEN
        COMMENT ON INDEX ix_amp_agents_slug IS '按智能体 slug 加速目录查询';
    END IF;
END;
$$;