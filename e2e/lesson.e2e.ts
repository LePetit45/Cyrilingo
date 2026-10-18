import { expect, test } from './test.js';
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
	await expect(page.locator('.feedback')).toContainText('Voici la réponse');
	await page.getByRole('button', { name: 'Continuer' }).click();
	await expect(bar).toHaveAttribute('aria-valuenow', '0');

	// 16 correct answers end the lesson, the missed question included.
	for (let i = 0; i < 16; i++) await answerCorrectly(page);

	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Leçon terminée/);
	await expect(page.getByText('94 %')).toBeVisible();
	await expect(page.getByRole('link', { name: 'Accueil' })).toHaveAttribute('href', '/');
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
	await expect(page.locator('.feedback')).toContainText('Pas tout à fait');
	await expect(page.locator('.feedback')).toContainText('Réponse :');
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

test.describe('keyboard and taps', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/lesson/l3');
		for (let i = 0; i < 3; i++) {
			await page.getByRole('button', { name: /Suivant|Aux questions/ }).click();
		}
	});

	test('Enter on the quit button opens the confirmation, even during feedback', async ({
		page
	}) => {
		await page.getByRole('button', { name: 'Je ne sais pas' }).click();
		await expect(page.getByRole('button', { name: 'Continuer' })).toBeFocused();
		await page.getByRole('button', { name: 'Quitter' }).focus();
		await page.keyboard.press('Enter');
		await expect(page.getByRole('dialog')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.locator('.feedback')).toBeVisible();
	});

	test('number keys do nothing while the quit confirmation is open', async ({ page }) => {
		await page.getByRole('button', { name: 'Quitter' }).click();
		await page.keyboard.press('1');
		await page.getByRole('button', { name: 'Rester' }).click();
		await expect(page.locator('.feedback')).toHaveCount(0);
	});

	test('a double tap on Continue does not answer the next question', async ({ page }) => {
		await page.getByRole('button', { name: 'Je ne sais pas' }).click();
		await page.getByRole('button', { name: 'Continuer' }).dblclick();
		await expect(page.locator('.feedback')).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Je ne sais pas' })).toBeVisible();
	});
});
