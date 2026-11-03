import { randomInt } from 'node:crypto';
import { test as base, type Page } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Headers making a browser context look like a client of its own behind the trusted proxy: the
 * API limits failed sign-ins per IP (AC-20), and the tests' deliberate failures would otherwise
 * add up over the whole run, across browsers.
 */
export const ownClientHeaders = () => ({
	'X-Forwarded-For': `10.${randomInt(256)}.${randomInt(256)}.${randomInt(1, 255)}`
});

/** Disables Web Audio and recordings on the page, so it never makes a sound. */
export async function mute(page: Page) {
	await page.addInitScript(() => {
		Object.defineProperty(window, 'AudioContext', { value: undefined });
		HTMLMediaElement.prototype.play = () => Promise.resolve();
	});
}

/**
 * Playwright's `test`, with the page muted: Web Audio is disabled and recordings never play, as
 * the app's sound effects and voice would otherwise sound on the machine running the tests.
 */
export const test = base.extend({
	page: async ({ page }, use) => {
		await page.context().setExtraHTTPHeaders(ownClientHeaders());
		await mute(page);
		await use(page);
	}
});
