-- 012_workspaces.sql
-- Create workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create workspace_members table
CREATE TABLE IF NOT EXISTS workspace_members (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_members_user ON workspace_members (workspace_id, user_id);

-- Add workspace_id to existing tables
ALTER TABLE platform_connections ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE posts ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE settings ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE writing_styles ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE content_pillars ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE content_ideas ADD COLUMN workspace_id TEXT REFERENCES workspaces(id) ON DELETE CASCADE;

-- Create default workspaces for existing users
-- Note: better-sqlite3 doesn't easily support uuid() inside pure SQL without custom functions, 
-- but we can handle the data migration inside the application startup or using hex(randomblob(16)).
INSERT INTO workspaces (id, name, owner_id)
SELECT 
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  'Personal Workspace',
  id
FROM users;

-- Add users as owners to their personal workspaces
INSERT INTO workspace_members (id, workspace_id, user_id, role)
SELECT 
  lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-a' || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))),
  w.id,
  u.id,
  'owner'
FROM users u
JOIN workspaces w ON w.owner_id = u.id;

-- Assign all existing orphaned data to the personal workspace of the owner
UPDATE platform_connections SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = platform_connections.user_id) WHERE workspace_id IS NULL;
UPDATE posts SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = posts.user_id) WHERE workspace_id IS NULL;
UPDATE settings SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = settings.user_id) WHERE workspace_id IS NULL;
UPDATE writing_styles SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = writing_styles.user_id) WHERE workspace_id IS NULL;
UPDATE content_pillars SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = content_pillars.user_id) WHERE workspace_id IS NULL;
UPDATE content_ideas SET workspace_id = (SELECT id FROM workspaces WHERE owner_id = content_ideas.user_id) WHERE workspace_id IS NULL;
