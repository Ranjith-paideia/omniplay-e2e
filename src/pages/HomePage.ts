import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * HomePage — the O3 dashboard after a successful login.
 */
export class HomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Assert core dashboard widgets are rendered. */
  async assertDashboardLoaded(): Promise<void> {
    // The O3 home has a main navigation / header bar
    await expect(this.page.getByRole('banner')).toBeVisible({ timeout: 30_000 });
    // The home page typically shows the OpenMRS logo or app name
    await this.page.waitForLoadState('networkidle', { timeout: 30_000 });
  }

  /** Search for a patient by name using the global omnibar. */
  async searchPatient(name: string): Promise<void> {
    // If the omnibar search input is not expanded yet, click the magnifying glass button
    const searchInput = this.page.getByTestId('patientSearchBar');
    if (!(await searchInput.isVisible().catch(() => false))) {
      const searchBtn = this.page
        .getByRole('button', { name: /search patient/i })
        .or(this.page.locator('button[aria-label*="Search"]').first());
      await searchBtn.click();
    }
    await searchInput.waitFor({ state: 'visible', timeout: 15_000 });
    await searchInput.click();
    await searchInput.fill(name);
    // Allow debounce and results to populate
    await this.page.waitForTimeout(2_500);
  }

  /** Click the first result in the patient search dropdown. */
  async selectFirstSearchResult(name?: string): Promise<void> {
    if (name) {
      const match = this.page
        .locator('li, a, [role="option"]')
        .filter({ hasText: new RegExp(name, 'i') })
        .first();
      if (await match.isVisible().catch(() => false)) {
        await match.click();
        return;
      }
    }
    const first = this.page.locator('li, a, [role="option"]').first();
    await first.waitFor({ state: 'visible', timeout: 15_000 });
    await first.click();
  }

  /** Navigate to patient registration form. */
  async navigateToPatientRegistration(): Promise<void> {
    // O3 has an "Add Patient" button in the top navigation
    const addPatientBtn = this.page
      .getByRole('link', { name: /add patient/i })
      .or(this.page.getByRole('button', { name: /add patient/i }))
      .or(this.page.getByLabel(/add patient/i));
    await addPatientBtn.click({ timeout: 15_000 });
    await this.page.waitForLoadState('domcontentloaded');
  }
}
