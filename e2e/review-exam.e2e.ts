import { expect, test } from './test.js';
import { answerCorrectly } from './answers.js';
import { skipWelcome } from './storage.js';

test.describe('free review', () => {
	test('needs a completed lesson', async ({ page }) => {
		await skipWelcome(page);
		await page.goto('/review');
		await expect(page.getByText('Termine au moins une leçon pour pouvoir réviser.')).toBeVisible();
		await page.getByRole('link', { name: 'Retour au parcours' }).click();
		await expect(page).toHaveURL(/\/$/);
	});

	test('asks 12 questions on completed lessons', async ({ page }) => {
		await skipWelcome(page, { completedLessons: ['l1', 'l2'], examPassed: false });
		await page.goto('/');
		await page
			.getByRole('navigation', { name: 'Navigation principale' })
			.getByRole('link', { name: 'Révision' })
			.click();
		for (let i = 0; i < 12; i++) await answerCorrectly(page);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Révision terminée/);
		await expect(page.getByText('100 %')).toBeVisible();
	});
});

test.describe('final exam', () => {
	test.beforeEach(async ({ page }) => {
		await skipWelcome(page);
		await page.goto('/');
		await page.getByRole('link', { name: /Épreuve de Preslav/ }).click();
		await page.getByRole('button', { name: 'Commencer l’épreuve' }).click();
	});

	test('awards the diploma at 90 % or more', async ({ page }) => {
		// 3 mistakes out of 30 is still a pass. Missed questions never come back.
		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: 'Je ne sais pas' }).click();
			await expect(page.getByRole('status')).not.toContainText('Rappel');
			await page.getByRole('button', { name: 'Continuer' }).click();
		}
		for (let i = 0; i < 27; i++) await answerCorrectly(page);

		await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Épreuve réussie/);
		await expect(page.getByText('27 / 30')).toBeVisible();
		await page.getByRole('button', { name: 'Voir mon diplôme' }).click();
		await expect(page.getByText('Saint-maître absolue du cyrillique')).toBeVisible();
		await page.getByRole('textbox', { name: /Ton prénom/ }).fill('Alex');
		await expect(page.locator('.name')).toHaveText('Alex');

		await page.getByRole('link', { name: 'Retour au parcours' }).click();
		await expect(page.getByRole('link', { name: /Épreuve de Preslav.*Réussie/ })).toBeVisible();
	});

	test('fails below 90 %', async ({ page }) => {
		for (let i = 0; i < 4; i++) {
			await page.getByRole('button', { name: 'Je ne sais pas' }).click();
			await page.getByRole('button', { name: 'Continuer' }).click();
		}
		for (let i = 0; i < 26; i++) await answerCorrectly(page);
		await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Presque/);
		await expect(page.getByText('26 / 30')).toBeVisible();
		await expect(page.getByRole('button', { name: 'Retenter l’épreuve' })).toBeVisible();
	});
});
