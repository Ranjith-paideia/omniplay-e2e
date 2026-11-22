import { test as base } from '@playwright/test';
import { BasePage } from '../pages/BasePage';
import { LoginPage } from '../pages/LoginPage';
import { HomePage } from '../pages/HomePage';
import { PatientChartPage } from '../pages/PatientChartPage';
import { PatientRegistrationPage } from '../pages/PatientRegistrationPage';
import { createPatient, deletePatient, CreatedPatient } from '../api/patientApi';

export type OmniPlayFixtures = {
  basePage: BasePage;
  loginPage: LoginPage;
  homePage: HomePage;
  patientChartPage: PatientChartPage;
  patientRegistrationPage: PatientRegistrationPage;
  /** A patient pre-seeded via REST API; automatically cleaned up after the test. */
  seededPatient: CreatedPatient;
};

/**
 * Extended Playwright `test` with all OmniPlay fixtures.
 *
 * Usage:
 *   import { test, expect } from '../../src/fixtures/testFixtures';
 */
export const test = base.extend<OmniPlayFixtures>({
  basePage: async ({ page }, use) => {
    await use(new BasePage(page));
  },

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  patientChartPage: async ({ page }, use) => {
    await use(new PatientChartPage(page));
  },

  patientRegistrationPage: async ({ page }, use) => {
    await use(new PatientRegistrationPage(page));
  },

  seededPatient: async ({}, use) => {
    let patient: CreatedPatient | undefined;
    try {
      patient = await createPatient();
    } catch (err) {
      throw new Error(`[OmniPlay] seededPatient fixture failed to create patient: ${err}`);
    }

    await use(patient);

    // Teardown — always runs even if the test fails
    if (patient) {
      try {
        await deletePatient(patient.uuid);
      } catch (err) {
        console.warn(`[OmniPlay] teardown: deletePatient(${patient.uuid}) threw: ${err}`);
      }
    }
  },
});

export { expect } from '@playwright/test';
