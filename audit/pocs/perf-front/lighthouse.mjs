// Frontend perf POC — runs Lighthouse against critical client URLs.
// Requires: a running client (dev server or `npm run build && npm run preview`).
//
// Install:
//   npm i -D -w @postcommander/client lighthouse chrome-launcher
//
// Run:
//   BASE_URL=http://localhost:5173 node audit/pocs/perf-front/lighthouse.mjs
//
// Outputs JSON + HTML reports under audit/pocs/perf-front/lighthouse-*.{json,html}
// and a summary CSV with Performance / Accessibility / Best Practices / SEO scores.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

let lighthouse;
let chromeLauncher;
try {
  lighthouse = (await import('lighthouse')).default;
  chromeLauncher = await import('chrome-launcher');
} catch {
  console.error(
    'lighthouse + chrome-launcher not installed. Run: npm i -D -w @postcommander/client lighthouse chrome-launcher',
  );
  process.exit(1);
}

const PAGES = [
  { name: 'landing', path: '/' },
  { name: 'pricing', path: '/pricing' },
  { name: 'login', path: '/login' },
  { name: 'dashboard', path: '/app/dashboard' }, // requires auth — may redirect
  { name: 'editor', path: '/app/generate' }, // requires auth
];

const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    formFactor: 'mobile',
    throttling: {
      // Slow 4G as documented in audit dim 11
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    },
    screenEmulation: {
      mobile: true,
      width: 360,
      height: 640,
      deviceScaleFactor: 2,
      disabled: false,
    },
  },
};

const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

const summary = [['page', 'url', 'performance', 'accessibility', 'best-practices', 'seo', 'lcp_ms', 'cls', 'tbt_ms']];

for (const page of PAGES) {
  const url = BASE_URL + page.path;
  console.log(`\n[lighthouse] ${page.name} → ${url}`);

  const result = await lighthouse(url, { port: chrome.port, output: ['json', 'html'] }, MOBILE_CONFIG);

  const reportJson = result.report[0];
  const reportHtml = result.report[1];

  fs.writeFileSync(path.join(__dirname, `lighthouse-${page.name}.json`), reportJson);
  fs.writeFileSync(path.join(__dirname, `lighthouse-${page.name}.html`), reportHtml);

  const lhr = result.lhr;
  const cats = lhr.categories;
  const audits = lhr.audits;

  const row = [
    page.name,
    url,
    Math.round((cats.performance?.score ?? 0) * 100),
    Math.round((cats.accessibility?.score ?? 0) * 100),
    Math.round((cats['best-practices']?.score ?? 0) * 100),
    Math.round((cats.seo?.score ?? 0) * 100),
    Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
    (audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3),
    Math.round(audits['total-blocking-time']?.numericValue ?? 0),
  ];
  summary.push(row);

  console.log(
    `  perf=${row[2]} a11y=${row[3]} bp=${row[4]} seo=${row[5]} LCP=${row[6]}ms CLS=${row[7]} TBT=${row[8]}ms`,
  );
}

await chrome.kill();

const csvPath = path.join(__dirname, 'lighthouse-summary.csv');
fs.writeFileSync(csvPath, summary.map((r) => r.join(',')).join('\n'));
console.log(`\n[lighthouse] Wrote ${csvPath}`);

// SLO check (audit dim 11): perf > 85 mobile, LCP < 2500ms, CLS < 0.1
const violations = [];
for (const row of summary.slice(1)) {
  const [name, , perf, , , , lcp, cls] = row;
  if (Number(perf) < 85) violations.push(`${name}: perf ${perf} < 85 target`);
  if (Number(lcp) > 2500) violations.push(`${name}: LCP ${lcp}ms > 2500ms target`);
  if (Number(cls) > 0.1) violations.push(`${name}: CLS ${cls} > 0.1 target`);
}
if (violations.length > 0) {
  console.log('\n⚠️  SLO violations:');
  violations.forEach((v) => console.log(`  - ${v}`));
  process.exit(2);
}
