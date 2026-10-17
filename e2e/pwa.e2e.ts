import { expect, test, type Response } from '@playwright/test';
import { isSofiaSansCyrillicLoaded } from './fonts.js';

test('works offline once the service worker is installed', async ({ page, context }) => {
	await page.goto('/');
	// The service worker precaches the whole app on install, then takes control of the page.
	await page.evaluate(() => navigator.serviceWorker.ready);
	await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

	await context.setOffline(true);
	// Some browsers fall back to their HTTP cache when offline, so also check that the page and
	// everything it loads were answered by the service worker.
	const responses: Response[] = [];
	page.on('response', (response) => responses.push(response));
	await page.reload();

	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cyrilingo');
	await expect(page.locator('.alphabet [lang="bg"]')).toHaveCount(30);
	expect(await isSofiaSansCyrillicLoaded(page)).toBe(true);

	expect(responses.map((response) => response.url())).toContain(page.url());
	for (const response of responses) {
		expect(response.fromServiceWorker(), response.url()).toBe(true);
	}
});

test('links an installable web app manifest', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#ff5a36');

	const href = await page.locator('link[rel="manifest"]').getAttribute('href');
	const manifestUrl = new URL(href ?? '', page.url());
	const response = await page.request.get(manifestUrl.href);
	expect(response.ok()).toBe(true);

	const manifest = await response.json();
	expect(manifest).toMatchObject({ name: 'Cyrilingo', display: 'standalone' });
	for (const icon of manifest.icons) {
		const iconResponse = await page.request.get(new URL(icon.src, manifestUrl).href);
		expect(iconResponse.headers()['content-type']).toBe('image/png');
	}
});
