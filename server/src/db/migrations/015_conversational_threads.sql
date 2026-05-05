ALTER TABLE social_comments ADD COLUMN agent_state TEXT DEFAULT NULL;
ALTER TABLE social_comments ADD COLUMN requires_human INTEGER DEFAULT 0;
