import { describe, expect, it } from 'vitest';
import { BULGARIAN_ALPHABET, toLowercase, type BulgarianLetter } from '../alphabet.js';
import { CARD_EXAMPLES, isWord, SYLLABLES, WORDS, type Reading, type Word } from './corpus.js';
import { LESSONS, lessonIntroducing, lettersKnownIn } from './course.js';
import { LETTERS } from './letters.js';
import { cyrillicLettersIn, isSpelledBy } from './testing.js';

const VOWELS = 'аеиоуъюя';
const words = Object.keys(WORDS) as Word[];

/** Position in the path of the first lesson whose known letters can spell a text. */
function firstReadableLesson(text: string): number {
	return Math.max(
		...cyrillicLettersIn(text).map((letter) => LESSONS.indexOf(lessonIntroducing(letter)))
	);
}

function expectOnlyKnownLetters(text: string, lessonId: string) {
	const known = lettersKnownIn(lessonId);
	for (const letter of cyrillicLettersIn(text)) {
		expect(known, `${text} uses ${letter}, unknown in ${lessonId}`).toContain(letter);
	}
}

describe('WORDS', () => {
	it('are lowercase Bulgarian, with a capital only for proper names', () => {
		for (const word of words) {
			expect(word).toMatch(/^[А-Я]?[а-я]+$/);
			expect(word).not.toMatch(/[ыэё]/);
		}
	});

	it('have a stress index pointing at a vowel', () => {
		for (const word of words) {
			const stressed = word[WORDS[word].stress]?.toLocaleLowerCase('bg') ?? '';
			expect(VOWELS, `${word} stresses « ${stressed} »`).toContain(stressed);
		}
	});

	it('are transliterable with the accepted variants', () => {
		for (const word of words) {
			const latin = cyrillicLettersIn(word)
				.map((letter) => LETTERS[letter].accepted[0])
				.join('');
			expect(cyrillicLettersIn(word)).toHaveLength(word.length);
			expect(isSpelledBy(word, latin), word).toBe(true);
		}
	});

	it('only use Ь in the combination ьо', () => {
		for (const word of words) expect(word.replaceAll('ьо', '')).not.toContain('ь');
	});

	it('cover every letter at least twice', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			const count = words.filter((word) => cyrillicLettersIn(word).includes(letter)).length;
			expect(count, letter).toBeGreaterThanOrEqual(2);
		}
	});

	it('are listed in the order of the lesson that makes them readable', () => {
		const lessons = words.map(firstReadableLesson);
		expect(lessons).toEqual([...lessons].sort((a, b) => a - b));
	});
});

describe('SYLLABLES', () => {
	it('are distinct lowercase Bulgarian, and not corpus words', () => {
		expect(new Set(SYLLABLES).size).toBe(SYLLABLES.length);
		for (const syllable of SYLLABLES) {
			expect(syllable).toMatch(/^[а-я]+$/);
			expect(isWord(syllable), syllable).toBe(false);
		}
	});

	it('only use Ь in the combination ьо', () => {
		for (const syllable of SYLLABLES) expect(syllable.replaceAll('ьо', '')).not.toContain('ь');
	});

	it('are listed in the order of the lesson that makes them readable', () => {
		const lessons = SYLLABLES.map(firstReadableLesson);
		expect(lessons).toEqual([...lessons].sort((a, b) => a - b));
	});
});

describe('lesson readings', () => {
	it('only use letters known in the lesson', () => {
		for (const lesson of LESSONS) {
			for (const reading of [...lesson.letterReadings, ...lesson.mixedReadings]) {
				expectOnlyKnownLetters(reading, lesson.id);
			}
		}
	});

	it('are distinct within a lesson', () => {
		for (const lesson of LESSONS) {
			const readings: Reading[] = [...lesson.letterReadings, ...lesson.mixedReadings];
			expect(new Set(readings).size, lesson.id).toBe(6);
		}
	});

	it('give each new letter a reading that contains it', () => {
		for (const lesson of LESSONS) {
			lesson.letters.forEach((letter, index) => {
				expect(cyrillicLettersIn(lesson.letterReadings[index])).toContain(letter);
			});
		}
	});

	it('mix new and previously learned letters after the first lesson', () => {
		for (const lesson of LESSONS.slice(1)) {
			for (const reading of lesson.mixedReadings) {
				const letters = cyrillicLettersIn(reading);
				const isNew = (letter: BulgarianLetter) => lesson.letters.includes(letter);
				expect(letters.some(isNew), `${lesson.id}: ${reading}`).toBe(true);
				expect(
					letters.some((letter) => !isNew(letter)),
					`${lesson.id}: ${reading}`
				).toBe(true);
			}
		}
	});
});

describe('CARD_EXAMPLES', () => {
	it('gives 2 or 3 distinct words containing the letter', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			const examples = CARD_EXAMPLES[letter];
			expect(examples.length).toBeGreaterThanOrEqual(2);
			expect(examples.length).toBeLessThanOrEqual(3);
			expect(new Set(examples).size).toBe(examples.length);
			for (const word of examples) {
				expect(word.toLocaleLowerCase('bg'), `${letter}: ${word}`).toContain(toLowercase(letter));
			}
		}
	});

	it('only uses letters known in the lesson introducing the letter', () => {
		for (const letter of BULGARIAN_ALPHABET) {
			for (const word of CARD_EXAMPLES[letter]) {
				expectOnlyKnownLetters(word, lessonIntroducing(letter).id);
			}
		}
	});
});
