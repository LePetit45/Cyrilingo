import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
	await page.goto('/');
});

test('shows the app name', async ({ page }) => {
	await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cyrilingo');
	await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
});

test('renders the 30 letters tagged as Bulgarian', async ({ page }) => {
	const letters = page.locator('.alphabet [lang="bg"]');
	await expect(letters).toHaveCount(30);
	await expect(letters.first()).toHaveText('Аа');
});

test('loads the self-hosted Sofia Sans Cyrillic subset', async ({ page }) => {
	const loaded = await page.evaluate(async () => {
		await document.fonts.ready;
		return [...document.fonts].some(
			(face) =>
				face.family.replaceAll('"', '') === 'Sofia Sans Variable' &&
				face.unicodeRange.includes('U+400') &&
				face.status === 'loaded'
		);
	});
	expect(loaded).toBe(true);
});
