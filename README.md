# OmniPlay E2E 🎭

> **Production-grade, domain-agnostic Playwright + TypeScript automation framework**
> Pre-wired to the [OpenMRS O3](https://dev3.openmrs.org/openmrs/spa) healthcare demo — swap the `.env` to target any web app.

[![Playwright Tests](https://github.com/<your-org>/omniplay-e2e/actions/workflows/playwright.yml/badge.svg)](https://github.com/<your-org>/omniplay-e2e/actions/workflows/playwright.yml)

---

## ✨ Key Capabilities

| Capability | Detail |
|---|---|
| **Page Object Model** | Modular POM classes in `src/pages/` using resilient Playwright locators (`getByRole`, `getByLabel`, `getByPlaceholder`, `getByText`) — no brittle XPath or generated CSS classes |
| **`storageState` Auth Reuse** | One-time login via `tests/auth.setup.ts`; all E2E tests reuse the saved browser session so no test re-logs in |
| **REST API Seeding** | `src/api/patientApi.ts` creates, verifies, and cleans up test patients via `APIRequestContext` with Basic Auth — including idgen-based valid OpenMRS identifiers |
| **Custom Fixtures** | `src/fixtures/testFixtures.ts` injects all POMs + a `seededPatient` fixture with automatic teardown |
| **Parallel Execution** | `fullyParallel: true`; separate `api` and `chromium` Playwright projects run concurrently |
| **GitHub Actions CI** | Push/PR to `main` triggers full run on `ubuntu-latest`; HTML report uploaded as artifact |

---

## 📁 Folder Structure

```
omniplay-e2e/
├── .env                        # Local env vars (git-ignored)
├── .env.example                # Template — copy to .env
├── .github/
│   └── workflows/
│       └── playwright.yml      # GitHub Actions CI pipeline
├── playwright.config.ts        # Playwright configuration
├── tsconfig.json               # Strict TypeScript config
├── src/
│   ├── api/
│   │   └── patientApi.ts       # REST API client (create/get/delete patient)
│   ├── config/
│   │   └── env.ts              # Typed, validated environment variables
│   ├── fixtures/
│   │   └── testFixtures.ts     # Custom Playwright fixtures (POMs + seededPatient)
│   └── pages/
│       ├── BasePage.ts         # Shared helpers (navigation, waits)
│       ├── HomePage.ts         # Dashboard + patient search
│       ├── LoginPage.ts        # Two-step OpenMRS O3 login
│       ├── PatientChartPage.ts # Patient banner + demographics assertions
│       └── PatientRegistrationPage.ts  # Registration form
├── tests/
│   ├── auth.setup.ts           # Playwright setup project (saves storageState)
│   ├── api/
│   │   └── patient-api.spec.ts # API-layer CRUD tests
│   └── e2e/
│       ├── dashboard.spec.ts           # Auth reuse smoke test
│       ├── patient-search.spec.ts      # API-seeded patient → UI search
│       └── patient-registration.spec.ts # Full UI registration flow
└── playwright/.auth/           # storageState files (git-ignored)
```

---

## 🚀 Quickstart

### Prerequisites
- Node.js 20+
- Internet access to `dev3.openmrs.org` (the demo target)

### Setup

```bash
# 1. Clone the repo
git clone <repo-url> omniplay-e2e
cd omniplay-e2e

# 2. Install dependencies
npm install

# 3. Install Playwright browsers (Chromium only)
npx playwright install chromium

# 4. Create your .env file
cp .env.example .env
# Edit .env if needed — defaults point to dev3.openmrs.org
```

### Run Tests

```bash
# Run all tests (API + E2E)
npm test

# Run only E2E tests (headed — watch the browser)
npm run test:headed

# Open Playwright interactive UI
npm run test:ui

# Run only API tests
npm run test:api

# Run only E2E browser tests
npm run test:e2e

# TypeScript type check (no emit)
npm run typecheck

# View HTML report
npm run report
```

---

## 📊 Viewing Reports & Traces

After running tests, open the HTML report:

```bash
npm run report
# Opens playwright-report/index.html in your browser
```

**View a trace** (recorded on first retry):

```bash
npx playwright show-trace test-results/<test-name>/trace.zip
```

The trace viewer shows a timeline of every action, network request, and screenshot.

---

## ⚙️ Configuration

All environment variables are defined in `.env` and validated in `src/config/env.ts`:

| Variable | Default | Description |
|---|---|---|
| `BASE_URL` | `https://dev3.openmrs.org/openmrs/spa` | Web app base URL |
| `API_BASE_URL` | `https://dev3.openmrs.org/openmrs/ws/rest/v1` | REST API base URL |
| `APP_USERNAME` | `admin` | Login username |
| `APP_PASSWORD` | `Admin123` | Login password |
| `APP_LOCATION` | `Outpatient Clinic` | Location to select after login |

> [!NOTE]
> `o3.openmrs.org` is protected by Cloudflare WAF which blocks headless API clients.
> `dev3.openmrs.org` is the recommended target for automation — it accepts Basic Auth directly.

---

## 🔄 Plug-and-Play: Adapting OmniPlay E2E to Any Domain

OmniPlay is intentionally domain-agnostic. To retarget it to any web app:

1. **Update `.env`**: Point `BASE_URL` and `API_BASE_URL` at your app.
2. **Replace POMs**: Rewrite `src/pages/` classes with locators for your app's UI.
3. **Replace API client**: Swap `src/api/patientApi.ts` for your app's data-seeding API.
4. **Update auth setup**: Edit `tests/auth.setup.ts` to match your login flow.
5. **Write your tests**: Add specs in `tests/e2e/` and `tests/api/` using the same fixture pattern.

The fixture system, parallel config, CI pipeline, `storageState` reuse, and reporting infrastructure all carry over unchanged.

---

## 🏗️ CI Pipeline

The GitHub Actions workflow (`.github/workflows/playwright.yml`) runs on every push/PR to `main`:

1. ✅ Checkout + Node 20 setup
2. ✅ `npm ci`
3. ✅ `npx playwright install --with-deps chromium`
4. ✅ `npm run typecheck` (strict TypeScript)
5. ✅ `npx playwright test` (all projects: setup → api + chromium)
6. ✅ Upload `playwright-report/` as a GitHub Actions artifact (retained 30 days)

Secrets (`BASE_URL`, `APP_USERNAME`, etc.) default to the public dev3 demo if not set, so CI runs out-of-the-box.

---

## 📝 Tech Stack

- [Playwright](https://playwright.dev/) 1.49+
- [TypeScript](https://www.typescriptlang.org/) 5.7+ (strict mode)
- [dotenv](https://github.com/motdotla/dotenv) for environment management
- [OpenMRS O3](https://dev3.openmrs.org/) — Carbon Design System SPA

---

*Built with ❤️ as a demonstration of production-grade test automation patterns.*
