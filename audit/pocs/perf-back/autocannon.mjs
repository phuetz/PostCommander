// Backend perf POC — runs autocannon against critical endpoints.
// Requires: a running server + a valid JWT cookie for authenticated routes.
//
// Install: npm i -D -w @postcommander/server autocannon
// Run:
//   AUTH_COOKIE='token=eyJhbGc...' BASE_URL=http://localhost:3001 \
//     node audit/pocs/perf-back/autocannon.mjs
//
// Outputs JSON reports under audit/pocs/perf-back/autocannon-*.json so the
// audit report can quote p50/p95/p99 with provenance.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const AUTH_COOKIE = process.env.AUTH_COOKIE || '';
const DURATION = Number(process.env.DURATION || 30); // seconds
const CONNECTIONS = Number(process.env.CONNECTIONS || 20);

let autocannon;
try {
  autocannon = (await import('autocannon')).default;
} catch {
  console.error('autocannon not installed. Run: npm i -D -w @postcommander/server autocannon');
  process.exit(1);
}

const SCENARIOS = [
  { name: 'live', url: `${BASE_URL}/api/live`, auth: false },
  { name: 'health', url: `${BASE_URL}/api/health`, auth: false },
  { name: 'posts-list', url: `${BASE_URL}/api/posts?page=1&pageSize=20`, auth: true },
  { name: 'analytics-overview', url: `${BASE_URL}/api/analytics/overview`, auth: true },
  { name: 'platforms-list', url: `${BASE_URL}/api/platforms`, auth: true },
];

function summarize(result) {
  return {
    url: result.url,
    duration: result.duration,
    connections: result.connections,
    requests: { total: result.requests.total, average: result.requests.average },
    throughput: { average: result.throughput.average },
    latency: {
      p50: result.latency.p50,
      p95: result.latency.p97_5 ?? result.latency.p95,
      p99: result.latency.p99,
      max: result.latency.max,
    },
    errors: result.errors,
    timeouts: result.timeouts,
    non2xx: result.non2xx,
  };
}

const allResults = {};
for (const scenario of SCENARIOS) {
  if (scenario.auth && !AUTH_COOKIE) {
    console.warn(`[autocannon] Skipping ${scenario.name} — AUTH_COOKIE not set`);
    continue;
  }

  console.log(`\n[autocannon] ${scenario.name} → ${scenario.url}`);
  const result = await autocannon({
    url: scenario.url,
    duration: DURATION,
    connections: CONNECTIONS,
    headers: scenario.auth ? { cookie: AUTH_COOKIE } : {},
  });

  const summary = summarize(result);
  allResults[scenario.name] = summary;
  console.log(
    `  p50=${summary.latency.p50}ms p95=${summary.latency.p95}ms p99=${summary.latency.p99}ms ` +
      `${summary.requests.average} req/s · errors=${summary.errors}`,
  );

  const outPath = path.join(__dirname, `autocannon-${scenario.name}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
}

const aggregatePath = path.join(__dirname, 'autocannon-summary.json');
fs.writeFileSync(aggregatePath, JSON.stringify(allResults, null, 2));
console.log(`\n[autocannon] Wrote ${aggregatePath}`);

// SLO check (from docs/slo.md): API p95 < 300ms, p99 < 1s
const violations = [];
for (const [name, r] of Object.entries(allResults)) {
  if (r.latency.p95 > 300) violations.push(`${name}: p95 ${r.latency.p95}ms > 300ms target`);
  if (r.latency.p99 > 1000) violations.push(`${name}: p99 ${r.latency.p99}ms > 1000ms target`);
}
if (violations.length > 0) {
  console.log('\n⚠️  SLO violations:');
  violations.forEach((v) => console.log(`  - ${v}`));
  process.exit(2);
}
