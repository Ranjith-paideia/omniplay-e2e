import { APIRequestContext, request } from '@playwright/test';
import { env } from '../config/env';

/** Shape returned by createPatient() */
export interface CreatedPatient {
  uuid: string;
  fullName: string;
  identifier: string;
}

/** Lazily initialised shared request context */
let _context: APIRequestContext | null = null;

/**
 * Get (or create) the shared API request context.
 *
 * IMPORTANT: Playwright's APIRequestContext resolves paths relative to baseURL
 * using the WHATWG URL spec. A leading slash resets to the origin, so we must
 * use paths WITHOUT a leading slash (e.g., 'location' not '/location') when the
 * baseURL already contains a path prefix like '/openmrs/ws/rest/v1'.
 *
 * To avoid ambiguity we append a trailing slash to the baseURL so that
 * relative resolution works correctly:
 *   baseURL = 'https://host/openmrs/ws/rest/v1/'
 *   ctx.get('location') → 'https://host/openmrs/ws/rest/v1/location'  ✓
 */
async function getContext(): Promise<APIRequestContext> {
  if (!_context) {
    const basicAuth =
      'Basic ' +
      Buffer.from(`${env.APP_USERNAME}:${env.APP_PASSWORD}`).toString('base64');

    // Ensure baseURL ends with '/' so relative paths resolve correctly
    const baseURL = env.API_BASE_URL.endsWith('/')
      ? env.API_BASE_URL
      : `${env.API_BASE_URL}/`;

    _context = await request.newContext({
      baseURL,
      extraHTTPHeaders: {
        Authorization: basicAuth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }
  return _context;
}

/** Dispose the shared context — call once after all tests finish. */
export async function disposeApiContext(): Promise<void> {
  if (_context) {
    await _context.dispose();
    _context = null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Fetch the UUID of a matching location.
 * Note: no leading slash — paths are relative to baseURL which ends with '/'.
 */
async function fetchLocationUuid(): Promise<string> {
  const ctx = await getContext();
  const res = await ctx.get('location', {
    params: { v: 'default', limit: '100' },
  });

  if (!res.ok()) {
    const body = await res.text().catch(() => '');
    throw new Error(`GET location failed: ${res.status()} — ${body.slice(0, 300)}`);
  }

  const body = await res.json() as {
    results: Array<{ uuid: string; display: string }>;
  };

  const target = body.results.find((l) =>
    l.display.toLowerCase().includes(env.APP_LOCATION.toLowerCase())
  );
  if (target) return target.uuid;

  const first = body.results[0];
  if (!first) throw new Error('No locations returned from /location');
  console.warn(
    `[OmniPlay] APP_LOCATION "${env.APP_LOCATION}" not found; using first: "${first.display}"`
  );
  return first.uuid;
}

/**
 * Fetch the UUID of the "OpenMRS ID" patient identifier type.
 * Returns whether Luhn validation is required so we can generate a valid ID.
 */
async function fetchIdentifierTypeInfo(): Promise<{ uuid: string; requiresLuhn: boolean }> {
  const ctx = await getContext();
  const res = await ctx.get('patientidentifiertype', {
    params: { v: 'default', limit: '50' },
  });

  if (!res.ok()) {
    const body = await res.text().catch(() => '');
    throw new Error(
      `GET patientidentifiertype failed: ${res.status()} — ${body.slice(0, 300)}`
    );
  }

  const body = await res.json() as {
    results: Array<{ uuid: string; display: string; validator: string | null; required: boolean }>;
  };

  // Prefer "OpenMRS ID" (Luhn-validated primary ID)
  const openmrsId = body.results.find((t) =>
    t.display.toLowerCase().includes('openmrs id')
  );
  if (openmrsId) {
    return {
      uuid: openmrsId.uuid,
      requiresLuhn: !!(openmrsId.validator?.toLowerCase().includes('luhn')),
    };
  }

  // Prefer a type with no validator for simplicity
  const noValidatorType = body.results.find((t) => !t.validator);
  if (noValidatorType) return { uuid: noValidatorType.uuid, requiresLuhn: false };

  const first = body.results[0];
  if (!first) throw new Error('No identifier types returned from /patientidentifiertype');
  return { uuid: first.uuid, requiresLuhn: false };
}

/**
 * Generate a valid patient identifier.
 * Attempts the idgen REST endpoint first; falls back to Luhn Mod-30 computation.
 */
async function generateIdentifier(requiresLuhn: boolean): Promise<string> {
  if (!requiresLuhn) {
    return `OMP-${Date.now()}`;
  }

  const ctx = await getContext();
  // idgen REST endpoint: GET idgen/nextIdentifier?source=1 returns a valid ID
  const idgenRes = await ctx.get('idgen/nextIdentifier', {
    params: { source: '1' },
  });

  if (idgenRes.ok()) {
    const idgenBody = await idgenRes.json() as {
      results?: Array<{ identifierValue: string }>;
    };
    const id = idgenBody.results?.[0]?.identifierValue;
    if (id) return id;
  }

  // idgen not available or no result — fall back to Luhn Mod-30 computation
  return computeLuhnMod30Identifier();
}

/**
 * Compute a Luhn Mod-30 valid identifier.
 * OpenMRS LuhnMod30IdentifierValidator uses a 32-char set (0-9 + A-Z minus I,O).
 */
function computeLuhnMod30Identifier(): string {
  const CHARSET = '0123456789ACDEFGHJKLMNPQRTUVWXYZ'; // 32 chars
  const base = String(Date.now()).slice(-6);
  let sum = 0;
  let alternate = false;
  for (let i = base.length - 1; i >= 0; i--) {
    const char = base[i] ?? '0';
    let n = CHARSET.indexOf(char);
    if (n === -1) n = parseInt(char, 10);
    if (alternate) {
      n *= 2;
      if (n >= CHARSET.length) n -= CHARSET.length - 1;
    }
    sum += n;
    alternate = !alternate;
  }
  const checkIndex = (CHARSET.length - (sum % CHARSET.length)) % CHARSET.length;
  return `${base}-${CHARSET[checkIndex] ?? '0'}`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a unique test patient via POST /patient.
 */
export async function createPatient(): Promise<CreatedPatient> {
  const ctx = await getContext();
  const ts = Date.now();
  const givenName = `Test${ts}`;
  const familyName = `OmniPlay`;
  const fullName = `${givenName} ${familyName}`;

  const [locationUuid, identifierTypeInfo] = await Promise.all([
    fetchLocationUuid(),
    fetchIdentifierTypeInfo(),
  ]);

  const identifier = await generateIdentifier(identifierTypeInfo.requiresLuhn);

  const payload = {
    person: {
      names: [{ givenName, familyName, preferred: true }],
      gender: 'M',
      birthdate: '1990-01-01',
      addresses: [
        {
          address1: '123 Test Street',
          cityVillage: 'Testville',
          country: 'Uganda',
          preferred: true,
        },
      ],
    },
    identifiers: [
      {
        identifier,
        identifierType: identifierTypeInfo.uuid,
        location: locationUuid,
        preferred: true,
      },
    ],
  };

  const res = await ctx.post('patient', { data: payload });
  if (!res.ok()) {
    const body = await res.text().catch(() => '');
    throw new Error(`POST patient failed (${res.status()}): ${body.slice(0, 600)}`);
  }

  const created = await res.json() as { uuid: string };
  return { uuid: created.uuid, fullName, identifier };
}

/**
 * Fetch a patient by UUID.
 */
export async function getPatient(uuid: string): Promise<Record<string, unknown>> {
  const ctx = await getContext();
  const res = await ctx.get(`patient/${uuid}`, { params: { v: 'default' } });
  if (!res.ok()) {
    throw new Error(`GET patient/${uuid} failed: ${res.status()}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

/**
 * Delete (purge) a patient by UUID.
 * Falls back to soft-void if purge is restricted.
 */
export async function deletePatient(uuid: string): Promise<void> {
  const ctx = await getContext();

  // Attempt hard purge first
  const purgeRes = await ctx.delete(`patient/${uuid}`, {
    params: { purge: 'true' },
  });
  if (purgeRes.ok() || purgeRes.status() === 404) return;

  // Fallback: soft-void (DELETE without purge param)
  const voidRes = await ctx.delete(`patient/${uuid}`);
  if (!voidRes.ok() && voidRes.status() !== 404) {
    console.warn(
      `[OmniPlay] deletePatient(${uuid}) returned ${voidRes.status()} — patient may remain.`
    );
  }
}
