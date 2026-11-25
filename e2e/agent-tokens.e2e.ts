import { accountSection, newEmail, signUp } from './accounts.js';
import { skipWelcome } from './storage.js';
import { expect, test } from './test.js';

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('[AC-53] creates an agent token shown once, then revokes every token', async ({
	page,
	browserName
}) => {
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	await accountSection(page).getByRole('link', { name: 'Agent IA' }).click();
	await expect(page.getByRole('heading', { level: 1, name: 'Agent IA' })).toBeVisible();

	await page.getByRole('button', { name: 'Créer un jeton pour un agent' }).click();
	const field = page.getByLabel('Ton jeton');
	await expect(field).toHaveValue(/^[\w-]{43}$/);
	await expect(page.getByText('il ne sera plus jamais affiché')).toBeVisible();

	// Shown once: coming back to the page shows no token.
	await page.reload();
	await expect(page.getByRole('button', { name: 'Créer un jeton pour un agent' })).toBeVisible();
	await expect(page.getByLabel('Ton jeton')).toHaveCount(0);

	await page.getByRole('button', { name: 'Révoquer tous les jetons' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Révoquer', exact: true }).click();
	await expect(page.getByRole('status')).toHaveText('Tous tes jetons ont été révoqués.');

	// This device is still signed in.
	await page.goto('/settings');
	await expect(accountSection(page).getByRole('button', { name: 'Se déconnecter' })).toBeVisible();
});
