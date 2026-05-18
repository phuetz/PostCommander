# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: wizards.spec.ts >> Wizards Navigation >> should load autoblog wizard
- Location: tests\e2e\wizards.spec.ts:7:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/Autopilot/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByText(/Autopilot/i)

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Wizards Navigation', () => {
  4  |   // Normally we would login here or set state
  5  |   // But for smoke test without DB data, we just ensure routes render
  6  | 
  7  |   test('should load autoblog wizard', async ({ page }) => {
  8  |     // Navigate to a known auth-protected page (or public depending on routing)
  9  |     // If auth is required, this test might redirect to /auth
  10 |     await page.goto('/app/w/autoblog');
  11 |     
  12 |     // Check if we redirect to auth or load the wizard
  13 |     const currentUrl = page.url();
  14 |     if (currentUrl.includes('/login')) {
  15 |       // Basic check that auth protection works
  16 |       await expect(page.locator('input[type="email"]')).toBeVisible();
  17 |     } else {
  18 |       // If we somehow bypassed auth or it's public
> 19 |       await expect(page.getByText(/Autopilot/i)).toBeVisible();
     |                                                  ^ Error: expect(locator).toBeVisible() failed
  20 |     }
  21 |   });
  22 | });
  23 | 
```