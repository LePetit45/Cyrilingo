import type { Page } from '@playwright/test';
import { newEmail, signUp } from './accounts.js';
import { answerCorrectly, READ_ALOUD_PROMPT, skipReadAloud } from './answers.js';
import { fakeMicrophone } from './microphone.js';
import { skipWelcome } from './storage.js';
import { expect, test } from './test.js';

// Read aloud (SPEC.md › The model feature). The end-to-end API runs a fake speech model that
// always hears « абв », a text no lesson asks for: every try is a mismatch.

const HEARD = 'абв';

/** Opens lesson 4 past its discovery cards. */
async function startLesson(page: Page) {
	await page.goto('/lesson/l4');
	for (let i = 0; i < 3; i++) {
		await page.getByRole('button', { name: /Suivant|Aux questions/ }).click();
	}
}

/** Answers questions until a read-aloud question shows. */
async function untilReadAloud(page: Page) {
	for (;;) {
		await expect(page.locator('.feedback')).toHaveCount(0);
		if ((await page.locator('.prompt').innerText()) === READ_ALOUD_PROMPT) return;
		await answerCorrectly(page, { readAloud: 'keep' });
	}
}

/** Answers every question left, skipping read-aloud ones, until the summary. */
async function finishLesson(page: Page) {
	const summary = page.getByRole('heading', { level: 1, name: /Leçon terminée/ });
	for (;;) {
		await skipReadAloud(page);
		if (await summary.count()) return;
		await answerCorrectly(page);
	}
}

const microphone = (page: Page) => page.getByRole('button', { name: /^(Parler|Arrêter)$/ });

test.describe('signed in', () => {
	test.beforeEach(async ({ page, browserName }) => {
		await skipWelcome(page);
		await signUp(page, newEmail(browserName));
	});

	test('[AC-40] [AC-43] [AC-48] reads a word aloud, shows what was heard, then allows one more try', async ({
		page
	}) => {
		await fakeMicrophone(page);
		await startLesson(page);
		await untilReadAloud(page);
		const word = (await page.locator('.shown').innerText()).trim();

		// Recording: the button turns into « Arrêter » and says it listens (AC-48).
		await microphone(page).click();
		await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible();
		await expect(page.getByRole('status').filter({ hasText: 'J’écoute…' })).toBeVisible();
		await page.getByRole('button', { name: 'Arrêter' }).click();

		// A mismatch shows the validated text heard, the expected reading and a second try.
		const feedback = page.locator('.feedback');
		await expect(feedback).toContainText('Pas tout à fait');
		await expect(feedback).toContainText(`J’ai entendu : ${HEARD}`);
		await expect(feedback).toContainText('Réponse :');
		await feedback.getByRole('button', { name: 'Réessayer' }).click();

		// Same word, second try; failing again passes the question without penalty.
		await expect(page.locator('.shown')).toHaveText(word);
		const bar = page.getByRole('progressbar', { name: 'Progression' });
		const before = Number(await bar.getAttribute('aria-valuenow'));
		await microphone(page).click();
		await page.getByRole('button', { name: 'Arrêter' }).click();
		await expect(feedback).toContainText('On passe à la suite, sans pénalité.');
		await feedback.getByRole('button', { name: 'Continuer' }).click();

		// It never comes back, yet the bar moves on; the missed try lowers the first-try rate.
		await expect(bar).not.toHaveAttribute('aria-valuenow', String(before));
		expect(Number(await bar.getAttribute('aria-valuenow'))).toBeGreaterThan(before);
		await finishLesson(page);
		await expect(page.getByText('100 %')).toHaveCount(0);
	});

	test('[AC-41] « Je ne peux pas parler » passes the question and removes the other read-aloud question', async ({
		page
	}) => {
		await startLesson(page);
		await untilReadAloud(page);
		await page.getByRole('button', { name: 'Je ne peux pas parler' }).click();
		await expect(page.locator('.feedback')).toHaveCount(0);

		// No read-aloud question until the end, and the skipped one is not counted.
		const summary = page.getByRole('heading', { level: 1, name: /Leçon terminée/ });
		while (!(await summary.count())) {
			await expect(page.locator('.feedback')).toHaveCount(0);
			if (await summary.count()) break;
			await expect(page.locator('.prompt')).not.toHaveText(READ_ALOUD_PROMPT);
			await answerCorrectly(page, { readAloud: 'keep' });
		}
		await expect(page.getByText('100 %')).toBeVisible();
	});

	test('[AC-41] [AC-48] a refused microphone says so and the lesson goes on without read aloud', async ({
		page
	}) => {
		await fakeMicrophone(page, { denied: true });
		await startLesson(page);
		await untilReadAloud(page);
		await microphone(page).click();
		const feedback = page.locator('.feedback');
		await expect(feedback).toContainText('Lecture à voix haute indisponible');
		await expect(feedback).toContainText('Le micro est bloqué.');
		await feedback.getByRole('button', { name: 'Continuer' }).click();

		const summary = page.getByRole('heading', { level: 1, name: /Leçon terminée/ });
		while (!(await summary.count())) {
			await expect(page.locator('.feedback')).toHaveCount(0);
			if (await summary.count()) break;
			await expect(page.locator('.prompt')).not.toHaveText(READ_ALOUD_PROMPT);
			await answerCorrectly(page, { readAloud: 'keep' });
		}
		await expect(page.getByText('100 %')).toBeVisible();
	});
});

test("[AC-40] a guest's lesson has no read-aloud question, and its summary says signing in adds them", async ({
	page
}) => {
	await skipWelcome(page);
	await startLesson(page);
	for (let i = 0; i < 16; i++) {
		await expect(page.locator('.prompt')).not.toHaveText(READ_ALOUD_PROMPT);
		await answerCorrectly(page, { readAloud: 'keep' });
	}
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(/^Leçon terminée/);
	await expect(page.getByText('Avec un compte, tu lis aussi des mots à voix haute')).toBeVisible();
});
