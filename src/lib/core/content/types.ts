import type { BulgarianLetter } from '../alphabet.js';
import type { Reading } from './corpus.js';

/** The four letter groups of the path, in course order (spec §3.2, §4.1). */
export const SECTION_IDS = ['allies', 'falseFriends', 'greekCousins', 'newcomers'] as const;

export type SectionId = (typeof SECTION_IDS)[number];

/** Locale-independent data about a letter. Learner-facing text lives in the locale content (spec §10.2). */
export interface LetterData {
	/** Official Bulgarian transliteration (2009 system), as shown on signs and passports (spec §3.4). */
	official: string;
	/**
	 * Latin spellings accepted for this letter in typed answers (spec §5.3), lowercase ASCII only:
	 * answers are compared after removing case and accents, so « ă » is covered by « a ».
	 */
	accepted: readonly string[];
	/**
	 * Letter combination the letter is taught as, when it never appears alone (spec §3.3: Ь is
	 * taught as ьо). The transliterations of the letter then describe the whole combination.
	 */
	taughtAs?: string;
	/**
	 * True when the Bulgarian lowercase shape differs from the standard (Russian) one, so the
	 * discovery card shows both (spec §3.3, D2).
	 */
	distinctBulgarianLowercase: boolean;
}

export interface Lesson {
	/** Stable identifier, saved in the learner's progress (spec §6). */
	id: string;
	section: SectionId;
	/** The 3 letters introduced by the lesson, in the order their discovery cards are shown (spec §4.1). */
	letters: readonly [BulgarianLetter, BulgarianLetter, BulgarianLetter];
	/** One reading per new letter, in the same order, each containing its letter (spec §4.3, step 2). */
	letterReadings: readonly [Reading, Reading, Reading];
	/** Readings mixing new and previously learned letters (spec §4.3, step 3). */
	mixedReadings: readonly [Reading, Reading, Reading];
}
