import { test as setup, expect } from '@playwright/test';
import * as path from 'path';
import { env } from '../src/config/env';
import { LoginPage } from '../src/pages/LoginPage';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Auth setup — runs once before all Chromium E2E tests.
 * Logs in with real credentials and saves storageState to disk so
 * subsequent tests reuse the authenticated session without re-logging in.
 */
setup('authenticate', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.login(env.APP_USERNAME, env.APP_PASSWORD, env.APP_LOCATION);

  // Confirm we landed on the authenticated home / dashboard
  // O3 redirects to the SPA home after login — URL should NOT contain 'login'
  await expect(page).not.toHaveURL(/login/i, { timeout: 30_000 });

  // Wait for the main app shell to settle
  await page.waitForLoadState('networkidle', { timeout: 60_000 });

  // Persist the authenticated browser state
  await page.context().storageState({ path: authFile });
  console.log(`[OmniPlay] Auth state saved → ${authFile}`);
});
