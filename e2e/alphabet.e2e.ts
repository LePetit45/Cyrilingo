import { expect, test } from '@playwright/test';
import { skipWelcome } from './storage.js';

test.beforeEach(async ({ page }) => {
	await skipWelcome(page, { completedLessons: ['l1', 'l3'], examPassed: false });
	await page.goto('/alphabet');
});

test('shows the 30 letters, learned or not', async ({ page }) => {
	await expect(page.getByText('6 lettres apprises sur 30')).toBeVisible();
	await expect(page.getByRole('button', { name: /, apprise$/ })).toHaveCount(6);
	await expect(page.getByRole('button', { name: /, pas encore apprise$/ })).toHaveCount(24);
	await expect(page.getByRole('button', { name: 'Р, apprise' })).toBeVisible();
});

test('opens the card of any letter, learned or not', async ({ page }) => {
	await page.getByRole('button', { name: 'Ж, pas encore apprise' }).click();
	const card = page.getByRole('dialog');
	await expect(card.getByRole('heading', { level: 2 })).toContainText('Ж');
	await expect(card).toContainText('« j »');
	await expect(card).toContainText('officiel : zh');
	await card.getByRole('button', { name: 'Fermer' }).click();
	await expect(card).toBeHidden();
});
