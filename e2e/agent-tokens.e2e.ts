import { newEmail, signUp } from './accounts.js';
import { skipWelcome } from './storage.js';
import { expect, test } from './test.js';

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('[AC-53] regenerates the agent key in the settings, in clear only until the page is left', async ({
	page,
	browserName
}) => {
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	const section = page.getByRole('region', { name: 'Clé MCP' });
	const key = section.getByLabel('Clé pour un agent IA');
	const copy = section.getByRole('button', { name: 'Copier la clé' });
	await expect(key).toHaveValue('');
	await expect(key).toHaveAttribute('placeholder', 'Aucune clé');
	await expect(copy).toBeDisabled();

	// The « ? » explains the key on hover.
	await section.getByRole('button', { name: 'À quoi sert cette clé ?' }).hover();
	await expect(section.getByRole('tooltip')).toBeVisible();

	// The first key needs no confirmation: there is none to replace. It shows in clear.
	await section.getByRole('button', { name: 'Régénérer' }).click();
	await expect(key).toHaveValue(/^[\w-]{43}$/);
	await expect(copy).toBeEnabled();
	const first = await key.inputValue();

	// Once the page is left, the key exists but shows as asterisks only.
	await page.reload();
	await expect(key).toHaveValue(/^•+$/);
	await expect(copy).toBeDisabled();

	// Replacing it asks first, then shows the new key.
	await section.getByRole('button', { name: 'Régénérer' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Régénérer' }).click();
	await expect(key).toHaveValue(/^[\w-]{43}$/);
	expect(await key.inputValue()).not.toBe(first);
});

test('copies the agent key', async ({ page, context, browserName }) => {
	// Only Chromium lets a test grant the clipboard permissions.
	test.skip(browserName !== 'chromium', 'clipboard permissions are Chromium only');
	await context.grantPermissions(['clipboard-read', 'clipboard-write']);
	await signUp(page, newEmail(browserName));
	await page.goto('/settings');
	const section = page.getByRole('region', { name: 'Clé MCP' });
	await section.getByRole('button', { name: 'Régénérer' }).click();
	const field = section.getByLabel('Clé pour un agent IA');
	await expect(field).toHaveValue(/^[\w-]{43}$/);
	const key = await field.inputValue();

	await section.getByRole('button', { name: 'Copier la clé' }).click();
	await expect(section.getByRole('status')).toHaveText('Clé copiée.');
	expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(key);
});
