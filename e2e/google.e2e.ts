import { accountSection, newEmail, signUp } from './accounts.js';
import { expect, test } from './test.js';
import { skipWelcome } from './storage.js';

// The end-to-end API runs without Google settings: the whole round trip through Google is tested
// against a fake client in apps/api (http/google.test.ts); here, what the learner sees of it.

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('« Continuer avec Google » comes back with a sentence when Google sign-in is off', async ({
	page
}) => {
	await page.goto('/signin');
	await page.getByRole('link', { name: 'Continuer avec Google' }).click();

	await expect(page).toHaveURL(/\/signin\/google\?error=google_unavailable$/);
	await expect(page.getByRole('alert')).toHaveText(
		'La connexion avec Google n’est pas disponible pour le moment. Utilise ton adresse e-mail et un mot de passe.'
	);
	await page.getByRole('link', { name: 'Retour à la connexion' }).last().click();
	await expect(
		page.getByRole('heading', { level: 1, name: 'Connexion', exact: true })
	).toBeVisible();
});

test('[AC-16] tells the learner when Google has not verified their e-mail', async ({ page }) => {
	await page.goto('/signin/google?error=google_unverified');
	await expect(page.getByRole('alert')).toContainText('Google n’a pas vérifié cette adresse');
	await expect(page.getByRole('link', { name: 'Réessayer' })).toHaveAttribute(
		'href',
		'/api/auth/google'
	);
});

test('the settings show how the account signs in', async ({ page, browserName }) => {
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	await expect(accountSection(page).getByText('Connexion avec')).toBeVisible();
	await expect(accountSection(page).getByText('Mot de passe', { exact: true })).toBeVisible();
});
