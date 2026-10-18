import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Playwright's `test`, with the page muted: Web Audio is disabled and recordings never play, as
 * the app's sound effects and voice would otherwise sound on the machine running the tests.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await page.addInitScript(() => {
			Object.defineProperty(window, 'AudioContext', { value: undefined });
			HTMLMediaElement.prototype.play = () => Promise.resolve();
		});
		await use(page);
	}
});
