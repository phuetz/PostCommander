import { test, expect } from '@playwright/test';

test.describe('PostCommander Copilot', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/app/dashboard');
  });

  test('should open Copilot, send message and receive typing indicator', async ({ page }) => {
    // Click the Copilot toggle button in the header
    const copilotBtn = page.getByTitle('Ouvrir Copilot');
    await expect(copilotBtn).toBeVisible();
    await copilotBtn.click();

    // Verify sidebar opens and initial message is visible
    await expect(page.getByText('PostCommander AI')).toBeVisible();
    await expect(page.getByText(/Comment puis-je vous aider/)).toBeVisible();

    // Send a message
    const input = page.getByPlaceholder('Posez votre question...');
    await input.fill('Donne-moi une idée de post');
    await page.keyboard.press('Enter');

    // Verify user message appears
    await expect(page.getByText('Donne-moi une idée de post')).toBeVisible();

    // Wait for the mock response (which takes 1.5s in CopilotSidebar.tsx)
    await expect(page.getByText(/C'est noté. Je peux générer un brouillon/)).toBeVisible({ timeout: 3000 });
  });
});
