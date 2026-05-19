// Scan client/src for JSX strings that look like user-facing text but aren't
// wrapped in t() / useTranslation(). Emits a CSV under audit/pocs/i18n/.
//
// Heuristic regex: capture 'Foo Bar' / "Foo Bar" / `Foo Bar` patterns starting
// with a capital letter, with 2+ words. Skips obvious code constructs (import
// specifiers, single-word imports, paths, CSS classes).
//
// Run from repo root: node audit/pocs/i18n/scan-hardcoded.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const SCAN_ROOT = path.join(REPO, 'client', 'src');

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist') continue;
      walk(full, acc);
    } else if (/\.(tsx|jsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

// Pattern: 2-word+ Capitalized strings between quotes. Excludes imports
// (handled by isLikelyUserFacing). Global flag for matchAll iteration.
const STRING_RE = /(['"`])([A-Z][a-z]+(?:[ -][A-Za-z][a-z]*){1,7})\1/g;

function isLikelyUserFacing(line) {
  if (/^\s*import\s/.test(line)) return false;
  if (/^\s*export\s.*from\s/.test(line)) return false;
  // Tailwind className lines: many class fragments with dashes
  if (/className\s*=\s*['"`]/.test(line) && /-[a-z]/.test(line)) return false;
  // Already inside an i18n fallback pattern: { key: '...', fallback: '...' }
  if (/\bfallback\s*:/.test(line)) return false;
  // Already inside a label/labelKey object property where the key drives i18n
  if (/\b(labelKey|titleKey|messageKey|nav\w*)\s*:/.test(line)) return false;
  // Demo/placeholder data assignments (useState defaults, etc.)
  if (/useState\s*\(\s*['"`]/.test(line)) return false;
  // Object literal key positions (line starts with quoted key followed by colon)
  if (/^\s*['"`][^'"`]+['"`]\s*:/.test(line)) return false;
  return true;
}

function isInsideTCall(line, matchIndex) {
  const before = line.slice(0, matchIndex);
  const lastT = before.lastIndexOf('t(');
  const lastClose = before.lastIndexOf(')');
  return lastT > lastClose;
}

const rows = [['file', 'line', 'text', 'snippet']];
let totalHits = 0;

for (const file of walk(SCAN_ROOT)) {
  const src = fs.readFileSync(file, 'utf8');
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!isLikelyUserFacing(line)) continue;
    for (const match of line.matchAll(STRING_RE)) {
      const text = match[2];
      const idx = match.index ?? 0;
      if (isInsideTCall(line, idx)) continue;
      if (!/ /.test(text)) continue;
      const rel = path.relative(REPO, file).replace(/\\/g, '/');
      rows.push([rel, String(i + 1), text, line.trim().slice(0, 200).replace(/,/g, ';')]);
      totalHits++;
    }
  }
}

const out = path.join(__dirname, 'hardcoded-strings.csv');
fs.writeFileSync(
  out,
  rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n'),
);

console.log(`Wrote ${out}`);
console.log(`Total hardcoded string candidates: ${totalHits}`);
console.log('');
console.log('--- TOP 20 BY FILE (highest hardcoded-string density) ---');
const byFile = new Map();
for (const r of rows.slice(1)) {
  byFile.set(r[0], (byFile.get(r[0]) ?? 0) + 1);
}
const sorted = Array.from(byFile.entries()).sort((a, b) => b[1] - a[1]).slice(0, 20);
for (const [f, n] of sorted) {
  console.log(`  ${n.toString().padStart(4)}  ${f}`);
}
