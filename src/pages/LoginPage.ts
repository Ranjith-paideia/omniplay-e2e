import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { env } from '../config/env';

/**
 * LoginPage — handles OpenMRS O3's two-step login flow:
 *   1. Enter username  → click Continue
 *   2. Enter password  → click Log in
 *   3. (Optional) Select location → click Confirm
 */
export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate(): Promise<void> {
    await this.page.goto(env.BASE_URL);
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Full login flow: username → Continue → password → Log in → location. */
  async login(
    username = env.APP_USERNAME,
    password = env.APP_PASSWORD,
    location = env.APP_LOCATION
  ): Promise<void> {
    // ── Step 1: Username ──────────────────────────────────────────────────────
    const usernameInput = this.page.getByLabel(/username/i);
    await usernameInput.waitFor({ state: 'visible', timeout: 30_000 });
    await usernameInput.fill(username);

    const continueBtn = this.page.getByRole('button', { name: /continue/i });
    await continueBtn.click();

    // ── Step 2: Password ──────────────────────────────────────────────────────
    const passwordInput = this.page.getByLabel(/^password/i);
    await passwordInput.waitFor({ state: 'visible', timeout: 15_000 });
    await passwordInput.fill(password);

    const loginBtn = this.page.getByRole('button', { name: /^log\s*in$/i });
    await loginBtn.click();

    // ── Step 3: Location picker (may or may not appear) ───────────────────────
    await this._selectLocationIfPrompted(location);
  }

  private async _selectLocationIfPrompted(location: string): Promise<void> {
    // Give the page a moment to decide whether to show the location screen
    try {
      // Look for a heading that indicates we're on the location selection screen
      const locationHeading = this.page.getByRole('heading', {
        name: /select.*location|location/i,
      });
      await locationHeading.waitFor({ state: 'visible', timeout: 8_000 });

      // Try clicking the specific location tile/radio
      const locationOption = this.page
        .getByRole('radio', { name: new RegExp(location, 'i') })
        .or(this.page.getByText(new RegExp(location, 'i')).first());

      await locationOption.click({ timeout: 8_000 });

      const confirmBtn = this.page.getByRole('button', {
        name: /confirm|proceed|continue/i,
      });
      await confirmBtn.click();
    } catch {
      // Location screen did not appear — already authenticated with saved state,
      // or the server skipped it.
    }
  }

  /** Assert the login page is visible. */
  async assertOnLoginPage(): Promise<void> {
    await expect(this.page.getByLabel(/username/i)).toBeVisible({ timeout: 20_000 });
  }
}
