import type { Page, TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Run axe-core accessibility audit against the current page.
 *
 *   - Requires `@axe-core/playwright` in client/devDependencies. The helper
 *     gracefully no-ops with a console.warn if the package isn't installed,
 *     so existing e2e specs continue to pass while the team rolls out a11y.
 *   - Saves the report under `audit/pocs/a11y/<spec>-<step>.json` for the
 *     audit trail. Spec name + step come from TestInfo when provided.
 *   - Fails the test on any "critical" or "serious" violation; logs warnings
 *     for "moderate" / "minor" (treated as informational so existing UI
 *     debt doesn't block CI). Tighten over time.
 *
 * Usage:
 *   import { checkA11y } from './_helpers/a11y';
 *   test('login page has no critical a11y violations', async ({ page }, testInfo) => {
 *     await page.goto('/login');
 *     await checkA11y(page, testInfo, 'login-form');
 *   });
 */
export async function checkA11y(
  page: Page,
  testInfo?: TestInfo,
  step?: string,
): Promise<void> {
  let AxeBuilder: any;
  try {
    const mod = await import('@axe-core/playwright');
    AxeBuilder = (mod as any).default ?? mod.AxeBuilder ?? mod;
  } catch {
    console.warn(
      '[a11y] @axe-core/playwright not installed — skipping. Install with: ' +
        'npm i -D -w @postcommander/client @axe-core/playwright',
    );
    return;
  }

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Persist the report under audit/pocs/a11y/.
  const reportDir = path.resolve(process.cwd(), '..', 'audit', 'pocs', 'a11y');
  try {
    fs.mkdirSync(reportDir, { recursive: true });
    const slug =
      (testInfo?.title ?? 'unnamed').replace(/[^a-z0-9-]+/gi, '-').toLowerCase() +
      (step ? `-${step.toLowerCase()}` : '');
    fs.writeFileSync(
      path.join(reportDir, `${slug}.json`),
      JSON.stringify(
        {
          url: page.url(),
          violations: results.violations,
          passes: results.passes.length,
          incomplete: results.incomplete.length,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
  } catch {
    // best-effort persistence — don't fail the test if FS is read-only.
  }

  const blocking = results.violations.filter(
    (v: any) => v.impact === 'critical' || v.impact === 'serious',
  );
  const warnings = results.violations.filter(
    (v: any) => v.impact === 'moderate' || v.impact === 'minor',
  );

  for (const w of warnings) {
    console.warn(
      `[a11y][${w.impact}] ${w.id}: ${w.help} (${w.nodes.length} node(s))`,
    );
  }

  if (blocking.length > 0) {
    const summary = blocking
      .map((v: any) => `  - [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node(s))`)
      .join('\n');
    throw new Error(
      `axe-core found ${blocking.length} critical/serious accessibility violation(s):\n${summary}`,
    );
  }
}
