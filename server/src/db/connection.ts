import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './migrate.js';
import * as schema from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DB_DIR, 'postcommander.db');

let sqlite: Database.Database | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

export function getDb(): Database.Database {
  if (!sqlite) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return sqlite;
}

export function getDrizzle(): BetterSQLite3Database<typeof schema> {
  if (!db) {
    throw new Error('Drizzle not initialized. Call initDb() first.');
  }
  return db;
}

export interface DbInstance {
  sqlite: Database.Database;
  db: BetterSQLite3Database<typeof schema>;
}

export function initDb(): DbInstance {
  // Ensure the data directory exists
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  sqlite = new Database(DB_PATH);

  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL');

  // Enable foreign keys
  sqlite.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations(sqlite);

  // Initialize Drizzle
  db = drizzle(sqlite, { schema });

  console.log(`Database initialized at ${DB_PATH}`);
  return { sqlite, db };
}

export function closeDb(): void {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
