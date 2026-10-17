// Reading exercises (spec §5.2, §5.3): transliterating Cyrillic text and checking typed answers.
import { BULGARIAN_ALPHABET, type BulgarianLetter } from './alphabet.js';
import { LETTERS } from './content/letters.js';

/** The Bulgarian letter written by a character, in either case. */
export function letterOf(char: string): BulgarianLetter | undefined {
	const upper = char.toLocaleUpperCase('bg');
	return BULGARIAN_ALPHABET.find((letter) => letter === upper);
}

/** The Bulgarian letters of a text, uppercase, in order. Other characters are skipped. */
export function lettersIn(text: string): BulgarianLetter[] {
	return [...text].map(letterOf).filter((letter) => letter !== undefined);
}

/** Lowercase, without accents (« ă » → « a »). */
export function normalizeLatin(text: string): string {
	return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/** A typed answer as it is compared: lowercase, without accents, spaces or hyphens (spec §5.3). */
export function normalizeAnswer(text: string): string {
	return normalizeLatin(text).replace(/[\s\p{Pd}]/gu, '');
}

/** Letters taught as a combination (Ь as ьо, spec §3.3), keyed by that combination. */
const COMBINATIONS = BULGARIAN_ALPHABET.flatMap((letter) => {
	const { taughtAs } = LETTERS[letter];
	return taughtAs ? [{ letter, taughtAs }] : [];
});

/**
 * Spells Cyrillic text in Latin letters, one letter (or taught combination, like ьо) at a time,
 * with `spell` giving the Latin spelling of each. Uppercase letters start a capitalized segment
 * (proper names); characters that are not Bulgarian letters are kept as they are.
 */
export function transliterate(text: string, spell: (letter: BulgarianLetter) => string): string {
	let result = '';
	for (let index = 0; index < text.length;) {
		const char = text[index];
		const lower = text.slice(index).toLocaleLowerCase('bg');
		const combination = COMBINATIONS.find(({ taughtAs }) => lower.startsWith(taughtAs));
		const letter = combination?.letter ?? letterOf(char);
		const segment = letter ? spell(letter) : char;
		result += char !== char.toLocaleLowerCase('bg') ? capitalize(segment) : segment;
		index += combination?.taughtAs.length ?? 1;
	}
	return result;
}

/**
 * Official Bulgarian transliteration (2009 system, spec §3.4), as written on signs: letter by
 * letter, except that a word-final -ия is spelled « ia » (България → Balgaria).
 */
export function officialTransliteration(text: string): string {
	// In Bulgarian words, only и + я spell « iya ».
	return transliterate(text, (letter) => LETTERS[letter].official).replace(/iya\b/g, 'ia');
}

function capitalize(text: string): string {
	return text.charAt(0).toUpperCase() + text.slice(1);
}

/** How one Cyrillic letter of a reading was answered. */
export interface LetterCheck {
	/** The character as written in the reading. */
	char: string;
	letter: BulgarianLetter;
	/** The part of the normalized answer aligned with this letter; empty when it was left out. */
	typed: string;
	correct: boolean;
}

export interface ReadingCheck {
	correct: boolean;
	/**
	 * The answer aligned letter by letter with the reading, to highlight wrong letters (spec §5.3).
	 * Null when the answer is too different to align: the whole expected answer is shown instead.
	 */
	letters: LetterCheck[] | null;
}

// Longest stretch of the answer one letter can be aligned with: the longest accepted variant
// (« cht », « tch », « iou ») plus one stray character.
const MAX_SEGMENT = 4;
// An alignment is first ranked by its number of wrong letters, then by how far the length of
// each wrong segment is from the letter's usual spelling.
const WRONG_LETTER_COST = 100;

/**
 * Checks a typed answer to a reading exercise (spec §5.3). Case, accents, spaces and hyphens are
 * ignored; each Cyrillic letter is checked on its own against its accepted Latin variants, so
 * transliterations can be mixed within a word. A word-final -ия may also be spelled « ia », as
 * in the official transliteration. There is no typo tolerance.
 */
export function checkReading(reading: string, answer: string): ReadingCheck {
	const chars = [...reading].filter((char) => letterOf(char) !== undefined);
	const letters = chars.map((char) => letterOf(char)!);
	const typed = normalizeAnswer(answer);

	// cost[i][j]: best cost to align the first i letters with the first j typed characters;
	// length[i][j]: length of the segment aligned with letter i - 1 in that best alignment.
	const cost = letters.map(() => Array<number>(typed.length + 1).fill(Infinity));
	cost.push(Array<number>(typed.length + 1).fill(Infinity));
	const length = cost.map((row) => row.map(() => 0));
	cost[0][0] = 0;

	const acceptedAt = (i: number): readonly string[] =>
		// Official spelling of a word-final -ия: « ia » (София → Sofia), so я is spelled « a ».
		letters[i] === 'Я' && i === letters.length - 1 && letters[i - 1] === 'И'
			? [...LETTERS.Я.accepted, 'a']
			: LETTERS[letters[i]].accepted;

	letters.forEach((_, i) => {
		const accepted = acceptedAt(i);
		for (let j = 0; j <= typed.length; j++) {
			if (cost[i][j] === Infinity) continue;
			for (let k = 0; k <= MAX_SEGMENT && j + k <= typed.length; k++) {
				const segment = typed.slice(j, j + k);
				const step = accepted.includes(segment)
					? 0
					: WRONG_LETTER_COST + Math.abs(k - accepted[0].length);
				if (cost[i][j] + step < cost[i + 1][j + k]) {
					cost[i + 1][j + k] = cost[i][j] + step;
					length[i + 1][j + k] = k;
				}
			}
		}
	});

	const total = cost[letters.length][typed.length];
	if (total === 0) return { correct: true, letters: aligned() };
	const wrong = Math.floor(total / WRONG_LETTER_COST);
	if (total === Infinity || wrong > letters.length / 2) return { correct: false, letters: null };
	return { correct: false, letters: aligned() };

	function aligned(): LetterCheck[] {
		const result: LetterCheck[] = [];
		for (let i = letters.length, j = typed.length; i > 0; i--) {
			const k = length[i][j];
			const segment = typed.slice(j - k, j);
			result.unshift({
				char: chars[i - 1],
				letter: letters[i - 1],
				typed: segment,
				correct: acceptedAt(i - 1).includes(segment)
			});
			j -= k;
		}
		return result;
	}
}
