import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Playwright's `test`, with the page's Web Audio disabled: the app's sound effects would
 * otherwise beep on the machine running the tests.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, 'AudioContext', { value: undefined });
		});
		await use(page);
	}
});
