import { expect, type Page } from '@playwright/test';
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '@cyrilingo/core/alphabet.js';
import { LETTERS } from '@cyrilingo/core/content/letters.js';
import { lettersIn } from '@cyrilingo/core/reading.js';
import { fr } from '@cyrilingo/core/content/i18n/fr.js';

// Answers questions the way a learner who knows every letter would, reading the screen.

function letterShown(glyphs: string): BulgarianLetter {
	const combination = BULGARIAN_ALPHABET.find((letter) => LETTERS[letter].taughtAs === glyphs);
	return combination ?? (glyphs[0].toLocaleUpperCase('bg') as BulgarianLetter);
}

function letterWithSound(sound: string): BulgarianLetter {
	return BULGARIAN_ALPHABET.find((letter) => fr.letters[letter].phonetic === sound)!;
}

function glyphOf(letter: BulgarianLetter): string {
	return LETTERS[letter].taughtAs ?? `${letter}${letter.toLocaleLowerCase('bg')}`;
}

/** Picks the choice with this label (the key hint is hidden from its accessible name). */
async function chooseByLabel(page: Page, label: string) {
	await page.locator('.choices').getByRole('button', { name: label, exact: true }).click();
}

/** Types an answer, on the in-app keyboard on touch devices, in the text field otherwise. */
export async function typeAnswer(page: Page, answer: string) {
	const field = page.getByRole('textbox', { name: 'Ta lecture, en lettres latines' });
	const keyboard = page.getByRole('group', { name: 'Clavier' });
	await field.or(keyboard).waitFor();
	if (await field.count()) {
		await field.fill(answer);
		await field.press('Enter');
		return;
	}
	for (const key of answer) await keyboard.getByRole('button', { name: key, exact: true }).click();
	await page.getByRole('button', { name: 'Vérifier' }).click();
}

/** The prompt of a read-aloud question, asked in the lessons of a signed-in learner. */
export const READ_ALOUD_PROMPT = 'Lis ce mot à voix haute';

/**
 * Skips the read-aloud question on screen, if any, with « Je ne peux pas parler »: that drops the
 * other read-aloud questions of the lesson too.
 */
export async function skipReadAloud(page: Page) {
	await expect(page.locator('.feedback')).toHaveCount(0);
	const prompt = page.locator('.prompt');
	if ((await prompt.count()) && (await prompt.innerText()) === READ_ALOUD_PROMPT) {
		await page.getByRole('button', { name: 'Je ne peux pas parler' }).click();
		await expect(prompt.filter({ hasText: READ_ALOUD_PROMPT })).toHaveCount(0);
	}
}

/**
 * Answers the current question correctly, then continues. Unless told otherwise, read-aloud
 * questions are skipped on the way, before and after, so one call answers one regular question
 * whether the learner is signed in or not.
 */
export async function answerCorrectly(
	page: Page,
	{ readAloud = 'skip' }: { readAloud?: 'skip' | 'keep' } = {}
) {
	if (readAloud === 'skip') await skipReadAloud(page);
	// Wait for the previous feedback to be gone, so the screen shows the new question.
	await expect(page.locator('.feedback')).toHaveCount(0);
	const prompt = (await page.locator('.prompt').innerText()).replace(/\s+/g, ' ');
	if (prompt === 'Comment se lit cette lettre ?') {
		const letter = letterShown(await page.locator('.shown').innerText());
		await chooseByLabel(page, fr.letters[letter].phonetic);
	} else if (prompt === 'Quelle lettre fait ce son ?') {
		const sound = (await page.locator('.shown').innerText()).replace(/[«»\s]/g, '');
		await chooseByLabel(page, glyphOf(letterWithSound(sound)));
	} else {
		const reading = (await page.locator('.shown').innerText()).trim();
		await typeAnswer(
			page,
			lettersIn(reading)
				.map((letter) => LETTERS[letter].accepted[0])
				.join('')
		);
	}
	const feedback = page.locator('.feedback');
	await expect(feedback).not.toContainText('Pas tout à fait');
	await feedback.getByRole('button', { name: 'Continuer' }).click();
	if (readAloud === 'skip') await skipReadAloud(page);
}
