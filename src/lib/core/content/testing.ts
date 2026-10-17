// Helpers shared by the content invariant tests. Not used by the app.
import { letterOf, lettersIn } from '../reading.js';
import { LETTERS } from './letters.js';

export { normalizeLatin } from '../reading.js';

/**
 * Whether `latin` (lowercase ASCII) spells `cyrillic` by picking one accepted variant per letter
 * (spec §5.3). Characters that are not Bulgarian letters never match.
 */
export function isSpelledBy(cyrillic: string, latin: string): boolean {
	const [first, ...rest] = cyrillic;
	if (first === undefined) return latin === '';
	const letter = letterOf(first);
	if (!letter) return false;
	return LETTERS[letter].accepted.some(
		(variant) =>
			latin.startsWith(variant) && isSpelledBy(rest.join(''), latin.slice(variant.length))
	);
}

/** The Bulgarian letters used in a text, uppercase. */
export const cyrillicLettersIn = lettersIn;
