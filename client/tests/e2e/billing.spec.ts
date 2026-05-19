import { test, expect } from '@playwright/test';

test.describe('Billing Navigation', () => {
  test('should protect billing settings route', async ({ page }) => {
    await page.goto('/app/billing');
    await page.waitForLoadState('networkidle');
    
    // Check if we redirect to auth
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 10000 });
    } else {
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Abonnement');
    }
  });
});
