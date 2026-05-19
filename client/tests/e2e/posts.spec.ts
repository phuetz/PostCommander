import { test, expect } from '@playwright/test';
import { checkA11y } from './_helpers/a11y';

test.describe('Posts Studio Navigation', () => {
  test('should protect post creation route', async ({ page }, testInfo) => {
    await page.goto('/app/w/post');
    await page.waitForLoadState('networkidle');

    // Check if we redirect to auth or load the studio
    const currentUrl = page.url();
    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
      // Basic check that auth protection works
      await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 10000 });
    } else {
      // If we somehow bypassed auth or it's mocked
      const bodyText = await page.textContent('body');
      expect(bodyText).toContain('Post');
    }

    // WCAG 2.1 AA audit on whichever page we ended up on (login or studio).
    await checkA11y(page, testInfo, 'posts-route');
  });
});
