import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * PatientChartPage — represents an individual patient's chart / record page.
 */
export class PatientChartPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Wait for the patient chart to fully render. */
  async waitForChartLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(this.page).toHaveURL(/\/patient\/[a-f0-9-]{36}/i, { timeout: 30_000 });
  }

  /** Assert the patient's name appears in the chart banner. */
  async assertPatientName(name: string): Promise<void> {
    await expect(
      this.page.getByText(new RegExp(name, 'i')).first()
    ).toBeVisible({ timeout: 20_000 });
  }

  /** Assert a demographic value (gender, age, DOB, identifier) appears. */
  async assertDemographic(value: string | RegExp): Promise<void> {
    await expect(this.page.getByText(value).first()).toBeVisible({ timeout: 15_000 });
  }

  /** Return the displayed patient name from the banner. */
  async getPatientName(): Promise<string> {
    const heading = this.page.getByRole('heading', { level: 1 }).first();
    return (await heading.textContent()) ?? '';
  }
}
