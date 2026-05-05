ALTER TABLE social_comments ADD COLUMN lead_score INTEGER DEFAULT NULL;
ALTER TABLE social_comments ADD COLUMN lead_status TEXT DEFAULT 'unscored';
ALTER TABLE social_comments ADD COLUMN lead_reason TEXT DEFAULT NULL;
