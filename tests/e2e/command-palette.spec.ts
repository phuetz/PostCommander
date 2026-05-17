import { test, expect } from '@playwright/test';

test.describe('Command Palette', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the app homepage (login handled by custom setup or bypassed in dev)
    await page.goto('/app/dashboard');
  });

  test('should open with Ctrl+K and navigate to Analytics', async ({ page, isMac }) => {
    // Press keyboard shortcut
    const modifier = isMac ? 'Meta' : 'Control';
    await page.keyboard.press(`${modifier}+k`);

    // Verify modal is visible
    const commandInput = page.getByPlaceholder('Tapez une commande ou cherchez...');
    await expect(commandInput).toBeVisible();

    // Type "Analytics"
    await commandInput.fill('Analytics');

    // Click the matching result
    await page.getByText('Business Intelligence', { exact: true }).click();

    // Verify URL changed
    await expect(page).toHaveURL(/.*\/app\/analytics/);
  });
});
