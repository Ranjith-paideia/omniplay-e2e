import { Page, expect } from '@playwright/test';

/**
 * BasePage — shared helpers inherited by all POM classes.
 */
export class BasePage {
  constructor(protected readonly page: Page) {}

  /** Wait for the network to be idle then assert the page title contains `text`. */
  async waitForPageReady(titleContains?: string): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    if (titleContains) {
      await expect(this.page).toHaveTitle(new RegExp(titleContains, 'i'), {
        timeout: 30_000,
      });
    }
  }

  /** Navigate to an arbitrary path relative to BASE_URL. */
  async goto(path = ''): Promise<void> {
    await this.page.goto(path || '/');
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Scroll element into view and click it. */
  async scrollAndClick(selector: string): Promise<void> {
    const el = this.page.locator(selector);
    await el.scrollIntoViewIfNeeded();
    await el.click();
  }

  /** Wait up to `timeout` ms for a toast / notification to disappear. */
  async waitForToastToDisappear(timeout = 10_000): Promise<void> {
    const toast = this.page.locator('[data-testid="toast"], .cds--toast-notification');
    try {
      await toast.waitFor({ state: 'hidden', timeout });
    } catch {
      // Toast may never appear — that's fine
    }
  }

  /** Current page URL. */
  get url(): string {
    return this.page.url();
  }
}
