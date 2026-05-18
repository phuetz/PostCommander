import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { config } from '../config/env.js';
import * as schema from './schema.js';

let pool: pg.Pool | null = null;
let db: NodePgDatabase<typeof schema> | null = null;

export function getDb(): pg.Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return pool;
}

export function getDrizzle(): NodePgDatabase<typeof schema> {
  if (!db) {
    throw new Error('Drizzle not initialized. Call initDb() first.');
  }
  return db;
}

export interface DbInstance {
  pool: pg.Pool;
  db: NodePgDatabase<typeof schema>;
}

export function initDb(): DbInstance {
  const connectionString = config.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postcommander';

  pool = new pg.Pool({
    connectionString,
    max: 20, // Max number of connections in the pool
  });

  db = drizzle(pool, { schema });

  console.log(`Database initialized with connection to ${connectionString.split('@')[1]}`);
  return { pool, db };
}

export async function closeDb(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}
