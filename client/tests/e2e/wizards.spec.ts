import { test, expect } from '@playwright/test';

test.describe('Wizards Navigation', () => {
  // Normally we would login here or set state
  // But for smoke test without DB data, we just ensure routes render

  test('should load autoblog wizard', async ({ page }) => {
    // Navigate to a known auth-protected page (or public depending on routing)
    // If auth is required, this test might redirect to /auth
    await page.goto('/app/w/autoblog');
    
    // Check if we redirect to auth or load the wizard
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      // Basic check that auth protection works
      await expect(page.locator('input[type="email"]')).toBeVisible();
    } else {
      // If we somehow bypassed auth or it's public
      await expect(page.getByText(/Autopilot/i)).toBeVisible();
    }
  });
});
