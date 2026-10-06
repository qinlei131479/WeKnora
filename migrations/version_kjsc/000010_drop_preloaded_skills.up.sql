-- skills/preloaded 预置技能已随上游 0.8.2 退役（目录删除 + harness 不再播种）。
-- 本迁移清理历史启动时 init_builtin_skills 播种进技能库的内置行：
--   tenant_skill_catalog 中 tenant_id = 0 且 id 为 preloaded slug 的记录。
-- 只删数据不删表；这些行的 storage bundle 对象成为孤儿，按 000006 先例不做清理。
-- 数据删除不可逆，禁止 migrate down（同 000006 口径，不提供 down 文件）。

DO $$
BEGIN
    IF to_regclass('public.tenant_skill_catalog') IS NULL THEN
        RETURN;
    END IF;

    DELETE FROM tenant_skill_catalog
     WHERE tenant_id = 0
       AND id IN (
           'citation-generator',
           'data-processor',
           'doc-coauthoring',
           'document-analyzer',
           'openmaic-classroom'
       );
END $$;
