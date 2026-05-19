// Coverage scan of Zod validation across all server routes.
// Scans server/src/routes/*.ts files, extracts every router.METHOD(path, ...handlers)
// declaration, and reports whether validate(...) or validateQuery(...) appears
// in the handler chain.
//
// Outputs:
//   - audit/pocs/injection/zod-coverage.csv         (one row per route)
//   - audit/pocs/injection/zod-coverage-summary.json (aggregates)
//
// Run from repo root: node audit/pocs/injection/zod-coverage.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..', '..');
const ROUTES_DIR = path.join(REPO, 'server', 'src', 'routes');

function listRouteFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts') && f !== 'index.ts');
}

const ROUTE_RE = /router\.(get|post|put|patch|delete)\s*\(\s*(['"`])([^'"`]+)\2\s*,([\s\S]*?)\);/g;

const rows = [];
const summary = {
  totalRoutes: 0,
  byMethod: {},
  mutatingTotal: 0,
  mutatingValidated: 0,
  mutatingMissing: [],
  publicMutating: [],
  perFile: {},
};

for (const file of listRouteFiles(ROUTES_DIR)) {
  const full = path.join(ROUTES_DIR, file);
  const src = fs.readFileSync(full, 'utf8');

  let match;
  while ((match = ROUTE_RE.exec(src)) !== null) {
    const method = match[1].toUpperCase();
    const route = match[3];
    const chain = match[4];
    const hasValidate = /\bvalidate\s*\(/.test(chain) || /\bvalidateQuery\s*\(/.test(chain);
    const hasAuth = /authMiddleware|requireAuth|requireAdmin/.test(chain);
    const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    rows.push({ file, method, route, mutating, hasValidate, hasAuth });

    summary.totalRoutes++;
    summary.byMethod[method] = (summary.byMethod[method] ?? 0) + 1;
    summary.perFile[file] = summary.perFile[file] ?? { total: 0, mutating: 0, validated: 0, unauth: 0 };
    summary.perFile[file].total++;
    if (mutating) {
      summary.mutatingTotal++;
      summary.perFile[file].mutating++;
      if (hasValidate) {
        summary.mutatingValidated++;
        summary.perFile[file].validated++;
      } else {
        summary.mutatingMissing.push(`${method} ${route}  (${file})`);
      }
      if (!hasAuth) {
        summary.publicMutating.push(`${method} ${route}  (${file})`);
        summary.perFile[file].unauth++;
      }
    }
  }
}

const csv = ['file,method,route,mutating,hasValidate,hasAuth'];
for (const r of rows) {
  csv.push([r.file, r.method, r.route, r.mutating, r.hasValidate, r.hasAuth].join(','));
}

fs.writeFileSync(path.join(__dirname, 'zod-coverage.csv'), csv.join('\n'));
fs.writeFileSync(
  path.join(__dirname, 'zod-coverage-summary.json'),
  JSON.stringify(summary, null, 2),
);

console.log('=== ZOD VALIDATION COVERAGE ===');
console.log('Total routes scanned:', summary.totalRoutes);
console.log('By method:', summary.byMethod);
console.log('\nMutating (POST/PUT/PATCH/DELETE):', summary.mutatingTotal);
if (summary.mutatingTotal > 0) {
  const pct = ((summary.mutatingValidated / summary.mutatingTotal) * 100).toFixed(1);
  console.log('  Validated:', summary.mutatingValidated, `(${pct}%)`);
  console.log('  Missing  :', summary.mutatingTotal - summary.mutatingValidated);
}

console.log('\n--- TOP 15 UNVALIDATED MUTATING ROUTES ---');
summary.mutatingMissing.slice(0, 15).forEach((r) => console.log('  ', r));
if (summary.mutatingMissing.length > 15) {
  console.log(`  ... +${summary.mutatingMissing.length - 15} more`);
}

console.log('\n--- ROUTES WITHOUT AUTH MIDDLEWARE INLINE (top 20) ---');
console.log('Note: some are intentionally public (auth, stripe webhook, health);');
console.log('others may apply auth at router-mount level (router.use(authMiddleware)).');
summary.publicMutating.slice(0, 20).forEach((r) => console.log('  ', r));

console.log('\n--- PER FILE ---');
for (const [file, c] of Object.entries(summary.perFile).sort((a, b) => b[1].mutating - a[1].mutating)) {
  console.log(`  ${file}: ${c.total} routes, ${c.mutating} mutating, ${c.validated} validated, ${c.unauth} inline-unauth`);
}
