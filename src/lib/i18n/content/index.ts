import type { BulgarianLetter } from '../../core/alphabet.js';
import type { Word } from '../../core/content/corpus.js';
import type { SectionId } from '../../core/content/types.js';
import { DEFAULT_LOCALE, type Locale } from '../index.js';
import { fr } from './fr.js';

export interface SectionText {
	title: string;
	intro: string;
}

/** Learner-facing text of a letter discovery card (spec §5.1). */
export interface LetterText {
	/**
	 * Phonetic transliteration for speakers of this locale: the reference sound taught (spec §3.4).
	 * For a letter taught as a combination (Ь → ьо), it spells the whole combination.
	 */
	phonetic: string;
	/** How to pronounce the reference sound, with familiar example words. */
	sound: string;
	/** Pronunciation nuances and other remarks that are not taught in the MVP (spec §3.3). */
	note?: string;
}

/** Learning content of one locale (spec §10.2). */
export interface LearningContent {
	sections: Readonly<Record<SectionId, SectionText>>;
	letters: Readonly<Record<BulgarianLetter, LetterText>>;
	/** Translation of every corpus word, shown after a reading answer (spec §5.3). */
	words: Readonly<Record<Word, string>>;
}

const catalogs: Record<Locale, LearningContent> = { fr };

export function getLearningContent(locale: Locale): LearningContent {
	return catalogs[locale];
}

/** Learning content for the current locale. The MVP is French-only (spec D5). */
export const content = getLearningContent(DEFAULT_LOCALE);
