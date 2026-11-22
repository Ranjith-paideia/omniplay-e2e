import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root (works from any cwd)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `[OmniPlay] Missing required environment variable: "${name}"\n` +
        `  Copy .env.example to .env and fill in the values.`
    );
  }
  return value;
}

function optionalEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  /** Base URL of the web application under test */
  BASE_URL: requireEnv('BASE_URL'),

  /** Base URL for REST API calls */
  API_BASE_URL: requireEnv('API_BASE_URL'),

  /** Login username */
  APP_USERNAME: requireEnv('APP_USERNAME'),

  /** Login password */
  APP_PASSWORD: requireEnv('APP_PASSWORD'),

  /** Location to select on the login location screen */
  APP_LOCATION: optionalEnv('APP_LOCATION', 'Outpatient Clinic'),
} as const;

export type Env = typeof env;
