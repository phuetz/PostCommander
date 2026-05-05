import { test, expect } from '@playwright/test';

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

test.describe('Settings account management', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('postcommander-lang', 'en');
    });

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            user: {
              id: 'user-settings-1',
              email: 'settings@example.com',
              name: 'Settings User',
              avatarUrl: null,
              role: 'user',
              plan: 'business',
              planStatus: 'active',
              postsUsedThisMonth: 0,
              postsResetDate: null,
              createdAt: '2026-04-16T00:00:00.000Z',
              updatedAt: '2026-04-16T00:00:00.000Z',
            },
          },
        }),
      );
    });

    await page.route('**/api/settings', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill(
          jsonResponse({
            success: true,
            data: {
              defaultProvider: 'openai',
              defaultModel: 'gpt-4.1-mini',
              defaultTone: 'professional',
              defaultLanguage: 'en',
            },
          }),
        );
        return;
      }

      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            defaultProvider: 'openai',
            defaultModel: 'gpt-4.1-mini',
            defaultTone: 'professional',
            defaultLanguage: 'en',
          },
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

    await page.route('**/api/auth/export', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'content-disposition': 'attachment; filename="postcommander-export-test.json"',
        },
        body: JSON.stringify({
          exportedAt: '2026-04-16T09:00:00.000Z',
          user: { id: 'user-settings-1', email: 'settings@example.com' },
          settings: { defaultTone: 'professional' },
          platformConnections: [],
          posts: [],
          writingStyles: [],
          generatedImages: [],
          contentPillars: [],
          contentIdeas: [],
          subscriptions: [],
          invoices: [],
          notes: [],
        }),
      });
    });

    await page.route('**/api/auth/account', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            message: 'Account deleted successfully',
          },
        }),
      );
    });

    await page.route('**/api/auth/logout', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            message: 'Logged out successfully',
          },
        }),
      );
    });
  });

  test('supports exporting account data and deleting the account from settings', async ({
    page,
  }) => {
    await page.goto('/app/settings');

    await expect(
      page.getByRole('heading', { name: 'Account & Data' }),
    ).toBeVisible();

    await page.getByRole('button', { name: 'Download export' }).click();
    await expect(page.getByText('Your account export is ready.')).toBeVisible();

    const deleteButton = page.getByRole('button', { name: 'Delete account' });
    await expect(deleteButton).toBeDisabled();

    await page.getByLabel('Current password').fill('correct horse battery staple');
    await page.getByLabel('Confirmation').fill('DELETE');
    await expect(deleteButton).toBeEnabled();

    await deleteButton.click();
    await expect(page).toHaveURL(/\/login$/);
  });
});
