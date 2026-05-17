import { test, expect } from '@playwright/test';

test.describe('Automations Workflow Builder', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate directly to the new Automations page
    await page.goto('/app/automations');
  });

  test('should load the workflow canvas and sidebar', async ({ page }) => {
    // Verify Header
    await expect(page.getByText('Lead Nurturing Automatique')).toBeVisible();

    // Verify Sidebar Tool Palette
    await expect(page.getByText('Boîte à outils')).toBeVisible();
    await expect(page.getByText('Nouveau Commentaire', { exact: true })).toBeVisible();
    await expect(page.getByText('Qualifier le Lead (IA)')).toBeVisible();

    // Verify React Flow canvas loads with the initial node
    // We check if the custom node we defined is rendered inside the React Flow pane
    const initialNode = page.locator('.react-flow__node').filter({ hasText: 'Nouveau Commentaire' });
    await expect(initialNode).toBeVisible();
  });
});
