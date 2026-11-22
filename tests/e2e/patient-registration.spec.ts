import { test, expect } from '../../src/fixtures/testFixtures';
import { env } from '../../src/config/env';
import { deletePatient } from '../../src/api/patientApi';

/**
 * Patient Registration E2E — registers a new patient through the O3 UI,
 * verifies the chart page loads, then cleans up via API.
 */
test.describe('Patient Registration (UI)', () => {
  let createdPatientUuid: string | null = null;

  test.afterEach(async () => {
    if (createdPatientUuid) {
      try {
        await deletePatient(createdPatientUuid);
      } catch (err) {
        console.warn(
          `[OmniPlay] Registration test teardown could not delete ${createdPatientUuid}: ${err}`
        );
      }
      createdPatientUuid = null;
    }
  });

  test('registers a new patient and lands on the Patient Chart', async ({
    page,
    patientRegistrationPage,
    patientChartPage,
  }) => {
    await page.goto(`${env.BASE_URL}/patient-registration`);
    await page.waitForLoadState('domcontentloaded');

    // Generate unique alpha-only names to avoid OpenMRS "Number in name is dubious" warnings
    const randomSuffix = Math.random().toString(36).replace(/[^a-z]/g, '').slice(0, 5);
    const given = `Auto${randomSuffix}`;
    const family = `User${randomSuffix}`;

    await patientRegistrationPage.waitForFormLoaded();
    await patientRegistrationPage.fillForm({
      givenName: given,
      familyName: family,
      gender: 'male',
      birthdate: '1985-06-15',
    });

    await patientRegistrationPage.submit();

    // After successful submission O3 redirects to the patient chart: /patient/<uuid>/chart/...
    await page.waitForURL(/\/patient\/[a-f0-9-]{36}\/chart/i, { timeout: 30_000 });
    await patientChartPage.waitForChartLoaded();

    // Extract UUID from URL for teardown
    const urlMatch = page.url().match(/patient\/([a-f0-9-]{36})/i);
    if (urlMatch?.[1]) {
      createdPatientUuid = urlMatch[1];
    }

    // Verify name appears in patient chart
    await patientChartPage.assertPatientName(given);
  });
});
