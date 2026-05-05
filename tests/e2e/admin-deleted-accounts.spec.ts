import { test, expect } from '@playwright/test';

function jsonResponse(body: unknown) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

test.describe('Admin deleted account archives', () => {
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
              id: 'admin-user-1',
              email: 'admin@example.com',
              name: 'Admin User',
              avatarUrl: null,
              role: 'admin',
              plan: 'business',
              planStatus: 'active',
              postsUsedThisMonth: 0,
              postsResetDate: null,
              createdAt: '2026-04-17T00:00:00.000Z',
              updatedAt: '2026-04-17T00:00:00.000Z',
            },
          },
        }),
      );
    });

    await page.route('**/api/admin/deleted-accounts**', async (route) => {
      await route.fulfill(
        jsonResponse({
          success: true,
          data: {
            audits: [
              {
                id: 'audit-1',
                originalUserId: 'user-deleted-1',
                emailHash: 'abc123hashedemail',
                stripeCustomerId: 'cus_deleted_123',
                plan: 'pro',
                planStatus: 'canceled',
                userCreatedAt: '2026-04-01T00:00:00.000Z',
                deletedAt: '2026-04-17T08:00:00.000Z',
                source: 'self_service',
                snapshot: {
                  user: {
                    id: 'user-deleted-1',
                    name: 'Deleted User',
                    plan: 'pro',
                  },
                  contentCounts: {
                    settings: 4,
                    platformConnections: 2,
                    posts: 18,
                    writingStyles: 1,
                    generatedImages: 0,
                    contentPillars: 3,
                    contentIdeas: 9,
                  },
                  billingCounts: {
                    subscriptions: 1,
                    invoices: 2,
                  },
                },
                billingRecords: [
                  {
                    id: 'billing-1',
                    recordType: 'subscription',
                    stripeRecordId: 'sub_deleted_123',
                    status: 'canceled',
                    archivedAt: '2026-04-17T08:00:00.000Z',
                    snapshot: {
                      stripeSubscriptionId: 'sub_deleted_123',
                      plan: 'pro',
                    },
                  },
                  {
                    id: 'billing-2',
                    recordType: 'invoice',
                    stripeRecordId: 'inv_deleted_123',
                    status: 'paid',
                    archivedAt: '2026-04-17T08:00:00.000Z',
                    snapshot: {
                      stripeInvoiceId: 'inv_deleted_123',
                      amount: 1900,
                    },
                  },
                ],
              },
            ],
          },
        }),
      );
    });
  });

  test('shows archived deleted account details for admins', async ({ page }) => {
    await page.goto('/app/admin/deleted-accounts');

    await expect(
      page.getByRole('heading', { name: 'Deleted Account Archives' }),
    ).toBeVisible();
    await expect(page.getByText('Admin only')).toBeVisible();
    await expect(page.getByText('Original user ID:').first()).toBeVisible();
    await expect(page.getByText('cus_deleted_123').first()).toBeVisible();
    await expect(page.getByText('sub_deleted_123').first()).toBeVisible();
    await expect(page.getByText('inv_deleted_123').first()).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export JSON' }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/deleted-accounts-.*\.json$/);
  });
});
