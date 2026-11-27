import { expect, test } from './test.js';
import { isSofiaSansCyrillicLoaded } from './fonts.js';

test('loads files as pages need them, without a service worker', async ({ page }) => {
	const requested: string[] = [];
	page.on('request', (request) => requested.push(new URL(request.url()).pathname));
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Bienvenue sur Cyrilingo/);
	expect(await isSofiaSansCyrillicLoaded(page)).toBe(true);

	expect(await page.evaluate(() => navigator.serviceWorker.getRegistrations())).toHaveLength(0);
	// No recording is downloaded before one is played (the app has about 700).
	expect(requested.filter((path) => path.endsWith('.mp3'))).toEqual([]);
});

test('retires the service worker an earlier version installed', async ({ page }) => {
	await page.goto('/');
	// What a browser kept from the precaching worker: its caches and its registration.
	await page.evaluate(async () => {
		const cache = await caches.open('cyrilingo-immutable');
		await cache.put('/old-file', new Response('old'));
		await navigator.serviceWorker.register('/service-worker.js');
	});

	await expect
		.poll(() => page.evaluate(() => navigator.serviceWorker.getRegistrations()))
		.toHaveLength(0);
	expect(await page.evaluate(() => caches.keys())).toEqual([]);
});

test('links an installable web app manifest', async ({ page }) => {
	await page.goto('/');
	await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#43a00e');

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
