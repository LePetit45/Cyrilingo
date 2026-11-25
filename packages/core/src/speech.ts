// Read aloud (SPEC.md › The model feature › Output validation): what the speech model heard is
// shown to nobody until it passes these checks, then compared with the expected word.

/** The longest text heard that can be shown. */
export const MAX_HEARD_LENGTH = 40;

/** The 30 Bulgarian letters in lowercase, plus space and hyphen. */
const BULGARIAN_TEXT = /^[абвгдежзийклмнопрстуфхцчшщъьюя -]+$/;

/** The vowel letters: in Bulgarian spelling, one vowel letter is one syllable. */
const VOWELS = /[аеиоуъюя]/giu;

/** Lowercase, Unicode NFC, without punctuation or symbols (hyphens kept), spaces collapsed. */
export function normalizeSpeech(text: string): string {
	return text
		.normalize('NFC')
		.toLocaleLowerCase('bg')
		.replace(/[^\p{L}\p{N}\s-]/gu, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/**
 * The text heard, normalized, when it may be shown: non-empty, at most 40 characters, and made
 * only of Bulgarian letters, spaces and hyphens. Null otherwise (Latin letters, digits, other
 * Cyrillic letters such as ы or ё): the outcome is then « not understood » (AC-42).
 */
export function validHeardText(text: string): string | null {
	const normalized = normalizeSpeech(text);
	return normalized.length <= MAX_HEARD_LENGTH && BULGARIAN_TEXT.test(normalized)
		? normalized
		: null;
}

/** Words this long or longer are accepted with one letter off. */
export const TOLERANT_FROM_LENGTH = 4;

/**
 * Whether a validated text heard counts as the expected word (AC-43). Spaces and hyphens are
 * ignored (the model may split a word: « аз бука »), and a word of 4 letters or more is accepted
 * with one letter added, missing or changed: recognizing an isolated word read with a French
 * accent is never exact (« вече » for « вечер », « меска » for « маска »).
 */
export function isSameWord(heard: string, expected: string): boolean {
	const said = heard.replace(/[ -]/g, '');
	const word = normalizeSpeech(expected).replace(/[ -]/g, '');
	if (said === '') return false;
	return editDistance(said, word) <= (word.length >= TOLERANT_FROM_LENGTH ? 1 : 0);
}

/** Letters to add, remove or change to turn one text into the other (Levenshtein). */
export function editDistance(a: string, b: string): number {
	let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		for (let j = 1; j <= b.length; j++) {
			current[j] = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
			);
		}
		previous = current;
	}
	return previous[b.length];
}

/** How many syllables a Bulgarian word has: its number of vowel letters. */
export function syllableCount(word: string): number {
	return word.match(VOWELS)?.length ?? 0;
}
