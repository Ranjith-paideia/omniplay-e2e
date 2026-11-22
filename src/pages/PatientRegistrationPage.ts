import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export interface PatientRegistrationData {
  givenName: string;
  familyName: string;
  gender: 'male' | 'female' | 'other' | 'unknown';
  birthdate?: string; // YYYY-MM-DD
}

/**
 * PatientRegistrationPage — the O3 "Register a new patient" form.
 */
export class PatientRegistrationPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Wait for the registration form to be rendered. */
  async waitForFormLoaded(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await expect(
      this.page
        .getByRole('heading', { name: /create new patient|register.*patient/i })
        .or(this.page.getByText(/create new patient|register.*patient/i).first())
    ).toBeVisible({ timeout: 30_000 });
  }

  /** Fill in the registration form with the provided patient data. */
  async fillForm(data: PatientRegistrationData): Promise<void> {
    // ── Given / First Name ────────────────────────────────────────────────────
    const givenNameInput = this.page
      .locator('#givenName')
      .or(this.page.getByLabel(/given.*name|first.*name/i))
      .first();
    await givenNameInput.fill(data.givenName);

    // ── Family / Last Name ────────────────────────────────────────────────────
    const familyNameInput = this.page
      .locator('#familyName')
      .or(this.page.getByLabel(/family.*name|last.*name/i))
      .first();
    await familyNameInput.fill(data.familyName);

    // ── Gender ────────────────────────────────────────────────────────────────
    // Carbon Design System radio button labels wrap the inputs. Target label directly.
    const genderLabel = this.page.locator(`label[for="gender-option-${data.gender}"]`);
    if (await genderLabel.count() > 0) {
      await genderLabel.click({ force: true });
    } else {
      await this.page.getByText(new RegExp(`^${data.gender}$`, 'i')).first().click({ force: true });
    }

    // ── Birthdate (optional) ──────────────────────────────────────────────────
    if (data.birthdate) {
      const [year, month, day] = data.birthdate.split('-');
      // React Aria DateField in O3 uses individual spinbuttons for day, month, year
      const daySpin = this.page.getByRole('spinbutton', { name: /day/i });
      if (await daySpin.count() > 0 && day && month && year) {
        await daySpin.fill(day);
        const monthSpin = this.page.getByRole('spinbutton', { name: /month/i });
        if (await monthSpin.count() > 0) await monthSpin.fill(month);
        const yearSpin = this.page.getByRole('spinbutton', { name: /year/i });
        if (await yearSpin.count() > 0) await yearSpin.fill(year);
      } else {
        // Fallback for standard date input
        const dateInput = this.page.getByLabel(/date.*birth|birthdate|dob/i).first();
        if (await dateInput.count() > 0 && day && month && year) {
          await dateInput.fill(`${day}/${month}/${year}`);
        }
      }
    }
  }

  /** Submit the registration form. */
  async submit(): Promise<void> {
    const submitBtn = this.page
      .getByRole('button', { name: /register patient|submit|save/i })
      .first();
    await submitBtn.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert that validation errors are NOT displayed. */
  async assertNoValidationErrors(): Promise<void> {
    const errorCount = await this.page
      .locator('.cds--form-requirement, [role="alert"]')
      .count();
    expect(errorCount).toBe(0);
  }
}
