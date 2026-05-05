import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function runMigrations(db: Database.Database): void {
  // Create the migrations tracking table
  db.exec(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const migrationsDir = path.join(__dirname, 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log('No migrations directory found, skipping migrations.');
    return;
  }

  // Read all .sql files sorted by name
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  if (files.length === 0) {
    console.log('No migration files found.');
    return;
  }

  // Get already-applied migrations
  const applied = new Set(
    db
      .prepare('SELECT name FROM _migrations')
      .all()
      .map((row) => (row as { name: string }).name),
  );

  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log('All migrations already applied.');
    return;
  }

  console.log(`Running ${pending.length} pending migration(s)...`);

  const insertMigration = db.prepare(
    'INSERT INTO _migrations (name) VALUES (?)',
  );

  for (const file of pending) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`  Applying: ${file}`);

    const runMigration = db.transaction(() => {
      db.exec(sql);
      insertMigration.run(file);
    });

    runMigration();
  }

  console.log('Migrations complete.');
}
