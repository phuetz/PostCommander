import { test, expect } from '@playwright/test';
import { checkA11y } from './_helpers/a11y';

test('auth page should load', async ({ page }, testInfo) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/PostCommander/);

  // Check if login form is visible
  const emailInput = page.locator('input[type="email"]');
  await expect(emailInput).toBeVisible();

  const passwordInput = page.locator('input[type="password"]');
  await expect(passwordInput).toBeVisible();

  // Try clicking sign in without filling
  const submitButton = page.locator('button[type="submit"]');
  await expect(submitButton).toBeVisible();

  // WCAG 2.1 AA audit (opt-in: no-ops if @axe-core/playwright isn't installed).
  await checkA11y(page, testInfo, 'login');
});
