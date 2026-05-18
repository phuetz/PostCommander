# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> auth page should load
- Location: tests\e2e\auth.spec.ts:3:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('input[type="email"]')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('input[type="email"]')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test('auth page should load', async ({ page }) => {
  4  |   await page.goto('/login');
  5  | 
  6  |   // Expect a title "to contain" a substring.
  7  |   await expect(page).toHaveTitle(/PostCommander/);
  8  | 
  9  |   // Check if login form is visible
  10 |   const emailInput = page.locator('input[type="email"]');
> 11 |   await expect(emailInput).toBeVisible();
     |                            ^ Error: expect(locator).toBeVisible() failed
  12 | 
  13 |   const passwordInput = page.locator('input[type="password"]');
  14 |   await expect(passwordInput).toBeVisible();
  15 | 
  16 |   // Try clicking sign in without filling
  17 |   const submitButton = page.locator('button[type="submit"]');
  18 |   await expect(submitButton).toBeVisible();
  19 | });
  20 | 
```