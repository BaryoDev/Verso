
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './src/renderer/src/e2e',
  testMatch: '**/*.spec.js',
  globalSetup: './src/renderer/src/e2e/global-setup.js',
  timeout: 30000,
  retries: 0,
  use: {
    trace: 'on-first-retry',
  },
});
