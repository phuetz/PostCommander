#!/usr/bin/env node
/**
 * Backs up server/data/postcommander.db using SQLite's online backup API
 * (better-sqlite3's `db.backup()`), which is safe to run while the server is
 * writing — unlike a plain file copy, which can capture a torn -wal/-shm pair.
 *
 * Usage:
 *   node scripts/backup-db.mjs                 # writes one backup, prunes to 7
 *   node scripts/backup-db.mjs --keep 30       # keep 30 most recent
 *   node scripts/backup-db.mjs --out /mnt/x    # custom destination directory
 *
 * Schedule via cron / Task Scheduler. Exits non-zero on failure so the
 * scheduler can alert.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const DB_PATH = path.join(REPO_ROOT, 'server', 'data', 'postcommander.db');

function parseArgs(argv) {
  const args = { keep: 7, out: path.join(REPO_ROOT, 'server', 'data', 'backups') };
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

  if (!fs.existsSync(DB_PATH)) {
    console.error(`No database found at ${DB_PATH} — nothing to back up.`);
    process.exit(1);
  }

  fs.mkdirSync(out, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(out, `postcommander-${stamp}.db`);

  // Lazy require so this script can be run without installing devDependencies
  // in a minimal ops container, as long as @postcommander/server is installed.
  let Database;
  try {
    Database = require('better-sqlite3');
  } catch (err) {
    console.error('better-sqlite3 not installed — run `npm install` first.');
    console.error(err.message);
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  try {
    await db.backup(target);
  } finally {
    db.close();
  }

  // Prune oldest beyond `keep` count.
  const existing = fs
    .readdirSync(out)
    .filter((name) => /^postcommander-.*\.db$/.test(name))
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
