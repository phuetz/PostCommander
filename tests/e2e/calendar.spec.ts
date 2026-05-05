import { test, expect } from '@playwright/test';

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

function isoAtHour(date: Date, hour: number) {
  const copy = new Date(date);
  copy.setHours(hour, 0, 0, 0);
  return copy.toISOString();
}

test.describe('Calendar interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('postcommander-lang', 'en');
    });

    const today = new Date();
    const scheduledAt = isoAtHour(today, 10);
    let currentScheduledAt = scheduledAt;

    const authenticatedUser = {
      id: 'calendar-user-1',
      email: 'calendar@example.com',
      name: 'Calendar User',
      avatarUrl: null,
      role: 'user',
      plan: 'business',
      planStatus: 'active',
      postsUsedThisMonth: 0,
      postsResetDate: null,
      createdAt: '2026-04-16T00:00:00.000Z',
      updatedAt: '2026-04-16T00:00:00.000Z',
    };

    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: { user: authenticatedUser },
        }),
      );
    });

    await page.route('**/api/posts**', async (route) => {
      if (route.request().method() === 'PUT') {
        const payload = route.request().postDataJSON() as { scheduledAt?: string };
        currentScheduledAt = payload.scheduledAt ?? currentScheduledAt;
        await route.fulfill(
          jsonResponse({
            success: true,
            data: {
              id: 'post-1',
              userId: authenticatedUser.id,
              content: 'Scheduled planning post',
              originalPrompt: 'Scheduled planning post',
              tone: 'professional',
              llmProvider: 'openai',
              llmModel: 'gpt-4.1-mini',
              platforms: ['linkedin'],
              platformVariants: [],
              hashtags: ['#planning'],
              status: 'scheduled',
              scheduledAt: currentScheduledAt,
              publishedAt: null,
              createdAt: '2026-04-16T00:00:00.000Z',
              updatedAt: '2026-04-16T00:00:00.000Z',
            },
          }),
        );
        return;
      }

      await route.fulfill(
        jsonResponse({
          success: true,
          data: [
            {
              id: 'post-1',
              userId: authenticatedUser.id,
              content: 'Scheduled planning post',
              originalPrompt: 'Scheduled planning post',
              tone: 'professional',
              llmProvider: 'openai',
              llmModel: 'gpt-4.1-mini',
              platforms: ['linkedin'],
              platformVariants: [],
              hashtags: ['#planning'],
              status: 'scheduled',
              scheduledAt: currentScheduledAt,
              publishedAt: null,
              createdAt: '2026-04-16T00:00:00.000Z',
              updatedAt: '2026-04-16T00:00:00.000Z',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 200,
        }),
      );
    });
  });

  test('shows scheduled posts and opens the day modal', async ({ page }) => {
    const today = new Date();
    const todayKey = today.toISOString().slice(0, 10);

    await page.goto('/app/calendar');

    await expect(page.locator('h2')).toContainText(
      new RegExp(String(today.getFullYear())),
    );
    await expect(page.getByTestId(`calendar-post-post-1`)).toBeVisible();

    await page.getByTestId(`calendar-day-${todayKey}`).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Scheduled planning post').first()).toBeVisible();
  });

  test('moves a scheduled post to another day', async ({ page }) => {
    const today = new Date();
    const originalDayKey = today.toISOString().slice(0, 10);
    const targetDay = new Date(today);
    targetDay.setDate(today.getDate() + 9);
    const targetDayKey = targetDay.toISOString().slice(0, 10);

    await page.goto('/app/calendar');

    const updateRequest = page.waitForRequest((request) => {
      return request.method() === 'PUT' && request.url().includes('/api/posts/post-1');
    });

    await page
      .getByTestId('calendar-post-post-1')
      .dragTo(page.getByTestId(`calendar-day-${targetDayKey}`));

    const request = await updateRequest;
    const payload = request.postDataJSON() as { scheduledAt: string; status: string };

    expect(payload.status).toBe('scheduled');
    expect(payload.scheduledAt.startsWith(originalDayKey)).toBe(false);
  });
});
