import { test, expect } from '../../src/fixtures/testFixtures';
import { env } from '../../src/config/env';

/**
 * Patient search flow — seeds a patient via the REST API then finds them in the UI.
 */
test.describe('Patient Search (seeded via API)', () => {
  test(
    'searches for the seeded patient and opens their chart',
    async ({ page, homePage, patientChartPage, seededPatient }) => {
      await page.goto(env.BASE_URL);
      await page.waitForLoadState('networkidle', { timeout: 30_000 });

      // Use the seeded patient's given name
      const givenName = seededPatient.fullName.split(' ')[0] ?? seededPatient.fullName;

      await homePage.searchPatient(givenName);
      await homePage.selectFirstSearchResult(givenName);

      // Verify patient chart loaded with seeded patient
      await patientChartPage.waitForChartLoaded();
      await patientChartPage.assertPatientName(givenName);
    }
  );
});
