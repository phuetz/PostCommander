PRAGMA foreign_keys = OFF;

ALTER TABLE settings RENAME TO settings_legacy;

CREATE TABLE settings (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO settings (id, user_id, key, value, updated_at)
SELECT lower(hex(randomblob(16))), NULL, key, value, updated_at
FROM settings_legacy;

DROP TABLE settings_legacy;

ALTER TABLE platform_connections ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE writing_styles ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE generated_images ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE content_pillars ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE content_ideas ADD COLUMN user_id TEXT REFERENCES users(id) ON DELETE CASCADE;

UPDATE content_ideas
SET user_id = (
    SELECT content_pillars.user_id
    FROM content_pillars
    WHERE content_pillars.id = content_ideas.pillar_id
)
WHERE user_id IS NULL;

UPDATE generated_images
SET user_id = (
    SELECT posts.user_id
    FROM posts
    WHERE posts.id = generated_images.post_id
)
WHERE user_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_settings_user ON settings(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_user_key ON settings(user_id, key);
CREATE INDEX IF NOT EXISTS idx_platform_connections_user ON platform_connections(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_platform_connections_user_platform
    ON platform_connections(user_id, platform)
    WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_posts_user ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_styles_user ON writing_styles(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_user ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS idx_content_pillars_user ON content_pillars(user_id);
CREATE INDEX IF NOT EXISTS idx_content_ideas_user ON content_ideas(user_id);

PRAGMA foreign_keys = ON;
