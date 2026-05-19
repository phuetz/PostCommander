import pg from 'pg';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../../../../.env') });

const { Pool } = pg;

async function resetDatabase() {
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postcommander';

  console.log('Connecting to database...');
  const pool = new Pool({ connectionString });

  try {
    console.log('Dropping public schema...');
    await pool.query('DROP SCHEMA public CASCADE;');
    
    console.log('Recreating public schema...');
    await pool.query('CREATE SCHEMA public;');
    
    console.log('Database reset successful.');
  } catch (error) {
    console.error('Failed to reset database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

resetDatabase();
