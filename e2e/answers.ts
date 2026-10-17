import { expect, type Page } from '@playwright/test';
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../src/lib/core/alphabet.js';
import { LETTERS } from '../src/lib/core/content/letters.js';
import { lettersIn } from '../src/lib/core/reading.js';
import { fr } from '../src/lib/i18n/content/fr.js';

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

/** Answers the current question correctly, then continues. */
export async function answerCorrectly(page: Page) {
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
}
