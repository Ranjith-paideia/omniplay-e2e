import { test, expect } from '../../src/fixtures/testFixtures';
import { env } from '../../src/config/env';

/**
 * Dashboard smoke test — validates that storageState auth reuse works.
 * No re-login is performed; the test opens the home URL with the saved session.
 */
test.describe('Home Dashboard (storageState reuse)', () => {
  test('opens the home page already authenticated', async ({ page, homePage }) => {
    await page.goto(env.BASE_URL);
    await homePage.assertDashboardLoaded();

    // Confirm we are NOT redirected to the login page
    await expect(page).not.toHaveURL(/login/i);
  });

  test('renders the top navigation banner', async ({ page }) => {
    await page.goto(env.BASE_URL);
    await page.waitForLoadState('networkidle', { timeout: 30_000 });
    // O3 always has a header / banner element
    await expect(page.getByRole('banner')).toBeVisible({ timeout: 20_000 });
  });

  test('shows the main application content area', async ({ page }) => {
    await page.goto(env.BASE_URL);
    await page.waitForLoadState('domcontentloaded');
    // The main region of the SPA
    const main = page.getByRole('main').first();
    await expect(main).toBeVisible({ timeout: 20_000 });
  });
});
