-- 013_analytics_comments.sql
-- Add analytics columns to post_publications
ALTER TABLE post_publications ADD COLUMN views INTEGER DEFAULT 0;
ALTER TABLE post_publications ADD COLUMN likes INTEGER DEFAULT 0;
ALTER TABLE post_publications ADD COLUMN comments_count INTEGER DEFAULT 0;
ALTER TABLE post_publications ADD COLUMN shares INTEGER DEFAULT 0;
ALTER TABLE post_publications ADD COLUMN last_synced_at TEXT;

-- Create social_comments table
CREATE TABLE IF NOT EXISTS social_comments (
  id TEXT PRIMARY KEY NOT NULL,
  post_publication_id TEXT NOT NULL REFERENCES post_publications(id) ON DELETE CASCADE,
  platform_comment_id TEXT NOT NULL,
  author_name TEXT NOT NULL,
  author_handle TEXT,
  author_avatar_url TEXT,
  content TEXT NOT NULL,
  is_replied INTEGER DEFAULT 0,
  reply_content TEXT,
  published_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
