import { expect, test } from '@playwright/test';
import { answerCorrectly, typeAnswer } from './answers.js';
import { skipWelcome } from './storage.js';

test.beforeEach(async ({ page }) => {
	await skipWelcome(page);
});

test('completes a lesson from start to finish', async ({ page }) => {
	await page.goto('/lesson/l3');

	// Discovery cards for the 3 new letters.
	for (const letter of ['Н', 'С', 'Р']) {
		await expect(page.getByRole('heading', { level: 2 })).toContainText(letter);
		await page.getByRole('button', { name: /Suivant|Aux questions/ }).click();
	}

	// A wrong answer freezes the progress bar and the question comes back later.
	const bar = page.getByRole('progressbar', { name: 'Progression' });
	await expect(bar).toHaveAttribute('aria-valuenow', '0');
	await page.getByRole('button', { name: 'Je ne sais pas' }).click();
	await expect(page.getByRole('status')).toContainText('Voici la réponse');
	await page.getByRole('button', { name: 'Continuer' }).click();
	await expect(bar).toHaveAttribute('aria-valuenow', '0');

	// 16 correct answers end the lesson, the missed question included.
	for (let i = 0; i < 16; i++) await answerCorrectly(page);

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Leçon terminée/);
	await expect(page.getByText('94 %')).toBeVisible();
	await page.getByRole('link', { name: 'Continuer' }).click();
	await expect(page).toHaveURL(/\/lesson\/l1$/);

	await page.goto('/');
	await expect(page.getByRole('link', { name: /Leçon 3 .*Terminée/ })).toBeVisible();
});

test('highlights the wrong letters of a reading', async ({ page }) => {
	await page.goto('/lesson/l1');
	for (let i = 0; i < 3; i++)
		await page.getByRole('button', { name: /Suivant|Aux questions/ }).click();
	for (;;) {
		await expect(page.locator('.feedback')).toHaveCount(0);
		if ((await page.locator('.prompt').innerText()) === 'Lis ce mot') break;
		await answerCorrectly(page);
	}
	await typeAnswer(page, 'xxxxxx');
	await expect(page.getByRole('status')).toContainText('Pas tout à fait');
	await expect(page.getByRole('status')).toContainText('Réponse :');
});

test('asks for confirmation before leaving a lesson', async ({ page }) => {
	await page.goto('/lesson/l2');
	await page.getByRole('button', { name: 'Quitter' }).click();
	await expect(page.getByRole('dialog')).toContainText(
		'Ta progression dans cette leçon sera perdue.'
	);
	await page.getByRole('button', { name: 'Rester' }).click();
	await expect(page.getByRole('dialog')).toBeHidden();
	await page.getByRole('button', { name: 'Quitter' }).click();
	await page.getByRole('dialog').getByRole('button', { name: 'Quitter' }).click();
	await expect(page).toHaveURL(/\/$/);
});
