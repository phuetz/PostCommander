CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  target_keywords TEXT NOT NULL,
  campaign_goal TEXT NOT NULL,
  platform TEXT NOT NULL,
  daily_limit INTEGER NOT NULL DEFAULT 15,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS outreach_prospects (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  profile_bio TEXT NOT NULL,
  profile_url TEXT,
  status TEXT NOT NULL DEFAULT 'discovered',
  generated_message TEXT,
  sent_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_user ON outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_status ON outreach_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_campaign ON outreach_prospects(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_prospects_status ON outreach_prospects(status);
