CREATE TABLE IF NOT EXISTS viral_posts (
    id TEXT PRIMARY KEY,
    platform TEXT NOT NULL,
    content TEXT NOT NULL,
    author_name TEXT,
    author_handle TEXT,
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    category TEXT,
    tags TEXT, -- JSON array
    language TEXT DEFAULT 'en',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'startup', 'coaching', 'recruiting', 'personal-brand', 'saas', 'freelance', 'ecommerce', 'tech'
    platform TEXT,
    tone TEXT,
    prompt_template TEXT NOT NULL,
    example_output TEXT,
    uses_count INTEGER DEFAULT 0,
    language TEXT DEFAULT 'en',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS writing_styles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    sample_posts TEXT NOT NULL, -- JSON array of sample posts
    analyzed_style TEXT, -- JSON: { vocabulary, sentenceLength, emojiUsage, hashtagStyle, toneProfile }
    llm_system_prompt TEXT, -- Generated system prompt to replicate this style
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS generated_images (
    id TEXT PRIMARY KEY,
    post_id TEXT REFERENCES posts(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'openai' (dall-e), 'stability'
    image_url TEXT,
    image_path TEXT, -- local storage path
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_viral_platform ON viral_posts(platform);
CREATE INDEX IF NOT EXISTS idx_viral_category ON viral_posts(category);
CREATE INDEX IF NOT EXISTS idx_templates_category ON templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_platform ON templates(platform);
CREATE INDEX IF NOT EXISTS idx_styles_name ON writing_styles(name);
