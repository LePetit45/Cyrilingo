import { accountSection, newEmail, signUp } from './accounts.js';
import { skipWelcome } from './storage.js';
import { expect, test } from './test.js';

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('[AC-53] regenerates the agent key in the settings, shown only until the page is left', async ({
	page,
	browserName
}) => {
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	const account = accountSection(page);
	const key = account.getByLabel('Clé pour un agent IA');
	const show = account.getByRole('button', { name: 'Afficher' });
	await expect(account).toContainText('Aucune clé pour l’instant.');
	await expect(show).toBeDisabled();

	// The first key needs no confirmation: there is none to replace.
	await account.getByRole('button', { name: 'Régénérer' }).click();
	await expect(key).toHaveAttribute('type', 'password');
	await show.click();
	await expect(key).toHaveAttribute('type', 'text');
	await expect(key).toHaveValue(/^[\w-]{43}$/);
	const first = await key.inputValue();
	await account.getByRole('button', { name: 'Masquer' }).click();
	await expect(key).toHaveAttribute('type', 'password');

	// Once the page is left, the key exists but cannot be shown again.
	await page.reload();
	await expect(account).toContainText('Une clé existe, mais elle ne peut plus être affichée.');
	await expect(key).toHaveValue('');
	await expect(show).toBeDisabled();

	// Replacing it asks first, then gives a new key.
	await account.getByRole('button', { name: 'Régénérer' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Régénérer' }).click();
	await show.click();
	await expect(key).toHaveValue(/^[\w-]{43}$/);
	expect(await key.inputValue()).not.toBe(first);
});
