import { defineConfig, devices } from '@playwright/test';

const serverPort = Number(process.env.PLAYWRIGHT_SERVER_PORT ?? 3101);
const clientPort = Number(process.env.PLAYWRIGHT_CLIENT_PORT ?? 4173);
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === 'true';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: `http://127.0.0.1:${clientPort}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'node scripts/playwright-dev-server.mjs server',
      url: `http://127.0.0.1:${serverPort}/api/health`,
      reuseExistingServer,
      timeout: 120_000,
    },
    {
      command: 'node scripts/playwright-dev-server.mjs client',
      url: `http://127.0.0.1:${clientPort}`,
      reuseExistingServer,
      timeout: 120_000,
    },
  ],
});
