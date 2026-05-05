CREATE TABLE IF NOT EXISTS content_pillars (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3b82f6',
    topics TEXT, -- JSON array of subtopics
    posting_frequency TEXT DEFAULT 'weekly', -- daily, weekly, biweekly, monthly
    target_platforms TEXT, -- JSON array of platform IDs
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS content_ideas (
    id TEXT PRIMARY KEY,
    pillar_id TEXT NOT NULL REFERENCES content_pillars(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'idea', -- idea, drafted, scheduled, published
    post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
    priority INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ideas_pillar ON content_ideas(pillar_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON content_ideas(status);
