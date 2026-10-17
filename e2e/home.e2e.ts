import { expect, test } from './test.js';
import { isSofiaSansCyrillicLoaded } from './fonts.js';
import { skipWelcome } from './storage.js';

test.describe('first launch', () => {
	test('shows the welcome screen, which opens lesson 1', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Bienvenue sur Cyrilingo/);
		await page.getByRole('button', { name: 'C’est parti' }).click();
		await expect(page).toHaveURL(/\/lesson\/l1$/);

		// The welcome screen only shows once.
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cyrilingo');
	});

	test('loads the self-hosted Sofia Sans Cyrillic subset', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
		expect(await isSofiaSansCyrillicLoaded(page)).toBe(true);
	});
});

test.describe('home', () => {
	test.beforeEach(async ({ page }) => {
		await skipWelcome(page);
		await page.goto('/');
	});

	test('shows the path: 4 sections, 10 lessons and the final exam', async ({ page }) => {
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cyrilingo');
		await expect(page.getByRole('heading', { level: 3 })).toHaveText([
			'Les alliées',
			'Les faux amis',
			'Les cousines grecques',
			'Les nouvelles venues'
		]);
		await expect(page.getByRole('link', { name: /^Leçon \d+/ })).toHaveCount(10);
		await expect(page.getByRole('link', { name: /Épreuve de Preslav/ })).toBeVisible();
		await expect(page.getByRole('link', { name: /Leçon 1 .*À faire maintenant/ })).toBeVisible();
	});

	test('tags lesson letters as Bulgarian', async ({ page }) => {
		await expect(page.locator('.letters[lang="bg"]').first()).toHaveText('А Т М');
	});

	test('opens the suggested lesson with Commencer', async ({ page }) => {
		await page.getByRole('link', { name: 'Commencer' }).click();
		await expect(page).toHaveURL(/\/lesson\/l1$/);
	});

	test('navigates with the tab bar', async ({ page }) => {
		const nav = page.getByRole('navigation', { name: 'Navigation principale' });
		await nav.getByRole('link', { name: 'Réglages' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Réglages');
		await expect(nav.getByRole('link', { name: 'Réglages' })).toHaveAttribute(
			'aria-current',
			'page'
		);
		await nav.getByRole('link', { name: 'Parcours' }).click();
		await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cyrilingo');
	});
});

test.describe('settings', () => {
	test.beforeEach(async ({ page }) => {
		await skipWelcome(page, { completedLessons: ['l1', 'l2'], examPassed: false });
		await page.goto('/settings');
	});

	test('saves the sound effects setting', async ({ page }) => {
		const toggle = page.getByRole('switch', { name: /Effets sonores/ });
		await expect(toggle).toBeChecked();
		await toggle.click();
		await page.reload();
		await expect(page.getByRole('switch', { name: /Effets sonores/ })).not.toBeChecked();
	});

	test('resets progress after confirmation', async ({ page }) => {
		await page.getByRole('button', { name: 'Réinitialiser ma progression' }).click();
		await page.getByRole('button', { name: 'Tout effacer' }).click();
		await expect(page.getByRole('status')).toHaveText('Ta progression a été réinitialisée.');
		await page.goto('/');
		await expect(page.getByRole('link', { name: /Leçon 1 .*À faire maintenant/ })).toBeVisible();
	});
});
