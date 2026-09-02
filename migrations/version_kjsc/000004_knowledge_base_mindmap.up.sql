-- Sidecar mindmap (replaces official 000084 columns on knowledge_bases).
CREATE TABLE IF NOT EXISTS knowledge_base_mindmaps (
    knowledge_base_id TEXT PRIMARY KEY,
    mindmap JSONB,
    mindmap_file_ids JSONB,
    mindmap_metadata JSONB,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'knowledge_bases'
          AND column_name = 'mindmap'
    ) THEN
        INSERT INTO knowledge_base_mindmaps (
            knowledge_base_id, mindmap, mindmap_file_ids, mindmap_metadata, updated_at
        )
        SELECT id, mindmap, mindmap_file_ids, mindmap_metadata, NOW()
        FROM knowledge_bases
        WHERE mindmap IS NOT NULL
           OR mindmap_file_ids IS NOT NULL
           OR mindmap_metadata IS NOT NULL
        ON CONFLICT (knowledge_base_id) DO UPDATE SET
            mindmap = EXCLUDED.mindmap,
            mindmap_file_ids = EXCLUDED.mindmap_file_ids,
            mindmap_metadata = EXCLUDED.mindmap_metadata,
            updated_at = NOW();
    END IF;
END $$;

ALTER TABLE knowledge_bases DROP COLUMN IF EXISTS mindmap_metadata;
ALTER TABLE knowledge_bases DROP COLUMN IF EXISTS mindmap_file_ids;
ALTER TABLE knowledge_bases DROP COLUMN IF EXISTS mindmap;
