CREATE TABLE IF NOT EXISTS orphaned_settings AS
SELECT *, datetime('now') AS archived_at
FROM settings
WHERE 0;

INSERT INTO orphaned_settings
SELECT *, datetime('now') AS archived_at
FROM settings
WHERE user_id IS NULL;

DELETE FROM settings
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_platform_connections AS
SELECT *, datetime('now') AS archived_at
FROM platform_connections
WHERE 0;

INSERT INTO orphaned_platform_connections
SELECT *, datetime('now') AS archived_at
FROM platform_connections
WHERE user_id IS NULL;

DELETE FROM platform_connections
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_posts AS
SELECT *, datetime('now') AS archived_at
FROM posts
WHERE 0;

INSERT INTO orphaned_posts
SELECT *, datetime('now') AS archived_at
FROM posts
WHERE user_id IS NULL;

DELETE FROM posts
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_writing_styles AS
SELECT *, datetime('now') AS archived_at
FROM writing_styles
WHERE 0;

INSERT INTO orphaned_writing_styles
SELECT *, datetime('now') AS archived_at
FROM writing_styles
WHERE user_id IS NULL;

DELETE FROM writing_styles
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_generated_images AS
SELECT *, datetime('now') AS archived_at
FROM generated_images
WHERE 0;

INSERT INTO orphaned_generated_images
SELECT *, datetime('now') AS archived_at
FROM generated_images
WHERE user_id IS NULL;

DELETE FROM generated_images
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_content_pillars AS
SELECT *, datetime('now') AS archived_at
FROM content_pillars
WHERE 0;

INSERT INTO orphaned_content_pillars
SELECT *, datetime('now') AS archived_at
FROM content_pillars
WHERE user_id IS NULL;

DELETE FROM content_pillars
WHERE user_id IS NULL;

CREATE TABLE IF NOT EXISTS orphaned_content_ideas AS
SELECT *, datetime('now') AS archived_at
FROM content_ideas
WHERE 0;

INSERT INTO orphaned_content_ideas
SELECT *, datetime('now') AS archived_at
FROM content_ideas
WHERE user_id IS NULL;

DELETE FROM content_ideas
WHERE user_id IS NULL;
