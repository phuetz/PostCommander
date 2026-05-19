#!/usr/bin/env node
/**
 * Backs up PostgreSQL database using pg_dump.
 *
 * Usage:
 *   node scripts/backup-db.mjs                 # writes one backup, prunes to 7
 *   node scripts/backup-db.mjs --keep 30       # keep 30 most recent
 *   node scripts/backup-db.mjs --out /mnt/x    # custom destination directory
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { config } from 'dotenv';

const execAsync = promisify(exec);

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

// Load environment variables for DATABASE_URL
config({ path: path.join(REPO_ROOT, '.env') });

function parseArgs(argv) {
  const args = { keep: 7, out: path.join(REPO_ROOT, 'backups') };
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--keep') args.keep = Number(argv[++i]);
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--help' || a === '-h') {
      console.log('Usage: node scripts/backup-db.mjs [--keep N] [--out DIR]');
      process.exit(0);
    } else {
      console.error(`Unknown arg: ${a}`);
      process.exit(2);
    }
  }
  if (!Number.isFinite(args.keep) || args.keep < 1) {
    console.error('--keep must be a positive integer');
    process.exit(2);
  }
  return args;
}

async function main() {
  const { keep, out } = parseArgs(process.argv);
  
  const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postcommander';

  fs.mkdirSync(out, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(out, `postcommander-${stamp}.sql`);

  try {
    console.log(`Starting backup to ${target}...`);
    // Execute pg_dump
    await execAsync(`pg_dump "${dbUrl}" -f "${target}"`);
  } catch (err) {
    console.error('pg_dump failed. Is PostgreSQL installed and available in PATH?');
    console.error(err.message);
    process.exit(1);
  }

  // Prune oldest beyond `keep` count.
  const existing = fs
    .readdirSync(out)
    .filter((name) => /^postcommander-.*\.sql$/.test(name))
    .map((name) => ({
      name,
      full: path.join(out, name),
      mtime: fs.statSync(path.join(out, name)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);

  const toDelete = existing.slice(keep);
  for (const f of toDelete) {
    try {
      fs.unlinkSync(f.full);
    } catch (err) {
      console.warn(`Could not prune ${f.name}: ${err.message}`);
    }
  }

  const sizeMb = (fs.statSync(target).size / (1024 * 1024)).toFixed(2);
  console.log(`Backup written: ${target} (${sizeMb} MB)`);
  console.log(
    `Retained ${Math.min(existing.length, keep)} of ${existing.length} backups (keep=${keep}).`,
  );
}

main().catch((err) => {
  console.error('Backup failed:', err);
  process.exit(1);
});
