-- Knowledge-base mindmap (yuxi get_mindmap moved to WeKnora).
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS mindmap JSONB;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS mindmap_file_ids JSONB;
ALTER TABLE knowledge_bases ADD COLUMN IF NOT EXISTS mindmap_metadata JSONB;
