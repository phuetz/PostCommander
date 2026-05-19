// Locale parity check : compares the key tree of every non-EN locale against
// EN (canonical) and emits a CSV of missing / extra keys per locale.
//
// Outputs:
//   audit/pocs/i18n/locale-parity.csv      — full diff
//   audit/pocs/i18n/locale-parity-summary.txt — per-locale stats
//
// Run from repo root: node audit/pocs/i18n/locale-parity.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const LOCALES_DIR = path.join(REPO, 'client', 'public', 'locales');

function flattenKeys(obj, prefix = '') {
  const keys = [];
  for (const [k, v] of Object.entries(obj ?? {})) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...flattenKeys(v, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function loadLocale(locale) {
  const dir = path.join(LOCALES_DIR, locale);
  if (!fs.existsSync(dir)) return null;
  // Each locale has 1+ JSON namespace files. Merge them under a `<namespace>.` prefix.
  const acc = {};
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const ns = file.replace(/\.json$/, '');
    try {
      acc[ns] = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (err) {
      console.warn(`[locale-parity] Failed to parse ${locale}/${file}: ${(err).message}`);
    }
  }
  return acc;
}

const locales = fs.readdirSync(LOCALES_DIR).filter((f) =>
  fs.statSync(path.join(LOCALES_DIR, f)).isDirectory(),
);

const canonical = loadLocale('en');
if (!canonical) {
  console.error('Canonical locale "en" not found');
  process.exit(1);
}
const canonicalKeys = new Set(flattenKeys(canonical));

const rows = [['locale', 'kind', 'key']];
const summary = [];

for (const locale of locales) {
  if (locale === 'en') continue;
  const data = loadLocale(locale);
  if (!data) {
    summary.push({ locale, status: 'missing-directory', missing: canonicalKeys.size, extra: 0 });
    continue;
  }
  const localeKeys = new Set(flattenKeys(data));
  const missing = [...canonicalKeys].filter((k) => !localeKeys.has(k));
  const extra = [...localeKeys].filter((k) => !canonicalKeys.has(k));
  for (const k of missing) rows.push([locale, 'missing', k]);
  for (const k of extra) rows.push([locale, 'extra', k]);
  summary.push({
    locale,
    status: 'ok',
    total: canonicalKeys.size,
    coverage: ((1 - missing.length / Math.max(1, canonicalKeys.size)) * 100).toFixed(1),
    missing: missing.length,
    extra: extra.length,
  });
}

const csvPath = path.join(__dirname, 'locale-parity.csv');
fs.writeFileSync(csvPath, rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n'));

const txtPath = path.join(__dirname, 'locale-parity-summary.txt');
const summaryTxt = [
  `Canonical locale: en (${canonicalKeys.size} keys)`,
  '',
  'Locale | Coverage | Missing | Extra',
  '-------|----------|---------|------',
  ...summary.map((s) =>
    s.status === 'ok'
      ? `${s.locale.padEnd(6)} | ${String(s.coverage + ' %').padStart(8)} | ${String(s.missing).padStart(7)} | ${String(s.extra).padStart(5)}`
      : `${s.locale.padEnd(6)} | (${s.status})`,
  ),
].join('\n');
fs.writeFileSync(txtPath, summaryTxt);

console.log(`Wrote ${csvPath}`);
console.log(`Wrote ${txtPath}`);
console.log('');
console.log(summaryTxt);
