import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getDrizzle } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations(): Promise<void> {
  const migrationsFolder = path.join(__dirname, '..', '..', 'drizzle');
  
  try {
    const db = getDrizzle();
    console.log('Running migrations...');
    await migrate(db as any, { migrationsFolder });
    console.log('Migrations complete.');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}
