import { expect, test } from '@playwright/test';
import { isSofiaSansCyrillicLoaded } from './fonts.js';

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
	expect(await isSofiaSansCyrillicLoaded(page)).toBe(true);
});
