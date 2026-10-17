// Helpers shared by the content invariant tests. Not used by the app.
import { BULGARIAN_ALPHABET, type BulgarianLetter } from '../alphabet.js';
import { LETTERS } from './letters.js';

function toLetter(char: string): BulgarianLetter | undefined {
	const upper = char.toLocaleUpperCase('bg');
	return BULGARIAN_ALPHABET.find((letter) => letter === upper);
}

/**
 * Whether `latin` (lowercase ASCII) spells `cyrillic` by picking one accepted variant per letter
 * (spec §5.3). Characters that are not Bulgarian letters never match.
 */
export function isSpelledBy(cyrillic: string, latin: string): boolean {
	const [first, ...rest] = cyrillic;
	if (first === undefined) return latin === '';
	const letter = toLetter(first);
	if (!letter) return false;
	return LETTERS[letter].accepted.some(
		(variant) =>
			latin.startsWith(variant) && isSpelledBy(rest.join(''), latin.slice(variant.length))
	);
}

/** Lowercase, without accents (« ă » → « a »), as typed answers are compared (spec §5.3). */
export function normalizeLatin(text: string): string {
	return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** The Bulgarian letters used in a text, uppercase. */
export function cyrillicLettersIn(text: string): BulgarianLetter[] {
	return [...text].map(toLetter).filter((letter) => letter !== undefined);
}
