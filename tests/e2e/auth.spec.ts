import { test, expect } from '@playwright/test';

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

test.describe('Authentication flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('postcommander-lang', 'en');
    });

    let currentUser: null | Record<string, unknown> = null;

    await page.route('**/api/auth/me', async (route) => {
      if (!currentUser) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Authentication token missing' }),
        });
        return;
      }

      await route.fulfill(
        jsonResponse({
          success: true,
          data: { user: currentUser },
        }),
      );
    });

    const buildUser = (email: string, name: string) => ({
      id: 'auth-user-1',
      email,
      name,
      avatarUrl: null,
      role: 'user',
      plan: 'free',
      planStatus: 'active',
      postsUsedThisMonth: 0,
      postsResetDate: null,
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z',
    });

    await page.route('**/api/auth/login', async (route) => {
      currentUser = buildUser('user@example.com', 'Test User');
      await route.fulfill(
        jsonResponse({
          success: true,
          data: { user: currentUser },
        }),
      );
    });

    await page.route('**/api/auth/register', async (route) => {
      currentUser = buildUser('new@example.com', 'New User');
      await route.fulfill(
        jsonResponse({
          success: true,
          data: { user: currentUser },
        }),
      );
    });

    await page.route('**/api/posts**', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: [],
          total: 0,
          page: 1,
          pageSize: 5,
        }),
      );
    });

    await page.route('**/api/platforms', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: [],
        }),
      );
    });

    await page.route('**/api/templates**', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: [],
          total: 0,
          page: 1,
          pageSize: 3,
        }),
      );
    });

    await page.route('**/api/analytics/overview', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            totalPosts: 0,
            byStatus: {},
            byPlatform: {},
            byTone: {},
            postsPerWeek: [],
            recentActivity: [],
          },
        }),
      );
    });
  });

  test('logs in and lands on the dashboard', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();

    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign In' }).click();

    await expect(page).toHaveURL(/\/app\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Quick Generate' })).toBeVisible();
  });

  test('registers and lands on the dashboard', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();

    await page.getByLabel('Full Name').fill('New User');
    await page.getByLabel('Email').fill('new@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: 'Sign Up' }).click();

    await expect(page).toHaveURL(/\/app\/dashboard$/);
    await expect(page.getByRole('button', { name: 'Quick Generate' })).toBeVisible();
  });

  test('navigates from login to register', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create one for free' }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
  });
});

test.describe('Marketing Pages', () => {
  test('should show landing page', async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('postcommander-lang', 'en');
    });
    await page.goto('/');
    await expect(page.locator('h1')).toContainText(/Generate Viral/);
  });
});
