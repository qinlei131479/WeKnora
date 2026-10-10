ALTER TABLE amp_agents
    ADD COLUMN IF NOT EXISTS is_builtin BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE amp_agents
SET is_builtin = TRUE
WHERE slug IN (
    'default-chatbot',
    'general-purpose',
    'web-search',
    'research-explorer',
    'fact-verifier',
    'deep-research',
    'quote'
);

COMMENT ON COLUMN amp_agents.is_builtin IS '是否内置智能体';
