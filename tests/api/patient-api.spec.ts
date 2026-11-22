import { test, expect } from '@playwright/test';
import {
  createPatient,
  getPatient,
  deletePatient,
} from '../../src/api/patientApi';

/**
 * API-layer tests — no browser required.
 * Validates auth, CRUD operations, and cleanup against the live OpenMRS REST API.
 */
test.describe('Patient REST API', () => {
  test('POST /patient — creates a unique test patient', async () => {
    const patient = await createPatient();

    expect(patient.uuid).toBeTruthy();
    expect(patient.fullName).toMatch(/Test\d+ OmniPlay/);
    expect(patient.identifier).toBeTruthy();

    // Clean up
    await deletePatient(patient.uuid);
  });

  test('GET /patient/:uuid — retrieves the created patient', async () => {
    const patient = await createPatient();

    const fetched = await getPatient(patient.uuid);
    expect(fetched['uuid']).toBe(patient.uuid);

    // Clean up
    await deletePatient(patient.uuid);
  });

  test('DELETE /patient/:uuid — purges the patient', async () => {
    const patient = await createPatient();

    // Should not throw
    await expect(deletePatient(patient.uuid)).resolves.toBeUndefined();

    // Attempting to fetch the purged patient should 404
    await expect(getPatient(patient.uuid)).rejects.toThrow(/404|not found/i);
  });

  test('createPatient — each call returns a unique identifier', async () => {
    const [a, b] = await Promise.all([createPatient(), createPatient()]);

    expect(a.uuid).not.toBe(b.uuid);
    expect(a.identifier).not.toBe(b.identifier);

    await Promise.all([deletePatient(a.uuid), deletePatient(b.uuid)]);
  });
});
