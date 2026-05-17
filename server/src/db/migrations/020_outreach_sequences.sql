ALTER TABLE outreach_campaigns ADD COLUMN target_activity TEXT;

CREATE TABLE IF NOT EXISTS outreach_sequence_steps (
    id TEXT PRIMARY KEY,
    campaign_id TEXT NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    delay_days INTEGER NOT NULL DEFAULT 0,
    prompt_template TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outreach_sequence_steps_campaign ON outreach_sequence_steps(campaign_id);

ALTER TABLE outreach_prospects ADD COLUMN reply_status TEXT NOT NULL DEFAULT 'none';
ALTER TABLE outreach_prospects ADD COLUMN current_step_number INTEGER NOT NULL DEFAULT 1;
ALTER TABLE outreach_prospects ADD COLUMN thread_context TEXT DEFAULT '[]';
ALTER TABLE outreach_prospects ADD COLUMN last_contacted_at TEXT;

CREATE INDEX IF NOT EXISTS idx_outreach_prospects_reply ON outreach_prospects(reply_status);

CREATE TABLE IF NOT EXISTS outreach_replies (
    id TEXT PRIMARY KEY,
    prospect_id TEXT NOT NULL REFERENCES outreach_prospects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    received_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outreach_replies_prospect ON outreach_replies(prospect_id);
