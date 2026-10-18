// How letters, sounds and readings are displayed, combining core data with the locale content.
import { toLowercase, type BulgarianLetter } from '#lib/core/alphabet.js';
import { isWord, type Reading } from '#lib/core/content/corpus.js';
import { LETTERS } from '#lib/core/content/letters.js';
import type { SoundChoice } from '#lib/core/engine/questions.js';
import { officialTransliteration, transliterate } from '#lib/core/reading.js';
import { content } from '#lib/i18n/content/index.js';

/**
 * A letter as shown in exercises: both cases (Дд, spec §5.3), or the combination it is taught
 * as (ьо, spec §3.3).
 */
export function letterGlyph(letter: BulgarianLetter): string {
	return LETTERS[letter].taughtAs ?? `${letter}${toLowercase(letter)}`;
}

/** The reference sound of a letter for the learner: the phonetic transliteration (spec §3.4). */
export function phoneticOf(letter: BulgarianLetter): string {
	return content.letters[letter].phonetic;
}

/** The official transliteration of a letter (spec §3.4). */
export function officialOf(letter: BulgarianLetter): string {
	return LETTERS[letter].official;
}

/** A letter → sound choice as displayed. */
export function soundChoiceText(choice: SoundChoice): string {
	return 'letter' in choice ? phoneticOf(choice.letter) : choice.latin;
}

/** A reading spelled with the phonetic transliteration, the expected answer shown on mistakes. */
export function phoneticReading(reading: string): string {
	return transliterate(reading, phoneticOf);
}

export { officialTransliteration };

/** French translation of a corpus word; syllables have none. */
export function translationOf(reading: Reading): string | undefined {
	return isWord(reading) ? content.words[reading] : undefined;
}
