CREATE TABLE IF NOT EXISTS auto_blog_configs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  article_type TEXT NOT NULL DEFAULT 'fond-technique',
  frequency TEXT NOT NULL DEFAULT 'daily',
  provider TEXT NOT NULL DEFAULT 'openai',
  model TEXT NOT NULL DEFAULT 'gpt-4o',
  author_name TEXT,
  author_role TEXT,
  author_references TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  last_generated_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auto_blog_configs_user ON auto_blog_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_blog_configs_status ON auto_blog_configs(status);
