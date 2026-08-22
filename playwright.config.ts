import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL: 'http://127.0.0.1:3005',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm exec next start -p 3005 -H 127.0.0.1',
    url: 'http://127.0.0.1:3005',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
