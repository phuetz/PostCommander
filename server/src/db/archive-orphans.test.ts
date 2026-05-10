import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationPath = path.join(__dirname, 'migrations', '008_archive_orphaned_user_data.sql');

function getCount(db: Database.Database, table: string): number {
  const row = db.prepare(`SELECT count(*) as count FROM ${table}`).get() as { count: number };
  return Number(row.count);
}

describe('008_archive_orphaned_user_data.sql', () => {
  it('archives rows with null user_id and removes them from active tables', () => {
    const db = new Database(':memory:');

    db.exec(`
      CREATE TABLE settings (id TEXT, user_id TEXT, key TEXT, value TEXT, updated_at TEXT);
      CREATE TABLE platform_connections (id TEXT, user_id TEXT, platform TEXT, account_name TEXT, access_token TEXT);
      CREATE TABLE posts (id TEXT, user_id TEXT, content TEXT);
      CREATE TABLE writing_styles (id TEXT, user_id TEXT, name TEXT);
      CREATE TABLE generated_images (id TEXT, user_id TEXT, prompt TEXT);
      CREATE TABLE content_pillars (id TEXT, user_id TEXT, name TEXT);
      CREATE TABLE content_ideas (id TEXT, user_id TEXT, title TEXT);

      INSERT INTO settings VALUES ('s1', NULL, 'legacy', 'value', '2026-01-01');
      INSERT INTO settings VALUES ('s2', 'user-1', 'owned', 'value', '2026-01-01');

      INSERT INTO platform_connections VALUES ('pc1', NULL, 'linkedin', 'Legacy', 'token');
      INSERT INTO platform_connections VALUES ('pc2', 'user-1', 'twitter', 'Owned', 'token');

      INSERT INTO posts VALUES ('p1', NULL, 'legacy post');
      INSERT INTO posts VALUES ('p2', 'user-1', 'owned post');

      INSERT INTO writing_styles VALUES ('ws1', NULL, 'legacy style');
      INSERT INTO writing_styles VALUES ('ws2', 'user-1', 'owned style');

      INSERT INTO generated_images VALUES ('gi1', NULL, 'legacy image');
      INSERT INTO generated_images VALUES ('gi2', 'user-1', 'owned image');

      INSERT INTO content_pillars VALUES ('cp1', NULL, 'legacy pillar');
      INSERT INTO content_pillars VALUES ('cp2', 'user-1', 'owned pillar');

      INSERT INTO content_ideas VALUES ('ci1', NULL, 'legacy idea');
      INSERT INTO content_ideas VALUES ('ci2', 'user-1', 'owned idea');
    `);

    db.exec(fs.readFileSync(migrationPath, 'utf8'));

    expect(getCount(db, 'settings')).toBe(1);
    expect(getCount(db, 'platform_connections')).toBe(1);
    expect(getCount(db, 'posts')).toBe(1);
    expect(getCount(db, 'writing_styles')).toBe(1);
    expect(getCount(db, 'generated_images')).toBe(1);
    expect(getCount(db, 'content_pillars')).toBe(1);
    expect(getCount(db, 'content_ideas')).toBe(1);

    expect(getCount(db, 'orphaned_settings')).toBe(1);
    expect(getCount(db, 'orphaned_platform_connections')).toBe(1);
    expect(getCount(db, 'orphaned_posts')).toBe(1);
    expect(getCount(db, 'orphaned_writing_styles')).toBe(1);
    expect(getCount(db, 'orphaned_generated_images')).toBe(1);
    expect(getCount(db, 'orphaned_content_pillars')).toBe(1);
    expect(getCount(db, 'orphaned_content_ideas')).toBe(1);

    const archivedSetting = db
      .prepare('SELECT id, user_id, archived_at FROM orphaned_settings LIMIT 1')
      .get() as { id: string; user_id: string | null; archived_at: string };

    expect(archivedSetting.id).toBe('s1');
    expect(archivedSetting.user_id).toBeNull();
    expect(archivedSetting.archived_at).toBeTruthy();
  });
});
