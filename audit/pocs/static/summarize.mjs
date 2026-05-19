// Summarize npm audit + jscpd reports for the final audit report
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const POCS = path.resolve(ROOT, 'audit', 'pocs');

function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

const audits = {
  root:   readJson(path.join(POCS, 'deps/npm-audit-root.json')),
  server: readJson(path.join(POCS, 'deps/npm-audit-server.json')),
  client: readJson(path.join(POCS, 'deps/npm-audit-client.json')),
  shared: readJson(path.join(POCS, 'deps/npm-audit-shared.json')),
};

const summary = [];
for (const [ws, data] of Object.entries(audits)) {
  if (!data) { summary.push({ ws, status: 'no_data' }); continue; }
  const vulns = data.vulnerabilities ?? {};
  const counts = { critical: 0, high: 0, moderate: 0, low: 0 };
  const direct = [];
  for (const [name, v] of Object.entries(vulns)) {
    counts[v.severity] = (counts[v.severity] ?? 0) + 1;
    if (v.isDirect) {
      const titles = (Array.isArray(v.via) ? v.via : []).filter(x => typeof x === 'object').map(x => x.title).filter(Boolean);
      direct.push({ name, severity: v.severity, range: v.range, titles, fix: v.fixAvailable });
    }
  }
  summary.push({ ws, totals: data.metadata?.vulnerabilities ?? counts, direct });
}

fs.writeFileSync(path.join(POCS, 'static/audit-summary.json'), JSON.stringify(summary, null, 2));

console.log('=== NPM AUDIT SUMMARY ===');
for (const s of summary) {
  console.log(`\n[${s.ws}] totals:`, s.totals);
  if (s.direct?.length) {
    console.log(`  Direct vulnerable deps:`);
    for (const d of s.direct) {
      console.log(`    - ${d.name} (${d.severity}) range:${d.range} fix: ${d.fix?.name ? d.fix.name+'@'+d.fix.version + (d.fix.isSemVerMajor?' (SEMVER MAJOR)':'') : 'none'}`);
      d.titles?.forEach(t => console.log(`        · ${t}`));
    }
  }
}

console.log('\n=== JSCPD ===');
for (const which of ['', '/jscpd-client']) {
  const p = path.join(POCS, `static${which}/jscpd-report.json`);
  if (which==='') {
    const p1 = path.join(POCS, `static/jscpd-server.json`);
    const d = readJson(p1) || readJson(p);
    if (!d) continue;
    console.log('\n[server]');
    console.log('  total clones:', d.statistics?.total?.clones, 'duped lines:', d.statistics?.total?.duplicatedLines, '%:', d.statistics?.total?.percentage);
  } else {
    const d = readJson(p);
    if (!d) continue;
    console.log('\n[client]');
    console.log('  total clones:', d.statistics?.total?.clones, 'duped lines:', d.statistics?.total?.duplicatedLines, '%:', d.statistics?.total?.percentage);
  }
}
