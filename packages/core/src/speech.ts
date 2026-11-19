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

/** Whether a validated text heard is the expected word (AC-43). */
export function isSameWord(heard: string, expected: string): boolean {
	return heard === normalizeSpeech(expected);
}

/** How many syllables a Bulgarian word has: its number of vowel letters. */
export function syllableCount(word: string): number {
	return word.match(VOWELS)?.length ?? 0;
}
