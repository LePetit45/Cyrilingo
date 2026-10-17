import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, toLowercase } from '../../core/alphabet.js';
import { lessonIntroducing, lettersKnownIn } from '../../core/content/course.js';
import { LETTERS } from '../../core/content/letters.js';
import { cyrillicLettersIn, isSpelledBy, normalizeLatin } from '../../core/content/testing.js';
import { SECTION_IDS } from '../../core/content/types.js';
import type { Locale } from '../index.js';
import { getLearningContent } from './index.js';

const LOCALES: Locale[] = ['fr'];

describe.each(LOCALES)('learning content (%s)', (locale) => {
	const content = getLearningContent(locale);

	it('has a title and an intro for every section, without Cyrillic', () => {
		for (const id of SECTION_IDS) {
			const { title, intro } = content.sections[id];
			expect(title.trim()).not.toBe('');
			expect(intro.trim()).not.toBe('');
			expect(cyrillicLettersIn(title + intro)).toEqual([]);
		}
	});

	it('has a sound and a mnemonic for every letter', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			expect(content.letters[letter].sound.trim()).not.toBe('');
			expect(content.letters[letter].mnemonic.trim()).not.toBe('');
		}
	});

	it('teaches a phonetic transliteration that typed answers accept', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			const cyrillic = LETTERS[letter].taughtAs ?? toLowercase(letter);
			const phonetic = normalizeLatin(content.letters[letter].phonetic);
			expect(isSpelledBy(cyrillic, phonetic), `${letter} → ${phonetic}`).toBe(true);
		}
	});

	it('only quotes letters known by the lesson introducing the letter', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			const { sound, mnemonic, note = '' } = content.letters[letter];
			const known = lettersKnownIn(lessonIntroducing(letter).id);
			for (const quoted of cyrillicLettersIn(sound + mnemonic + note)) {
				expect(known, `${letter} card quotes ${quoted}`).toContain(quoted);
			}
		}
	});
});
