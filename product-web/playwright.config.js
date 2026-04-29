import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: {
    baseURL,
    headless: true,
    screenshot: 'off',
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: 'npm run dev -- --host 0.0.0.0 --port 5173',
    url: 'http://localhost:5173',
    timeout: 120000,
    reuseExistingServer: true,
  },
});
