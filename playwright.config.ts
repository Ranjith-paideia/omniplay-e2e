import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env before reading process.env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const BASE_URL = process.env['BASE_URL'] ?? 'https://o3.openmrs.org/openmrs/spa';
const authFile = path.join(__dirname, 'playwright/.auth/user.json');

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 1,
  workers: process.env['CI'] ? 2 : undefined,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Generous timeout for the live demo which can be slow
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
  },

  /* Global test timeout */
  timeout: 120_000,
  expect: { timeout: 20_000 },

  projects: [
    // ── 1. Auth Setup ──────────────────────────────────────────────────────────
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 2. API Tests (no browser, no auth dependency) ──────────────────────────
    {
      name: 'api',
      testDir: './tests/api',
      use: {
        // API tests use APIRequestContext — no headed browser needed
        ...devices['Desktop Chrome'],
      },
    },

    // ── 3. Chromium E2E (depends on setup, reuses storageState) ───────────────
    {
      name: 'chromium',
      testDir: './tests/e2e',
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: authFile,
      },
    },
  ],
});
